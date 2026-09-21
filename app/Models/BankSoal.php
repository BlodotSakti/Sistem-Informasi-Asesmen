<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id_soal
 * @property int $id_guru
 * @property int $id_mapel
 * @property string $isi_soal
 * @property string $jenis_soal
 * @property string $kunci_jawaban
 * @property string $topik_materi
 * @property string $level_kognitif
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\DetailSesiSoal> $detailSesiSoal
 * @property-read int|null $detail_sesi_soal_count
 * @property-read \App\Models\Guru $guru
 * @property-read \App\Models\MataPelajaran $mataPelajaran
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\SesiAsesmen> $sesiAsesmen
 * @property-read int|null $sesi_asesmen_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BankSoal newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BankSoal newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BankSoal query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BankSoal whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BankSoal whereIdGuru($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BankSoal whereIdMapel($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BankSoal whereIdSoal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BankSoal whereIsiSoal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BankSoal whereJenisSoal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BankSoal whereKunciJawaban($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BankSoal whereLevelKognitif($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BankSoal whereTopikMateri($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|BankSoal whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class BankSoal extends Model
{
    use HasFactory;

    protected $table = 'bank_soal';

    protected $primaryKey = 'id_soal';

    protected $fillable = [
        'created_by',
        'id_mapel',
        'isi_soal',
        'jenis_soal',
        'opsi_jawaban',
        'kunci_jawaban',
        'topik_materi',
        'level_kognitif',
        'gambar_soal',
        'keywords',
        'rule_weight',
        'lsa_weight',
    ];

    protected $casts = [
        'opsi_jawaban' => 'array',
        'keywords' => 'array',
    ];

    public function pembuat(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'created_by', 'id_pengguna');
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