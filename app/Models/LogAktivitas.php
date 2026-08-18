<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogAktivitas extends Model
{
    use HasFactory;

    protected $table = 'log_aktivitas';
    protected $primaryKey = 'id_log';

    protected $fillable = [
        'id_pengguna_aktor',
        'tipe_aksi',
        'deskripsi',
    ];

    public function aktor(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_pengguna_aktor', 'id_pengguna');
    }
}
