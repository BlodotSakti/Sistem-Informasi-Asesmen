<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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