<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Siswa;
use App\Models\Kelas;
use App\Models\TahunAjaran;
use App\Models\Pengguna;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $totalGuru = Guru::count();
        $totalSiswa = Siswa::count();
        
        $tahunAjaranAktif = TahunAjaran::where('is_aktif', true)->first();
        // Fallback to all classes if no active academic year is set
        $totalKelas = $tahunAjaranAktif 
            ? Kelas::where('tahun_ajaran', $tahunAjaranAktif->nama_tahun_ajaran)->count() 
            : Kelas::count();

        // System Logs: 10 newest registered users
        $recentLogs = Pengguna::query()
            ->with(['admin', 'guru', 'siswa'])
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(function (Pengguna $pengguna) {
                $profile = $pengguna->admin ?? $pengguna->guru ?? $pengguna->siswa;

                return [
                    'id' => $pengguna->id_pengguna,
                    'tanggal' => $pengguna->created_at?->format('Y-m-d H:i') ?? now()->format('Y-m-d H:i'),
                    'deskripsi' => match ($pengguna->role) {
                        'admin' => 'Penambahan akun admin baru',
                        'guru' => 'Penambahan akun guru baru',
                        'siswa' => 'Penambahan akun siswa baru',
                        default => 'Penambahan pengguna baru',
                    },
                    'nama_lengkap' => $profile?->nama_lengkap ?? $pengguna->username,
                    'role' => $pengguna->role,
                ];
            });

        // Activity Chart: New users per day for the last 7 days
        $chartData = [];
        $startDate = Carbon::now()->subDays(6)->startOfDay();
        
        // Ensure proper dialect compatibility for dates based on database driver (SQLite vs MySQL)
        // Since sqlite dates are stored as strings and DB::raw('DATE(...)') might differ, 
        // a safer cross-database approach for recent small datasets is to just get the collection and group by.
        $recentUsers = Pengguna::query()
            ->where('created_at', '>=', $startDate)
            ->get()
            ->groupBy(function($user) {
                return $user->created_at->format('Y-m-d');
            })
            ->map(function ($group) {
                return $group->count();
            });

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dateString = $date->format('Y-m-d');
            $chartData[] = [
                'tanggal' => $date->locale('id')->translatedFormat('d M'),
                'total' => $recentUsers->get($dateString, 0),
            ];
        }

        return response()->json([
            'summary' => [
                'total_guru' => $totalGuru,
                'total_siswa' => $totalSiswa,
                'total_kelas' => $totalKelas,
            ],
            'chart' => $chartData,
            'logs' => $recentLogs,
        ]);
    }
}
