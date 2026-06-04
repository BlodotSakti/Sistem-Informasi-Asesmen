<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id_apresiasi
 * @property int $id_guru
 * @property int $id_siswa
 * @property int|null $id_berita_acara
 * @property \Illuminate\Support\Carbon $tanggal
 * @property string $jenis_badge
 * @property string $topik_materi
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Guru $guru
 * @property-read \App\Models\Siswa $siswa
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Apresiasi newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Apresiasi newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Apresiasi query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Apresiasi whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Apresiasi whereIdApresiasi($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Apresiasi whereIdGuru($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Apresiasi whereIdSiswa($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Apresiasi whereJenisBadge($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Apresiasi whereTanggal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Apresiasi whereTopikMateri($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Apresiasi whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Apresiasi extends Model
{
    use HasFactory;

    protected $table = 'apresiasi';

    protected $primaryKey = 'id_apresiasi';

    protected $fillable = [
        'id_guru',
        'id_siswa',
        'id_berita_acara',
        'tanggal',
        'jenis_badge',
        'topik_materi',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'id_guru', 'id_guru');
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class, 'id_siswa', 'id_siswa');
    }

    public function beritaAcara(): BelongsTo
    {
        return $this->belongsTo(BeritaAcara::class, 'id_berita_acara', 'id_berita_acara');
    }
}