<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankSoal;
use App\Models\LogAktivitas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBankSoalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            BankSoal::query()
                ->with(['mataPelajaran', 'pembuat.admin', 'pembuat.guru'])
                ->latest('id_soal')
                ->get()
        );
    }

    public function store(Request $request): JsonResponse
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
        ]);

        $validator->after(function ($validator) use ($request): void {
            $jenisSoal = $request->input('jenis_soal');
            $opsi = collect($request->input('opsi_jawaban', []))->map(fn ($item) => trim((string) $item))->filter()->values();

            if ($jenisSoal === 'pilihan_ganda') {
                if ($opsi->count() < 2) {
                    $validator->errors()->add('opsi_jawaban', 'Minimal dua opsi jawaban diperlukan.');
                }
                if ($opsi->count() > 0 && ! $opsi->contains(trim((string) $request->input('kunci_jawaban')))) {
                    $validator->errors()->add('kunci_jawaban', 'Kunci jawaban harus sesuai salah satu opsi.');
                }
            } elseif ($jenisSoal === 'pilihan_ganda_kompleks') {
                if ($opsi->count() < 2) {
                    $validator->errors()->add('opsi_jawaban', 'Minimal dua opsi jawaban diperlukan.');
                }
                
                $kunciArr = $request->input('kunci_jawaban');
                if (!is_array($kunciArr) || count($kunciArr) === 0) {
                    $validator->errors()->add('kunci_jawaban', 'Minimal satu kunci jawaban diperlukan.');
                } else {
                    foreach ($kunciArr as $k) {
                        if (! $opsi->contains(trim((string) $k))) {
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

        $cleanOptions = collect($data['opsi_jawaban'] ?? [])->map(fn ($item) => trim((string) $item))->filter()->values()->all();

        if ($data['jenis_soal'] === 'esai') {
            $cleanOptions = [];
            $data['kunci_jawaban'] = trim((string) $data['kunci_jawaban']);
        } elseif ($data['jenis_soal'] === 'pilihan_ganda_kompleks') {
            $data['kunci_jawaban'] = json_encode(array_values(array_filter(array_map('trim', (array) $data['kunci_jawaban']))));
        } else {
            $data['kunci_jawaban'] = trim((string) $data['kunci_jawaban']);
        }

        $data['created_by'] = $request->user()->id_pengguna;
        $data['opsi_jawaban'] = $cleanOptions;

        $soal = BankSoal::create($data);
        $namaMapel = $soal->mataPelajaran->nama_lengkap ?? "ID {$data['id_mapel']}";

        LogAktivitas::create([
            'id_pengguna_aktor' => request()->user()->id_pengguna,
            'tipe_aksi' => 'Buat Soal',
            'deskripsi' => "Admin membuat 1 soal baru secara manual untuk mata pelajaran {$namaMapel}.",
        ]);

        return response()->json($soal, 201);
    }

    public function update(Request $request, int $id_soal): JsonResponse
    {
        $bankSoal = BankSoal::query()->findOrFail($id_soal);

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
        ]);

        $validator->after(function ($validator) use ($request): void {
            $jenisSoal = $request->input('jenis_soal');
            $opsi = collect($request->input('opsi_jawaban', []))->map(fn ($item) => trim((string) $item))->filter()->values();

            if ($jenisSoal === 'pilihan_ganda') {
                if ($opsi->count() < 2) {
                    $validator->errors()->add('opsi_jawaban', 'Minimal dua opsi jawaban diperlukan.');
                }
                if ($opsi->count() > 0 && ! $opsi->contains(trim((string) $request->input('kunci_jawaban')))) {
                    $validator->errors()->add('kunci_jawaban', 'Kunci jawaban harus sesuai salah satu opsi.');
                }
            } elseif ($jenisSoal === 'pilihan_ganda_kompleks') {
                if ($opsi->count() < 2) {
                    $validator->errors()->add('opsi_jawaban', 'Minimal dua opsi jawaban diperlukan.');
                }
                $kunciArr = $request->input('kunci_jawaban');
                if (!is_array($kunciArr) || count($kunciArr) === 0) {
                    $validator->errors()->add('kunci_jawaban', 'Minimal satu kunci jawaban diperlukan.');
                } else {
                    foreach ($kunciArr as $k) {
                        if (! $opsi->contains(trim((string) $k))) {
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

        $cleanOptions = collect($data['opsi_jawaban'] ?? [])->map(fn ($item) => trim((string) $item))->filter()->values()->all();

        if ($data['jenis_soal'] === 'esai') {
            $cleanOptions = [];
            $data['kunci_jawaban'] = trim((string) $data['kunci_jawaban']);
        } elseif ($data['jenis_soal'] === 'pilihan_ganda_kompleks') {
            $data['kunci_jawaban'] = json_encode(array_values(array_filter(array_map('trim', (array) $data['kunci_jawaban']))));
        } else {
            $data['kunci_jawaban'] = trim((string) $data['kunci_jawaban']);
        }

        $data['opsi_jawaban'] = $cleanOptions;

        $bankSoal->update($data);

        return response()->json($bankSoal->fresh(['mataPelajaran', 'pembuat']));
    }

    public function destroy(Request $request, int $id_soal): JsonResponse
    {
        $bankSoal = BankSoal::query()->findOrFail($id_soal);

        try {
            $gambar_soal = $bankSoal->gambar_soal;
            $bankSoal->delete();
            if ($gambar_soal) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($gambar_soal);
            }
            return response()->json(['message' => 'Soal berhasil dihapus.']);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') {
                return response()->json(['message' => 'Soal tidak dapat dihapus karena sudah digunakan.'], 400);
            }
            throw $e;
        }
    }

    public function bulkStore(Request $request): JsonResponse
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

        $penggunaId = $request->user()->id_pengguna;

        $created = [];
        foreach ($data['soal'] as $soal) {
            $soal['created_by'] = $penggunaId;
            $soal['id_mapel'] = $data['id_mapel'];
            
            if ($soal['jenis_soal'] === 'esai') {
                $soal['opsi_jawaban'] = [];
            }
            if ($soal['jenis_soal'] === 'pilihan_ganda_kompleks' && is_string($soal['kunci_jawaban'])) {
                $soal['kunci_jawaban'] = json_encode(array_values(array_filter(array_map('trim', explode(',', $soal['kunci_jawaban'])))));
            }
            
            $soal['rule_weight'] = $soal['rule_weight'] ?? 0;
            $soal['lsa_weight'] = $soal['lsa_weight'] ?? 0;
            
            $created[] = BankSoal::create($soal);
        }

        $mapel = \App\Models\MataPelajaran::find($data['id_mapel']);
        $namaMapel = $mapel ? $mapel->nama_lengkap : "ID {$data['id_mapel']}";

        LogAktivitas::create([
            'id_pengguna_aktor' => $penggunaId,
            'tipe_aksi' => 'Import Soal',
            'deskripsi' => "Admin mengimpor " . count($created) . " soal baru dari file Excel/CSV untuk mata pelajaran {$namaMapel}.",
        ]);

        return response()->json(['message' => count($created) . ' soal berhasil diimport.', 'data' => $created], 201);
    }
}
