<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id_catatan
 * @property int $id_guru
 * @property int $id_siswa
 * @property \Illuminate\Support\Carbon $tanggal
 * @property string $isi_pesan
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Guru $guru
 * @property-read \App\Models\Siswa $siswa
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CatatanPrivat newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CatatanPrivat newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CatatanPrivat query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CatatanPrivat whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CatatanPrivat whereIdCatatan($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CatatanPrivat whereIdGuru($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CatatanPrivat whereIdSiswa($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CatatanPrivat whereIsiPesan($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CatatanPrivat whereTanggal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CatatanPrivat whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class CatatanPrivat extends Model
{
    use HasFactory;

    protected $table = 'catatan_privat';

    protected $primaryKey = 'id_catatan';

    protected $fillable = [
        'id_guru',
        'id_siswa',
        'tanggal',
        'isi_pesan',
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
}