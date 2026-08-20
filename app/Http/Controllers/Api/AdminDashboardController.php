<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Siswa;
use App\Models\Kelas;
use App\Models\TahunAjaran;
use App\Models\Pengguna;
use App\Models\MataPelajaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $totalGuru = Guru::count();
        $totalSiswa = Siswa::count();
        $totalPenggunaAktif = Pengguna::where('is_aktif', true)->count();
        $totalPenggunaArsip = Pengguna::where('is_aktif', false)->count();

        
        $tahunAjaranAktif = TahunAjaran::where('is_aktif', true)->first();
        
        // Fallback to all classes if no active academic year is set
        if ($tahunAjaranAktif) {
            $periodeLabel = sprintf('%s - Semester %s', $tahunAjaranAktif->nama_tahun_ajaran, ucfirst($tahunAjaranAktif->semester));
            $totalKelas = Kelas::where('tahun_ajaran', $periodeLabel)->count();
        } else {
            $totalKelas = Kelas::count();
        }
            
        $totalMapel = MataPelajaran::count();

        // System Logs: Fetch from LogAktivitas table
        $recentLogs = \App\Models\LogAktivitas::with(['aktor.admin', 'aktor.guru', 'aktor.siswa'])
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(function ($log) {
                $profile = $log->aktor?->admin ?? $log->aktor?->guru ?? $log->aktor?->siswa;
                return [
                    'id' => $log->id_log,
                    'tanggal' => $log->created_at->format('Y-m-d H:i'),
                    'deskripsi' => $log->deskripsi,
                    'nama_lengkap' => $profile?->nama_lengkap ?? $log->aktor?->username ?? 'Sistem',
                    'role' => $log->aktor?->role ?? 'admin',
                ];
            });

        // Chart Data Aggregations
        $chartData = [
            'siswa_per_kelas' => [],
            'siswa_per_tingkat' => [],
            'soal_per_mapel' => [],
            'soal_per_tingkat_kelas' => [],
            'soal_per_level_kognitif' => [],
            'kelas_per_semester' => [],
        ];

        // 1. & 2. Siswa per Kelas & Siswa per Tingkat (grouped by tahun_ajaran)
        $kelas = Kelas::withCount('kelasSiswa')->get();
        $chartData['siswa_per_kelas'] = $kelas->groupBy('tahun_ajaran')->map(function($classes) {
            return $classes->map(function($c) {
                return ['name' => $c->nama_kelas, 'value' => $c->kelas_siswa_count];
            })->values();
        })->toArray();

        $chartData['siswa_per_tingkat'] = $kelas->groupBy('tahun_ajaran')->map(function($classes) {
            $tingkatMap = [];
            foreach ($classes as $c) {
                // Asumsi: Tingkat adalah kata pertama dari nama kelas (misal: "X IPA 1" -> "X")
                $parts = explode(' ', trim($c->nama_kelas));
                $tingkat = count($parts) > 0 ? $parts[0] : 'Lainnya';
                if (!isset($tingkatMap[$tingkat])) $tingkatMap[$tingkat] = 0;
                $tingkatMap[$tingkat] += $c->kelas_siswa_count;
            }
            $result = [];
            foreach ($tingkatMap as $tingkat => $count) {
                $result[] = ['name' => "Kelas $tingkat", 'value' => $count];
            }
            return collect($result)->sortBy('name')->values()->toArray();
        })->toArray();

        // 3. Soal per Mapel (Global, not bound to tahun_ajaran)
        $chartData['soal_per_mapel'] = \App\Models\BankSoal::with('mataPelajaran')
            ->select('id_mapel', DB::raw('count(*) as total'))
            ->groupBy('id_mapel')
            ->get()
            ->map(function($s) {
                $name = 'Tanpa Mapel';
                if ($s->mataPelajaran) {
                    $name = $s->mataPelajaran->nama_mapel . ' (' . $s->mataPelajaran->tingkat . ')';
                }
                return [
                    'name' => $name,
                    'value' => $s->total
                ];
            })->sortBy('name')->values()->toArray();

        // 4. Soal per Tingkat Kelas (Global)
        $chartData['soal_per_tingkat_kelas'] = DB::table('bank_soal')
            ->join('mata_pelajaran', 'bank_soal.id_mapel', '=', 'mata_pelajaran.id_mapel')
            ->select('mata_pelajaran.tingkat', DB::raw('count(*) as total'))
            ->groupBy('mata_pelajaran.tingkat')
            ->get()
            ->map(function($item) {
                return ['name' => "Tingkat " . $item->tingkat, 'value' => $item->total];
            })->sortBy('name')->values()->toArray();

        // 5. Soal per Level Kognitif (Global)
        $chartData['soal_per_level_kognitif'] = \App\Models\BankSoal::select('level_kognitif', DB::raw('count(*) as total'))
            ->groupBy('level_kognitif')
            ->get()
            ->map(function($item) {
                return ['name' => $item->level_kognitif ?? 'N/A', 'value' => $item->total];
            })->sortBy('name')->values()->toArray();

        // 6. Kelas per Semester (Global history)
        $chartData['kelas_per_semester'] = Kelas::select('tahun_ajaran', DB::raw('count(*) as total'))
            ->groupBy('tahun_ajaran')
            ->get()
            ->map(function($item) {
                return ['name' => $item->tahun_ajaran ?? 'N/A', 'value' => $item->total];
            })->sortBy('name')->values()->toArray();

        // Options for filter
        $tahunAjaranOptions = TahunAjaran::orderBy('created_at', 'desc')->get()->map(function($t) {
            return $t->nama_tahun_ajaran . ' - Semester ' . ucfirst($t->semester);
        })->toArray();

        return response()->json([
            'summary' => [
                'total_guru' => $totalGuru,
                'total_siswa' => $totalSiswa,
                'total_pengguna_aktif' => $totalPenggunaAktif,
                'total_pengguna_arsip' => $totalPenggunaArsip,
                'total_kelas' => $totalKelas,
                'total_mapel' => $totalMapel,
            ],
            'chart' => $chartData,
            'tahun_ajaran_options' => $tahunAjaranOptions,
            'logs' => $recentLogs,
        ]);
    }
}
