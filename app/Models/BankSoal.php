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
        'paket_soal',
        'level_kognitif',
        'gambar_soal',
        'audio_soal',
        'batas_putar_audio',
        'keywords',
        'rule_weight',
        'lsa_weight',
        'math_steps',
        'math_weight',
        'tgate',
        'required_keywords_count',
    ];

    protected $casts = [
        'opsi_jawaban' => 'array',
        'keywords' => 'array',
        'math_steps' => 'array',
        'math_weight' => 'float',
        'tgate' => 'float',
        'required_keywords_count' => 'integer',
        'batas_putar_audio' => 'integer',
    ];

    protected $appends = [
        'gambar_soal_url',
        'audio_soal_url',
    ];

    public static function fileToDataUri(\Illuminate\Http\UploadedFile $file): string
    {
        $mime = $file->getMimeType() ?: $file->getClientMimeType() ?: 'application/octet-stream';
        $contents = file_get_contents($file->getRealPath());
        return 'data:' . $mime . ';base64,' . base64_encode($contents);
    }

    public function getGambarSoalUrlAttribute(): ?string
    {
        if (empty($this->gambar_soal)) {
            return null;
        }
        $val = (string) $this->gambar_soal;
        if (str_starts_with($val, 'data:') || str_starts_with($val, 'http://') || str_starts_with($val, 'https://')) {
            return $val;
        }
        return asset('storage/' . ltrim($val, '/'));
    }

    public function getAudioSoalUrlAttribute(): ?string
    {
        if (empty($this->audio_soal)) {
            return null;
        }
        $val = (string) $this->audio_soal;
        if (str_starts_with($val, 'data:') || str_starts_with($val, 'http://') || str_starts_with($val, 'https://')) {
            return $val;
        }
        return asset('storage/' . ltrim($val, '/'));
    }

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