<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalisisDiagnostik;
use App\Models\Apresiasi;
use App\Models\BankSoal;
use App\Models\BeritaAcara;
use App\Models\CatatanPrivat;
use App\Models\Kelas;
use App\Models\PenugasanPembelajaran;
use App\Models\SesiAsesmen;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuruController extends Controller
{
    public function bankSoalStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_mapel' => ['required', 'integer', 'exists:mata_pelajaran,id_mapel'],
            'isi_soal' => ['required', 'string'],
            'jenis_soal' => ['required', 'in:pilihan_ganda,esai'],
            'kunci_jawaban' => ['required', 'string'],
            'topik_materi' => ['required', 'string', 'max:255'],
            'level_kognitif' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
        ]);

        $guruId = $request->user()->guru->id_guru;
        $this->ensureGuruMengampuMapel($guruId, (int) $data['id_mapel']);

        $data['id_guru'] = $guruId;

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
        $data = $request->validate([
            'id_kelas' => ['required', 'integer', 'exists:kelas,id_kelas'],
            'pertemuan_ke' => ['required', 'integer', 'min:1'],
            'tanggal' => ['required', 'date'],
            'materi_bahasan' => ['required', 'string', 'max:255'],
            'catatan_kelas' => ['required', 'string'],
        ]);

        $data['id_guru'] = $request->user()->guru->id_guru;

        return response()->json(BeritaAcara::create($data), 201);
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
}