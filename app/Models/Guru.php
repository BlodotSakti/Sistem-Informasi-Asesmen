<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Guru extends Model
{
    use HasFactory;

    protected $table = 'guru';

    protected $primaryKey = 'id_guru';

    protected $fillable = [
        'id_pengguna',
        'nama_lengkap',
        'nip',
    ];

    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_pengguna', 'id_pengguna');
    }

    public function kelasWali(): HasMany
    {
        return $this->hasMany(Kelas::class, 'id_guru_wali', 'id_guru');
    }

    public function bankSoal(): HasMany
    {
        return $this->hasMany(BankSoal::class, 'id_guru', 'id_guru');
    }

    public function beritaAcara(): HasMany
    {
        return $this->hasMany(BeritaAcara::class, 'id_guru', 'id_guru');
    }

    public function catatanPrivat(): HasMany
    {
        return $this->hasMany(CatatanPrivat::class, 'id_guru', 'id_guru');
    }

    public function apresiasi(): HasMany
    {
        return $this->hasMany(Apresiasi::class, 'id_guru', 'id_guru');
    }
}