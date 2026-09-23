<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use App\Models\TahunAjaran;
use App\Models\LogAktivitas;

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
            $this->setBackupFilenamePrefix();
            // Run the backup command
            $exitCode = Artisan::call('backup:run', ['--only-db' => true]);
            
            if ($exitCode !== 0) {
                $output = Artisan::output();
                throw new \Exception("Gagal menjalankan perintah backup (Exit code: $exitCode). " . $output);
            }
            
            LogAktivitas::create([
                'id_pengguna_aktor' => request()->user()->id_pengguna,
                'tipe_aksi' => 'tambah',
                'deskripsi' => 'Pembuatan Backup Database berhasil.',
            ]);

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
            $this->setBackupFilenamePrefix();
            // Run full backup
            $exitCode = Artisan::call('backup:run');

            if ($exitCode !== 0) {
                $output = Artisan::output();
                throw new \Exception("Gagal menjalankan perintah backup (Exit code: $exitCode). " . $output);
            }
            
            LogAktivitas::create([
                'id_pengguna_aktor' => request()->user()->id_pengguna,
                'tipe_aksi' => 'tambah',
                'deskripsi' => 'Pembuatan Full Backup berhasil.',
            ]);

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

            LogAktivitas::create([
                'id_pengguna_aktor' => request()->user()->id_pengguna ?? 1,
                'tipe_aksi' => 'hapus',
                'deskripsi' => 'Penghapusan file backup: ' . $file_name,
            ]);

            return response()->json(['message' => 'File backup berhasil dihapus.']);
        }

        return response()->json(['error' => 'File tidak ditemukan.'], 404);
    }

    /**
     * Set backup filename prefix based on active Tahun Ajaran.
     */
    private function setBackupFilenamePrefix()
    {
        $activeTahunAjaran = TahunAjaran::where('is_aktif', true)->first();
        if ($activeTahunAjaran) {
            $namaTA = str_replace('/', '-', $activeTahunAjaran->nama_tahun_ajaran);
            $semester = ucfirst($activeTahunAjaran->semester);
            $prefix = "TA-{$namaTA}-Semester-{$semester}_";
            config(['backup.backup.destination.filename_prefix' => $prefix]);
        }
    }
}
