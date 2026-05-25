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
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use RuntimeException;

class AdminController extends Controller
{
    public function penggunaIndex(Request $request): JsonResponse
    {
        $query = Pengguna::query()->with(['admin', 'guru', 'siswa'])->latest('created_at');

        $search = trim((string) $request->input('search', ''));

        if ($search !== '') {
            $query->where(function ($subQuery) use ($search): void {
                $subQuery
                    ->where('username', 'like', '%' . $search . '%')
                    ->orWhere('role', 'like', '%' . $search . '%')
                    ->orWhereHas('admin', function ($profileQuery) use ($search): void {
                        $profileQuery->where('nama_lengkap', 'like', '%' . $search . '%');
                    })
                    ->orWhereHas('guru', function ($profileQuery) use ($search): void {
                        $profileQuery
                            ->where('nama_lengkap', 'like', '%' . $search . '%')
                            ->orWhere('nip', 'like', '%' . $search . '%');
                    })
                    ->orWhereHas('siswa', function ($profileQuery) use ($search): void {
                        $profileQuery
                            ->where('nama_lengkap', 'like', '%' . $search . '%')
                            ->orWhere('nisn', 'like', '%' . $search . '%');
                    });
            });
        }

        if ($request->filled('role') && $request->input('role') !== 'all') {
            $query->where('role', $request->input('role'));
        }

        if ($request->filled('status')) {
            match ($request->input('status')) {
                'active' => $query->where('is_aktif', true),
                'archived' => $query->where('is_aktif', false),
                default => null,
            };
        }

        return response()->json($query->paginate(15)->withQueryString());
    }

    public function penggunaStore(Request $request): JsonResponse
    {
        $data = $this->validatePenggunaPayload($request);
        $pengguna = $this->createManualPengguna($data);

        return response()->json($pengguna->load(['admin', 'guru', 'siswa']), 201);
    }

    public function penggunaShow(Pengguna $pengguna): JsonResponse
    {
        return response()->json($pengguna->load(['admin', 'guru', 'siswa']));
    }

    public function penggunaUpdate(Request $request, Pengguna $pengguna): JsonResponse
    {
        $data = $this->validatePenggunaPayload($request, $pengguna);

        $updateData = [
            'username' => $data['username'],
            'role' => $data['role'],
            'is_aktif' => $data['is_aktif'] ?? $pengguna->is_aktif,
        ];

        if (! empty($data['password'])) {
            $updateData['password'] = $data['password'];
        }

        $pengguna->update($updateData);

        $this->syncUserProfile($pengguna->fresh(), $data, true);

        return response()->json($pengguna->fresh(['admin', 'guru', 'siswa']));
    }

    public function penggunaArchive(Request $request, Pengguna $pengguna): JsonResponse
    {
        $pengguna->update([
            'is_aktif' => false,
            'diarsipkan_pada' => now(),
            'diarsipkan_alasan' => $request->input('alasan'),
        ]);

        return response()->json($pengguna->fresh(['admin', 'guru', 'siswa']));
    }

    public function penggunaRestore(Pengguna $pengguna): JsonResponse
    {
        $pengguna->update([
            'is_aktif' => true,
            'diarsipkan_pada' => null,
            'diarsipkan_alasan' => null,
        ]);

        return response()->json($pengguna->fresh(['admin', 'guru', 'siswa']));
    }

    public function penggunaDestroy(Pengguna $pengguna): JsonResponse
    {
        $pengguna->update([
            'is_aktif' => false,
            'diarsipkan_pada' => now(),
            'diarsipkan_alasan' => 'Diarsipkan oleh admin.',
        ]);

        return response()->json(null, 204);
    }

