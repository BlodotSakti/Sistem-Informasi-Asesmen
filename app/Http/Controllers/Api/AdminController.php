<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
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
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        if (! class_exists(\Maatwebsite\Excel\Facades\Excel::class)) {
            return response()->json([
                'message' => 'Fitur import Excel membutuhkan paket maatwebsite/excel.',
            ], 501);
        }

        return response()->json([
            'message' => 'Endpoint import siap, hubungkan ke class Import Excel Anda.',
        ]);
    }
}