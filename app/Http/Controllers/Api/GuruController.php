<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalisisDiagnostik;
use App\Models\Apresiasi;
use App\Models\BankSoal;
use App\Models\BeritaAcara;
use App\Models\CatatanPrivat;
use App\Models\JawabanSiswa;
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

        $waliKelas = Kelas::query()
            ->where('id_guru_wali', $guruId)
            ->get();

        $kelasOptions = collect();
        foreach ($waliKelas as $kelas) {
            $kelasOptions->push([
                'id_kelas' => $kelas->id_kelas,
                'nama_kelas' => $kelas->nama_kelas,
                'tahun_ajaran' => $kelas->tahun_ajaran,
                'is_wali_kelas' => true,
            ]);
        }
        foreach ($assignments as $item) {
            $kelasOptions->push([
                'id_kelas' => $item->id_kelas,
                'nama_kelas' => $item->kelas?->nama_kelas,
                'tahun_ajaran' => $item->tahun_ajaran,
                'is_wali_kelas' => false,
            ]);
        }

        $kelasOptions = $kelasOptions->unique('id_kelas')->values();
        $kelasIds = $kelasOptions->pluck('id_kelas');

        $activeClassStudents = KelasSiswa::query()
            ->with('siswa')
            ->whereIn('id_kelas', $kelasIds)
            ->where('is_aktif', true)
            ->orderBy('id_kelas')
            ->get();

        $studentsByClass = $activeClassStudents
            ->groupBy('id_kelas')
            ->map(fn(Collection $items): array => $items
                ->map(fn(KelasSiswa $item): array => [
                    'id_siswa' => $item->id_siswa,
                    'nama_lengkap' => $item->siswa?->nama_lengkap,
                    'nisn' => $item->siswa?->nisn,
                ])
                ->values()
                ->all())
            ->all();

        $bankSoal = BankSoal::query()
            ->with('mataPelajaran')
            ->where('created_by', $request->user()->id_pengguna)
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

        $tipeSoalOptions = SesiAsesmen::query()
            ->whereIn('id_kelas', $kelasIds)
            ->whereIn('id_mapel', $assignments->pluck('id_mapel'))
            ->whereNotNull('tipe_soal')
            ->distinct()
            ->pluck('tipe_soal');

        return response()->json([
            'teaching_assignments' => $assignments,
            'kelas_options' => $kelasOptions,
            'tipe_soal_options' => $tipeSoalOptions,
            'mapel_options' => $assignments
                ->map(fn(PenugasanPembelajaran $item): array => [
                    'id_mapel' => $item->id_mapel,
                    'nama_mapel' => $item->mataPelajaran?->nama_mapel,
                    'nama_lengkap' => $item->mataPelajaran?->nama_lengkap,
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
        $penggunaId = $request->user()->id_pengguna;

        return response()->json(
            BankSoal::query()
                ->with('mataPelajaran')
                ->where('created_by', $penggunaId)
                ->latest('id_soal')
                ->paginate(15)
        );
    }

    public function bankSoalStore(Request $request): JsonResponse
    {
        $validator = validator($request->all(), [
            'id_mapel' => ['required', 'integer', 'exists:mata_pelajaran,id_mapel'],
            'isi_soal' => ['required', 'string'],
            'jenis_soal' => ['required', 'in:pilihan_ganda,esai,pilihan_ganda_kompleks'],
            'kunci_jawaban' => ['required'],
            'topik_materi' => ['required', 'string', 'max:255'],
            'level_kognitif' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'opsi_jawaban' => ['nullable', 'array'],
            'opsi_jawaban.*' => ['nullable', 'string', 'max:255'],
            'gambar_soal' => ['nullable', 'image', 'mimes:jpeg,png,jpg', 'max:2048'],
            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['string'],
            'rule_weight' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'lsa_weight' => ['nullable', 'numeric', 'min:0', 'max:1'],
        ]);

        $validator->after(function ($validator) use ($request): void {
            $jenisSoal = $request->input('jenis_soal');
            $opsi = collect($request->input('opsi_jawaban', []))
                ->map(fn($item) => trim((string) $item))
                ->filter()
                ->values();

            if ($jenisSoal === 'pilihan_ganda') {
                if ($opsi->count() < 2) {
                    $validator->errors()->add('opsi_jawaban', 'Minimal dua opsi jawaban diperlukan untuk soal pilihan ganda.');
                }

                if ($opsi->count() > 0 && !$opsi->contains(trim((string) $request->input('kunci_jawaban')))) {
                    $validator->errors()->add('kunci_jawaban', 'Kunci jawaban harus sesuai salah satu opsi pilihan ganda.');
                }
            } elseif ($jenisSoal === 'pilihan_ganda_kompleks') {
                if ($opsi->count() < 2) {
                    $validator->errors()->add('opsi_jawaban', 'Minimal dua opsi jawaban diperlukan untuk soal pilihan ganda kompleks.');
                }

                $kunciArr = $request->input('kunci_jawaban');
                if (!is_array($kunciArr) || count($kunciArr) === 0) {
                    $validator->errors()->add('kunci_jawaban', 'Minimal satu kunci jawaban diperlukan.');
                } else {
                    foreach ($kunciArr as $k) {
                        if (!$opsi->contains(trim((string) $k))) {
                            $validator->errors()->add('kunci_jawaban', 'Semua kunci jawaban harus terdapat pada opsi jawaban.');
                            break;
                        }
                    }
                }
            }
        });

        $data = $validator->validate();

        if ($request->hasFile('gambar_soal')) {
            $data['gambar_soal'] = $request->file('gambar_soal')->store('soal_images', 'public');
        }

        $guruId = $request->user()->guru->id_guru;
        $this->ensureGuruMengampuMapel($guruId, (int) $data['id_mapel']);

        $cleanOptions = collect($data['opsi_jawaban'] ?? [])
            ->map(fn($item) => trim((string) $item))
            ->filter()
            ->values()
            ->all();

        if ($data['jenis_soal'] === 'esai') {
            $cleanOptions = [];
            $data['kunci_jawaban'] = trim((string) $data['kunci_jawaban']);
            $data['keywords'] = array_values(array_filter(array_map('trim', $data['keywords'] ?? [])));
            $data['rule_weight'] = $data['rule_weight'] ?? 0.50;
            $data['lsa_weight'] = $data['lsa_weight'] ?? 0.50;
        } elseif ($data['jenis_soal'] === 'pilihan_ganda_kompleks') {
            $data['kunci_jawaban'] = json_encode(array_values(array_filter(array_map('trim', (array) $data['kunci_jawaban']))));
        } else {
            $data['kunci_jawaban'] = trim((string) $data['kunci_jawaban']);
        }

        $data['created_by'] = $request->user()->id_pengguna;
        $data['opsi_jawaban'] = $cleanOptions;

        return response()->json(BankSoal::create($data), 201);
    }

    public function bankSoalUpdate(Request $request, int $id_soal): JsonResponse
    {
        $penggunaId = $request->user()->id_pengguna;
        $guruId = $request->user()->guru->id_guru;
        $bankSoal = BankSoal::query()->where('created_by', $penggunaId)->findOrFail($id_soal);

        $validator = validator($request->all(), [
            'id_mapel' => ['required', 'integer', 'exists:mata_pelajaran,id_mapel'],
            'isi_soal' => ['required', 'string'],
            'jenis_soal' => ['required', 'in:pilihan_ganda,esai,pilihan_ganda_kompleks'],
            'kunci_jawaban' => ['required'],
            'topik_materi' => ['required', 'string', 'max:255'],
            'level_kognitif' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'opsi_jawaban' => ['nullable', 'array'],
            'opsi_jawaban.*' => ['nullable', 'string', 'max:255'],
            'gambar_soal' => ['nullable', 'image', 'mimes:jpeg,png,jpg', 'max:2048'],
            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['string'],
            'rule_weight' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'lsa_weight' => ['nullable', 'numeric', 'min:0', 'max:1'],
        ]);

        $validator->after(function ($validator) use ($request): void {
            $jenisSoal = $request->input('jenis_soal');
            $opsi = collect($request->input('opsi_jawaban', []))
                ->map(fn($item) => trim((string) $item))
                ->filter()
                ->values();

            if ($jenisSoal === 'pilihan_ganda') {
                if ($opsi->count() < 2) {
                    $validator->errors()->add('opsi_jawaban', 'Minimal dua opsi jawaban diperlukan untuk soal pilihan ganda.');
                }
                if ($opsi->count() > 0 && !$opsi->contains(trim((string) $request->input('kunci_jawaban')))) {
                    $validator->errors()->add('kunci_jawaban', 'Kunci jawaban harus sesuai salah satu opsi pilihan ganda.');
                }
            } elseif ($jenisSoal === 'pilihan_ganda_kompleks') {
                if ($opsi->count() < 2) {
                    $validator->errors()->add('opsi_jawaban', 'Minimal dua opsi jawaban diperlukan untuk soal pilihan ganda kompleks.');
                }

                $kunciArr = $request->input('kunci_jawaban');
                if (!is_array($kunciArr) || count($kunciArr) === 0) {
                    $validator->errors()->add('kunci_jawaban', 'Minimal satu kunci jawaban diperlukan.');
                } else {
                    foreach ($kunciArr as $k) {
                        if (!$opsi->contains(trim((string) $k))) {
                            $validator->errors()->add('kunci_jawaban', 'Semua kunci jawaban harus terdapat pada opsi jawaban.');
                            break;
                        }
                    }
                }
            }
        });

        $data = $validator->validate();

        if ($request->hasFile('gambar_soal')) {
            if ($bankSoal->gambar_soal) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($bankSoal->gambar_soal);
            }
            $data['gambar_soal'] = $request->file('gambar_soal')->store('soal_images', 'public');
        } elseif ($request->input('hapus_gambar') === 'true') {
            if ($bankSoal->gambar_soal) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($bankSoal->gambar_soal);
            }
            $data['gambar_soal'] = null;
        }
        $this->ensureGuruMengampuMapel($guruId, (int) $data['id_mapel']);

        $cleanOptions = collect($data['opsi_jawaban'] ?? [])
            ->map(fn($item) => trim((string) $item))
            ->filter()
            ->values()
            ->all();

        if ($data['jenis_soal'] === 'esai') {
            $cleanOptions = [];
            $data['kunci_jawaban'] = trim((string) $data['kunci_jawaban']);
            $data['keywords'] = array_values(array_filter(array_map('trim', $data['keywords'] ?? [])));
            $data['rule_weight'] = $data['rule_weight'] ?? 0.50;
            $data['lsa_weight'] = $data['lsa_weight'] ?? 0.50;
        } elseif ($data['jenis_soal'] === 'pilihan_ganda_kompleks') {
            $data['kunci_jawaban'] = json_encode(array_values(array_filter(array_map('trim', (array) $data['kunci_jawaban']))));
        } else {
            $data['kunci_jawaban'] = trim((string) $data['kunci_jawaban']);
        }

        $data['opsi_jawaban'] = $cleanOptions;
        $bankSoal->update($data);

        return response()->json($bankSoal->fresh());
    }

    public function bankSoalDestroy(Request $request, int $id_soal): JsonResponse
    {
        $penggunaId = $request->user()->id_pengguna;
        $bankSoal = BankSoal::query()->where('created_by', $penggunaId)->findOrFail($id_soal);

        try {
            $gambar_soal = $bankSoal->gambar_soal;
            $bankSoal->delete();
            if ($gambar_soal) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($gambar_soal);
            }
            return response()->json(['message' => 'Soal berhasil dihapus.']);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') {
                return response()->json(['message' => 'Soal tidak dapat dihapus karena sudah digunakan dalam Jadwal CBT aktif/riwayat ujian siswa.'], 400);
            }
            throw $e;
        }
    }

    public function bankSoalShared(Request $request, int $id_mapel): JsonResponse
    {
        $guruId = $request->user()->guru->id_guru;
        $this->ensureGuruMengampuMapel($guruId, $id_mapel);

        return response()->json(
            BankSoal::query()
                ->with(['mataPelajaran', 'pembuat'])
                ->where('id_mapel', $id_mapel)
                ->latest('id_soal')
                ->get()
        );
    }

    public function bankSoalBulkStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_mapel' => ['required', 'integer', 'exists:mata_pelajaran,id_mapel'],
            'soal' => ['required', 'array'],
            'soal.*.isi_soal' => ['required', 'string'],
            'soal.*.jenis_soal' => ['required', 'in:pilihan_ganda,esai,pilihan_ganda_kompleks'],
            'soal.*.kunci_jawaban' => ['required'],
            'soal.*.topik_materi' => ['required', 'string', 'max:255'],
            'soal.*.level_kognitif' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'soal.*.opsi_jawaban' => ['nullable', 'array'],
            'soal.*.keywords' => ['nullable', 'array'],
            'soal.*.rule_weight' => ['nullable', 'numeric'],
            'soal.*.lsa_weight' => ['nullable', 'numeric'],
        ]);

        $guruId = $request->user()->guru->id_guru;
        $this->ensureGuruMengampuMapel($guruId, (int) $data['id_mapel']);
        $penggunaId = $request->user()->id_pengguna;

        $created = [];
        $errors = [];

        foreach ($data['soal'] as $index => $soal) {
            $soal['created_by'] = $penggunaId;
            $soal['id_mapel'] = $data['id_mapel'];

            if ($soal['jenis_soal'] === 'esai') {
                $soal['opsi_jawaban'] = [];
            } else {
                $opsiJawaban = collect($soal['opsi_jawaban'] ?? [])->map(fn($val) => trim((string) $val));

                if ($soal['jenis_soal'] === 'pilihan_ganda_kompleks') {
                    $kunciArr = is_string($soal['kunci_jawaban'])
                        ? array_values(array_filter(array_map('trim', explode(',', $soal['kunci_jawaban']))))
                        : (array) $soal['kunci_jawaban'];

                    // Validate each kunci exists in opsi
                    foreach ($kunciArr as $k) {
                        if (!$opsiJawaban->contains(trim((string) $k))) {
                            $errors[] = "Baris " . ($index + 2) . ": Kunci '" . $k . "' tak ada di opsi.";
                        }
                    }
                    $soal['kunci_jawaban'] = json_encode($kunciArr);
                } else {
                    $kunci = trim((string) $soal['kunci_jawaban']);
                    if (!$opsiJawaban->contains($kunci)) {
                        $errors[] = "Baris " . ($index + 2) . ": Kunci '" . $kunci . "' tak ada di opsi.";
                    }
                    $soal['kunci_jawaban'] = $kunci;
                }
            }
            
            $soal['rule_weight'] = $soal['rule_weight'] ?? 0;
            $soal['lsa_weight'] = $soal['lsa_weight'] ?? 0;

            $created[] = $soal;
        }

        if (!empty($errors)) {
            $errorMsg = "Gagal Import! Kunci jawaban tidak cocok dengan opsi:\n" . implode("\n", array_slice($errors, 0, 5));
            if (count($errors) > 5) {
                $errorMsg .= "\n... dan " . (count($errors) - 5) . " baris lainnya.";
            }
            return response()->json([
                'message' => $errorMsg,
                'errors' => $errors
            ], 422);
        }

        $inserted = [];
        foreach ($created as $soal) {
            $inserted[] = BankSoal::create($soal);
        }

        return response()->json(['message' => count($inserted) . ' soal berhasil diimport.', 'data' => $inserted], 201);
    }

    public function sesiAsesmenDetail(Request $request, int $id_sesi): JsonResponse
    {
        $guruId = $request->user()->guru->id_guru;

        $sesi = SesiAsesmen::query()
            ->with(['kelas', 'mataPelajaran', 'detailSesiSoal.bankSoal'])
            ->findOrFail($id_sesi);

        // Get all students in this class
        $siswaAssignments = KelasSiswa::query()
            ->where('id_kelas', $sesi->id_kelas)
            ->where('is_aktif', true)
            ->with('siswa')
            ->get();

        $detailIds = $sesi->detailSesiSoal->pluck('id_detail');

        // Get all answers for this session from all students
        $allJawaban = JawabanSiswa::whereIn('id_detail', $detailIds)
            ->get()
            ->groupBy('id_siswa');

        // Build soal list with correct answers
        $soalList = $sesi->detailSesiSoal->map(function ($detail) {
            $bs = $detail->bankSoal;
            return [
                'id_detail' => $detail->id_detail,
                'isi_soal' => $bs->isi_soal,
                'jenis_soal' => $bs->jenis_soal,
                'opsi_jawaban' => $bs->opsi_jawaban,
                'kunci_jawaban' => $bs->kunci_jawaban,
                'keywords' => $bs->keywords,
                'level_kognitif' => $bs->level_kognitif,
                'bobot_nilai' => $detail->bobot_nilai,
            ];
        })->values();

        // Build student results
        $totalBobot = $sesi->detailSesiSoal->sum('bobot_nilai');
        $siswaResults = [];
        $skorSemua = [];

        foreach ($siswaAssignments as $assignment) {
            $siswa = $assignment->siswa;
            if (!$siswa)
                continue;

            $jawabanSiswa = $allJawaban->get($siswa->id_siswa, collect());
            $sudahMengerjakan = $jawabanSiswa->isNotEmpty();
            $totalSkor = $jawabanSiswa->sum('skor_diperoleh');
            $jumlahBenar = $jawabanSiswa->where('is_correct', true)->count();

            $detailJawaban = null;
            if ($sudahMengerjakan) {
                $skorSemua[] = (float) $totalSkor;
                $jawabanByDetail = $jawabanSiswa->keyBy('id_detail');
                $detailJawaban = $sesi->detailSesiSoal->map(function ($detail) use ($jawabanByDetail) {
                    $jawab = $jawabanByDetail->get($detail->id_detail);
                    return [
                        'id_detail' => $detail->id_detail,
                        'jawaban_siswa' => $jawab?->teks_jawaban,
                        'is_correct' => $jawab?->is_correct ?? false,
                        'skor_diperoleh' => $jawab ? (float) $jawab->skor_diperoleh : 0,
                    ];
                })->values();
            }

            $siswaResults[] = [
                'id_siswa' => $siswa->id_siswa,
                'nama_lengkap' => $siswa->nama_lengkap,
                'nisn' => $siswa->nisn,
                'status' => $sudahMengerjakan ? 'sudah' : 'belum',
                'total_skor' => round($totalSkor, 2),
                'jumlah_benar' => $jumlahBenar,
                'jumlah_dijawab' => $jawabanSiswa->count(),
                'detail_jawaban' => $detailJawaban,
                'analisis_diagnostik' => (function () use ($siswa, $id_sesi, $sudahMengerjakan) {
                    if (!$sudahMengerjakan)
                        return null;
                    $analisis = AnalisisDiagnostik::where('id_siswa', $siswa->id_siswa)
                        ->where('id_sesi', $id_sesi)
                        ->first();
                    if (!$analisis)
                        return null;
                    return [
                        'narasi_kekuatan' => $analisis->narasi_kekuatan,
                        'narasi_kelemahan' => $analisis->narasi_kelemahan,
                        'skor_total' => $analisis->skor_total,
                        'tanggal_generate' => $analisis->tanggal_generate,
                    ];
                })(),
            ];
        }

        $sudahCount = count(array_filter($siswaResults, fn($s) => $s['status'] === 'sudah'));
        $belumCount = count($siswaResults) - $sudahCount;
        $rataRata = count($skorSemua) > 0 ? round(array_sum($skorSemua) / count($skorSemua), 2) : 0;

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
            'soal' => $soalList,
            'total_bobot' => round($totalBobot, 2),
            'statistik' => [
                'total_siswa' => count($siswaResults),
                'sudah_mengerjakan' => $sudahCount,
                'belum_mengerjakan' => $belumCount,
                'rata_rata_skor' => $rataRata,
                'skor_tertinggi' => count($skorSemua) > 0 ? round(max($skorSemua), 2) : 0,
                'skor_terendah' => count($skorSemua) > 0 ? round(min($skorSemua), 2) : 0,
            ],
            'siswa' => $siswaResults,
        ]);
    }

    public function updateSkorJawaban(Request $request, int $id_sesi, int $id_detail, int $id_siswa): JsonResponse
    {
        $request->validate([
            'skor' => ['required', 'numeric', 'min:0'],
        ]);

        $jawaban = JawabanSiswa::where('id_siswa', $id_siswa)
            ->where('id_detail', $id_detail)
            ->whereHas('detailSesiSoal', function ($q) use ($id_sesi) {
                $q->where('id_sesi', $id_sesi);
            })->firstOrFail();

        $is_correct = $request->skor > 0;
        
        $jawaban->update([
            'skor_diperoleh' => $request->skor,
            'is_correct' => $is_correct
        ]);

        $detailIds = \App\Models\DetailSesiSoal::where('id_sesi', $id_sesi)->pluck('id_detail');
        $totalSkor = JawabanSiswa::where('id_siswa', $id_siswa)
            ->whereIn('id_detail', $detailIds)
            ->sum('skor_diperoleh');

        \App\Models\AnalisisDiagnostik::where('id_siswa', $id_siswa)
            ->where('id_sesi', $id_sesi)
            ->update(['skor_total' => $totalSkor]);

        return response()->json([
            'message' => 'Skor berhasil diperbarui',
            'skor_diperoleh' => $jawaban->skor_diperoleh,
            'is_correct' => $jawaban->is_correct,
            'total_skor_baru' => $totalSkor
        ]);
    }

    public function validasiNilai(Request $request, int $id_sesi, int $id_siswa): JsonResponse
    {
        $sesi = SesiAsesmen::findOrFail($id_sesi);
        $siswa = \App\Models\Siswa::findOrFail($id_siswa);

        $detailIds = $sesi->detailSesiSoal->pluck('id_detail');
        $totalSkor = JawabanSiswa::where('id_siswa', $id_siswa)
            ->whereIn('id_detail', $detailIds)
            ->sum('skor_diperoleh');

        $existing = \App\Models\AnalisisDiagnostik::where('id_siswa', $id_siswa)
            ->where('id_sesi', $id_sesi)
            ->first();

        // Pengecekan cerdas: batalkan trigger jika skor sama dan narasi sudah pernah dibuat (tidak kosong)
        if ($existing && round($existing->skor_total, 2) === round($totalSkor, 2) && !empty($existing->narasi_kekuatan)) {
            return response()->json([
                'status' => 'unchanged',
                'message' => 'Nilai tidak mengalami perubahan. Analisis Diagnostik sebelumnya masih relevan sehingga tidak diperbarui ulang untuk menghemat kuota AI.'
            ]);
        }

        \App\Models\AnalisisDiagnostik::updateOrCreate(
            ['id_siswa' => $id_siswa, 'id_sesi' => $id_sesi],
            ['skor_total' => $totalSkor, 'tanggal_generate' => now()]
        );
        
        \App\Jobs\GenerateAnalisisDiagnostikJob::dispatch($id_siswa, $id_sesi);

        return response()->json([
            'status' => 'updated',
            'message' => 'Validasi berhasil, analisis diagnostik AI sedang diperbarui berdasarkan nilai terbaru.'
        ]);
    }

    public function sesiAsesmenIndex(Request $request): JsonResponse
    {
        $guruId = $request->user()->guru->id_guru;

        $query = SesiAsesmen::query()->with(['kelas', 'mataPelajaran', 'detailSesiSoal']);
        $this->scopeGuruSesiAsesmen($query, $guruId);

        return response()->json(
            $query->latest('waktu_mulai')
                ->latest('id_sesi')
                ->paginate(15)
        );
    }

    public function sesiAsesmenStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_kelas' => ['required', 'integer', 'exists:kelas,id_kelas'],
            'id_mapel' => ['required', 'integer', 'exists:mata_pelajaran,id_mapel'],
            'tipe_soal' => ['required', 'string', 'max:255'],
            'jenis_asesmen' => ['required', 'in:pretest,posttest,ujian'],
            'waktu_mulai' => ['required', 'date'],
            'waktu_selesai' => ['required', 'date', 'after:waktu_mulai'],
            'durasi_menit' => ['required', 'integer', 'min:1'],
            'boleh_ulang' => ['sometimes', 'boolean'],
            'soal' => ['required', 'array', 'min:1'],
            'soal.*.id_soal' => ['required', 'integer', 'exists:bank_soal,id_soal'],
            'soal.*.bobot_nilai' => ['required', 'numeric', 'min:0'],
        ]);

        $guruId = $request->user()->guru->id_guru;
        $this->ensureGuruMengampuKelasDanMapel($guruId, (int) $data['id_kelas'], (int) $data['id_mapel']);

        $sesiAsesmen = \Illuminate\Support\Facades\DB::transaction(function () use ($data) {
            $sesi = SesiAsesmen::create([
                'id_kelas' => $data['id_kelas'],
                'id_mapel' => $data['id_mapel'],
                'tipe_soal' => $data['tipe_soal'],
                'jenis_asesmen' => $data['jenis_asesmen'],
                'waktu_mulai' => $data['waktu_mulai'],
                'waktu_selesai' => $data['waktu_selesai'],
                'durasi_menit' => $data['durasi_menit'],
                'boleh_ulang' => $data['boleh_ulang'] ?? false,
            ]);

            foreach ($data['soal'] as $soal) {
                \App\Models\DetailSesiSoal::create([
                    'id_sesi' => $sesi->id_sesi,
                    'id_soal' => $soal['id_soal'],
                    'bobot_nilai' => $soal['bobot_nilai'],
                ]);
            }

            return $sesi->load('bankSoal');
        });

        return response()->json($sesiAsesmen, 201);
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
            'kehadiran_siswa.*.jenis_badge' => ['nullable', 'string', 'max:255'],
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
                if (!empty($row['catatan_pribadi'])) {
                    CatatanPrivat::create([
                        'id_guru' => $guruId,
                        'id_siswa' => $row['id_siswa'],
                        'id_berita_acara' => $beritaAcara->id_berita_acara,
                        'tanggal' => $data['tanggal'],
                        'isi_pesan' => $row['catatan_pribadi'],
                    ]);
                }

                if (!empty($row['jenis_badge'])) {
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
            'kehadiran_siswa.*.jenis_badge' => ['nullable', 'string', 'max:255'],
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
                if (!empty($row['catatan_pribadi'])) {
                    CatatanPrivat::create([
                        'id_guru' => $guruId,
                        'id_siswa' => $row['id_siswa'],
                        'id_berita_acara' => $beritaAcara->id_berita_acara,
                        'tanggal' => $data['tanggal'],
                        'isi_pesan' => $row['catatan_pribadi'],
                    ]);
                }

                if (!empty($row['jenis_badge'])) {
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

    public function sesiAsesmenUpdate(Request $request, int $id_sesi): JsonResponse
    {
        $sesi = SesiAsesmen::findOrFail($id_sesi);

        $data = $request->validate([
            'id_kelas' => ['required', 'integer', 'exists:kelas,id_kelas'],
            'id_mapel' => ['required', 'integer', 'exists:mata_pelajaran,id_mapel'],
            'tipe_soal' => ['required', 'string', 'max:255'],
            'jenis_asesmen' => ['required', 'in:pretest,posttest,ujian'],
            'waktu_mulai' => ['required', 'date'],
            'waktu_selesai' => ['required', 'date', 'after:waktu_mulai'],
            'durasi_menit' => ['required', 'integer', 'min:1'],
            'boleh_ulang' => ['sometimes', 'boolean'],
            'soal' => ['required', 'array', 'min:1'],
            'soal.*.id_soal' => ['required', 'integer', 'exists:bank_soal,id_soal'],
            'soal.*.bobot_nilai' => ['required', 'numeric', 'min:0'],
        ]);

        $guruId = $request->user()->guru->id_guru;
        $this->ensureGuruMengampuKelasDanMapel($guruId, (int) $data['id_kelas'], (int) $data['id_mapel']);

        $sesiAsesmen = \Illuminate\Support\Facades\DB::transaction(function () use ($sesi, $data) {
            $sesi->update([
                'id_kelas' => $data['id_kelas'],
                'id_mapel' => $data['id_mapel'],
                'tipe_soal' => $data['tipe_soal'],
                'jenis_asesmen' => $data['jenis_asesmen'],
                'waktu_mulai' => $data['waktu_mulai'],
                'waktu_selesai' => $data['waktu_selesai'],
                'durasi_menit' => $data['durasi_menit'],
                'boleh_ulang' => $data['boleh_ulang'] ?? $sesi->boleh_ulang,
            ]);

            $newSoalIds = collect($data['soal'])->pluck('id_soal')->toArray();
            
            // Hapus soal yang tidak dipilih lagi (jika ada)
            \App\Models\DetailSesiSoal::where('id_sesi', $sesi->id_sesi)
                ->whereNotIn('id_soal', $newSoalIds)
                ->delete();

            // Update bobot jika soal sudah ada, buat baru jika belum ada
            foreach ($data['soal'] as $soal) {
                \App\Models\DetailSesiSoal::updateOrCreate(
                    ['id_sesi' => $sesi->id_sesi, 'id_soal' => $soal['id_soal']],
                    ['bobot_nilai' => $soal['bobot_nilai']]
                );
            }

            return $sesi->load('bankSoal');
        });

        return response()->json($sesiAsesmen);
    }

    public function sesiAsesmenDestroy(int $id_sesi): JsonResponse
    {
        $sesi = SesiAsesmen::findOrFail($id_sesi);

        try {
            $sesi->delete();
            return response()->json(null, 204);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == 23000) {
                return response()->json(['message' => 'Sesi Asesmen tidak bisa dihapus karena sudah memiliki data riwayat pengerjaan siswa.'], 400);
            }
            throw $e;
        }
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
            'jenis_badge' => ['required', 'string', 'max:255'],
            'topik_materi' => ['required', 'string', 'max:255'],
        ]);

        $data['id_guru'] = $request->user()->guru->id_guru;

        return response()->json(Apresiasi::create($data), 201);
    }

    public function analisisDiagnostikIndex(Request $request): JsonResponse
    {
        $query = AnalisisDiagnostik::query()->with(['siswa', 'sesiAsesmen.mataPelajaran', 'sesiAsesmen.kelas']);

        // Scope to teacher's classes/mapel
        $guruId = $request->user()->guru->id_guru;
        $query->whereHas('sesiAsesmen', function ($q) use ($guruId) {
            $this->scopeGuruSesiAsesmen($q, $guruId);
        });

        if ($request->filled('id_sesi')) {
            $query->where('id_sesi', $request->integer('id_sesi'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('siswa', function ($q) use ($search) {
                $q->where('nama_lengkap', 'LIKE', "%{$search}%");
            });
        }

        if ($request->filled('id_kelas') && $request->input('id_kelas') !== 'all') {
            $idKelas = $request->integer('id_kelas');
            $query->whereHas('sesiAsesmen', function ($q) use ($idKelas) {
                $q->where('id_kelas', $idKelas);
            });
        }

        if ($request->filled('tipe_soal') && $request->input('tipe_soal') !== 'all') {
            $tipeSoal = $request->input('tipe_soal');
            $query->whereHas('sesiAsesmen', function ($q) use ($tipeSoal) {
                $q->where('tipe_soal', $tipeSoal);
            });
        }

        return response()->json($query->latest('tanggal_generate')->paginate(15));
    }

    public function analisisDiagnostikShow(int $id_analisis): JsonResponse
    {
        $analisis = AnalisisDiagnostik::query()
            ->with(['siswa', 'sesiAsesmen.mataPelajaran', 'sesiAsesmen.kelas'])
            ->findOrFail($id_analisis);

        $geminiService = app(\App\Services\GeminiService::class);
        $rekapData = $geminiService->buildRekapCognitive($analisis->id_siswa, $analisis->id_sesi);

        $analisisArray = $analisis->toArray();
        $analisisArray['rekap_kognitif'] = $rekapData['rekap_level_kognitif'] ?? null;

        return response()->json(['data' => $analisisArray]);
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
            ->where(function ($q) use ($guruId) {
                $this->scopeGuruSesiAsesmen($q, $guruId);
            })
            ->where('waktu_mulai', '>=', now())
            ->orderBy('waktu_mulai')
            ->limit(5)
            ->get()
            ->map(fn(SesiAsesmen $sesi): array => [
                'title' => 'Jadwal Ujian - ' . $sesi->kelas?->nama_kelas,
                'meta' => optional($sesi->waktu_mulai)?->format('d/m/Y') . ' - ' . ucfirst($sesi->jenis_asesmen) . ' (' . $sesi->tipe_soal . ') | ' . ($sesi->mataPelajaran?->nama_mapel ?? '-'),
                'note' => 'Mulai ' . optional($sesi->waktu_mulai)?->format('H:i') . ' WIB',
            ]);

        $ujianAktifQuery = SesiAsesmen::query()->where('waktu_mulai', '>=', now());
        $this->scopeGuruSesiAsesmen($ujianAktifQuery, $guruId);

        $sesiIds = SesiAsesmen::query()->where(function ($q) use ($guruId) {
            $this->scopeGuruSesiAsesmen($q, $guruId);
        })->pluck('id_sesi');

        $ujianPerBulanRaw = SesiAsesmen::query()
            ->whereIn('id_sesi', $sesiIds)
            ->whereNotNull('waktu_mulai')
            ->whereYear('waktu_mulai', date('Y'))
            ->selectRaw(DB::getDefaultConnection() === 'sqlite' || DB::connection()->getDriverName() === 'sqlite' ? "CAST(strftime('%m', waktu_mulai) AS INTEGER) as bulan, COUNT(*) as total" : 'MONTH(waktu_mulai) as bulan, COUNT(*) as total')
            ->groupBy('bulan')
            ->pluck('total', 'bulan')
            ->toArray();
        $ujianPerBulan = [];
        $months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        for ($i = 1; $i <= 12; $i++) {
            $ujianPerBulan[] = [
                'name' => $months[$i - 1],
                'value' => $ujianPerBulanRaw[$i] ?? 0
            ];
        }

        $rataRataPerKelasRaw = \App\Models\AnalisisDiagnostik::query()
            ->join('sesi_asesmen', 'analisis_diagnostik.id_sesi', '=', 'sesi_asesmen.id_sesi')
            ->join('kelas', 'sesi_asesmen.id_kelas', '=', 'kelas.id_kelas')
            ->whereIn('sesi_asesmen.id_sesi', $sesiIds)
            ->selectRaw('kelas.nama_kelas, AVG(analisis_diagnostik.skor_total) as rata_rata')
            ->groupBy('kelas.nama_kelas')
            ->pluck('rata_rata', 'kelas.nama_kelas');
            
        $rataRataPerKelas = [];
        foreach ($rataRataPerKelasRaw as $kelas => $rata) {
            $rataRataPerKelas[] = ['name' => $kelas, 'value' => round((float)$rata, 2)];
        }

        $kognitifSoalRaw = BankSoal::query()
            ->where('created_by', $request->user()->id_pengguna)
            ->selectRaw('level_kognitif, COUNT(*) as total')
            ->groupBy('level_kognitif')
            ->pluck('total', 'level_kognitif');
            
        $kognitifSoal = collect(['C1', 'C2', 'C3', 'C4', 'C5', 'C6'])->map(function($c) use ($kognitifSoalRaw) {
            return ['name' => $c, 'value' => $kognitifSoalRaw[$c] ?? 0];
        })->filter(fn($v) => $v['value'] > 0)->values()->toArray();

        $siswaPerKelasRaw = Kelas::query()
            ->whereIn('id_kelas', $kelasIds)
            ->withCount(['kelasSiswa as total_siswa' => function($q) {
                $q->where('kelas_siswa.is_aktif', true);
            }])
            ->get();
            
        $siswaPerKelas = $siswaPerKelasRaw->map(function($k) {
            return ['name' => $k->nama_kelas, 'value' => $k->total_siswa];
        })->toArray();

        $apresiasiRaw = Apresiasi::query()->where('id_guru', $guruId)->count();
        $catatanRaw = CatatanPrivat::query()->where('id_guru', $guruId)->count();
        $apresiasi = [
            ['name' => 'Lencana/Apresiasi', 'value' => $apresiasiRaw],
            ['name' => 'Catatan Pribadi', 'value' => $catatanRaw],
        ];

        return response()->json([
            'cards' => [
                'total_kelas' => $kelasIds->count(),
                'total_bank_soal' => BankSoal::query()->where('created_by', $request->user()->id_pengguna)->count(),
                'total_penugasan' => $penugasan->count(),
                'ujian_aktif' => $ujianAktifQuery->count(),
                'total_berita_acara' => BeritaAcara::query()->where('id_guru', $guruId)->count(),
            ],
            'chart' => [
                'ujian_per_bulan' => $ujianPerBulan,
                'rata_rata_per_kelas' => $rataRataPerKelas,
                'kognitif_soal' => $kognitifSoal,
                'siswa_per_kelas' => $siswaPerKelas,
                'apresiasi' => $apresiasi,
            ],
            'upcoming_schedules' => $upcomingSchedules,
            'teaching_assignments' => $penugasan->map(fn(PenugasanPembelajaran $assignment): array => [
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

    public function analyticsData(Request $request): JsonResponse
    {
        $guruId = $request->user()->guru->id_guru;
        $id_kelas = $request->query('id_kelas');
        $id_siswa = $request->query('id_siswa');
        
        // 1. Tren Nilai Individu (jika id_siswa & id_kelas ada)
        $trenNilai = [];
        if ($id_siswa && $id_kelas) {
            $analisisSiswa = AnalisisDiagnostik::query()
                ->join('sesi_asesmen', 'analisis_diagnostik.id_sesi', '=', 'sesi_asesmen.id_sesi')
                ->join('mata_pelajaran', 'sesi_asesmen.id_mapel', '=', 'mata_pelajaran.id_mapel')
                ->where('analisis_diagnostik.id_siswa', $id_siswa)
                ->where('sesi_asesmen.id_kelas', $id_kelas)
                ->where(function ($q) use ($guruId) {
                    $this->scopeGuruSesiAsesmen($q, $guruId);
                })
                ->orderBy('sesi_asesmen.waktu_mulai', 'asc')
                ->get([
                    'analisis_diagnostik.skor_total', 
                    'sesi_asesmen.jenis_asesmen',
                    'mata_pelajaran.nama_mapel',
                    'sesi_asesmen.waktu_mulai'
                ]);

            foreach ($analisisSiswa as $js) {
                $trenNilai[] = [
                    'name' => date('d/m/y', strtotime($js->waktu_mulai)) . ' - ' . $js->nama_mapel,
                    'value' => (float) $js->skor_total,
                    'full_name' => ucfirst($js->jenis_asesmen)
                ];
            }
        }

        // 2. Ketuntasan Belajar per Kelas (semua Mapel yang diampu guru di kelas tersebut)
        $ketuntasan = [];
        if ($id_kelas) {
            // Hitung total siswa aktif di kelas ini
            $totalSiswa = \App\Models\KelasSiswa::where('id_kelas', $id_kelas)->where('is_aktif', true)->count();

            // Dapatkan KKM untuk tiap penugasan di kelas ini
            $penugasan = PenugasanPembelajaran::query()
                ->with('mataPelajaran')
                ->where('id_kelas', $id_kelas)
                ->where('id_guru', $guruId)
                ->where('is_aktif', true)
                ->get();
                
            foreach ($penugasan as $p) {
                $kkm = $p->nilai_kkm ?? 75; // Default 75
                
                // Ambil nilai terbaru tiap siswa untuk mapel ini di kelas ini
                $nilaiSiswa = AnalisisDiagnostik::query()
                    ->join('sesi_asesmen', 'analisis_diagnostik.id_sesi', '=', 'sesi_asesmen.id_sesi')
                    ->where('sesi_asesmen.id_kelas', $id_kelas)
                    ->where('sesi_asesmen.id_mapel', $p->id_mapel)
                    ->select('analisis_diagnostik.id_siswa')
                    // Mengambil rata-rata nilai per mapel untuk setiap siswa
                    ->selectRaw('AVG(analisis_diagnostik.skor_total) as rata_rata')
                    ->groupBy('analisis_diagnostik.id_siswa')
                    ->get();
                    
                $lulus = 0;
                $remedial = 0;
                
                foreach ($nilaiSiswa as $n) {
                    if ($n->rata_rata >= $kkm) {
                        $lulus++;
                    } else {
                        $remedial++;
                    }
                }
                
                $belumMengerjakan = max(0, $totalSiswa - ($lulus + $remedial));
                
                if ($totalSiswa > 0) {
                    $ketuntasan[] = [
                        'name' => $p->mataPelajaran->nama_mapel,
                        'Tuntas' => $lulus,
                        'Remedial' => $remedial,
                        'Belum Mengerjakan' => $belumMengerjakan,
                        'KKM' => $kkm
                    ];
                }
            }
        }

        return response()->json([
            'tren_nilai' => $trenNilai,
            'ketuntasan' => $ketuntasan
        ]);
    }

    public function updateKkm(Request $request, int $id_penugasan): JsonResponse
    {
        $guruId = $request->user()->guru->id_guru;
        
        $penugasan = PenugasanPembelajaran::query()
            ->where('id_guru', $guruId)
            ->findOrFail($id_penugasan);
            
        $data = $request->validate([
            'nilai_kkm' => ['required', 'integer', 'min:0', 'max:100']
        ]);
        
        $penugasan->update(['nilai_kkm' => $data['nilai_kkm']]);
        
        return response()->json([
            'message' => 'Nilai KKM berhasil diperbarui.',
            'penugasan' => $penugasan
        ]);
    }

    protected function ensureGuruMengampuMapel(int $guruId, int $idMapel): void
    {
        $exists = PenugasanPembelajaran::query()
            ->where('id_guru', $guruId)
            ->where('id_mapel', $idMapel)
            ->where('is_aktif', true)
            ->exists();

        if (!$exists) {
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

        if (!$exists) {
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
            ->map(fn($item) => (int) $item)
            ->values();

        if ($aktifSiswaIds->isEmpty()) {
            abort(response()->json([
                'message' => 'Kelas belum memiliki siswa aktif untuk dicatat pada berita acara.',
            ], 422));
        }

        $submittedIds = collect($kehadiran)
            ->pluck('id_siswa')
            ->map(fn($item) => (int) $item)
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

    protected function scopeGuruSesiAsesmen($query, int $guruId): void
    {
        $waliKelasIds = Kelas::where('id_guru_wali', $guruId)->pluck('id_kelas')->toArray();
        $penugasan = PenugasanPembelajaran::where('id_guru', $guruId)->get(['id_kelas', 'id_mapel']);

        $query->where(function ($q) use ($waliKelasIds, $penugasan) {
            if (!empty($waliKelasIds)) {
                $q->orWhereIn('sesi_asesmen.id_kelas', $waliKelasIds);
            }

            foreach ($penugasan as $tugas) {
                $q->orWhere(function ($sq) use ($tugas) {
                    $sq->where('sesi_asesmen.id_kelas', $tugas->id_kelas)
                        ->where('sesi_asesmen.id_mapel', $tugas->id_mapel);
                });
            }

            if (empty($waliKelasIds) && $penugasan->isEmpty()) {
                $q->whereRaw('1 = 0');
            }
        });
    }
}