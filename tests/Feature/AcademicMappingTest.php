<?php

namespace Tests\Feature;

use App\Models\Pengguna;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicMappingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_academic_mapping()
    {
        $admin = Pengguna::factory()->create(['role' => 'admin', 'is_aktif' => true]);

        $response = $this->actingAs($admin)->getJson('/api/admin/academic-mapping');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         '*' => [
                             'id_kelas',
                             'nama_kelas',
                             'tingkat',
                             'tahun_ajaran',
                             'guru_wali',
                             'total_siswa',
                             'siswa',
                             'mata_pelajaran',
                         ]
                     ]
                 ]);
    }

    public function test_guru_cannot_access_academic_mapping()
    {
        $guru = Pengguna::factory()->create(['role' => 'guru', 'is_aktif' => true]);

        $response = $this->actingAs($guru)->getJson('/api/admin/academic-mapping');

        $response->assertStatus(403);
    }

    public function test_siswa_cannot_access_academic_mapping()
    {
        $siswa = Pengguna::factory()->create(['role' => 'siswa', 'is_aktif' => true]);

        $response = $this->actingAs($siswa)->getJson('/api/admin/academic-mapping');

        $response->assertStatus(403);
    }
}
