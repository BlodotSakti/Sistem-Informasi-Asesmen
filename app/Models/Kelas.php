<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kelas extends Model
{
    use HasFactory;

    protected $table = 'kelas';

    protected $primaryKey = 'id_kelas';

    protected $fillable = [
        'id_guru_wali',
        'nama_kelas',
        'tahun_ajaran',
    ];

    public function guruWali(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'id_guru_wali', 'id_guru');
    }

    public function sesiAsesmen(): HasMany
    {
        return $this->hasMany(SesiAsesmen::class, 'id_kelas', 'id_kelas');
    }

    public function beritaAcara(): HasMany
    {
        return $this->hasMany(BeritaAcara::class, 'id_kelas', 'id_kelas');
    }
}