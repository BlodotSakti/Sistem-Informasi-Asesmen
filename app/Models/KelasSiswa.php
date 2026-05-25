<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id_kelas_siswa
 * @property int $id_kelas
 * @property int $id_siswa
 * @property string $tahun_ajaran
 * @property bool $is_aktif
 * @property \Illuminate\Support\Carbon|null $tanggal_masuk
 * @property \Illuminate\Support\Carbon|null $tanggal_keluar
 */
class KelasSiswa extends Model
{
    use HasFactory;

    protected $table = 'kelas_siswa';

    protected $primaryKey = 'id_kelas_siswa';

    protected $fillable = [
        'id_kelas',
        'id_siswa',
        'tahun_ajaran',
        'is_aktif',
        'tanggal_masuk',
        'tanggal_keluar',
    ];

    protected $casts = [
        'is_aktif' => 'boolean',
        'tanggal_masuk' => 'date',
        'tanggal_keluar' => 'date',
    ];

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class, 'id_kelas', 'id_kelas');
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class, 'id_siswa', 'id_siswa');
    }
}