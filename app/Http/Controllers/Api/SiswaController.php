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
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SiswaController extends Controller
{
    public function activeSessions(Request $request): JsonResponse
    {
        $siswa = $request->user()->siswa;
        $idKelas = $siswa?->kelasAktifAssignment?->id_kelas;
        $idSiswa = $siswa?->id_siswa;

        $query = SesiAsesmen::query()
            ->with(['kelas', 'mataPelajaran', 'detailSesiSoal'])
            ->latest('waktu_mulai');

        if ($idKelas) {
            $query->where('id_kelas', $idKelas);
        } else {
            $query->whereRaw('1 = 0');
        }

        $paginated = $query->paginate(15);

        // Add sudah_dikerjakan flag per session
        if ($idSiswa) {
            $allDetailIds = $paginated->getCollection()->flatMap(function ($sesi) {
                return $sesi->detailSesiSoal->pluck('id_detail');
            })->unique()->values();

            $answeredDetailIds = JawabanSiswa::where('id_siswa', $idSiswa)
                ->whereIn('id_detail', $allDetailIds)
                ->pluck('id_detail')
                ->toArray();

            $paginated->getCollection()->transform(function ($sesi) use ($answeredDetailIds) {
                $sesiDetailIds = $sesi->detailSesiSoal->pluck('id_detail')->toArray();
                $answeredCount = count(array_intersect($sesiDetailIds, $answeredDetailIds));
                $sesi->sudah_dikerjakan = $answeredCount > 0 && $answeredCount >= count($sesiDetailIds);
                return $sesi;
            });
        }

        return response()->json($paginated);
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

    public function cbtData(Request $request, int $id_sesi): JsonResponse
    {
        $siswa = $request->user()->siswa;
        
        $sesi = SesiAsesmen::query()
            ->with(['mataPelajaran', 'detailSesiSoal.bankSoal'])
            ->where('id_sesi', $id_sesi)
            ->firstOrFail();

        // Check if student has access to this class session
        if ($sesi->id_kelas !== $siswa->kelasAktifAssignment?->id_kelas) {
            return response()->json(['message' => 'Unauthorized access to this session'], 403);
        }

        // Check if session has ended
        if ($sesi->waktu_selesai && now()->gt($sesi->waktu_selesai)) {
            return response()->json([
                'message' => 'Waktu pengerjaan ujian telah berakhir.',
                'waktu_habis' => true,
            ], 403);
        }

        // Check if session has started
        if ($sesi->waktu_mulai && now()->lt($sesi->waktu_mulai)) {
            return response()->json([
                'message' => 'Ujian belum dimulai.',
                'belum_mulai' => true,
            ], 403);
        }

        // Check if student already completed and retakes not allowed
        if (!$sesi->boleh_ulang) {
            $totalSoal = $sesi->detailSesiSoal->count();
            $answeredCount = JawabanSiswa::where('id_siswa', $siswa->id_siswa)
                ->whereIn('id_detail', $sesi->detailSesiSoal->pluck('id_detail'))
                ->count();
            if ($answeredCount > 0 && $answeredCount >= $totalSoal) {
                return response()->json([
                    'message' => 'Anda sudah mengerjakan ujian ini dan tidak diperbolehkan mengulang.',
                    'sudah_dikerjakan' => true,
                ], 403);
            }
        }

        $soal = $sesi->detailSesiSoal->map(function ($detail) {
            $bankSoal = $detail->bankSoal;
            return [
                'id_detail' => $detail->id_detail,
                'jenis_soal' => $bankSoal->jenis_soal,
                'isi_soal' => $bankSoal->isi_soal,
                'opsi_jawaban' => $bankSoal->opsi_jawaban,
                'bobot_nilai' => $detail->bobot_nilai,
            ];
        });

        // Get existing answers
        $jawaban = JawabanSiswa::query()
            ->where('id_siswa', $siswa->id_siswa)
            ->whereIn('id_detail', $soal->pluck('id_detail'))
            ->get()
            ->keyBy('id_detail');

        return response()->json([
            'sesi' => [
                'id_sesi' => $sesi->id_sesi,
                'tipe_soal' => $sesi->tipe_soal,
                'jenis_asesmen' => $sesi->jenis_asesmen,
                'durasi_menit' => $sesi->durasi_menit,
                'waktu_mulai' => $sesi->waktu_mulai,
                'waktu_selesai' => $sesi->waktu_selesai,
                'mata_pelajaran' => $sesi->mataPelajaran?->nama_mapel,
            ],
            'soal' => $soal,
            'jawaban_tersimpan' => $jawaban->values()->map(function ($item) {
                return [
                    'id_detail' => $item->id_detail,
                    'teks_jawaban' => $item->teks_jawaban,
                ];
            }),
        ]);
    }

    public function cbtSubmit(Request $request, int $id_sesi): JsonResponse
    {
        $siswa = $request->user()->siswa;
        $data = $request->validate([
            'jawaban' => ['required', 'array'],
            'jawaban.*.id_detail' => ['required', 'integer', 'exists:detail_sesi_soal,id_detail'],
            'jawaban.*.teks_jawaban' => ['nullable', 'string'],
        ]);

        $sesi = SesiAsesmen::query()
            ->with(['detailSesiSoal.bankSoal', 'mataPelajaran'])
            ->findOrFail($id_sesi);

        if ($sesi->waktu_selesai && now()->gt(\Carbon\Carbon::parse($sesi->waktu_selesai)->addMinutes(5))) {
            return response()->json(['message' => 'Waktu ujian telah berakhir'], 403);
        }

        if ($sesi->waktu_mulai && now()->lt($sesi->waktu_mulai)) {
            return response()->json(['message' => 'Ujian belum dimulai'], 403);
        }

        $details = $sesi->detailSesiSoal->keyBy('id_detail');
        $totalSkor = 0;
        $totalBobot = $sesi->detailSesiSoal->sum('bobot_nilai');
        $resultPerSoal = [];

        // Deduplikasi: hanya ambil jawaban terakhir per id_detail
        $jawabanByDetail = collect($data['jawaban'])->keyBy('id_detail')->values()->all();

        DB::transaction(function () use ($jawabanByDetail, $siswa, $details, &$totalSkor, &$resultPerSoal) {
            foreach ($jawabanByDetail as $jawab) {
                $detail = $details->get($jawab['id_detail']);
                if (!$detail || !$detail->bankSoal) continue;

                $bankSoal = $detail->bankSoal;
                $teksJawaban = $jawab['teks_jawaban'] ?? null;

                $isCorrect = false;
                $skorDiperoleh = 0;

                if ($teksJawaban !== null && $teksJawaban !== '') {
                    if ($bankSoal->jenis_soal === 'pilihan_ganda') {
                        $isCorrect = $teksJawaban === $bankSoal->kunci_jawaban;
                        $skorDiperoleh = $isCorrect ? $detail->bobot_nilai : 0;
                    } elseif ($bankSoal->jenis_soal === 'pilihan_ganda_kompleks') {
                        $kunciArr = json_decode($bankSoal->kunci_jawaban, true) ?? [];
                        $jawabArr = json_decode($teksJawaban, true);

                        if (!is_array($jawabArr)) {
                            $jawabArr = [$teksJawaban];
                        }

                        if (count($kunciArr) > 0) {
                            $truePositives = 0;
                            $falsePositives = 0;
                            foreach ($jawabArr as $j) {
                                if (in_array($j, $kunciArr)) {
                                    $truePositives++;
                                } else {
                                    $falsePositives++;
                                }
                            }
                            $calculatedScore = $truePositives / count($kunciArr);
                            $skorDiperoleh = round($calculatedScore * $detail->bobot_nilai, 4);
                            $isCorrect = ($truePositives == count($kunciArr) && $falsePositives == 0);
                        }
                    }
                    // Essay: stays 0, needs manual grading
                }

                $totalSkor += $skorDiperoleh;

                JawabanSiswa::updateOrCreate(
                    [
                        'id_siswa' => $siswa->id_siswa,
                        'id_detail' => $jawab['id_detail'],
                    ],
                    [
                        'teks_jawaban' => $teksJawaban ?? '',
                        'is_correct' => $isCorrect,
                        'skor_diperoleh' => $skorDiperoleh,
                    ]
                );

                $resultPerSoal[] = [
                    'id_detail' => $detail->id_detail,
                    'isi_soal' => $bankSoal->isi_soal,
                    'jenis_soal' => $bankSoal->jenis_soal,
                    'opsi_jawaban' => $bankSoal->opsi_jawaban,
                    'jawaban_siswa' => $teksJawaban,
                    'kunci_jawaban' => $bankSoal->kunci_jawaban,
                    'is_correct' => $isCorrect,
                    'bobot_nilai' => $detail->bobot_nilai,
                    'skor_diperoleh' => $skorDiperoleh,
                ];
            }
        });

        $jumlahBenar = collect($resultPerSoal)->where('is_correct', true)->count();

        // --- Trigger Gemini AI Analisis Diagnostik ---
        $analisisDiagnostik = null;
        try {
            $geminiService = new GeminiService();
            $analisis = $geminiService->generateAnalisis($siswa->id_siswa, $id_sesi);
            $analisisDiagnostik = [
                'id_analisis' => $analisis->id_analisis,
                'skor_total' => $analisis->skor_total,
                'narasi_kekuatan' => $analisis->narasi_kekuatan,
                'narasi_kelemahan' => $analisis->narasi_kelemahan,
                'tanggal_generate' => $analisis->tanggal_generate,
                'rekap_kognitif' => $geminiService->buildRekapCognitive($siswa->id_siswa, $id_sesi)['rekap_level_kognitif'] ?? null,
            ];
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Gemini AI analysis failed after CBT submit.', [
                'id_siswa' => $siswa->id_siswa,
                'id_sesi' => $id_sesi,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'Ujian berhasil disubmit',
            'total_skor' => round($totalSkor, 4),
            'total_bobot' => round($totalBobot, 4),
            'jumlah_soal' => count($resultPerSoal),
            'jumlah_benar' => $jumlahBenar,
            'jumlah_salah' => count($resultPerSoal) - $jumlahBenar,
            'mata_pelajaran' => $sesi->mataPelajaran?->nama_mapel,
            'jenis_asesmen' => $sesi->jenis_asesmen,
            'detail_hasil' => $resultPerSoal,
            'analisis_diagnostik' => $analisisDiagnostik,
        ], 200);
    }

    public function cbtSaveAnswer(Request $request, int $id_sesi): JsonResponse
    {
        $siswa = $request->user()->siswa;
        $data = $request->validate([
            'id_detail' => ['required', 'integer', 'exists:detail_sesi_soal,id_detail'],
            'teks_jawaban' => ['nullable', 'string'],
        ]);

        $sesi = SesiAsesmen::findOrFail($id_sesi);

        if ($sesi->waktu_selesai && now()->gt(\Carbon\Carbon::parse($sesi->waktu_selesai)->addMinutes(5))) {
            return response()->json(['message' => 'Waktu ujian telah berakhir'], 403);
        }

        if ($sesi->waktu_mulai && now()->lt($sesi->waktu_mulai)) {
            return response()->json(['message' => 'Ujian belum dimulai'], 403);
        }

        if ($sesi->id_kelas !== $siswa->kelasAktifAssignment?->id_kelas) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $detail = \App\Models\DetailSesiSoal::with('bankSoal')->where('id_detail', $data['id_detail'])->first();
        $isCorrect = false;
        $skorDiperoleh = 0;

        if ($detail && $detail->bankSoal) {
            $bankSoal = $detail->bankSoal;
            $teksJawaban = $data['teks_jawaban'] ?? null;

            if ($teksJawaban !== null && $teksJawaban !== '') {
                if ($bankSoal->jenis_soal === 'pilihan_ganda') {
                    $isCorrect = $teksJawaban === $bankSoal->kunci_jawaban;
                    $skorDiperoleh = $isCorrect ? $detail->bobot_nilai : 0;
                } elseif ($bankSoal->jenis_soal === 'pilihan_ganda_kompleks') {
                    $kunciArr = json_decode($bankSoal->kunci_jawaban, true) ?? [];
                    $jawabArr = json_decode($teksJawaban, true);

                    if (!is_array($jawabArr)) {
                        $jawabArr = [$teksJawaban];
                    }

                    if (count($kunciArr) > 0) {
                        $truePositives = 0;
                        $falsePositives = 0;
                        foreach ($jawabArr as $j) {
                            if (in_array($j, $kunciArr)) $truePositives++;
                            else $falsePositives++;
                        }
                        $calculatedScore = $truePositives / count($kunciArr);
                        $skorDiperoleh = round($calculatedScore * $detail->bobot_nilai, 4);
                        $isCorrect = ($truePositives == count($kunciArr) && $falsePositives == 0);
                    }
                }
            }
        }

        JawabanSiswa::updateOrCreate(
            [
                'id_siswa' => $siswa->id_siswa,
                'id_detail' => $data['id_detail'],
            ],
            [
                'teks_jawaban' => $data['teks_jawaban'] ?? '',
                'is_correct' => $isCorrect,
                'skor_diperoleh' => $skorDiperoleh,
            ]
        );

        return response()->json(['message' => 'Jawaban tersimpan'], 200);
    }

    public function cbtHistory(Request $request): JsonResponse
    {
        $siswa = $request->user()->siswa;

        $idKelas = $siswa->kelasAktifAssignment?->id_kelas;

        if (!$idKelas) {
            return response()->json([]);
        }

        $sessions = SesiAsesmen::query()
            ->with(['kelas', 'mataPelajaran', 'detailSesiSoal'])
            ->where('id_kelas', $idKelas)
            ->latest('waktu_mulai')
            ->get()
            ->map(function (SesiAsesmen $sesi) use ($siswa) {
                $detailIds = $sesi->detailSesiSoal->pluck('id_detail');
                $jawaban = JawabanSiswa::where('id_siswa', $siswa->id_siswa)
                    ->whereIn('id_detail', $detailIds)
                    ->get();

                $totalSkor = $jawaban->sum('skor_diperoleh');
                $totalBobot = $sesi->detailSesiSoal->sum('bobot_nilai');
                $jumlahBenar = $jawaban->where('is_correct', true)->count();

                return [
                    'id_sesi' => $sesi->id_sesi,
                    'mata_pelajaran' => $sesi->mataPelajaran?->nama_mapel,
                    'kelas' => $sesi->kelas?->nama_kelas,
                    'tipe_soal' => $sesi->tipe_soal,
                    'jenis_asesmen' => $sesi->jenis_asesmen,
                    'waktu_mulai' => $sesi->waktu_mulai,
                    'durasi_menit' => $sesi->durasi_menit,
                    'jumlah_soal' => $sesi->detailSesiSoal->count(),
                    'jumlah_dijawab' => $jawaban->count(),
                    'jumlah_benar' => $jumlahBenar,
                    'total_skor' => round($totalSkor, 2),
                    'total_bobot' => round($totalBobot, 2),
                    'submitted_at' => $jawaban->max('updated_at'),
                    'has_analisis' => AnalisisDiagnostik::where('id_siswa', $siswa->id_siswa)
                        ->where('id_sesi', $sesi->id_sesi)
                        ->exists(),
                ];
            });

        return response()->json(['data' => $sessions->values()]);
    }

    public function cbtReview(Request $request, int $id_sesi): JsonResponse
    {
        $siswa = $request->user()->siswa;

        $sesi = SesiAsesmen::query()
            ->with(['mataPelajaran', 'kelas', 'detailSesiSoal.bankSoal'])
            ->findOrFail($id_sesi);

        $detailIds = $sesi->detailSesiSoal->pluck('id_detail');
        $jawaban = JawabanSiswa::where('id_siswa', $siswa->id_siswa)
            ->whereIn('id_detail', $detailIds)
            ->get()
            ->keyBy('id_detail');

        // Only allow review if the student has at least one answer
        if ($jawaban->isEmpty()) {
            return response()->json(['message' => 'Anda belum mengerjakan ujian ini.'], 403);
        }

        $totalSkor = 0;
        $totalBobot = 0;

        $soalReview = $sesi->detailSesiSoal->map(function ($detail) use ($jawaban, &$totalSkor, &$totalBobot) {
            $bankSoal = $detail->bankSoal;
            $answer = $jawaban->get($detail->id_detail);
            $totalBobot += $detail->bobot_nilai;

            $skorDiperoleh = $answer ? (float) $answer->skor_diperoleh : 0;
            $totalSkor += $skorDiperoleh;

            return [
                'id_detail' => $detail->id_detail,
                'isi_soal' => $bankSoal->isi_soal,
                'jenis_soal' => $bankSoal->jenis_soal,
                'opsi_jawaban' => $bankSoal->opsi_jawaban,
                'kunci_jawaban' => $bankSoal->kunci_jawaban,
                'bobot_nilai' => $detail->bobot_nilai,
                'jawaban_siswa' => $answer?->teks_jawaban,
                'is_correct' => $answer?->is_correct ?? false,
                'skor_diperoleh' => $skorDiperoleh,
            ];
        });

        // Include Analisis Diagnostik if exists
        $analisis = AnalisisDiagnostik::where('id_siswa', $siswa->id_siswa)
            ->where('id_sesi', $id_sesi)
            ->first();

        $analisisDiagnostik = null;
        if ($analisis) {
            $geminiService = new GeminiService();
            $analisisDiagnostik = [
                'id_analisis' => $analisis->id_analisis,
                'skor_total' => $analisis->skor_total,
                'narasi_kekuatan' => $analisis->narasi_kekuatan,
                'narasi_kelemahan' => $analisis->narasi_kelemahan,
                'tanggal_generate' => $analisis->tanggal_generate,
                'rekap_kognitif' => $geminiService->buildRekapCognitive($siswa->id_siswa, $id_sesi)['rekap_level_kognitif'] ?? null,
            ];
        }

        return response()->json([
            'sesi' => [
                'id_sesi' => $sesi->id_sesi,
                'mata_pelajaran' => $sesi->mataPelajaran?->nama_mapel,
                'kelas' => $sesi->kelas?->nama_kelas,
                'jenis_asesmen' => $sesi->jenis_asesmen,
                'tipe_soal' => $sesi->tipe_soal,
                'waktu_mulai' => $sesi->waktu_mulai,
                'durasi_menit' => $sesi->durasi_menit,
            ],
            'total_skor' => round($totalSkor, 2),
            'total_bobot' => round($totalBobot, 2),
            'jumlah_benar' => $soalReview->where('is_correct', true)->count(),
            'jumlah_soal' => $soalReview->count(),
            'soal' => $soalReview->values(),
            'analisis_diagnostik' => $analisisDiagnostik,
        ]);
    }
}