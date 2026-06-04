<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalisisDiagnostik;
use App\Models\Apresiasi;
use App\Models\BeritaAcara;
use App\Models\CatatanPrivat;
use App\Models\KelasSiswa;
use App\Models\JawabanSiswa;
use App\Models\PenugasanPembelajaran;
use App\Models\RencanaBelajar;
use App\Models\SesiAsesmen;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SiswaController extends Controller
{
    public function activeSessions(Request $request): JsonResponse
    {
        $idKelas = $request->user()->siswa?->kelasAktifAssignment?->id_kelas;

        $query = SesiAsesmen::query()
            ->with(['kelas', 'mataPelajaran'])
            ->where('waktu_mulai', '<=', now())
            ->latest('waktu_mulai');

        if ($idKelas) {
            $query->where('id_kelas', $idKelas);
        } else {
            $query->whereRaw('1 = 0');
        }

        return response()->json($query->paginate(15));
    }

    public function submitJawaban(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_detail' => ['required', 'integer', 'exists:detail_sesi_soal,id_detail'],
            'teks_jawaban' => ['required', 'string'],
            'is_correct' => ['required', 'boolean'],
            'skor_diperoleh' => ['required', 'numeric', 'min:0'],
        ]);

        $data['id_siswa'] = $request->user()->siswa->id_siswa;

        return response()->json(JawabanSiswa::create($data), 201);
    }

    public function trendNilai(Request $request): JsonResponse
    {
        $idSiswa = $request->user()->siswa->id_siswa;

        $trend = DB::table('analisis_diagnostik')
            ->select('tanggal_generate', 'skor_total')
            ->where('id_siswa', $idSiswa)
            ->orderBy('tanggal_generate')
            ->get();

        return response()->json(['data' => $trend]);
    }

    public function catatanPrivat(Request $request): JsonResponse
    {
        return response()->json(
            CatatanPrivat::query()
                ->where('id_siswa', $request->user()->siswa->id_siswa)
                ->with('guru')
                ->latest('tanggal')
                ->paginate(15)
        );
    }

    public function apresiasi(Request $request): JsonResponse
    {
        return response()->json(
            Apresiasi::query()
                ->where('id_siswa', $request->user()->siswa->id_siswa)
                ->with('guru')
                ->latest('tanggal')
                ->paginate(15)
        );
    }

    public function dashboardSummary(Request $request): JsonResponse
    {
        $pengguna = $request->user()->loadMissing([
            'siswa.kelasAktifAssignment.kelas.guruWali',
            'siswa.kelasRiwayat.kelas.guruWali',
            'siswa.rencanaBelajar.mataPelajaran',
        ]);

        $siswa = $pengguna->siswa;
        $idSiswa = $siswa->id_siswa;
        $kelasAktifAssignment = $siswa->kelasAktifAssignment?->loadMissing('kelas.guruWali');
        $kelasAktif = $kelasAktifAssignment?->kelas;

        $penugasan = $kelasAktif
            ? PenugasanPembelajaran::query()
                ->with(['mataPelajaran', 'guru'])
                ->where('id_kelas', $kelasAktif->id_kelas)
                ->where('is_aktif', true)
                ->orderBy('id_mapel')
                ->get()
            : collect();

        $riwayatKelas = $siswa->kelasRiwayat()
            ->with('kelas.guruWali')
            ->where('is_aktif', false)
            ->latest('tanggal_masuk')
            ->limit(5)
            ->get();

        $rencanaBelajar = $siswa->rencanaBelajar()
            ->with('mataPelajaran')
            ->latest()
            ->limit(5)
            ->get();

        $analisis = AnalisisDiagnostik::query()
            ->where('id_siswa', $idSiswa)
            ->latest('tanggal_generate')
            ->get();

        $latestScore = $analisis->first()?->skor_total ?? 0;
        $averageScore = $analisis->avg('skor_total') ? round($analisis->avg('skor_total'), 2) : 0;
        $pendingSessionCount = $kelasAktif
            ? SesiAsesmen::query()
                ->where('id_kelas', $kelasAktif->id_kelas)
                ->where('waktu_mulai', '>=', now())
                ->count()
            : 0;

        return response()->json([
            'profile' => [
                'nama_lengkap' => $siswa->nama_lengkap,
                'nisn' => $siswa->nisn,
                'kelas_aktif' => $kelasAktif ? [
                    'id_kelas' => $kelasAktif->id_kelas,
                    'nama_kelas' => $kelasAktif->nama_kelas,
                    'tahun_ajaran' => $kelasAktif->tahun_ajaran,
                    'guru_wali' => $kelasAktif->guruWali?->nama_lengkap,
                ] : null,
                'riwayat_kelas' => $riwayatKelas->map(fn ($item): array => [
                    'id_kelas_siswa' => $item->id_kelas_siswa,
                    'nama_kelas' => $item->kelas?->nama_kelas,
                    'tahun_ajaran' => $item->tahun_ajaran,
                    'is_aktif' => $item->is_aktif,
                ])->values(),
                'mata_pelajaran' => $penugasan->map(fn (PenugasanPembelajaran $item): array => [
                    'id_penugasan_pembelajaran' => $item->id_penugasan_pembelajaran,
                    'id_mapel' => $item->id_mapel,
                    'nama_mapel' => $item->mataPelajaran?->nama_mapel,
                    'guru' => $item->guru?->nama_lengkap,
                    'tahun_ajaran' => $item->tahun_ajaran,
                ])->values(),
                'rencana_belajar' => $rencanaBelajar->map(fn (RencanaBelajar $item): array => [
                    'id_rencana_belajar' => $item->id_rencana_belajar,
                    'id_mapel' => $item->id_mapel,
                    'nama_mapel' => $item->mataPelajaran?->nama_mapel,
                    'status' => $item->status,
                    'sumber' => $item->sumber,
                    'catatan' => $item->catatan,
                ])->values(),
            ],
            'cards' => [
                'rata_rata' => $averageScore,
                'ujian_menunggu' => $pendingSessionCount,
                'tugas_aktif' => JawabanSiswa::query()->where('id_siswa', $idSiswa)->count(),
                'apresiasi' => Apresiasi::query()->where('id_siswa', $idSiswa)->count(),
            ],
            'trend' => $analisis->take(7)->reverse()->values()->map(function (AnalisisDiagnostik $item): array {
                return [
                    'label' => optional($item->tanggal_generate)?->format('d/m'),
                    'value' => (float) $item->skor_total,
                ];
            }),
            'highlight' => [
                'latest_score' => $latestScore,
                'badge' => Apresiasi::query()->where('id_siswa', $idSiswa)->latest('tanggal')->first(),
                'notes' => CatatanPrivat::query()->where('id_siswa', $idSiswa)->latest('tanggal')->limit(3)->get(),
            ],
            'available_subjects' => $penugasan->map(fn (PenugasanPembelajaran $item): array => [
                'id_penugasan_pembelajaran' => $item->id_penugasan_pembelajaran,
                'id_mapel' => $item->id_mapel,
                'nama_mapel' => $item->mataPelajaran?->nama_mapel,
                'guru' => $item->guru?->nama_lengkap,
            ])->values(),
        ]);
    }

    public function riwayatPembelajaran(Request $request): JsonResponse
    {
        $pengguna = $request->user()->loadMissing([
            'siswa.kelasRiwayat.kelas.guruWali',
            'siswa.kelasAktifAssignment.kelas.guruWali',
        ]);

        $siswa = $pengguna->siswa;
        $idSiswa = $siswa->id_siswa;

        $kelasAssignments = $siswa->kelasRiwayat()
            ->with('kelas.guruWali')
            ->orderByDesc('tanggal_masuk')
            ->get();

        $kelasIds = $kelasAssignments->pluck('id_kelas')->unique()->values();

        $beritaAcara = BeritaAcara::query()
            ->with(['kelas', 'mataPelajaran', 'catatanPrivat.guru', 'apresiasi.guru'])
            ->when($kelasIds->isNotEmpty(), fn ($query) => $query->whereIn('id_kelas', $kelasIds))
            ->orderByDesc('tanggal')
            ->orderByDesc('pertemuan_ke')
            ->get()
            ->filter(function (BeritaAcara $item) use ($kelasAssignments, $idSiswa): bool {
                $matchingAssignments = $kelasAssignments->where('id_kelas', $item->id_kelas);
                $attendance = collect($item->kehadiran_siswa ?? [])->first(fn ($row): bool => (string) ($row['id_siswa'] ?? '') === (string) $idSiswa);

                if ($matchingAssignments->isEmpty()) {
                    return (bool) $attendance;
                }

                $tanggal = $item->tanggal?->toDateString();

                foreach ($matchingAssignments as $assignment) {
                    $masuk = $assignment->tanggal_masuk?->toDateString();
                    $keluar = $assignment->tanggal_keluar?->toDateString();

                    if ($masuk && $tanggal < $masuk) {
                        continue;
                    }

                    if ($keluar && $tanggal > $keluar) {
                        continue;
                    }

                    return true;
                }

                return (bool) $attendance;
            })
            ->map(function (BeritaAcara $item) use ($idSiswa): array {
                $attendance = collect($item->kehadiran_siswa ?? [])->first(fn ($row): bool => (string) ($row['id_siswa'] ?? '') === (string) $idSiswa);
                $catatanPribadi = $item->catatanPrivat->first(fn ($note): bool => (int) $note->id_siswa === (int) $idSiswa);
                $apresiasi = $item->apresiasi->first(fn ($badge): bool => (int) $badge->id_siswa === (int) $idSiswa);

                return [
                    'id_berita_acara' => $item->id_berita_acara,
                    'id_kelas' => $item->id_kelas,
                    'nama_kelas' => $item->kelas?->nama_kelas,
                    'tahun_ajaran' => $item->kelas?->tahun_ajaran,
                    'id_mapel' => $item->id_mapel,
                    'nama_mapel' => $item->mataPelajaran?->nama_mapel,
                    'pertemuan_ke' => $item->pertemuan_ke,
                    'pertemuan_label' => 'Pertemuan ke-' . $item->pertemuan_ke,
                    'tanggal' => $item->tanggal?->format('d/m/Y'),
                    'tanggal_raw' => $item->tanggal?->toDateString(),
                    'materi_bahasan' => $item->materi_bahasan,
                    'evaluasi_kendala' => $item->evaluasi_kendala,
                    'catatan_kelas' => $item->catatan_kelas,
                    'status_kehadiran' => $attendance['status_kehadiran'] ?? 'belum_dicatat',
                    'catatan_pribadi' => $catatanPribadi ? [
                        'id_catatan' => $catatanPribadi->id_catatan,
                        'isi_pesan' => $catatanPribadi->isi_pesan,
                        'guru' => [
                            'nama_lengkap' => $catatanPribadi->guru?->nama_lengkap,
                        ],
                        'tanggal' => $catatanPribadi->tanggal?->format('d/m/Y'),
                    ] : null,
                    'apresiasi' => $apresiasi ? [
                        'id_apresiasi' => $apresiasi->id_apresiasi,
                        'jenis_badge' => $apresiasi->jenis_badge,
                        'topik_materi' => $apresiasi->topik_materi,
                        'guru' => [
                            'nama_lengkap' => $apresiasi->guru?->nama_lengkap,
                        ],
                        'tanggal' => $apresiasi->tanggal?->format('d/m/Y'),
                    ] : null,
                ];
            })
            ->values();

        $subjectSummary = $beritaAcara
            ->groupBy('id_mapel')
            ->map(function ($items) {
                $first = $items->first();

                return [
                    'id_mapel' => $first['id_mapel'],
                    'nama_mapel' => $first['nama_mapel'],
                    'total_pertemuan' => $items->count(),
                    'pertemuan_terakhir' => $first['tanggal'],
                    'topik_terakhir' => $first['materi_bahasan'],
                    'hadir' => $items->where('status_kehadiran', 'hadir')->count(),
                    'izin' => $items->where('status_kehadiran', 'izin')->count(),
                    'sakit' => $items->where('status_kehadiran', 'sakit')->count(),
                    'alpa' => $items->where('status_kehadiran', 'alpa')->count(),
                    'catatan_pribadi' => $items->filter(fn (array $item): bool => filled($item['catatan_pribadi'] ?? null))->count(),
                    'apresiasi' => $items->filter(fn (array $item): bool => filled($item['apresiasi'] ?? null))->count(),
                ];
            })
            ->values();

        return response()->json([
            'total_pertemuan' => $beritaAcara->count(),
            'summary_kehadiran' => [
                'hadir' => $beritaAcara->where('status_kehadiran', 'hadir')->count(),
                'izin' => $beritaAcara->where('status_kehadiran', 'izin')->count(),
                'sakit' => $beritaAcara->where('status_kehadiran', 'sakit')->count(),
                'alpa' => $beritaAcara->where('status_kehadiran', 'alpa')->count(),
            ],
            'mata_pelajaran' => $subjectSummary,
            'data' => $beritaAcara,
        ]);
    }

    public function rencanaBelajarIndex(Request $request): JsonResponse
    {
        return response()->json(
            RencanaBelajar::query()
                ->where('id_siswa', $request->user()->siswa->id_siswa)
                ->with('mataPelajaran')
                ->latest()
                ->paginate(15)
        );
    }

    public function rencanaBelajarStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_mapel' => ['required', 'integer', 'exists:mata_pelajaran,id_mapel'],
            'catatan' => ['nullable', 'string', 'max:1000'],
            'sumber' => ['sometimes', Rule::in(['manual', 'kelas', 'guru'])],
            'status' => ['sometimes', Rule::in(['direncanakan', 'sedang_dipelajari', 'selesai'])],
        ]);

        $rencana = RencanaBelajar::query()->updateOrCreate(
            [
                'id_siswa' => $request->user()->siswa->id_siswa,
                'id_mapel' => $data['id_mapel'],
            ],
            [
                'catatan' => $data['catatan'] ?? null,
                'sumber' => $data['sumber'] ?? 'manual',
                'status' => $data['status'] ?? 'direncanakan',
            ]
        );

        return response()->json($rencana->fresh('mataPelajaran'), 201);
    }
}