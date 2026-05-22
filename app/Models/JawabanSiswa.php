<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JawabanSiswa extends Model
{
    use HasFactory;

    protected $table = 'jawaban_siswa';

    protected $primaryKey = 'id_jawaban';

    protected $fillable = [
        'id_siswa',
        'id_detail',
        'teks_jawaban',
        'is_correct',
        'skor_diperoleh',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'skor_diperoleh' => 'decimal:2',
    ];

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class, 'id_siswa', 'id_siswa');
    }

    public function detailSesiSoal(): BelongsTo
    {
        return $this->belongsTo(DetailSesiSoal::class, 'id_detail', 'id_detail');
    }
}