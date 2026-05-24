<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateAnalisisDiagnostikJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Bus;
use Throwable;

class AnalisisDiagnostikController extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_siswa' => ['required', 'integer', 'exists:siswa,id_siswa'],
            'id_sesi' => ['required', 'integer', 'exists:sesi_asesmen,id_sesi'],
        ]);

        return $this->dispatchAnalysis($data['id_siswa'], $data['id_sesi']);
    }

    public function generateForCompletedSession(int $idSesi, int $idSiswa): JsonResponse
    {
        return $this->dispatchAnalysis($idSiswa, $idSesi);
    }

    protected function dispatchAnalysis(int $idSiswa, int $idSesi): JsonResponse
    {
        try {
            Bus::dispatchSync(new GenerateAnalisisDiagnostikJob($idSiswa, $idSesi));

            return response()->json([
                'message' => 'Analisis diagnostik berhasil diproses.',
                'data' => [
                    'id_siswa' => $idSiswa,
                    'id_sesi' => $idSesi,
                ],
            ]);
        } catch (Throwable $throwable) {
            return response()->json([
                'message' => 'Analisis diagnostik gagal diproses.',
                'error' => $throwable->getMessage(),
            ], 500);
        }
    }
}