<?php

namespace Tests\Feature\Api;

use App\Models\Pengguna;
use App\Models\Guru;
use App\Models\Siswa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_guru_and_prevent_duplicate_nip(): void
    {
        $this->createAdminUser();
        $token = $this->loginToken('operator01');

        $create = $this->withToken($token)->postJson('/api/admin/pengguna', [
            'role' => 'guru',
            'nama_lengkap' => 'Guru Manual',
            'nip' => '198801012026010777',
            'password' => 'secret12345',
        ]);

        $create->assertCreated();
        $create->assertJsonPath('username', '198801012026010777');
        $this->assertDatabaseHas('guru', [
            'nip' => '198801012026010777',
            'nama_lengkap' => 'Guru Manual',
        ]);

        $duplicate = $this->withToken($token)->postJson('/api/admin/pengguna', [
            'role' => 'guru',
            'nama_lengkap' => 'Guru Duplikat',
            'nip' => '198801012026010777',
            'password' => 'secret12345',
        ]);

        $duplicate->assertStatus(422);
        $duplicate->assertJsonValidationErrors(['nip']);
    }

    public function test_admin_can_create_siswa_update_account_and_archive_it(): void
    {
        $this->createAdminUser();
        $token = $this->loginToken('operator01');

        $create = $this->withToken($token)->postJson('/api/admin/pengguna', [
            'role' => 'siswa',
            'nama_lengkap' => 'Siswa Manual',
            'nisn' => '1234567898123',
            'password' => 'secret12345',
        ]);

        $create->assertCreated();
        $create->assertJsonPath('username', '1234567898123');

        $penggunaId = $create->json('id_pengguna');

        $update = $this->withToken($token)->patchJson('/api/admin/pengguna/' . $penggunaId, [
            'role' => 'siswa',
            'nama_lengkap' => 'Siswa Manual Update',
            'nisn' => '1234567898123',
            'is_aktif' => true,
        ]);

        $update->assertOk();
        $update->assertJsonPath('siswa.nama_lengkap', 'Siswa Manual Update');

        $archive = $this->withToken($token)->patchJson('/api/admin/pengguna/' . $penggunaId . '/arsip', [
            'alasan' => 'Lulus dari sekolah',
        ]);

        $archive->assertOk();
        $archive->assertJsonPath('is_aktif', false);

        $loginArchived = $this->postJson('/api/auth/login', [
            'username' => '1234567898123',
            'password' => 'secret12345',
        ]);

        $loginArchived->assertStatus(403);
    }

    public function test_admin_can_restore_archived_account(): void
    {
        $this->createAdminUser();
        $token = $this->loginToken('operator01');

        $create = $this->withToken($token)->postJson('/api/admin/pengguna', [
            'role' => 'guru',
            'nama_lengkap' => 'Guru Restore',
            'nip' => '198801012026010888',
            'password' => 'secret12345',
        ]);

        $penggunaId = $create->json('id_pengguna');

        $this->withToken($token)->patchJson('/api/admin/pengguna/' . $penggunaId . '/arsip', [
            'alasan' => 'Mutasi',
        ])->assertOk();

        $restore = $this->withToken($token)->patchJson('/api/admin/pengguna/' . $penggunaId . '/aktifkan');

        $restore->assertOk();
        $restore->assertJsonPath('is_aktif', true);
        $restore->assertJsonPath('diarsipkan_pada', null);
        $restore->assertJsonPath('diarsipkan_alasan', null);

        $login = $this->postJson('/api/auth/login', [
            'username' => '198801012026010888',
            'password' => 'secret12345',
        ]);

        $login->assertOk();
    }

    public function test_admin_can_filter_pengguna_by_search_role_and_status(): void
    {
        $this->createAdminUser();
        $token = $this->loginToken('operator01');

        $activeGuru = Pengguna::create([
            'username' => '198801012026010999',
            'password' => 'secret12345',
            'role' => 'guru',
        ]);
        $activeGuru->guru()->create([
            'nama_lengkap' => 'Guru Filter Aktif',
            'nip' => '198801012026010999',
        ]);

        $archivedSiswa = Pengguna::create([
            'username' => '1234567898124',
            'password' => 'secret12345',
            'role' => 'siswa',
            'is_aktif' => false,
            'diarsipkan_pada' => now(),
            'diarsipkan_alasan' => 'Keluar sekolah',
        ]);
        $archivedSiswa->siswa()->create([
            'nama_lengkap' => 'Siswa Arsip Filter',
            'nisn' => '1234567898124',
        ]);

        $response = $this->withToken($token)->getJson('/api/admin/pengguna?search=arsip&role=siswa&status=archived');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.username', '1234567898124');
    }

    protected function createAdminUser(): Pengguna
    {
        $pengguna = Pengguna::create([
            'username' => 'operator01',
            'password' => 'secret123',
            'role' => 'admin',
        ]);

        $pengguna->admin()->create([
            'nama_lengkap' => 'Operator Sekolah',
        ]);

        return $pengguna->fresh(['admin']);
    }

    protected function loginToken(string $username): string
    {
        return $this->postJson('/api/auth/login', [
            'username' => $username,
            'password' => 'secret123',
        ])->json('token');
    }
}