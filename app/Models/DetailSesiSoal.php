<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id_detail
 * @property int $id_sesi
 * @property int $id_soal
 * @property numeric $bobot_nilai
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\BankSoal $bankSoal
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\JawabanSiswa> $jawabanSiswa
 * @property-read int|null $jawaban_siswa_count
 * @property-read \App\Models\SesiAsesmen $sesiAsesmen
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DetailSesiSoal newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DetailSesiSoal newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DetailSesiSoal query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DetailSesiSoal whereBobotNilai($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DetailSesiSoal whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DetailSesiSoal whereIdDetail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DetailSesiSoal whereIdSesi($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DetailSesiSoal whereIdSoal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DetailSesiSoal whereUpdatedAt($value)
 * @mixin \Eloquent
 */
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