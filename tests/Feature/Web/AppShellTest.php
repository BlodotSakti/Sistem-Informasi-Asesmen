<?php

namespace Tests\Feature\Web;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppShellTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_shell_is_served(): void
    {
        $response = $this->get('/login');

        $response->assertOk();
        $response->assertSee('id="app"', false);
    }

    public function test_dashboard_shell_is_served(): void
    {
        $response = $this->get('/admin/dashboard');

        $response->assertOk();
        $response->assertSee('id="app"', false);
    }

    public function test_admin_master_pages_are_served(): void
    {
        $pages = [
            '/admin/pengguna',
            '/admin/tahun-ajaran',
            '/admin/kelas',
            '/admin/mata-pelajaran',
            '/admin/kelas-siswa',
            '/admin/penugasan-pembelajaran',
            '/admin/import-akun',
        ];

        foreach ($pages as $page) {
            $response = $this->get($page);

            $response->assertOk();
            $response->assertSee('id="app"', false);
        }
    }

    public function test_student_profile_shell_is_served(): void
    {
        $response = $this->get('/siswa/profil');

        $response->assertOk();
        $response->assertSee('id="app"', false);
    }
}