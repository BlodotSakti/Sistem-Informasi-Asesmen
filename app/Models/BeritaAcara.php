<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\MataPelajaran;

/**
 * @property int $id_berita_acara
 * @property int $id_kelas
 * @property int $id_guru
 * @property int $id_mapel
 * @property int $pertemuan_ke
 * @property \Illuminate\Support\Carbon $tanggal
 * @property string $materi_bahasan
 * @property array<int, array<string, mixed>> $kehadiran_siswa
 * @property string $evaluasi_kendala
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
        'id_mapel',
        'pertemuan_ke',
        'tanggal',
        'materi_bahasan',
        'kehadiran_siswa',
        'evaluasi_kendala',
        'catatan_kelas',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'kehadiran_siswa' => 'array',
    ];

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class, 'id_kelas', 'id_kelas');
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'id_guru', 'id_guru');
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mapel', 'id_mapel');
    }

    public function catatanPrivat(): HasMany
    {
        return $this->hasMany(CatatanPrivat::class, 'id_berita_acara', 'id_berita_acara');
    }

    public function apresiasi(): HasMany
    {
        return $this->hasMany(Apresiasi::class, 'id_berita_acara', 'id_berita_acara');
    }
}