<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalisisDiagnostik extends Model
{
    use HasFactory;

    protected $table = 'analisis_diagnostik';

    protected $primaryKey = 'id_analisis';

    protected $fillable = [
        'id_siswa',
        'id_sesi',
        'skor_total',
        'narasi_kekuatan',
        'narasi_kelemahan',
        'tanggal_generate',
    ];

    protected $casts = [
        'skor_total' => 'decimal:2',
        'tanggal_generate' => 'datetime',
    ];

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class, 'id_siswa', 'id_siswa');
    }

    public function sesiAsesmen(): BelongsTo
    {
        return $this->belongsTo(SesiAsesmen::class, 'id_sesi', 'id_sesi');
    }
}