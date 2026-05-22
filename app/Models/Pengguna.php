<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Pengguna extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'pengguna';

    protected $primaryKey = 'id_pengguna';

    protected $fillable = [
        'username',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'password' => 'hashed',
    ];

    public function admin(): HasOne
    {
        return $this->hasOne(Admin::class, 'id_pengguna', 'id_pengguna');
    }

    public function guru(): HasOne
    {
        return $this->hasOne(Guru::class, 'id_pengguna', 'id_pengguna');
    }

    public function siswa(): HasOne
    {
        return $this->hasOne(Siswa::class, 'id_pengguna', 'id_pengguna');
    }
}