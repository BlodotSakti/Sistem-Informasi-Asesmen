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
}