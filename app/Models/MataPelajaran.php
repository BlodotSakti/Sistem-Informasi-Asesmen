<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MataPelajaran extends Model
{
    use HasFactory;

    protected $table = 'mata_pelajaran';

    protected $primaryKey = 'id_mapel';

    protected $fillable = [
        'nama_mapel',
        'tingkat',
    ];

    public function bankSoal(): HasMany
    {
        return $this->hasMany(BankSoal::class, 'id_mapel', 'id_mapel');
    }

    public function sesiAsesmen(): HasMany
    {
        return $this->hasMany(SesiAsesmen::class, 'id_mapel', 'id_mapel');
    }
}