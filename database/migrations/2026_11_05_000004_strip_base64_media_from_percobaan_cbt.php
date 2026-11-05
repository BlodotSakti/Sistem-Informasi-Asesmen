<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Bersihkan salinan Base64 gambar/audio di kolom JSON percobaan_cbt.data_jawaban.
     *
     * Sejak media soal disimpan sebagai Base64 di bank_soal, snapshot jawaban CBT ikut
     * menyalin data media tersebut sehingga tiap baris percobaan_cbt berukuran sangat besar.
     * Hal ini memicu error MySQL "Out of sort memory" (Aiven) saat memuat Riwayat CBT.
     * Media tetap ditampilkan karena review mengambil fallback dari bank_soal.
     */
    public function up(): void
    {
        // Ambil ID saja (ringan, tanpa sort berat), lalu proses satu per satu.
        $ids = DB::table('percobaan_cbt')->pluck('id_percobaan');

        foreach ($ids as $id) {
            $row = DB::table('percobaan_cbt')
                ->where('id_percobaan', $id)
                ->first(['id_percobaan', 'data_jawaban']);

            if (!$row || empty($row->data_jawaban)) {
                continue;
            }

            $data = json_decode($row->data_jawaban, true);
            if (!is_array($data)) {
                continue;
            }

            $changed = false;
            foreach ($data as $i => $item) {
                if (!is_array($item)) {
                    continue;
                }
                foreach (['gambar_soal', 'audio_soal', 'gambar_soal_url', 'audio_soal_url'] as $key) {
                    if (isset($item[$key]) && is_string($item[$key]) && str_starts_with($item[$key], 'data:')) {
                        $data[$i][$key] = null;
                        $changed = true;
                    }
                }
            }

            if ($changed) {
                DB::table('percobaan_cbt')
                    ->where('id_percobaan', $id)
                    ->update(['data_jawaban' => json_encode($data, JSON_UNESCAPED_UNICODE)]);
            }
        }
    }

    public function down(): void
    {
        // Tidak dapat dikembalikan (data media tetap tersedia di bank_soal).
    }
};

