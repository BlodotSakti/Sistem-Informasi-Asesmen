<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class BackupController extends Controller
{
    /**
     * Get list of backups.
     */
    public function index()
    {
        $disk = Storage::disk(config('backup.backup.destination.disks')[0] ?? 'local');
        $files = $disk->files(config('backup.backup.name'));

        $backups = [];
        foreach ($files as $k => $f) {
            if (substr($f, -4) == '.zip' && $disk->exists($f)) {
                $backups[] = [
                    'file_path' => $f,
                    'file_name' => str_replace(config('backup.backup.name') . '/', '', $f),
                    'file_size' => round($disk->size($f) / 1048576, 2) . ' MB',
                    'last_modified' => \Carbon\Carbon::createFromTimestamp($disk->lastModified($f))->timezone('Asia/Jakarta')->translatedFormat('d F Y, H:i') . ' WIB',
                ];
            }
        }

        // reverse sort to show newest first
        $backups = array_reverse($backups);

        return response()->json($backups);
    }

    /**
     * Create a new database backup manually.
     */
    public function create()
    {
        try {
            // Run the backup command
            Artisan::call('backup:run', ['--only-db' => true]);
            
            return response()->json(['message' => 'Database Backup berhasil dibuat.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal membuat backup: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create full backup manually.
     */
    public function createFull()
    {
        try {
            // Run full backup
            Artisan::call('backup:run');
            
            return response()->json(['message' => 'Full Backup berhasil dibuat.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal membuat backup: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Download a backup.
     */
    public function download($file_name)
    {
        $file = config('backup.backup.name') . '/' . $file_name;
        $disk = Storage::disk(config('backup.backup.destination.disks')[0] ?? 'local');

        if ($disk->exists($file)) {
            return $disk->download($file);
        }

        return response()->json(['error' => 'File tidak ditemukan.'], 404);
    }

    /**
     * Delete a backup.
     */
    public function destroy($file_name)
    {
        $file = config('backup.backup.name') . '/' . $file_name;
        $disk = Storage::disk(config('backup.backup.destination.disks')[0] ?? 'local');

        if ($disk->exists($file)) {
            $disk->delete($file);
            return response()->json(['message' => 'File backup berhasil dihapus.']);
        }

        return response()->json(['error' => 'File tidak ditemukan.'], 404);
    }
}
