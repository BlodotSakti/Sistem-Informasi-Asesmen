<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id_guru
 * @property int $id_pengguna
 * @property string $nama_lengkap
 * @property string $nip
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Apresiasi> $apresiasi
 * @property-read int|null $apresiasi_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\BankSoal> $bankSoal
 * @property-read int|null $bank_soal_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\BeritaAcara> $beritaAcara
 * @property-read int|null $berita_acara_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\CatatanPrivat> $catatanPrivat
 * @property-read int|null $catatan_privat_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Kelas> $kelasWali
 * @property-read int|null $kelas_wali_count
 * @property-read \App\Models\Pengguna $pengguna
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Guru newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Guru newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Guru query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Guru whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Guru whereIdGuru($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Guru whereIdPengguna($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Guru whereNamaLengkap($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Guru whereNip($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Guru whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Guru extends Model
{
    use HasFactory;

    protected $table = 'guru';

    protected $primaryKey = 'id_guru';

    protected $fillable = [
        'id_pengguna',
        'nama_lengkap',
        'nip',
    ];

    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_pengguna', 'id_pengguna');
    }

    public function kelasWali(): HasMany
    {
        return $this->hasMany(Kelas::class, 'id_guru_wali', 'id_guru');
    }

    public function bankSoal(): HasMany
    {
        return $this->hasMany(BankSoal::class, 'id_guru', 'id_guru');
    }

    public function beritaAcara(): HasMany
    {
        return $this->hasMany(BeritaAcara::class, 'id_guru', 'id_guru');
    }

    public function catatanPrivat(): HasMany
    {
        return $this->hasMany(CatatanPrivat::class, 'id_guru', 'id_guru');
    }

    public function apresiasi(): HasMany
    {
        return $this->hasMany(Apresiasi::class, 'id_guru', 'id_guru');
    }
}