<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use Illuminate\Http\JsonResponse;

class AcademicMappingController extends Controller
{
    public function index(): JsonResponse
    {
        $kelasList = Kelas::query()
            ->with([
                'guruWali',
                'penugasanPembelajaran.mataPelajaran',
                'penugasanPembelajaran.guru',
                'kelasSiswa' => function ($query) {
                    $query->where('is_aktif', true)->with('siswa');
                }
            ])
            ->orderBy('tahun_ajaran', 'desc')
            ->orderBy('nama_kelas', 'asc')
            ->get();

        $mapping = $kelasList->map(function (Kelas $kelas) {
            $siswa = $kelas->kelasSiswa->map(fn ($ks) => [
                'id_siswa' => $ks->siswa->id_siswa,
                'nama_lengkap' => $ks->siswa->nama_lengkap,
                'nisn' => $ks->siswa->nisn,
            ])->sortBy('nama_lengkap')->values();

            $mataPelajaran = $kelas->penugasanPembelajaran->map(fn ($pp) => [
                'id_penugasan_pembelajaran' => $pp->id_penugasan_pembelajaran,
                'nama_mapel' => $pp->mataPelajaran->nama_mapel ?? null,
                'guru_pengampu' => $pp->guru->nama_lengkap ?? null,
            ])->sortBy('nama_mapel')->values();

            // Extract level from class name (e.g., "X MIPA 1" -> "X")
            $parts = explode(' ', $kelas->nama_kelas);
            $tingkat = $parts[0] ?? 'Lainnya';

            return [
                'id_kelas' => $kelas->id_kelas,
                'nama_kelas' => $kelas->nama_kelas,
                'tingkat' => $tingkat,
                'tahun_ajaran' => $kelas->tahun_ajaran,
                'guru_wali' => $kelas->guruWali->nama_lengkap ?? 'Belum ada wali kelas',
                'total_siswa' => $siswa->count(),
                'siswa' => $siswa,
                'mata_pelajaran' => $mataPelajaran,
            ];
        });

        return response()->json([
            'data' => $mapping,
        ]);
    }
}
