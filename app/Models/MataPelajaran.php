<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id_mapel
 * @property string $nama_mapel
 * @property string $tingkat
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\BankSoal> $bankSoal
 * @property-read int|null $bank_soal_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\PenugasanPembelajaran> $penugasanPembelajaran
 * @property-read int|null $penugasan_pembelajaran_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\RencanaBelajar> $rencanaBelajar
 * @property-read int|null $rencana_belajar_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\SesiAsesmen> $sesiAsesmen
 * @property-read int|null $sesi_asesmen_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MataPelajaran newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MataPelajaran newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MataPelajaran query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MataPelajaran whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MataPelajaran whereIdMapel($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MataPelajaran whereNamaMapel($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MataPelajaran whereTingkat($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MataPelajaran whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class MataPelajaran extends Model
{
    use HasFactory;

    protected $table = 'mata_pelajaran';

    protected $primaryKey = 'id_mapel';

    protected $fillable = [
        'nama_mapel',
        'tingkat',
    ];

    public function bankSoal(): HasMany
    {
        return $this->hasMany(BankSoal::class, 'id_mapel', 'id_mapel');
    }

    public function sesiAsesmen(): HasMany
    {
        return $this->hasMany(SesiAsesmen::class, 'id_mapel', 'id_mapel');
    }

    public function penugasanPembelajaran(): HasMany
    {
        return $this->hasMany(PenugasanPembelajaran::class, 'id_mapel', 'id_mapel');
    }

    public function rencanaBelajar(): HasMany
    {
        return $this->hasMany(RencanaBelajar::class, 'id_mapel', 'id_mapel');
    }
}