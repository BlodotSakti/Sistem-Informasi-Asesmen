<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use App\Models\Guru;
use App\Models\BeritaAcara;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\Siswa;
use App\Services\PenggunaBulkImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AdminController extends Controller
{
    public function masterData(): JsonResponse
    {
        return response()->json([
            'tahun_ajaran' => TahunAjaran::query()->latest()->get(),
            'kelas' => Kelas::query()->with('guruWali')->latest()->get(),
            'mata_pelajaran' => MataPelajaran::query()->latest()->get(),
            'guru_options' => Guru::query()
                ->select(['id_guru', 'nama_lengkap', 'nip'])
                ->orderBy('nama_lengkap')
                ->get(),
        ]);
    }

    public function tahunAjaranIndex(): JsonResponse
    {
        return response()->json(TahunAjaran::query()->latest()->paginate(15));
    }

    public function tahunAjaranStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama_tahun_ajaran' => ['required', 'string', 'max:30', 'unique:tahun_ajaran,nama_tahun_ajaran'],
            'tanggal_mulai' => ['nullable', 'date'],
            'tanggal_selesai' => ['nullable', 'date', 'after_or_equal:tanggal_mulai'],
            'is_aktif' => ['sometimes', 'boolean'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $tahunAjaran = TahunAjaran::create($data);

        return response()->json($tahunAjaran, 201);
    }

    public function tahunAjaranShow(TahunAjaran $tahunAjaran): JsonResponse
    {
        return response()->json($tahunAjaran);
    }

    public function tahunAjaranUpdate(Request $request, TahunAjaran $tahunAjaran): JsonResponse
    {
        $data = $request->validate([
            'nama_tahun_ajaran' => ['sometimes', 'string', 'max:30', 'unique:tahun_ajaran,nama_tahun_ajaran,' . $tahunAjaran->id_tahun_ajaran . ',id_tahun_ajaran'],
            'tanggal_mulai' => ['nullable', 'date'],
            'tanggal_selesai' => ['nullable', 'date', 'after_or_equal:tanggal_mulai'],
            'is_aktif' => ['sometimes', 'boolean'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $tahunAjaran->update($data);

        return response()->json($tahunAjaran->fresh());
    }

    public function tahunAjaranDestroy(TahunAjaran $tahunAjaran): JsonResponse
    {
        $tahunAjaran->delete();

        return response()->json(null, 204);
    }

    public function kelasIndex(): JsonResponse
    {
        return response()->json(Kelas::query()->with('guruWali')->latest()->paginate(15));
    }

    public function kelasStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_guru_wali' => ['required', 'integer', 'exists:guru,id_guru'],
            'nama_kelas' => ['required', 'string', 'max:100'],
            'tahun_ajaran' => ['required', 'string', 'max:20'],
        ]);

        return response()->json(Kelas::create($data), 201);
    }

    public function kelasShow(Kelas $kelas): JsonResponse
    {
        return response()->json($kelas->load('guruWali'));
    }

    public function kelasUpdate(Request $request, Kelas $kelas): JsonResponse
    {
        $data = $request->validate([
            'id_guru_wali' => ['sometimes', 'integer', 'exists:guru,id_guru'],
            'nama_kelas' => ['sometimes', 'string', 'max:100'],
            'tahun_ajaran' => ['sometimes', 'string', 'max:20'],
        ]);

        $kelas->update($data);

        return response()->json($kelas->fresh('guruWali'));
    }

    public function kelasDestroy(Kelas $kelas): JsonResponse
    {
        $kelas->delete();

        return response()->json(null, 204);
    }

    public function mataPelajaranIndex(): JsonResponse
    {
        return response()->json(MataPelajaran::query()->latest()->paginate(15));
    }

    public function mataPelajaranStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama_mapel' => ['required', 'string', 'max:255'],
            'tingkat' => ['required', 'string', 'max:50'],
        ]);

        return response()->json(MataPelajaran::create($data), 201);
    }

    public function mataPelajaranShow(MataPelajaran $mataPelajaran): JsonResponse
    {
        return response()->json($mataPelajaran);
    }

    public function mataPelajaranUpdate(Request $request, MataPelajaran $mataPelajaran): JsonResponse
    {
        $data = $request->validate([
            'nama_mapel' => ['sometimes', 'string', 'max:255'],
            'tingkat' => ['sometimes', 'string', 'max:50'],
        ]);

        $mataPelajaran->update($data);

        return response()->json($mataPelajaran->fresh());
    }

    public function mataPelajaranDestroy(MataPelajaran $mataPelajaran): JsonResponse
    {
        $mataPelajaran->delete();

        return response()->json(null, 204);
    }

    public function bulkImportPengguna(Request $request): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
            'default_role' => ['nullable', 'in:guru,siswa'],
        ]);

        $service = app(PenggunaBulkImportService::class);

        try {
            $summary = $service->import($request->file('file'), $data['default_role'] ?? null);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Import akun berhasil diproses.',
            ...$summary,
        ]);
    }

    public function dashboardSummary(): JsonResponse
    {
        $recentUsers = Pengguna::query()
            ->with(['admin', 'guru', 'siswa'])
            ->latest('created_at')
            ->limit(5)
            ->get()
            ->map(function (Pengguna $pengguna): array {
                $profile = $pengguna->admin ?? $pengguna->guru ?? $pengguna->siswa;

                return [
                    'tanggal' => optional($pengguna->created_at)?->format('Y-m-d') ?? now()->format('Y-m-d'),
                    'deskripsi' => match ($pengguna->role) {
                        'admin' => 'Admin menambahkan akun operator baru',
                        'guru' => 'Admin menambahkan akun guru baru',
                        'siswa' => 'Admin menambahkan akun siswa baru',
                        default => 'Aktivitas pengguna baru',
                    },
                    'nama_lengkap' => $profile?->nama_lengkap,
                ];
            });

        return response()->json([
            'cards' => [
                'total_guru' => Guru::count(),
                'total_siswa' => Siswa::count(),
                'total_kelas' => Kelas::count(),
                'total_tahun_ajaran' => TahunAjaran::count(),
                'total_mapel' => MataPelajaran::count(),
            ],
            'chart' => [
                'labels' => ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                'values' => [12, 18, 14, 22, 16, 20, 24],
            ],
            'recent_activities' => $recentUsers,
        ]);
    }
}