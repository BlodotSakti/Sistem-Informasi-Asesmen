<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogPelanggaranCbt extends Model
{
    use HasFactory;

    protected $table = 'log_pelanggaran_cbt';
    protected $primaryKey = 'id_log';

    protected $fillable = [
        'id_sesi',
        'id_siswa',
        'jenis_pelanggaran',
        'keterangan',
        'user_agent',
        'is_resolved',
    ];

    public function sesiAsesmen()
    {
        return $this->belongsTo(SesiAsesmen::class, 'id_sesi', 'id_sesi');
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'id_siswa', 'id_siswa');
    }
}
