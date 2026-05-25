<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id_berita_acara
 * @property int $id_kelas
 * @property int $id_guru
 * @property int $pertemuan_ke
 * @property \Illuminate\Support\Carbon $tanggal
 * @property string $materi_bahasan
 * @property string $catatan_kelas
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Guru $guru
 * @property-read \App\Models\Kelas $kelas
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BeritaAcara newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BeritaAcara newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BeritaAcara query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BeritaAcara whereCatatanKelas($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BeritaAcara whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BeritaAcara whereIdBeritaAcara($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BeritaAcara whereIdGuru($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BeritaAcara whereIdKelas($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BeritaAcara whereMateriBahasan($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BeritaAcara wherePertemuanKe($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BeritaAcara whereTanggal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BeritaAcara whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class BeritaAcara extends Model
{
    use HasFactory;

    protected $table = 'berita_acara';

    protected $primaryKey = 'id_berita_acara';

    protected $fillable = [
        'id_kelas',
        'id_guru',
        'pertemuan_ke',
        'tanggal',
        'materi_bahasan',
        'catatan_kelas',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class, 'id_kelas', 'id_kelas');
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'id_guru', 'id_guru');
    }
}