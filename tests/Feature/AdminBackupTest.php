<?php

namespace Tests\Feature;

use App\Models\Pengguna;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminBackupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock Storage
        Storage::fake(config('backup.backup.destination.disks')[0] ?? 'local');
    }

    private function createAdminUser()
    {
        return Pengguna::factory()->create([
            'role' => 'admin',
        ]);
    }

    private function createGuruUser()
    {
        return Pengguna::factory()->create([
            'role' => 'guru',
        ]);
    }

    public function test_admin_can_view_backups()
    {
        $admin = $this->createAdminUser();
        $token = $admin->createToken('auth_token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->getJson('/api/admin/backup');

        $response->assertStatus(200);
        $response->assertJsonIsArray();
    }

    public function test_non_admin_cannot_view_backups()
    {
        $guru = $this->createGuruUser();
        $token = $guru->createToken('auth_token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->getJson('/api/admin/backup');

        // Middleware role:admin should block
        $response->assertStatus(403);
    }

    public function test_admin_can_run_db_backup()
    {
        $admin = $this->createAdminUser();
        $token = $admin->createToken('auth_token')->plainTextToken;

        Artisan::shouldReceive('call')
            ->once()
            ->with('backup:run', ['--only-db' => true]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->postJson('/api/admin/backup/run');

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Database Backup berhasil dibuat.'
        ]);
    }

    public function test_admin_can_run_full_backup()
    {
        $admin = $this->createAdminUser();
        $token = $admin->createToken('auth_token')->plainTextToken;

        Artisan::shouldReceive('call')
            ->once()
            ->with('backup:run');

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->postJson('/api/admin/backup/run-full');

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Full Backup berhasil dibuat.'
        ]);
    }

    public function test_admin_can_download_backup()
    {
        $admin = $this->createAdminUser();
        $token = $admin->createToken('auth_token')->plainTextToken;

        $disk = Storage::disk(config('backup.backup.destination.disks')[0] ?? 'local');
        $fileName = 'test-backup.zip';
        $path = config('backup.backup.name') . '/' . $fileName;
        
        $disk->put($path, 'dummy content');

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->get('/api/admin/backup/download/' . $fileName);

        $response->assertStatus(200);
        $response->assertDownload($fileName);
    }

    public function test_admin_can_delete_backup()
    {
        $admin = $this->createAdminUser();
        $token = $admin->createToken('auth_token')->plainTextToken;

        $disk = Storage::disk(config('backup.backup.destination.disks')[0] ?? 'local');
        $fileName = 'test-backup.zip';
        $path = config('backup.backup.name') . '/' . $fileName;
        
        $disk->put($path, 'dummy content');

        $this->assertTrue($disk->exists($path));

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->deleteJson('/api/admin/backup/' . $fileName);

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'File backup berhasil dihapus.'
        ]);

        $this->assertFalse($disk->exists($path));
    }
}
