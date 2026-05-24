<?php

namespace Tests\Feature\Api;

use App\Models\Admin;
use App\Models\Guru;
use App\Models\Pengguna;
use App\Models\Siswa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_token_and_profile_payload(): void
    {
        $this->createUserWithProfile('admin', 'operator01', 'Operator Sekolah');

        $response = $this->postJson('/api/auth/login', [
            'username' => 'operator01',
            'password' => 'secret123',
        ]);

        $response->assertOk();
        $response->assertJsonPath('user.role', 'admin');
        $response->assertJsonPath('user.nama_lengkap', 'Operator Sekolah');
        $response->assertJsonStructure([
            'message',
            'token_type',
            'token',
            'user' => [
                'id_pengguna',
                'username',
                'role',
                'nama_lengkap',
                'profile',
            ],
        ]);
    }

    public function test_admin_route_rejects_guru_token(): void
    {
        $guru = $this->createUserWithProfile('guru', 'guru01', 'Guru Pengajar');

        $login = $this->postJson('/api/auth/login', [
            'username' => 'guru01',
            'password' => 'secret123',
        ]);

        $token = $login->json('token');

        $response = $this->withToken($token)->getJson('/api/admin/kelas');

        $response->assertForbidden();
    }

    public function test_admin_route_allows_admin_token(): void
    {
        $this->createUserWithProfile('admin', 'admin01', 'Operator Sekolah');

        $login = $this->postJson('/api/auth/login', [
            'username' => 'admin01',
            'password' => 'secret123',
        ]);

        $token = $login->json('token');

        $response = $this->withToken($token)->getJson('/api/admin/kelas');

        $response->assertOk();
    }

    protected function createUserWithProfile(string $role, string $username, string $namaLengkap): Pengguna
    {
        $pengguna = Pengguna::create([
            'username' => $username,
            'password' => 'secret123',
            'role' => $role,
        ]);

        match ($role) {
            'admin' => Admin::create([
                'id_pengguna' => $pengguna->id_pengguna,
                'nama_lengkap' => $namaLengkap,
            ]),
            'guru' => Guru::create([
                'id_pengguna' => $pengguna->id_pengguna,
                'nama_lengkap' => $namaLengkap,
                'nip' => '198801012026010001',
            ]),
            'siswa' => Siswa::create([
                'id_pengguna' => $pengguna->id_pengguna,
                'nama_lengkap' => $namaLengkap,
                'nisn' => '1234567890',
            ]),
            default => null,
        };

        return $pengguna->fresh(['admin', 'guru', 'siswa']);
    }
}