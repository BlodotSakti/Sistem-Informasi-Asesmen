<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id_rencana_belajar
 * @property int $id_siswa
 * @property int $id_mapel
 * @property string $sumber
 * @property string $status
 * @property string|null $catatan
 */
class RencanaBelajar extends Model
{
    use HasFactory;

    protected $table = 'rencana_belajar';

    protected $primaryKey = 'id_rencana_belajar';

    protected $fillable = [
        'id_siswa',
        'id_mapel',
        'sumber',
        'status',
        'catatan',
    ];

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class, 'id_siswa', 'id_siswa');
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mapel', 'id_mapel');
    }
}