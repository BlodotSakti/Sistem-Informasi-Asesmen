<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Siswa extends Model
{
    use HasFactory;

    protected $table = 'siswa';

    protected $primaryKey = 'id_siswa';

    protected $fillable = [
        'id_pengguna',
        'nama_lengkap',
        'nisn',
    ];

    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_pengguna', 'id_pengguna');
    }

    public function jawabanSiswa(): HasMany
    {
        return $this->hasMany(JawabanSiswa::class, 'id_siswa', 'id_siswa');
    }

    public function analisisDiagnostik(): HasMany
    {
        return $this->hasMany(AnalisisDiagnostik::class, 'id_siswa', 'id_siswa');
    }

    public function catatanPrivat(): HasMany
    {
        return $this->hasMany(CatatanPrivat::class, 'id_siswa', 'id_siswa');
    }

    public function apresiasi(): HasMany
    {
        return $this->hasMany(Apresiasi::class, 'id_siswa', 'id_siswa');
    }
}