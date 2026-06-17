<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id_siswa
 * @property int $id_pengguna
 * @property string $nama_lengkap
 * @property string $nisn
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\AnalisisDiagnostik> $analisisDiagnostik
 * @property-read int|null $analisis_diagnostik_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Apresiasi> $apresiasi
 * @property-read int|null $apresiasi_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\CatatanPrivat> $catatanPrivat
 * @property-read int|null $catatan_privat_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\KelasSiswa> $kelasRiwayat
 * @property-read int|null $kelas_riwayat_count
 * @property-read \App\Models\KelasSiswa|null $kelasAktifAssignment
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\JawabanSiswa> $jawabanSiswa
 * @property-read int|null $jawaban_siswa_count
 * @property-read \App\Models\Pengguna $pengguna
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\RencanaBelajar> $rencanaBelajar
 * @property-read int|null $rencana_belajar_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Siswa newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Siswa newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Siswa query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Siswa whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Siswa whereIdPengguna($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Siswa whereIdSiswa($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Siswa whereNamaLengkap($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Siswa whereNisn($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Siswa whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Siswa extends Model
{
    use HasFactory;

    protected $table = 'siswa';

    protected $primaryKey = 'id_siswa';

    protected $fillable = [
        'id_pengguna',
        'nama_lengkap',
        'nisn',
    ];

    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_pengguna', 'id_pengguna');
    }

    public function jawabanSiswa(): HasMany
    {
        return $this->hasMany(JawabanSiswa::class, 'id_siswa', 'id_siswa');
    }

    public function analisisDiagnostik(): HasMany
    {
        return $this->hasMany(AnalisisDiagnostik::class, 'id_siswa', 'id_siswa');
    }

    public function catatanPrivat(): HasMany
    {
        return $this->hasMany(CatatanPrivat::class, 'id_siswa', 'id_siswa');
    }

    public function apresiasi(): HasMany
    {
        return $this->hasMany(Apresiasi::class, 'id_siswa', 'id_siswa');
    }

    public function kelasRiwayat(): HasMany
    {
        return $this->hasMany(KelasSiswa::class, 'id_siswa', 'id_siswa');
    }

    public function kelasAktifAssignment(): HasOne
    {
        return $this->hasOne(KelasSiswa::class, 'id_siswa', 'id_siswa')
            ->where('is_aktif', true)
            ->latestOfMany('tanggal_masuk');
    }
}