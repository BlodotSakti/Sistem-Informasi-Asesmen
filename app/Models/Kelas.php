<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id_kelas
 * @property int $id_guru_wali
 * @property string $nama_kelas
 * @property string $tahun_ajaran
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\BeritaAcara> $beritaAcara
 * @property-read int|null $berita_acara_count
 * @property-read \App\Models\Guru $guruWali
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\SesiAsesmen> $sesiAsesmen
 * @property-read int|null $sesi_asesmen_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Kelas newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Kelas newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Kelas query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Kelas whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Kelas whereIdGuruWali($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Kelas whereIdKelas($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Kelas whereNamaKelas($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Kelas whereTahunAjaran($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Kelas whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Kelas extends Model
{
    use HasFactory;

    protected $table = 'kelas';

    protected $primaryKey = 'id_kelas';

    protected $fillable = [
        'id_guru_wali',
        'nama_kelas',
        'tahun_ajaran',
    ];

    public function guruWali(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'id_guru_wali', 'id_guru');
    }

    public function sesiAsesmen(): HasMany
    {
        return $this->hasMany(SesiAsesmen::class, 'id_kelas', 'id_kelas');
    }

    public function beritaAcara(): HasMany
    {
        return $this->hasMany(BeritaAcara::class, 'id_kelas', 'id_kelas');
    }
}