    public function masterData(): JsonResponse
    {
        $tahunAjaran = TahunAjaran::query()
            ->orderBy('nama_tahun_ajaran')
            ->orderBy('semester')
            ->get()
            ->map(function (TahunAjaran $item): array {
                return [
                    ...$item->toArray(),
                    'periode_label' => sprintf('%s - Semester %s', $item->nama_tahun_ajaran, ucfirst((string) $item->semester)),
                ];
            });

        return response()->json([
            'tahun_ajaran' => $tahunAjaran,
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
        return response()->json(TahunAjaran::query()->orderBy('nama_tahun_ajaran')->orderBy('semester')->paginate(15));
    }

    public function tahunAjaranStore(Request $request): JsonResponse
    {
        $semester = $request->input('semester', 'ganjil');

        $data = $request->validate([
            'nama_tahun_ajaran' => [
                'required',
                'string',
                'max:30',
                Rule::unique('tahun_ajaran', 'nama_tahun_ajaran')->where(fn ($query) => $query->where('semester', $semester)),
            ],
            'semester' => ['sometimes', Rule::in(['ganjil', 'genap'])],
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
        $semester = $request->input('semester', $tahunAjaran->semester ?? 'ganjil');

        $data = $request->validate([
            'nama_tahun_ajaran' => [
                'sometimes',
                'string',
                'max:30',
                Rule::unique('tahun_ajaran', 'nama_tahun_ajaran')
                    ->where(fn ($query) => $query->where('semester', $semester))
                    ->ignore($tahunAjaran->id_tahun_ajaran, 'id_tahun_ajaran'),
            ],
            'semester' => ['sometimes', Rule::in(['ganjil', 'genap'])],
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
            'tingkat' => ['required', Rule::in(['X', 'XI', 'XII'])],
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
            'tingkat' => ['sometimes', Rule::in(['X', 'XI', 'XII'])],
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

    protected function validatePenggunaPayload(Request $request, ?Pengguna $pengguna = null): array
    {
        $data = $request->validate([
            'role' => ['required', Rule::in(['admin', 'guru', 'siswa'])],
            'username' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('pengguna', 'username')->ignore($pengguna?->id_pengguna, 'id_pengguna'),
            ],
            'password' => [$pengguna ? 'nullable' : 'required', 'string', 'min:8'],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'nip' => ['nullable', 'string', 'max:50'],
            'nisn' => ['nullable', 'string', 'max:50'],
            'is_aktif' => ['sometimes', 'boolean'],
        ]);

        if ($data['role'] === 'guru') {
            $data['nip'] = $data['nip'] ?: $data['username'] ?: ($pengguna?->guru?->nip ?? null);

            if (! $data['nip']) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'nip' => 'NIP wajib diisi untuk guru.',
                ]);
            }

            $data['username'] = $data['nip'];
        } elseif ($data['role'] === 'siswa') {
            $data['nisn'] = $data['nisn'] ?: $data['username'] ?: ($pengguna?->siswa?->nisn ?? null);

            if (! $data['nisn']) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'nisn' => 'NISN wajib diisi untuk siswa.',
                ]);
            }

            $data['username'] = $data['nisn'];
        } else {
            $data['username'] = $data['username'] ?: ($pengguna?->username ?? Str::slug($data['nama_lengkap']) . '-' . now()->format('His'));
        }

        if ($pengguna && empty($request->input('username'))) {
            $data['username'] = $pengguna->username;
        }

        if ($data['role'] === 'guru') {
            $existingNip = Guru::query()
                ->where('nip', $data['nip'])
                ->when($pengguna?->guru, fn ($query) => $query->where('id_guru', '!=', $pengguna->guru->id_guru))
                ->exists();

            if ($existingNip) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'nip' => 'NIP sudah digunakan oleh akun lain.',
                ]);
            }
        }

        if ($data['role'] === 'siswa') {
            $existingNisn = Siswa::query()
                ->where('nisn', $data['nisn'])
                ->when($pengguna?->siswa, fn ($query) => $query->where('id_siswa', '!=', $pengguna->siswa->id_siswa))
                ->exists();

            if ($existingNisn) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'nisn' => 'NISN sudah digunakan oleh akun lain.',
                ]);
            }
        }

        $existingUser = Pengguna::query()
            ->where('username', $data['username'])
            ->when($pengguna, fn ($query) => $query->where('id_pengguna', '!=', $pengguna->id_pengguna))
            ->first();

        if ($existingUser) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'username' => 'Username sudah digunakan.',
            ]);
        }

        return $data;
    }

    protected function createManualPengguna(array $data): Pengguna
    {
        $pengguna = Pengguna::query()->create([
            'username' => $data['username'],
            'password' => $data['password'] ?? PenggunaBulkImportService::DEFAULT_PASSWORD,
            'role' => $data['role'],
            'is_aktif' => $data['is_aktif'] ?? true,
        ]);

        $this->syncUserProfile($pengguna, $data, false);

        return $pengguna;
    }

    protected function syncUserProfile(Pengguna $pengguna, array $data, bool $replaceExisting = false): void
    {
        if ($replaceExisting) {
            $pengguna->admin()->delete();
            $pengguna->guru()->delete();
            $pengguna->siswa()->delete();
        }

        if ($data['role'] === 'admin') {
            $pengguna->admin()->updateOrCreate(
                ['id_pengguna' => $pengguna->id_pengguna],
                ['nama_lengkap' => $data['nama_lengkap']]
            );
        } elseif ($data['role'] === 'guru') {
            $pengguna->guru()->updateOrCreate(
                ['id_pengguna' => $pengguna->id_pengguna],
                [
                    'nama_lengkap' => $data['nama_lengkap'],
                    'nip' => $data['nip'],
                ]
            );
        } else {
            $pengguna->siswa()->updateOrCreate(
                ['id_pengguna' => $pengguna->id_pengguna],
                [
                    'nama_lengkap' => $data['nama_lengkap'],
                    'nisn' => $data['nisn'],
                ]
            );
        }
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