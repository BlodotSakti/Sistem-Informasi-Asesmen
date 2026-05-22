<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DetailSesiSoal extends Model
{
    use HasFactory;

    protected $table = 'detail_sesi_soal';

    protected $primaryKey = 'id_detail';

    protected $fillable = [
        'id_sesi',
        'id_soal',
        'bobot_nilai',
    ];

    protected $casts = [
        'bobot_nilai' => 'decimal:2',
    ];

    public function sesiAsesmen(): BelongsTo
    {
        return $this->belongsTo(SesiAsesmen::class, 'id_sesi', 'id_sesi');
    }

    public function bankSoal(): BelongsTo
    {
        return $this->belongsTo(BankSoal::class, 'id_soal', 'id_soal');
    }

    public function jawabanSiswa(): HasMany
    {
        return $this->hasMany(JawabanSiswa::class, 'id_detail', 'id_detail');
    }
}