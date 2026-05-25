<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int $id_pengguna
 * @property string $username
 * @property string $password
 * @property string $role
 * @property bool $is_aktif
 * @property \Illuminate\Support\Carbon|null $diarsipkan_pada
 * @property string|null $diarsipkan_alasan
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Admin|null $admin
 * @property-read \App\Models\Guru|null $guru
 * @property-read \App\Models\Siswa|null $siswa
 * @property-read \Illuminate\Notifications\DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification> $notifications
 * @property-read int|null $notifications_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \Laravel\Sanctum\PersonalAccessToken> $tokens
 * @property-read int|null $tokens_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengguna newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengguna newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengguna query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengguna whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengguna whereDiarsipkanAlasan($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengguna whereDiarsipkanPada($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengguna whereIdPengguna($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengguna whereIsAktif($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengguna wherePassword($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengguna whereRole($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengguna whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengguna whereUsername($value)
 * @mixin \Eloquent
 */
class Pengguna extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'pengguna';

    protected $primaryKey = 'id_pengguna';

    protected $fillable = [
        'username',
        'password',
        'role',
        'is_aktif',
        'diarsipkan_pada',
        'diarsipkan_alasan',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'password' => 'hashed',
        'is_aktif' => 'boolean',
        'diarsipkan_pada' => 'datetime',
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