<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SesiAsesmen extends Model
{
    use HasFactory;

    protected $table = 'sesi_asesmen';

    protected $primaryKey = 'id_sesi';

    protected $fillable = [
        'id_kelas',
        'id_mapel',
        'tipe_soal',
        'jenis_asesmen',
        'waktu_mulai',
        'durasi_menit',
    ];

    protected $casts = [
        'waktu_mulai' => 'datetime',
        'durasi_menit' => 'integer',
    ];

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class, 'id_kelas', 'id_kelas');
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mapel', 'id_mapel');
    }

    public function detailSesiSoal(): HasMany
    {
        return $this->hasMany(DetailSesiSoal::class, 'id_sesi', 'id_sesi');
    }

    public function bankSoal(): BelongsToMany
    {
        return $this->belongsToMany(
            BankSoal::class,
            'detail_sesi_soal',
            'id_sesi',
            'id_soal',
            'id_sesi',
            'id_soal'
        )->withPivot(['id_detail', 'bobot_nilai']);
    }

    public function analisisDiagnostik(): HasMany
    {
        return $this->hasMany(AnalisisDiagnostik::class, 'id_sesi', 'id_sesi');
    }
}