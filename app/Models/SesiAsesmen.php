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
        'boleh_ulang',
    ];

    protected $casts = [
        'waktu_mulai' => 'datetime',
        'waktu_selesai' => 'datetime',
        'durasi_menit' => 'integer',
        'boleh_ulang' => 'boolean',
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
}