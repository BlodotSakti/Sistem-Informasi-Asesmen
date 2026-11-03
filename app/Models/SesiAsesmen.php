<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id_sesi
 * @property int $id_kelas
 * @property int $id_mapel
 * @property string $tipe_soal
 * @property string $jenis_asesmen
 * @property \Illuminate\Support\Carbon $waktu_mulai
 * @property int $durasi_menit
 * @property float $target_bobot_total
 * @property bool $boleh_ulang
 * @property bool $tampilkan_kunci
 * @property bool $distribusi_paket
 * @property bool $acak_soal
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\AnalisisDiagnostik> $analisisDiagnostik
 * @property-read int|null $analisis_diagnostik_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\BankSoal> $bankSoal
 * @property-read int|null $bank_soal_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\DetailSesiSoal> $detailSesiSoal
 * @property-read int|null $detail_sesi_soal_count
 * @property-read \App\Models\Kelas $kelas
 * @property-read \App\Models\MataPelajaran $mataPelajaran
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SesiAsesmen newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SesiAsesmen newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SesiAsesmen query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SesiAsesmen whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SesiAsesmen whereDurasiMenit($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SesiAsesmen whereIdKelas($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SesiAsesmen whereIdMapel($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SesiAsesmen whereIdSesi($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SesiAsesmen whereJenisAsesmen($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SesiAsesmen whereTipeSoal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SesiAsesmen whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SesiAsesmen whereWaktuMulai($value)
 * @mixin \Eloquent
 */
class SesiAsesmen extends Model
{
    use HasFactory;

    protected $table = 'sesi_asesmen';

    protected $primaryKey = 'id_sesi';

    protected $fillable = [
        'id_kelas',
        'id_mapel',
        'tipe_soal',
        'jenis_asesmen',
        'waktu_mulai',
        'waktu_selesai',
        'durasi_menit',
        'target_bobot_total',
        'boleh_ulang',
        'tampilkan_kunci',
        'distribusi_paket',
        'acak_soal',
        'token',
    ];

    protected $casts = [
        'waktu_mulai' => 'datetime',
        'waktu_selesai' => 'datetime',
        'durasi_menit' => 'integer',
        'target_bobot_total' => 'float',
        'boleh_ulang' => 'boolean',
        'tampilkan_kunci' => 'boolean',
        'distribusi_paket' => 'boolean',
        'acak_soal' => 'boolean',
    ];

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class, 'id_kelas', 'id_kelas');
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mapel', 'id_mapel');
    }

    public function detailSesiSoal(): HasMany
    {
        return $this->hasMany(DetailSesiSoal::class, 'id_sesi', 'id_sesi');
    }

    public function bankSoal(): BelongsToMany
    {
        return $this->belongsToMany(
            BankSoal::class,
            'detail_sesi_soal',
            'id_sesi',
            'id_soal',
            'id_sesi',
            'id_soal'
        )->withPivot(['id_detail', 'bobot_nilai']);
    }

    public function analisisDiagnostik(): HasMany
    {
        return $this->hasMany(AnalisisDiagnostik::class, 'id_sesi', 'id_sesi');
    }

    public function percobaanCbt(): HasMany
    {
        return $this->hasMany(PercobaanCbt::class, 'id_sesi', 'id_sesi');
    }

    /**
     * Menentukan daftar DetailSesiSoal untuk seorang siswa pada percobaan tertentu
     * berdasarkan pengaturan distribusi_paket (Multi-Paket) dan acak_soal.
     *
     * @return array{paket_aktif: string|null, details: \Illuminate\Support\Collection<int, \App\Models\DetailSesiSoal>, total_bobot: float}
     */
    public function resolveSoalForSiswa(int $idSiswa, int $attemptIndex = 0): array
    {
        if (! $this->relationLoaded('detailSesiSoal')) {
            $this->loadMissing('detailSesiSoal.bankSoal');
        }

        $allDetails = $this->detailSesiSoal
            ->filter(fn ($d) => $d->bankSoal !== null)
            ->values();

        $assignedPackage = null;
        $selectedDetails = $allDetails;

        if ($this->distribusi_paket) {
            $grouped = $allDetails->groupBy(function ($d) {
                return trim((string) ($d->bankSoal?->paket_soal ?? ''));
            });

            $namedGroups = $grouped->filter(fn ($items, $key) => $key !== '');
            $umumItems = $grouped->get('', collect());

            if ($namedGroups->count() > 1) {
                $keys = $namedGroups->keys()->sort(SORT_NATURAL | SORT_FLAG_CASE)->values();
                $pkgIndex = abs($idSiswa + max(0, $attemptIndex)) % $keys->count();
                $assignedPackage = (string) $keys->get($pkgIndex);
                $selectedIds = $namedGroups->get($assignedPackage, collect())
                    ->concat($umumItems)
                    ->pluck('id_detail')
                    ->all();
                // Pertahankan urutan master agar nomor soal konsisten dengan dokumen PDF/Excel
                $selectedDetails = $allDetails
                    ->filter(fn ($d) => in_array($d->id_detail, $selectedIds, true))
                    ->values();
            } elseif ($namedGroups->count() === 1) {
                $assignedPackage = (string) $namedGroups->keys()->first();
            }
        }

        if ($this->acak_soal && $selectedDetails->count() > 1) {
            $selectedDetails = $selectedDetails->sortBy(function ($detail) use ($idSiswa, $attemptIndex) {
                return sprintf('%u', crc32("sesi:{$this->id_sesi}:siswa:{$idSiswa}:att:{$attemptIndex}:detail:{$detail->id_detail}"));
            })->values();
        }

        return [
            'paket_aktif' => $assignedPackage,
            'details' => $selectedDetails,
            'total_bobot' => (float) $selectedDetails->sum('bobot_nilai'),
        ];
    }

    /**
     * Apakah sesi ini benar-benar membagikan paket berbeda ke tiap siswa
     * (distribusi_paket aktif dan terdapat lebih dari 1 paket bernama).
     */
    public function isMultiPaketAktif(): bool
    {
        return count($this->paketGroups()) > 1;
    }

    /**
     * Mengelompokkan soal sesi per paket (urutan MASTER, sama seperti yang dilihat guru).
     * - Multi-paket aktif: satu grup per paket bernama, masing-masing ditambah soal Umum.
     * - Selain itu: satu grup berisi seluruh soal (nama = null).
     *
     * @return array<int, array{nama: string|null, details: \Illuminate\Support\Collection}>
     */
    public function paketGroups(): array
    {
        if (! $this->relationLoaded('detailSesiSoal')) {
            $this->loadMissing('detailSesiSoal.bankSoal');
        }

        $allDetails = $this->detailSesiSoal
            ->filter(fn ($d) => $d->bankSoal !== null)
            ->values();

        if ($this->distribusi_paket) {
            $grouped = $allDetails->groupBy(fn ($d) => trim((string) ($d->bankSoal?->paket_soal ?? '')));
            $namedGroups = $grouped->filter(fn ($items, $key) => $key !== '');

            if ($namedGroups->count() > 1) {
                $keys = $namedGroups->keys()->sort(SORT_NATURAL | SORT_FLAG_CASE)->values();
                $umumIds = $grouped->get('', collect())->pluck('id_detail')->all();

                return $keys->map(function ($key) use ($allDetails, $namedGroups, $umumIds) {
                    $ids = array_merge($namedGroups->get($key)->pluck('id_detail')->all(), $umumIds);

                    return [
                        'nama' => (string) $key,
                        // Pertahankan urutan master asli (paket + umum bercampur sesuai urutan input guru)
                        'details' => $allDetails->filter(fn ($d) => in_array($d->id_detail, $ids, true))->values(),
                    ];
                })->all();
            }
        }

        return [[
            'nama' => null,
            'details' => $allDetails,
        ]];
    }

    /**
     * Menghitung total bobot efektif per siswa untuk sesi ini.
     * Jika distribusi_paket aktif dan terdapat >1 paket, mengembalikan total bobot per paket.
     */
    public function effectiveTotalBobot(): float
    {
        if (! $this->relationLoaded('detailSesiSoal')) {
            $this->loadMissing('detailSesiSoal.bankSoal');
        }

        if ($this->distribusi_paket) {
            $allDetails = $this->detailSesiSoal->filter(fn ($d) => $d->bankSoal !== null);
            $grouped = $allDetails->groupBy(fn ($d) => trim((string) ($d->bankSoal?->paket_soal ?? '')));
            $namedGroups = $grouped->filter(fn ($items, $key) => $key !== '');
            $umumSum = (float) $grouped->get('', collect())->sum('bobot_nilai');

            if ($namedGroups->count() > 1) {
                $firstPkgSum = (float) $namedGroups->first()->sum('bobot_nilai');
                return round($firstPkgSum + $umumSum, 2);
            }
        }

        return round((float) $this->detailSesiSoal->sum('bobot_nilai'), 2);
    }
}
