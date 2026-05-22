<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankSoal extends Model
{
    use HasFactory;

    protected $table = 'bank_soal';

    protected $primaryKey = 'id_soal';

    protected $fillable = [
        'id_guru',
        'id_mapel',
        'isi_soal',
        'jenis_soal',
        'kunci_jawaban',
        'topik_materi',
        'level_kognitif',
    ];

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'id_guru', 'id_guru');
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mapel', 'id_mapel');
    }

    public function detailSesiSoal(): HasMany
    {
        return $this->hasMany(DetailSesiSoal::class, 'id_soal', 'id_soal');
    }

    public function sesiAsesmen(): BelongsToMany
    {
        return $this->belongsToMany(
            SesiAsesmen::class,
            'detail_sesi_soal',
            'id_soal',
            'id_sesi',
            'id_soal',
            'id_sesi'
        )->withPivot(['id_detail', 'bobot_nilai']);
    }
}