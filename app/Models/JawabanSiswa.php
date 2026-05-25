<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id_jawaban
 * @property int $id_siswa
 * @property int $id_detail
 * @property string $teks_jawaban
 * @property bool $is_correct
 * @property numeric $skor_diperoleh
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\DetailSesiSoal $detailSesiSoal
 * @property-read \App\Models\Siswa $siswa
 * @method static \Illuminate\Database\Eloquent\Builder<static>|JawabanSiswa newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|JawabanSiswa newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|JawabanSiswa query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|JawabanSiswa whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|JawabanSiswa whereIdDetail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|JawabanSiswa whereIdJawaban($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|JawabanSiswa whereIdSiswa($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|JawabanSiswa whereIsCorrect($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|JawabanSiswa whereSkorDiperoleh($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|JawabanSiswa whereTeksJawaban($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|JawabanSiswa whereUpdatedAt($value)
 * @mixin \Eloquent
 */
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