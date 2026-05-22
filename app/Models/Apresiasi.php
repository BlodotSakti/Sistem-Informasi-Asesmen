<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Apresiasi extends Model
{
    use HasFactory;

    protected $table = 'apresiasi';

    protected $primaryKey = 'id_apresiasi';

    protected $fillable = [
        'id_guru',
        'id_siswa',
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
}