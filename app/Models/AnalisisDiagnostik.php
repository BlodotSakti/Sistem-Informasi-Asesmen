<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id_analisis
 * @property int $id_siswa
 * @property int $id_sesi
 * @property numeric $skor_total
 * @property string $narasi_kekuatan
 * @property string $narasi_kelemahan
 * @property \Illuminate\Support\Carbon $tanggal_generate
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\SesiAsesmen $sesiAsesmen
 * @property-read \App\Models\Siswa $siswa
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnalisisDiagnostik newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnalisisDiagnostik newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnalisisDiagnostik query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnalisisDiagnostik whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnalisisDiagnostik whereIdAnalisis($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnalisisDiagnostik whereIdSesi($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnalisisDiagnostik whereIdSiswa($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnalisisDiagnostik whereNarasiKekuatan($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnalisisDiagnostik whereNarasiKelemahan($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnalisisDiagnostik whereSkorTotal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnalisisDiagnostik whereTanggalGenerate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnalisisDiagnostik whereUpdatedAt($value)
 * @mixin \Eloquent
 */
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