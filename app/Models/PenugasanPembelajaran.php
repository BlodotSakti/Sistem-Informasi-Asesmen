<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id_penugasan_pembelajaran
 * @property int $id_kelas
 * @property int $id_mapel
 * @property int $id_guru
 * @property string $tahun_ajaran
 * @property bool $is_aktif
 */
class PenugasanPembelajaran extends Model
{
    use HasFactory;

    protected $table = 'penugasan_pembelajaran';

    protected $primaryKey = 'id_penugasan_pembelajaran';

    protected $fillable = [
        'id_kelas',
        'id_mapel',
        'id_guru',
        'tahun_ajaran',
        'is_aktif',
    ];

    protected $casts = [
        'is_aktif' => 'boolean',
    ];

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class, 'id_kelas', 'id_kelas');
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mapel', 'id_mapel');
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'id_guru', 'id_guru');
    }
}