<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalisisDiagnostik;
use App\Models\Apresiasi;
use App\Models\BankSoal;
use App\Models\BeritaAcara;
use App\Models\CatatanPrivat;
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

        $data['id_guru'] = $request->user()->guru->id_guru;

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
}