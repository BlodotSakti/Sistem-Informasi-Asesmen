<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\JawabanSiswa;
use App\Models\AnalisisDiagnostik;

class PercobaanCbt extends Model
{
    use HasFactory;

    protected $table = 'percobaan_cbt';
    protected $primaryKey = 'id_percobaan';

    protected $fillable = [
        'id_sesi',
        'id_siswa',
        'percobaan_ke',
        'total_skor',
        'total_bobot',
        'jumlah_soal',
        'jumlah_benar',
        'jumlah_salah',
        'data_jawaban',
    ];

    protected $casts = [
        'percobaan_ke' => 'integer',
        'total_skor' => 'decimal:2',
        'total_bobot' => 'decimal:2',
        'jumlah_soal' => 'integer',
        'jumlah_benar' => 'integer',
        'jumlah_salah' => 'integer',
        'data_jawaban' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function sesiAsesmen(): BelongsTo
    {
        return $this->belongsTo(SesiAsesmen::class, 'id_sesi', 'id_sesi');
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class, 'id_siswa', 'id_siswa');
    }

    /**
     * Sinkronisasi nilai tertinggi dari seluruh percobaan ke JawabanSiswa & AnalisisDiagnostik.
     * Mengembalikan record percobaan terbaik (highest attempt).
     */
    public static function syncHighestAttempt(int $id_siswa, int $id_sesi): ?self
    {
        $attempts = self::where('id_siswa', $id_siswa)
            ->where('id_sesi', $id_sesi)
            ->get();

        if ($attempts->isEmpty()) {
            return null;
        }

        // Cari percobaan dengan total_skor tertinggi. Jika skor sama, prioritaskan percobaan terbaru.
        $highest = $attempts->sort(function ($a, $b) {
            $skorA = (float) $a->total_skor;
            $skorB = (float) $b->total_skor;
            if ($skorA == $skorB) {
                return $b->percobaan_ke <=> $a->percobaan_ke;
            }
            return $skorB <=> $skorA;
        })->first();

        if (!$highest) {
            return null;
        }

        // 1. Sinkronkan JawabanSiswa agar mencerminkan jawaban percobaan tertinggi
        if (!empty($highest->data_jawaban) && is_array($highest->data_jawaban)) {
            $detailIds = collect($highest->data_jawaban)->pluck('id_detail')->filter()->values();
            if ($detailIds->isNotEmpty()) {
                JawabanSiswa::where('id_siswa', $id_siswa)
                    ->whereIn('id_detail', $detailIds)
                    ->delete();

                foreach ($highest->data_jawaban as $dj) {
                    if (empty($dj['id_detail'])) {
                        continue;
                    }
                    $teks = $dj['jawaban_siswa'] ?? null;
                    if (is_array($teks)) {
                        $teks = json_encode($teks);
                    }
                    JawabanSiswa::create([
                        'id_siswa' => $id_siswa,
                        'id_detail' => $dj['id_detail'],
                        'teks_jawaban' => $teks ?? '',
                        'is_correct' => (bool) ($dj['is_correct'] ?? false),
                        'skor_diperoleh' => (float) ($dj['skor_diperoleh'] ?? 0),
                    ]);
                }
            }
        }

        // 2. Sinkronkan skor_total di AnalisisDiagnostik
        $analisis = AnalisisDiagnostik::where('id_siswa', $id_siswa)
            ->where('id_sesi', $id_sesi)
            ->first();

        if ($analisis) {
            $analisis->update([
                'skor_total' => $highest->total_skor,
            ]);
        } else {
            AnalisisDiagnostik::create([
                'id_siswa' => $id_siswa,
                'id_sesi' => $id_sesi,
                'skor_total' => $highest->total_skor,
                'narasi_kekuatan' => 'Sedang diproses oleh AI...',
                'narasi_kelemahan' => 'Sedang diproses oleh AI...',
                'tanggal_generate' => now(),
            ]);
        }

        return $highest;
    }
}
