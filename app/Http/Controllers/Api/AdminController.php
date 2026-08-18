<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use App\Models\Guru;
use App\Models\BeritaAcara;
use App\Models\Kelas;
use App\Models\KelasSiswa;
use App\Models\MataPelajaran;
use App\Models\PenugasanPembelajaran;
use App\Models\Pengguna;
use App\Models\Siswa;
use App\Models\LogAktivitas;
use App\Services\PenggunaBulkImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Csv;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
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

        $paginator = $query->paginate(15)->withQueryString();

        return response()->json([
            'users' => $paginator,
            'summary' => [
                'total' => Pengguna::count(),
                'active' => Pengguna::where('is_aktif', true)->count(),
            ]
        ]);
    }

    public function penggunaStore(Request $request): JsonResponse
    {
        $data = $this->validatePenggunaPayload($request);
        $pengguna = $this->createManualPengguna($data);

        LogAktivitas::create([
            'id_pengguna_aktor' => $request->user()->id_pengguna,
            'tipe_aksi' => 'tambah',
            'deskripsi' => 'Penambahan akun ' . $pengguna->role . ' baru: ' . ($data['nama_lengkap'] ?? $pengguna->username),
        ]);

        return response()->json($pengguna->load(['admin', 'guru', 'siswa']), 201);
    }

    public function penggunaShow(Pengguna $pengguna): JsonResponse
    {
        return response()->json($pengguna->load(['admin', 'guru', 'siswa']));
    }

    public function penggunaUpdate(Request $request, Pengguna $pengguna): JsonResponse
    {
        $data = $this->validatePenggunaPayload($request, $pengguna);

        if ($request->user()->id_pengguna === $pengguna->id_pengguna) {
            if (isset($data['role']) && $data['role'] !== $pengguna->role) {
                return response()->json(['message' => 'Anda tidak dapat mengubah role Anda sendiri.'], 403);
            }
            if (isset($data['is_aktif']) && $data['is_aktif'] === false) {
                return response()->json(['message' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.'], 403);
            }
        }

        if ($pengguna->role === 'admin' && ( (isset($data['role']) && $data['role'] !== 'admin') || (isset($data['is_aktif']) && $data['is_aktif'] === false) )) {
            $activeAdminCount = Pengguna::where('role', 'admin')->where('is_aktif', true)->count();
            if ($activeAdminCount <= 1) {
                return response()->json(['message' => 'Tidak dapat mengubah atau menonaktifkan admin terakhir yang aktif.'], 403);
            }
        }

        $updateData = [
            'username' => $data['username'],
            'role' => $data['role'],
            'is_aktif' => $data['is_aktif'] ?? $pengguna->is_aktif,
        ];

        if (! empty($data['password'])) {
            $updateData['password'] = $data['password'];
        }

        if (
            (! empty($data['password'])) ||
            (isset($data['role']) && $data['role'] !== $pengguna->role) ||
            (isset($data['is_aktif']) && (bool)$data['is_aktif'] === false && $pengguna->is_aktif === true)
        ) {
            $pengguna->tokens()->delete();
        }

        $pengguna->update($updateData);

        $this->syncUserProfile($pengguna->fresh(), $data, true);

        LogAktivitas::create([
            'id_pengguna_aktor' => $request->user()->id_pengguna,
            'tipe_aksi' => 'edit',
            'deskripsi' => 'Pembaruan data akun ' . $pengguna->role . ': ' . ($data['nama_lengkap'] ?? $pengguna->username),
        ]);

        return response()->json($pengguna->fresh(['admin', 'guru', 'siswa']));
    }

    public function penggunaArchive(Request $request, Pengguna $pengguna): JsonResponse
    {
        if ($request->user()->id_pengguna === $pengguna->id_pengguna) {
            return response()->json(['message' => 'Anda tidak dapat mengarsipkan akun Anda sendiri.'], 403);
        }

        if ($pengguna->role === 'admin') {
            $activeAdminCount = Pengguna::where('role', 'admin')->where('is_aktif', true)->count();
            if ($activeAdminCount <= 1) {
                return response()->json(['message' => 'Tidak dapat mengarsipkan admin terakhir yang aktif.'], 403);
            }
        }

        $pengguna->tokens()->delete();

        $pengguna->update([
            'is_aktif' => false,
            'diarsipkan_pada' => now(),
            'diarsipkan_alasan' => $request->input('alasan'),
        ]);

        LogAktivitas::create([
            'id_pengguna_aktor' => $request->user()->id_pengguna,
            'tipe_aksi' => 'arsip',
            'deskripsi' => 'Pengarsipan/Penonaktifan akun ' . $pengguna->role . ': ' . $pengguna->username,
        ]);

        return response()->json($pengguna->fresh(['admin', 'guru', 'siswa']));
    }

    public function penggunaRestore(Request $request, Pengguna $pengguna): JsonResponse
    {
        $pengguna->update([
            'is_aktif' => true,
            'diarsipkan_pada' => null,
            'diarsipkan_alasan' => null,
        ]);

        LogAktivitas::create([
            'id_pengguna_aktor' => $request->user()->id_pengguna,
            'tipe_aksi' => 'aktifkan',
            'deskripsi' => 'Pengaktifan kembali akun ' . $pengguna->role . ': ' . $pengguna->username,
        ]);

        return response()->json($pengguna->fresh(['admin', 'guru', 'siswa']));
    }

    public function penggunaDestroy(Request $request, Pengguna $pengguna): JsonResponse
    {
        if ($request->user()->id_pengguna === $pengguna->id_pengguna) {
            return response()->json(['message' => 'Anda tidak dapat menghapus akun Anda sendiri.'], 403);
        }

        if ($pengguna->role === 'admin') {
            $activeAdminCount = Pengguna::where('role', 'admin')->where('is_aktif', true)->count();
            if ($activeAdminCount <= 1) {
                return response()->json(['message' => 'Tidak dapat menghapus admin terakhir yang aktif.'], 403);
            }
        }

        $role = $pengguna->role;
        $username = $pengguna->username;

        $pengguna->delete();

        LogAktivitas::create([
            'id_pengguna_aktor' => $request->user()->id_pengguna,
            'tipe_aksi' => 'hapus',
            'deskripsi' => 'Penghapusan permanen akun ' . $role . ': ' . $username,
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
            'kelas_siswa' => KelasSiswa::query()->with(['kelas.guruWali', 'siswa'])->latest()->get(),
            'penugasan_pembelajaran' => PenugasanPembelajaran::query()->with(['kelas', 'mataPelajaran', 'guru'])->latest()->get(),
            'guru_options' => Guru::query()
                ->select(['id_guru', 'nama_lengkap', 'nip', 'id_pengguna'])
                ->whereHas('pengguna', function ($query) {
                    $query->where('is_aktif', true);
                })
                ->orderBy('nama_lengkap')
                ->get(),
            'siswa_options' => Siswa::query()
                ->select(['id_siswa', 'nama_lengkap', 'nisn', 'id_pengguna'])
                ->whereHas('pengguna', function ($query) {
                    $query->where('is_aktif', true);
                })
                ->orderBy('nama_lengkap')
                ->get(),
        ]);
    }

    public function kelasSiswaIndex(): JsonResponse
    {
        return response()->json(
            KelasSiswa::query()
                ->with(['kelas.guruWali', 'siswa'])
                ->latest()
                ->paginate(15)
        );
    }

    public function kelasSiswaStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_kelas' => ['required', 'integer', 'exists:kelas,id_kelas'],
            'id_siswa' => ['required', 'integer', 'exists:siswa,id_siswa'],
            'tahun_ajaran' => ['nullable', 'string', 'max:40'],
            'is_aktif' => ['sometimes', 'boolean'],
            'tanggal_masuk' => ['nullable', 'date'],
            'tanggal_keluar' => ['nullable', 'date', 'after_or_equal:tanggal_masuk'],
        ]);

        $kelas = Kelas::query()->findOrFail($data['id_kelas']);
        $data['tahun_ajaran'] = $data['tahun_ajaran'] ?? $kelas->tahun_ajaran;
        $data['is_aktif'] = $data['is_aktif'] ?? true;

        if ($data['is_aktif']) {
            $this->deactivateOtherKelasSiswaAssignments((int) $data['id_siswa']);
        }

        $record = KelasSiswa::query()->create($data);

        return response()->json($record->load(['kelas.guruWali', 'siswa']), 201);
    }

    public function kelasSiswaShow(KelasSiswa $kelasSiswa): JsonResponse
    {
        return response()->json($kelasSiswa->load(['kelas.guruWali', 'siswa']));
    }

    public function kelasSiswaUpdate(Request $request, KelasSiswa $kelasSiswa): JsonResponse
    {
        $data = $request->validate([
            'id_kelas' => ['sometimes', 'integer', 'exists:kelas,id_kelas'],
            'id_siswa' => ['sometimes', 'integer', 'exists:siswa,id_siswa'],
            'tahun_ajaran' => ['sometimes', 'string', 'max:40'],
            'is_aktif' => ['sometimes', 'boolean'],
            'tanggal_masuk' => ['nullable', 'date'],
            'tanggal_keluar' => ['nullable', 'date', 'after_or_equal:tanggal_masuk'],
        ]);

        $nextSiswaId = (int) ($data['id_siswa'] ?? $kelasSiswa->id_siswa);
        $nextKelasId = (int) ($data['id_kelas'] ?? $kelasSiswa->id_kelas);

        if (! isset($data['tahun_ajaran']) && isset($data['id_kelas'])) {
            $data['tahun_ajaran'] = Kelas::query()->findOrFail($nextKelasId)->tahun_ajaran;
        }

        $shouldBeActive = array_key_exists('is_aktif', $data)
            ? (bool) $data['is_aktif']
            : (bool) $kelasSiswa->is_aktif;

        if ($shouldBeActive) {
            $this->deactivateOtherKelasSiswaAssignments($nextSiswaId, $kelasSiswa->id_kelas_siswa);
        }

        $kelasSiswa->update($data);

        return response()->json($kelasSiswa->fresh(['kelas.guruWali', 'siswa']));
    }

    public function kelasSiswaDestroy(KelasSiswa $kelasSiswa): JsonResponse
    {
        $kelasSiswa->delete();

        return response()->json(null, 204);
    }

    public function penugasanPembelajaranIndex(): JsonResponse
    {
        return response()->json(
            PenugasanPembelajaran::query()
                ->with(['kelas', 'mataPelajaran', 'guru'])
                ->latest()
                ->paginate(15)
        );
    }

    public function penugasanPembelajaranStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_kelas' => ['required', 'integer', 'exists:kelas,id_kelas'],
            'id_mapel' => ['required', 'integer', 'exists:mata_pelajaran,id_mapel'],
            'id_guru' => ['required', 'integer', 'exists:guru,id_guru'],
            'tahun_ajaran' => ['nullable', 'string', 'max:40'],
            'is_aktif' => ['sometimes', 'boolean'],
        ]);

        $kelas = Kelas::query()->findOrFail($data['id_kelas']);
        $data['tahun_ajaran'] = $data['tahun_ajaran'] ?? $kelas->tahun_ajaran;
        $data['is_aktif'] = $data['is_aktif'] ?? true;

        $exists = PenugasanPembelajaran::query()
            ->where('id_kelas', $data['id_kelas'])
            ->where('id_mapel', $data['id_mapel'])
            ->where('id_guru', $data['id_guru'])
            ->where('tahun_ajaran', $data['tahun_ajaran'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Penugasan guru-mapel-kelas untuk tahun ajaran tersebut sudah ada.',
            ], 422);
        }

        $record = PenugasanPembelajaran::query()->create($data);

        return response()->json($record->load(['kelas', 'mataPelajaran', 'guru']), 201);
    }

    public function penugasanPembelajaranShow(PenugasanPembelajaran $penugasanPembelajaran): JsonResponse
    {
        return response()->json($penugasanPembelajaran->load(['kelas', 'mataPelajaran', 'guru']));
    }

    public function penugasanPembelajaranUpdate(Request $request, PenugasanPembelajaran $penugasanPembelajaran): JsonResponse
    {
        $data = $request->validate([
            'id_kelas' => ['sometimes', 'integer', 'exists:kelas,id_kelas'],
            'id_mapel' => ['sometimes', 'integer', 'exists:mata_pelajaran,id_mapel'],
            'id_guru' => ['sometimes', 'integer', 'exists:guru,id_guru'],
            'tahun_ajaran' => ['sometimes', 'string', 'max:40'],
            'is_aktif' => ['sometimes', 'boolean'],
        ]);

        $nextKelasId = (int) ($data['id_kelas'] ?? $penugasanPembelajaran->id_kelas);
        $nextMapelId = (int) ($data['id_mapel'] ?? $penugasanPembelajaran->id_mapel);
        $nextGuruId = (int) ($data['id_guru'] ?? $penugasanPembelajaran->id_guru);
        $nextTahunAjaran = $data['tahun_ajaran'] ?? $penugasanPembelajaran->tahun_ajaran;

        if (! isset($data['tahun_ajaran']) && isset($data['id_kelas'])) {
            $nextTahunAjaran = Kelas::query()->findOrFail($nextKelasId)->tahun_ajaran;
            $data['tahun_ajaran'] = $nextTahunAjaran;
        }

        $exists = PenugasanPembelajaran::query()
            ->where('id_kelas', $nextKelasId)
            ->where('id_mapel', $nextMapelId)
            ->where('id_guru', $nextGuruId)
            ->where('tahun_ajaran', $nextTahunAjaran)
            ->where('id_penugasan_pembelajaran', '!=', $penugasanPembelajaran->id_penugasan_pembelajaran)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Penugasan guru-mapel-kelas untuk tahun ajaran tersebut sudah ada.',
            ], 422);
        }

        $penugasanPembelajaran->update($data);

        return response()->json($penugasanPembelajaran->fresh(['kelas', 'mataPelajaran', 'guru']));
    }

    public function penugasanPembelajaranDestroy(PenugasanPembelajaran $penugasanPembelajaran): JsonResponse
    {
        $penugasanPembelajaran->delete();

        return response()->json(null, 204);
    }

    public function kelasSiswaBulkImport(Request $request): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $rows = $this->readSpreadsheetRows($request->file('file'));
        $summary = ['created' => 0, 'updated' => 0, 'skipped' => 0, 'skipped_rows' => []];

        foreach ($rows as $index => $row) {
            $namaKelas = trim((string) ($row['nama_kelas'] ?? ''));
            $namaSiswa = trim((string) ($row['nama_siswa'] ?? ''));
            $tahunAjaran = trim((string) ($row['tahun_ajaran'] ?? ''));

            if ($namaKelas === '' || $namaSiswa === '') {
                $summary['skipped']++;
                $summary['skipped_rows'][] = [
                    'row' => $index + 2,
                    'reason' => 'nama_kelas atau nama_siswa kosong.',
                ];

                continue;
            }

            $kelas = Kelas::query()->where('nama_kelas', $namaKelas)->first();
            $siswa = Siswa::query()->where('nama_lengkap', $namaSiswa)->first();

            if (! $kelas) {
                $summary['skipped']++;
                $summary['skipped_rows'][] = [
                    'row' => $index + 2,
                    'reason' => "Kelas '{$namaKelas}' tidak ditemukan di database.",
                ];

                continue;
            }

            if (! $siswa) {
                $summary['skipped']++;
                $summary['skipped_rows'][] = [
                    'row' => $index + 2,
                    'reason' => "Siswa '{$namaSiswa}' tidak ditemukan di database.",
                ];

                continue;
            }

            $payload = [
                'id_kelas' => $kelas->id_kelas,
                'id_siswa' => $siswa->id_siswa,
                'tahun_ajaran' => $tahunAjaran !== '' ? $tahunAjaran : $kelas->tahun_ajaran,
                'is_aktif' => $this->normalizeBoolean($row['is_aktif'] ?? true),
                'tanggal_masuk' => $this->normalizeDate($row['tanggal_masuk'] ?? null),
                'tanggal_keluar' => $this->normalizeDate($row['tanggal_keluar'] ?? null),
            ];

            $record = KelasSiswa::query()->updateOrCreate(
                [
                    'id_kelas' => $payload['id_kelas'],
                    'id_siswa' => $payload['id_siswa'],
                    'tahun_ajaran' => $payload['tahun_ajaran'],
                ],
                $payload
            );

            if ($record->wasRecentlyCreated) {
                $summary['created']++;
            } else {
                $summary['updated']++;
            }

            if ($record->is_aktif) {
                $this->deactivateOtherKelasSiswaAssignments($record->id_siswa, $record->id_kelas_siswa);
            }
        }

        return response()->json([
            'message' => 'Import relasi siswa-kelas berhasil diproses.',
            ...$summary,
        ]);
    }

    public function penugasanPembelajaranBulkImport(Request $request): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $rows = $this->readSpreadsheetRows($request->file('file'));
        $summary = ['created' => 0, 'updated' => 0, 'skipped' => 0, 'skipped_rows' => []];

        foreach ($rows as $index => $row) {
            $namaKelas = trim((string) ($row['nama_kelas'] ?? ''));
            $namaMapel = trim((string) ($row['nama_mapel'] ?? ''));
            $namaGuru = trim((string) ($row['nama_guru'] ?? ''));
            $tahunAjaran = trim((string) ($row['tahun_ajaran'] ?? ''));

            if ($namaKelas === '' || $namaMapel === '' || $namaGuru === '') {
                $summary['skipped']++;
                $summary['skipped_rows'][] = [
                    'row' => $index + 2,
                    'reason' => 'nama_kelas, nama_mapel, atau nama_guru kosong.',
                ];

                continue;
            }

            $kelas = Kelas::query()->where('nama_kelas', $namaKelas)->first();

            // Match mapel by "nama_mapel (tingkat)" format or exact nama_mapel
            $mapel = null;
            if (preg_match('/^(.+?)\s*\((\w+)\)$/', $namaMapel, $matches)) {
                $mapel = MataPelajaran::query()
                    ->where('nama_mapel', trim($matches[1]))
                    ->where('tingkat', trim($matches[2]))
                    ->first();
            }
            if (! $mapel) {
                $mapel = MataPelajaran::query()->where('nama_mapel', $namaMapel)->first();
            }

            $guru = Guru::query()->where('nama_lengkap', $namaGuru)->first();

            if (! $kelas) {
                $summary['skipped']++;
                $summary['skipped_rows'][] = [
                    'row' => $index + 2,
                    'reason' => "Kelas '{$namaKelas}' tidak ditemukan di database.",
                ];

                continue;
            }

            if (! $mapel) {
                $summary['skipped']++;
                $summary['skipped_rows'][] = [
                    'row' => $index + 2,
                    'reason' => "Mata Pelajaran '{$namaMapel}' tidak ditemukan di database.",
                ];

                continue;
            }

            if (! $guru) {
                $summary['skipped']++;
                $summary['skipped_rows'][] = [
                    'row' => $index + 2,
                    'reason' => "Guru '{$namaGuru}' tidak ditemukan di database.",
                ];

                continue;
            }

            $payload = [
                'id_kelas' => $kelas->id_kelas,
                'id_mapel' => $mapel->id_mapel,
                'id_guru' => $guru->id_guru,
                'tahun_ajaran' => $tahunAjaran !== '' ? $tahunAjaran : $kelas->tahun_ajaran,
                'is_aktif' => $this->normalizeBoolean($row['is_aktif'] ?? true),
            ];

            $record = PenugasanPembelajaran::query()->updateOrCreate(
                [
                    'id_kelas' => $payload['id_kelas'],
                    'id_mapel' => $payload['id_mapel'],
                    'id_guru' => $payload['id_guru'],
                    'tahun_ajaran' => $payload['tahun_ajaran'],
                ],
                $payload
            );

            if ($record->wasRecentlyCreated) {
                $summary['created']++;
            } else {
                $summary['updated']++;
            }
        }

        return response()->json([
            'message' => 'Import penugasan pembelajaran berhasil diproses.',
            ...$summary,
        ]);
    }
    public function importTemplate(string $type, string $format)
    {
        $definitions = [
            'kelas-siswa' => [
                'filename' => 'template-relasi-siswa-kelas',
                'headers' => ['nama_kelas', 'nama_siswa', 'tahun_ajaran', 'is_aktif', 'tanggal_masuk', 'tanggal_keluar'],
                'sample' => ['XI IPA 1', 'Rani Putri', '2026/2027', 'true', '2026-07-10', ''],
            ],
            'penugasan-pembelajaran' => [
                'filename' => 'template-penugasan-pembelajaran',
                'headers' => ['nama_kelas', 'nama_mapel', 'nama_guru', 'tahun_ajaran', 'is_aktif'],
                'sample' => ['XI IPA 1', 'Bahasa Indonesia (X)', 'Andi Pratama', '2026/2027', 'true'],
            ],
        ];

        if (! isset($definitions[$type]) || ! in_array($format, ['csv', 'xlsx'], true)) {
            abort(404);
        }

        $definition = $definitions[$type];
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        foreach ($definition['headers'] as $columnIndex => $header) {
            $sheet->setCellValue(Coordinate::stringFromColumnIndex($columnIndex + 1) . '1', $header);
        }

        foreach ($definition['sample'] as $columnIndex => $value) {
            $sheet->setCellValue(Coordinate::stringFromColumnIndex($columnIndex + 1) . '2', $value);
        }

        if ($format === 'csv') {
            $writer = new Csv($spreadsheet);
            $writer->setUseBOM(true);
            $writer->setDelimiter(',');

            return response()->streamDownload(function () use ($writer): void {
                $writer->save('php://output');
            }, $definition['filename'] . '.csv', [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer): void {
            $writer->save('php://output');
        }, $definition['filename'] . '.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
            'tahun_ajaran' => ['required', 'string', 'max:255'],
        ]);

        $data['tahun_ajaran'] = $this->normalizeTahunAjaran($data['tahun_ajaran']);

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
            'tahun_ajaran' => ['sometimes', 'string', 'max:255'],
        ]);

        if (array_key_exists('tahun_ajaran', $data)) {
            $data['tahun_ajaran'] = $this->normalizeTahunAjaran($data['tahun_ajaran']);
        }

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
                'total_kelas_siswa' => KelasSiswa::count(),
                'total_penugasan_pembelajaran' => PenugasanPembelajaran::count(),
            ],
            'chart' => [
                'labels' => ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                'values' => [12, 18, 14, 22, 16, 20, 24],
            ],
            'recent_activities' => $recentUsers,
        ]);
    }

    protected function readSpreadsheetRows($file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $rows = $spreadsheet->getActiveSheet()->toArray(null, true, true, false);

        if (count($rows) < 2) {
            return [];
        }

        $headers = array_map(static fn ($value): string => strtolower(trim((string) $value)), array_shift($rows));
        $result = [];

        foreach ($rows as $row) {
            $record = [];

            foreach ($headers as $index => $header) {
                if ($header === '') {
                    continue;
                }

                $record[$header] = isset($row[$index]) ? trim((string) $row[$index]) : '';
            }

            if (count(array_filter($record, static fn ($value): bool => $value !== '')) === 0) {
                continue;
            }

            $result[] = $record;
        }

        return $result;
    }

    protected function normalizeInteger(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return is_numeric($value) ? (int) $value : null;
    }

    protected function normalizeBoolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        $normalized = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        return $normalized ?? true;
    }

    protected function normalizeDate(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value !== '' ? $value : null;
    }

    protected function normalizeTahunAjaran(mixed $value): string
    {
        $value = trim((string) $value);

        if ($value === '') {
            return $value;
        }

        return $value;
    }

    protected function deactivateOtherKelasSiswaAssignments(int $idSiswa, ?int $exceptId = null): void
    {
        KelasSiswa::query()
            ->where('id_siswa', $idSiswa)
            ->where('is_aktif', true)
            ->when($exceptId, fn ($query) => $query->where('id_kelas_siswa', '!=', $exceptId))
            ->update([
                'is_aktif' => false,
                'tanggal_keluar' => now()->toDateString(),
            ]);
    }
}