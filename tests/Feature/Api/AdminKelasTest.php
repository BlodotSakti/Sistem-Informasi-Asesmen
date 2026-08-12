<?php

namespace Tests\Feature\Api;

use App\Models\Guru;
use App\Models\Pengguna;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminKelasTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_admin_can_store_kelas_preserving_full_semester_string(): void
    {
        $admin = Pengguna::factory()->create(['role' => 'admin', 'is_aktif' => true]);
        $guruUser = Pengguna::create([
            'username' => '198801012026010788',
            'password' => 'secret123',
            'role' => 'guru',
        ]);
        $guru = $guruUser->guru()->create([
            'nama_lengkap' => 'Guru Kelas Uji',
            'nip' => '198801012026010788',
        ]);

        $response = $this->actingAs($admin)->postJson('/api/admin/kelas', [
            'id_guru_wali' => $guru->id_guru,
            'nama_kelas' => 'X IPA 1',
            'tahun_ajaran' => '2025/2026 - Semester Ganjil',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('tahun_ajaran', '2025/2026 - Semester Ganjil');

        $this->assertDatabaseHas('kelas', [
            'nama_kelas' => 'X IPA 1',
            'tahun_ajaran' => '2025/2026 - Semester Ganjil',
        ]);
    }

    public function test_admin_can_update_kelas_preserving_full_semester_string(): void
    {
        $admin = Pengguna::factory()->create(['role' => 'admin', 'is_aktif' => true]);
        $guruUser = Pengguna::create([
            'username' => '198801012026010799',
            'password' => 'secret123',
            'role' => 'guru',
        ]);
        $guru = $guruUser->guru()->create([
            'nama_lengkap' => 'Guru Kelas Uji 2',
            'nip' => '198801012026010799',
        ]);

        $kelas = \App\Models\Kelas::create([
            'id_guru_wali' => $guru->id_guru,
            'nama_kelas' => 'X IPA 1',
            'tahun_ajaran' => '2025/2026 - Semester Ganjil',
        ]);

        $response = $this->actingAs($admin)->patchJson("/api/admin/kelas/{$kelas->id_kelas}", [
            'nama_kelas' => 'X IPA 1 Revisi',
            'tahun_ajaran' => '2025/2026 - Semester Genap',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('tahun_ajaran', '2025/2026 - Semester Genap');

        $this->assertDatabaseHas('kelas', [
            'id_kelas' => $kelas->id_kelas,
            'nama_kelas' => 'X IPA 1 Revisi',
            'tahun_ajaran' => '2025/2026 - Semester Genap',
        ]);
    }
}
