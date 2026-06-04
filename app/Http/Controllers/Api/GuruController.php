<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalisisDiagnostik;
use App\Models\Apresiasi;
use App\Models\BankSoal;
use App\Models\BeritaAcara;
use App\Models\CatatanPrivat;
use App\Models\KelasSiswa;
use App\Models\Kelas;
use App\Models\PenugasanPembelajaran;
use App\Models\SesiAsesmen;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class GuruController extends Controller
{
    public function workspaceData(Request $request): JsonResponse
    {
        $guruId = $request->user()->guru->id_guru;

        $assignments = PenugasanPembelajaran::query()
            ->with(['kelas', 'mataPelajaran'])
            ->where('id_guru', $guruId)
            ->where('is_aktif', true)
            ->orderByDesc('id_penugasan_pembelajaran')
            ->get();

        $kelasIds = $assignments->pluck('id_kelas')->unique()->values();

        $activeClassStudents = KelasSiswa::query()
            ->with('siswa')
            ->whereIn('id_kelas', $kelasIds)
            ->where('is_aktif', true)
            ->orderBy('id_kelas')
            ->get();

        $studentsByClass = $activeClassStudents
            ->groupBy('id_kelas')
            ->map(fn (Collection $items): array => $items
                ->map(fn (KelasSiswa $item): array => [
                    'id_siswa' => $item->id_siswa,
                    'nama_lengkap' => $item->siswa?->nama_lengkap,
                    'nisn' => $item->siswa?->nisn,
                ])
                ->values()
                ->all())
            ->all();

        $bankSoal = BankSoal::query()
            ->with('mataPelajaran')
            ->where('id_guru', $guruId)
            ->latest('id_soal')
            ->limit(30)
            ->get();

        $beritaAcara = BeritaAcara::query()
            ->with(['kelas', 'mataPelajaran'])
            ->where('id_guru', $guruId)
            ->latest('tanggal')
            ->latest('id_berita_acara')
            ->limit(30)
            ->get();

        return response()->json([
            'teaching_assignments' => $assignments,
            'kelas_options' => $assignments
                ->map(fn (PenugasanPembelajaran $item): array => [
                    'id_kelas' => $item->id_kelas,
                    'nama_kelas' => $item->kelas?->nama_kelas,
                    'tahun_ajaran' => $item->tahun_ajaran,
                ])
                ->unique('id_kelas')
                ->values(),
            'mapel_options' => $assignments
                ->map(fn (PenugasanPembelajaran $item): array => [
                    'id_mapel' => $item->id_mapel,
                    'nama_mapel' => $item->mataPelajaran?->nama_mapel,
                    'tingkat' => $item->mataPelajaran?->tingkat,
                ])
                ->unique('id_mapel')
                ->values(),
            'students_by_class' => $studentsByClass,
            'bank_soal' => $bankSoal,
            'berita_acara' => $beritaAcara,
        ]);
    }

    public function bankSoalIndex(Request $request): JsonResponse
    {
        $guruId = $request->user()->guru->id_guru;

        return response()->json(
            BankSoal::query()
                ->with('mataPelajaran')
                ->where('id_guru', $guruId)
                ->latest('id_soal')
                ->paginate(15)
        );
    }

    public function bankSoalStore(Request $request): JsonResponse
    {
        $validator = validator($request->all(), [
            'id_mapel' => ['required', 'integer', 'exists:mata_pelajaran,id_mapel'],
            'isi_soal' => ['required', 'string'],
            'jenis_soal' => ['required', 'in:pilihan_ganda,esai'],
            'kunci_jawaban' => ['required', 'string'],
            'topik_materi' => ['required', 'string', 'max:255'],
            'level_kognitif' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'opsi_jawaban' => ['nullable', 'array'],
            'opsi_jawaban.*' => ['nullable', 'string', 'max:255'],
        ]);

        $validator->after(function ($validator) use ($request): void {
            $jenisSoal = $request->input('jenis_soal');
            $opsi = collect($request->input('opsi_jawaban', []))
                ->map(fn ($item) => trim((string) $item))
                ->filter()
                ->values();

            if ($jenisSoal === 'pilihan_ganda') {
                if ($opsi->count() < 2) {
                    $validator->errors()->add('opsi_jawaban', 'Minimal dua opsi jawaban diperlukan untuk soal pilihan ganda.');
                }

                if ($opsi->count() > 0 && ! $opsi->contains(trim((string) $request->input('kunci_jawaban')))) {
                    $validator->errors()->add('kunci_jawaban', 'Kunci jawaban harus sesuai salah satu opsi pilihan ganda.');
                }
            }
        });

        $data = $validator->validate();

        $guruId = $request->user()->guru->id_guru;
        $this->ensureGuruMengampuMapel($guruId, (int) $data['id_mapel']);

        $cleanOptions = collect($data['opsi_jawaban'] ?? [])
            ->map(fn ($item) => trim((string) $item))
            ->filter()
            ->values()
            ->all();

        if ($data['jenis_soal'] === 'esai') {
            $cleanOptions = [];
        }

        $data['id_guru'] = $guruId;
        $data['opsi_jawaban'] = $cleanOptions;

        return response()->json(BankSoal::create($data), 201);
    }

    public function sesiAsesmenStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_kelas' => ['required', 'integer', 'exists:kelas,id_kelas'],
            'id_mapel' => ['required', 'integer', 'exists:mata_pelajaran,id_mapel'],
            'tipe_soal' => ['required', 'string', 'max:255'],
            'jenis_asesmen' => ['required', 'in:pretest,posttest,ujian'],
            'waktu_mulai' => ['required', 'date'],
            'durasi_menit' => ['required', 'integer', 'min:1'],
        ]);

        $guruId = $request->user()->guru->id_guru;
        $this->ensureGuruMengampuKelasDanMapel($guruId, (int) $data['id_kelas'], (int) $data['id_mapel']);

        return response()->json(SesiAsesmen::create($data), 201);
    }

    public function beritaAcaraStore(Request $request): JsonResponse
    {
        $guruId = $request->user()->guru->id_guru;

        $data = $request->validate([
            'id_kelas' => ['required', 'integer', 'exists:kelas,id_kelas'],
            'id_mapel' => ['required', 'integer', 'exists:mata_pelajaran,id_mapel'],
            'pertemuan_ke' => ['required', 'integer', 'min:1'],
            'tanggal' => ['required', 'date'],
            'materi_bahasan' => ['required', 'string', 'max:255'],
            'evaluasi_kendala' => ['required', 'string'],
            'catatan_kelas' => ['required', 'string'],
            'kehadiran_siswa' => ['required', 'array', 'min:1'],
            'kehadiran_siswa.*.id_siswa' => ['required', 'integer', 'exists:siswa,id_siswa'],
            'kehadiran_siswa.*.status_kehadiran' => ['required', Rule::in(['hadir', 'izin', 'sakit', 'alpa'])],
            'kehadiran_siswa.*.catatan_pribadi' => ['nullable', 'string', 'max:1000'],
            'kehadiran_siswa.*.jenis_badge' => ['nullable', Rule::in(['emas', 'perak', 'perunggu'])],
        ]);

        $this->ensureGuruMengampuKelasDanMapel($guruId, (int) $data['id_kelas'], (int) $data['id_mapel']);
        $this->validateKehadiranLengkap((int) $data['id_kelas'], $data['kehadiran_siswa']);

        $data['id_guru'] = $guruId;

        $beritaAcara = DB::transaction(function () use ($data, $guruId): BeritaAcara {
            $kehadiranSiswa = collect($data['kehadiran_siswa'])
                ->map(function (array $row): array {
                    $catatanPribadi = trim((string) ($row['catatan_pribadi'] ?? ''));
                    $jenisBadge = trim((string) ($row['jenis_badge'] ?? ''));

                    return [
                        'id_siswa' => (int) $row['id_siswa'],
                        'status_kehadiran' => $row['status_kehadiran'],
                        'catatan_pribadi' => $catatanPribadi !== '' ? $catatanPribadi : null,
                        'jenis_badge' => $jenisBadge !== '' ? $jenisBadge : null,
                    ];
                })
                ->values()
                ->all();

            $beritaAcara = BeritaAcara::create([
                ...$data,
                'kehadiran_siswa' => $kehadiranSiswa,
            ]);

            foreach ($kehadiranSiswa as $row) {
                if (! empty($row['catatan_pribadi'])) {
                    CatatanPrivat::create([
                        'id_guru' => $guruId,
                        'id_siswa' => $row['id_siswa'],
                        'id_berita_acara' => $beritaAcara->id_berita_acara,
                        'tanggal' => $data['tanggal'],
                        'isi_pesan' => $row['catatan_pribadi'],
                    ]);
                }

                if (! empty($row['jenis_badge'])) {
                    Apresiasi::create([
                        'id_guru' => $guruId,
                        'id_siswa' => $row['id_siswa'],
                        'id_berita_acara' => $beritaAcara->id_berita_acara,
                        'tanggal' => $data['tanggal'],
                        'jenis_badge' => $row['jenis_badge'],
                        'topik_materi' => $data['materi_bahasan'],
                    ]);
                }
            }

            return $beritaAcara->load(['kelas', 'mataPelajaran', 'catatanPrivat.guru', 'apresiasi.guru']);
        });

        return response()->json($beritaAcara, 201);
    }

    public function beritaAcaraUpdate(Request $request, int $id_berita_acara): JsonResponse
    {
        $guruId = $request->user()->guru->id_guru;
        $beritaAcara = BeritaAcara::query()->where('id_guru', $guruId)->findOrFail($id_berita_acara);

        $data = $request->validate([
            'id_kelas' => ['required', 'integer', 'exists:kelas,id_kelas'],
            'id_mapel' => ['required', 'integer', 'exists:mata_pelajaran,id_mapel'],
            'pertemuan_ke' => ['required', 'integer', 'min:1'],
            'tanggal' => ['required', 'date'],
            'materi_bahasan' => ['required', 'string', 'max:255'],
            'evaluasi_kendala' => ['required', 'string'],
            'catatan_kelas' => ['required', 'string'],
            'kehadiran_siswa' => ['required', 'array', 'min:1'],
            'kehadiran_siswa.*.id_siswa' => ['required', 'integer', 'exists:siswa,id_siswa'],
            'kehadiran_siswa.*.status_kehadiran' => ['required', Rule::in(['hadir', 'izin', 'sakit', 'alpa'])],
            'kehadiran_siswa.*.catatan_pribadi' => ['nullable', 'string', 'max:1000'],
            'kehadiran_siswa.*.jenis_badge' => ['nullable', Rule::in(['emas', 'perak', 'perunggu'])],
        ]);

        $this->ensureGuruMengampuKelasDanMapel($guruId, (int) $data['id_kelas'], (int) $data['id_mapel']);
        $this->validateKehadiranLengkap((int) $data['id_kelas'], $data['kehadiran_siswa']);

        $updatedBeritaAcara = DB::transaction(function () use ($beritaAcara, $data, $guruId): BeritaAcara {
            $kehadiranSiswa = collect($data['kehadiran_siswa'])
                ->map(function (array $row): array {
                    $catatanPribadi = trim((string) ($row['catatan_pribadi'] ?? ''));
                    $jenisBadge = trim((string) ($row['jenis_badge'] ?? ''));

                    return [
                        'id_siswa' => (int) $row['id_siswa'],
                        'status_kehadiran' => $row['status_kehadiran'],
                        'catatan_pribadi' => $catatanPribadi !== '' ? $catatanPribadi : null,
                        'jenis_badge' => $jenisBadge !== '' ? $jenisBadge : null,
                    ];
                })
                ->values()
                ->all();

            $beritaAcara->update([
                ...$data,
                'kehadiran_siswa' => $kehadiranSiswa,
            ]);

            $beritaAcara->catatanPrivat()->delete();
            $beritaAcara->apresiasi()->delete();

            foreach ($kehadiranSiswa as $row) {
                if (! empty($row['catatan_pribadi'])) {
                    CatatanPrivat::create([
                        'id_guru' => $guruId,
                        'id_siswa' => $row['id_siswa'],
                        'id_berita_acara' => $beritaAcara->id_berita_acara,
                        'tanggal' => $data['tanggal'],
                        'isi_pesan' => $row['catatan_pribadi'],
                    ]);
                }

                if (! empty($row['jenis_badge'])) {
                    Apresiasi::create([
                        'id_guru' => $guruId,
                        'id_siswa' => $row['id_siswa'],
                        'id_berita_acara' => $beritaAcara->id_berita_acara,
                        'tanggal' => $data['tanggal'],
                        'jenis_badge' => $row['jenis_badge'],
                        'topik_materi' => $data['materi_bahasan'],
                    ]);
                }
            }

            return $beritaAcara->fresh()->load(['kelas', 'mataPelajaran', 'catatanPrivat.guru', 'apresiasi.guru']);
        });

        return response()->json($updatedBeritaAcara);
    }

    public function beritaAcaraIndex(Request $request): JsonResponse
    {
        $guruId = $request->user()->guru->id_guru;

        return response()->json(
            BeritaAcara::query()
                ->with(['kelas', 'mataPelajaran'])
                ->where('id_guru', $guruId)
                ->latest('tanggal')
                ->latest('id_berita_acara')
                ->paginate(15)
        );
    }

    public function catatanPrivatStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_siswa' => ['required', 'integer', 'exists:siswa,id_siswa'],
            'tanggal' => ['required', 'date'],
            'isi_pesan' => ['required', 'string'],
        ]);

        $data['id_guru'] = $request->user()->guru->id_guru;

        return response()->json(CatatanPrivat::create($data), 201);
    }

    public function apresiasiStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_siswa' => ['required', 'integer', 'exists:siswa,id_siswa'],
            'tanggal' => ['required', 'date'],
            'jenis_badge' => ['required', 'in:emas,perak,perunggu'],
            'topik_materi' => ['required', 'string', 'max:255'],
        ]);

        $data['id_guru'] = $request->user()->guru->id_guru;

        return response()->json(Apresiasi::create($data), 201);
    }

    public function analisisDiagnostikIndex(Request $request): JsonResponse
    {
        $query = AnalisisDiagnostik::query()->with(['siswa', 'sesiAsesmen']);

        if ($request->filled('id_sesi')) {
            $query->where('id_sesi', $request->integer('id_sesi'));
        }

        return response()->json($query->latest('tanggal_generate')->paginate(15));
    }

    public function dashboardSummary(Request $request): JsonResponse
    {
        $guruId = $request->user()->guru->id_guru;

        $penugasan = PenugasanPembelajaran::query()
            ->with(['kelas', 'mataPelajaran'])
            ->where('id_guru', $guruId)
            ->where('is_aktif', true)
            ->get();

        $waliKelas = Kelas::query()
            ->where('id_guru_wali', $guruId)
            ->get();

        $kelasIds = $penugasan
            ->pluck('id_kelas')
            ->merge($waliKelas->pluck('id_kelas'))
            ->unique()
            ->values();

        $mapelIds = $penugasan->pluck('id_mapel')->unique()->values();

        $upcomingSchedules = SesiAsesmen::query()
            ->with(['kelas', 'mataPelajaran'])
            ->when($kelasIds->isNotEmpty(), fn ($query) => $query->whereIn('id_kelas', $kelasIds))
            ->when($mapelIds->isNotEmpty(), fn ($query) => $query->whereIn('id_mapel', $mapelIds))
            ->where('waktu_mulai', '>=', now())
            ->orderBy('waktu_mulai')
            ->limit(5)
            ->get()
            ->map(fn (SesiAsesmen $sesi): array => [
                'title' => 'Jadwal Ujian - ' . $sesi->kelas?->nama_kelas,
                'meta' => optional($sesi->waktu_mulai)?->format('d/m/Y') . ' - ' . ucfirst($sesi->jenis_asesmen) . ' | ' . ($sesi->mataPelajaran?->nama_mapel ?? '-'),
                'note' => 'Mulai ' . optional($sesi->waktu_mulai)?->format('H:i') . ' WIB',
            ]);

        return response()->json([
            'cards' => [
                'total_kelas' => $kelasIds->count(),
                'total_bank_soal' => BankSoal::query()->where('id_guru', $guruId)->count(),
                'total_penugasan' => $penugasan->count(),
                'ujian_aktif' => SesiAsesmen::query()
                    ->when($kelasIds->isNotEmpty(), fn ($query) => $query->whereIn('id_kelas', $kelasIds))
                    ->when($mapelIds->isNotEmpty(), fn ($query) => $query->whereIn('id_mapel', $mapelIds))
                    ->where('waktu_mulai', '>=', now())
                    ->count(),
                'total_berita_acara' => BeritaAcara::query()->where('id_guru', $guruId)->count(),
            ],
            'upcoming_schedules' => $upcomingSchedules,
            'teaching_assignments' => $penugasan->map(fn (PenugasanPembelajaran $assignment): array => [
                'id_penugasan_pembelajaran' => $assignment->id_penugasan_pembelajaran,
                'nama_kelas' => $assignment->kelas?->nama_kelas,
                'nama_mapel' => $assignment->mataPelajaran?->nama_mapel,
                'tahun_ajaran' => $assignment->tahun_ajaran,
            ])->values(),
            'quick_tips' => [
                'Pastikan penugasan guru-mapel-kelas aktif sebelum membuat bank soal.',
                'Gunakan berita acara untuk dokumentasi kelas harian.',
                'Pantau analisis diagnostik untuk melihat kelemahan siswa.',
            ],
        ]);
    }

    protected function ensureGuruMengampuMapel(int $guruId, int $idMapel): void
    {
        $exists = PenugasanPembelajaran::query()
            ->where('id_guru', $guruId)
            ->where('id_mapel', $idMapel)
            ->where('is_aktif', true)
            ->exists();

        if (! $exists) {
            abort(response()->json([
                'message' => 'Guru belum ditugaskan untuk mengampu mata pelajaran ini.',
            ], 422));
        }
    }

    protected function ensureGuruMengampuKelasDanMapel(int $guruId, int $idKelas, int $idMapel): void
    {
        $exists = PenugasanPembelajaran::query()
            ->where('id_guru', $guruId)
            ->where('id_kelas', $idKelas)
            ->where('id_mapel', $idMapel)
            ->where('is_aktif', true)
            ->exists();

        if (! $exists) {
            abort(response()->json([
                'message' => 'Guru belum ditugaskan untuk kelas dan mata pelajaran tersebut.',
            ], 422));
        }
    }

    protected function validateKehadiranLengkap(int $idKelas, array $kehadiran): void
    {
        $aktifSiswaIds = KelasSiswa::query()
            ->where('id_kelas', $idKelas)
            ->where('is_aktif', true)
            ->pluck('id_siswa')
            ->map(fn ($item) => (int) $item)
            ->values();

        if ($aktifSiswaIds->isEmpty()) {
            abort(response()->json([
                'message' => 'Kelas belum memiliki siswa aktif untuk dicatat pada berita acara.',
            ], 422));
        }

        $submittedIds = collect($kehadiran)
            ->pluck('id_siswa')
            ->map(fn ($item) => (int) $item)
            ->values();

        if ($submittedIds->count() !== $submittedIds->unique()->count()) {
            abort(response()->json([
                'message' => 'Data kehadiran tidak boleh memiliki siswa duplikat.',
            ], 422));
        }

        $missingIds = $aktifSiswaIds->diff($submittedIds)->values();

        if ($missingIds->isNotEmpty()) {
            abort(response()->json([
                'message' => 'Presensi tidak lengkap. Semua siswa aktif di kelas harus dicatat kehadirannya.',
            ], 422));
        }

        $invalidIds = $submittedIds->diff($aktifSiswaIds)->values();

        if ($invalidIds->isNotEmpty()) {
            abort(response()->json([
                'message' => 'Terdapat siswa yang tidak termasuk kelas aktif ini pada data kehadiran.',
            ], 422));
        }
    }
}