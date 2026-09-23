<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\TahunAjaran;
use App\Models\LogAktivitas;
use Carbon\Carbon;
use ZipArchive;

class BackupController extends Controller
{
    public function index()
    {
        $backupDir = 'backups';

        if (!Storage::disk('local')->exists($backupDir)) {
            return response()->json([]);
        }

        $files = Storage::disk('local')->files($backupDir);

        $backups = [];
        foreach ($files as $f) {
            if (substr($f, -4) === '.zip' || substr($f, -4) === '.sql') {
                $backups[] = [
                    'file_path' => $f,
                    'file_name' => basename($f),
                    'file_size' => round(Storage::disk('local')->size($f) / 1048576, 2) . ' MB',
                    'last_modified' => Carbon::createFromTimestamp(
                        Storage::disk('local')->lastModified($f)
                    )->timezone('Asia/Jakarta')->translatedFormat('d F Y, H:i') . ' WIB',
                ];
            }
        }

        $backups = array_reverse($backups);

        return response()->json($backups);
    }

    public function create()
    {
        try {
            $sqlContent = $this->generateDatabaseDump();

            $filename = $this->generateFilename('db') . '.sql';
            $path = 'backups/' . $filename;

            Storage::disk('local')->put($path, $sqlContent);

            LogAktivitas::create([
                'id_pengguna_aktor' => request()->user()->id_pengguna,
                'tipe_aksi' => 'tambah',
                'deskripsi' => 'Pembuatan Backup Database berhasil: ' . $filename,
            ]);

            return response()->json(['message' => 'Database Backup berhasil dibuat.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal membuat backup: ' . $e->getMessage()], 500);
        }
    }

    public function createFull()
    {
        try {
            $sqlContent = $this->generateDatabaseDump();

            $zipFilename = $this->generateFilename('full') . '.zip';
            $zipPath = storage_path('app/backups/' . $zipFilename);

            if (!is_dir(storage_path('app/backups'))) {
                mkdir(storage_path('app/backups'), 0755, true);
            }

            $zip = new ZipArchive();
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                throw new \Exception('Gagal membuat file ZIP.');
            }

            $zip->addFromString('database.sql', $sqlContent);

            $uploadDir = storage_path('app/public');
            if (is_dir($uploadDir)) {
                $this->addDirectoryToZip($zip, $uploadDir, 'storage');
            }

            $zip->close();

            LogAktivitas::create([
                'id_pengguna_aktor' => request()->user()->id_pengguna,
                'tipe_aksi' => 'tambah',
                'deskripsi' => 'Pembuatan Full Backup berhasil: ' . $zipFilename,
            ]);

            return response()->json(['message' => 'Full Backup berhasil dibuat.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal membuat backup: ' . $e->getMessage()], 500);
        }
    }

    public function download($file_name)
    {
        $file = 'backups/' . $file_name;

        if (Storage::disk('local')->exists($file)) {
            return Storage::disk('local')->download($file);
        }

        return response()->json(['error' => 'File tidak ditemukan.'], 404);
    }

    public function destroy($file_name)
    {
        $file = 'backups/' . $file_name;

        if (Storage::disk('local')->exists($file)) {
            Storage::disk('local')->delete($file);

            LogAktivitas::create([
                'id_pengguna_aktor' => request()->user()->id_pengguna ?? 1,
                'tipe_aksi' => 'hapus',
                'deskripsi' => 'Penghapusan file backup: ' . $file_name,
            ]);

            return response()->json(['message' => 'File backup berhasil dihapus.']);
        }

        return response()->json(['error' => 'File tidak ditemukan.'], 404);
    }

    private function generateFilename($type)
    {
        $activeTahunAjaran = TahunAjaran::where('is_aktif', true)->first();
        $prefix = '';
        if ($activeTahunAjaran) {
            $namaTA = str_replace('/', '-', $activeTahunAjaran->nama_tahun_ajaran);
            $semester = ucfirst($activeTahunAjaran->semester);
            $prefix = "TA-{$namaTA}-Semester-{$semester}_";
        }

        $timestamp = Carbon::now()->timezone('Asia/Jakarta')->format('Y-m-d_H-i-s');
        return "{$prefix}{$type}_backup_{$timestamp}";
    }

    private function generateDatabaseDump()
    {
        $tables = DB::select('SHOW TABLES');
        $dbName = config('database.connections.mysql.database');
        $key = 'Tables_in_' . $dbName;

        $sql = "-- Database Backup\n";
        $sql .= "-- Generated: " . Carbon::now()->timezone('Asia/Jakarta')->format('Y-m-d H:i:s') . " WIB\n";
        $sql .= "-- Database: {$dbName}\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n";
        $sql .= "SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n";
        $sql .= "SET AUTOCOMMIT=0;\n";
        $sql .= "START TRANSACTION;\n\n";

        foreach ($tables as $table) {
            $tableName = $table->$key;

            $createResult = DB::select("SHOW CREATE TABLE `{$tableName}`");
            $createSql = $createResult[0]->{'Create Table'} ?? '';

            $sql .= "-- ----------------------------\n";
            $sql .= "-- Table structure for `{$tableName}`\n";
            $sql .= "-- ----------------------------\n";
            $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
            $sql .= $createSql . ";\n\n";

            $rows = DB::select("SELECT * FROM `{$tableName}`");

            if (count($rows) > 0) {
                $sql .= "-- ----------------------------\n";
                $sql .= "-- Records of `{$tableName}`\n";
                $sql .= "-- ----------------------------\n";

                $columns = array_keys((array) $rows[0]);
                $columnList = implode('`, `', $columns);

                $batchSize = 100;
                $chunks = array_chunk($rows, $batchSize);

                foreach ($chunks as $chunk) {
                    $sql .= "INSERT INTO `{$tableName}` (`{$columnList}`) VALUES\n";

                    $values = [];
                    foreach ($chunk as $row) {
                        $rowValues = [];
                        foreach ((array) $row as $value) {
                            if (is_null($value)) {
                                $rowValues[] = 'NULL';
                            } else {
                                $rowValues[] = "'" . addslashes((string) $value) . "'";
                            }
                        }
                        $values[] = '(' . implode(', ', $rowValues) . ')';
                    }

                    $sql .= implode(",\n", $values) . ";\n";
                }

                $sql .= "\n";
            }
        }

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
        $sql .= "COMMIT;\n";

        return $sql;
    }

    private function addDirectoryToZip(ZipArchive $zip, $dir, $zipPrefix)
    {
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($iterator as $file) {
            if (!$file->isDir()) {
                $filePath = $file->getRealPath();
                $relativePath = $zipPrefix . '/' . substr($filePath, strlen($dir) + 1);
                $relativePath = str_replace('\\', '/', $relativePath);
                $zip->addFile($filePath, $relativePath);
            }
        }
    }
}
