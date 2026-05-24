<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Apresiasi;
use App\Models\AnalisisDiagnostik;
use App\Models\CatatanPrivat;
use App\Models\JawabanSiswa;
use App\Models\SesiAsesmen;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SiswaController extends Controller
{
    public function activeSessions(): JsonResponse
    {
        return response()->json(
            SesiAsesmen::query()
                ->with(['kelas', 'mataPelajaran'])
                ->where('waktu_mulai', '<=', now())
                ->latest('waktu_mulai')
                ->paginate(15)
        );
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
        $idSiswa = $request->user()->siswa->id_siswa;

        $analisis = AnalisisDiagnostik::query()
            ->where('id_siswa', $idSiswa)
            ->latest('tanggal_generate')
            ->get();

        $latestScore = $analisis->first()?->skor_total ?? 0;
        $averageScore = $analisis->avg('skor_total') ? round($analisis->avg('skor_total'), 2) : 0;

        return response()->json([
            'cards' => [
                'rata_rata' => $averageScore,
                'ujian_menunggu' => SesiAsesmen::query()->where('waktu_mulai', '>=', now())->count(),
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
        ]);
    }
}