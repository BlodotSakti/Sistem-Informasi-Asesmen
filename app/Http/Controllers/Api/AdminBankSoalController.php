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
            'paket_soal' => ['nullable', 'string', 'max:100'],
            'level_kognitif' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'opsi_jawaban' => ['nullable', 'array'],
            'opsi_jawaban.*' => ['nullable', 'string', 'max:255'],
            'gambar_soal' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'audio_soal' => ['nullable', 'file', 'mimes:mp3,wav,m4a,ogg,aac,webm,mp4,mpeg', 'max:10240'],
            'batas_putar_audio' => ['nullable', 'integer', 'min:0', 'max:20'],
            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['string'],
            'rule_weight' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'lsa_weight' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'math_steps' => ['nullable', 'array'],
            'math_steps.*' => ['string'],
            'math_weight' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'tgate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'required_keywords_count' => ['nullable', 'integer', 'min:1'],
        ], [
            'gambar_soal.max' => 'Ukuran berkas gambar pendukung tidak boleh melebihi 2 MB.',
            'gambar_soal.mimes' => 'Format berkas gambar harus berupa JPG, JPEG, PNG, atau WEBP.',
            'gambar_soal.image' => 'Berkas gambar pendukung harus berupa gambar yang valid.',
            'audio_soal.max' => 'Ukuran berkas audio pendukung tidak boleh melebihi 10 MB.',
            'audio_soal.mimes' => 'Format berkas audio harus berupa MP3, WAV, M4A, OGG, atau AAC.',
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
            $data['gambar_soal'] = BankSoal::fileToDataUri($request->file('gambar_soal'));
        }

        if ($request->hasFile('audio_soal')) {
            $data['audio_soal'] = BankSoal::fileToDataUri($request->file('audio_soal'));
        }
        $data['batas_putar_audio'] = !empty($data['batas_putar_audio']) && (int) $data['batas_putar_audio'] > 0 ? (int) $data['batas_putar_audio'] : null;

        $cleanOptions = collect($data['opsi_jawaban'] ?? [])->map(fn ($item) => trim((string) $item))->filter()->values()->all();

        if ($data['jenis_soal'] === 'esai') {
            $cleanOptions = [];
            $data['kunci_jawaban'] = trim((string) $data['kunci_jawaban']);
            $data['keywords'] = array_values(array_filter(array_map('trim', $data['keywords'] ?? [])));
            $data['rule_weight'] = $data['rule_weight'] ?? 0.50;
            $data['lsa_weight'] = $data['lsa_weight'] ?? 0.50;
            $data['math_steps'] = array_values(array_filter(array_map('trim', $data['math_steps'] ?? [])));
            $data['math_weight'] = $data['math_weight'] ?? 0.00;
            $data['tgate'] = $data['tgate'] ?? 0.00;
            $data['required_keywords_count'] = !empty($data['required_keywords_count']) ? (int) $data['required_keywords_count'] : null;
        } elseif ($data['jenis_soal'] === 'pilihan_ganda_kompleks') {
            $data['kunci_jawaban'] = json_encode(array_values(array_filter(array_map('trim', (array) $data['kunci_jawaban']))));
        } else {
            $data['kunci_jawaban'] = trim((string) $data['kunci_jawaban']);
        }

        $data['created_by'] = $request->user()->id_pengguna;
        $data['opsi_jawaban'] = $cleanOptions;
        $data['paket_soal'] = isset($data['paket_soal']) && trim((string) $data['paket_soal']) !== '' ? trim((string) $data['paket_soal']) : null;

        $soal = BankSoal::create($data);
        $namaMapel = $soal->mataPelajaran->nama_lengkap ?? "ID {$data['id_mapel']}";

        LogAktivitas::create([
            'id_pengguna_aktor' => $request->user()->id_pengguna,
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
            'paket_soal' => ['nullable', 'string', 'max:100'],
            'level_kognitif' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'opsi_jawaban' => ['nullable', 'array'],
            'opsi_jawaban.*' => ['nullable', 'string', 'max:255'],
            'gambar_soal' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'audio_soal' => ['nullable', 'file', 'mimes:mp3,wav,m4a,ogg,aac,webm,mp4,mpeg', 'max:10240'],
            'batas_putar_audio' => ['nullable', 'integer', 'min:0', 'max:20'],
            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['string'],
            'rule_weight' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'lsa_weight' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'math_steps' => ['nullable', 'array'],
            'math_steps.*' => ['string'],
            'math_weight' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'tgate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'required_keywords_count' => ['nullable', 'integer', 'min:1'],
        ], [
            'gambar_soal.max' => 'Ukuran berkas gambar pendukung tidak boleh melebihi 2 MB.',
            'gambar_soal.mimes' => 'Format berkas gambar harus berupa JPG, JPEG, PNG, atau WEBP.',
            'gambar_soal.image' => 'Berkas gambar pendukung harus berupa gambar yang valid.',
            'audio_soal.max' => 'Ukuran berkas audio pendukung tidak boleh melebihi 10 MB.',
            'audio_soal.mimes' => 'Format berkas audio harus berupa MP3, WAV, M4A, OGG, atau AAC.',
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
            if ($bankSoal->gambar_soal && !str_starts_with($bankSoal->gambar_soal, 'data:')) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($bankSoal->gambar_soal);
            }
            $data['gambar_soal'] = BankSoal::fileToDataUri($request->file('gambar_soal'));
        } elseif ($request->input('hapus_gambar') === 'true') {
            if ($bankSoal->gambar_soal && !str_starts_with($bankSoal->gambar_soal, 'data:')) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($bankSoal->gambar_soal);
            }
            $data['gambar_soal'] = null;
        } else {
            unset($data['gambar_soal']);
        }

        if ($request->hasFile('audio_soal')) {
            if ($bankSoal->audio_soal && !str_starts_with($bankSoal->audio_soal, 'data:')) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($bankSoal->audio_soal);
            }
            $data['audio_soal'] = BankSoal::fileToDataUri($request->file('audio_soal'));
        } elseif ($request->input('hapus_audio') === 'true') {
            if ($bankSoal->audio_soal && !str_starts_with($bankSoal->audio_soal, 'data:')) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($bankSoal->audio_soal);
            }
            $data['audio_soal'] = null;
            $data['batas_putar_audio'] = null;
        } else {
            unset($data['audio_soal']);
        }

        if (array_key_exists('batas_putar_audio', $data) && ($data['audio_soal'] ?? $bankSoal->audio_soal)) {
            $data['batas_putar_audio'] = !empty($data['batas_putar_audio']) && (int) $data['batas_putar_audio'] > 0 ? (int) $data['batas_putar_audio'] : null;
        }

        $cleanOptions = collect($data['opsi_jawaban'] ?? [])->map(fn ($item) => trim((string) $item))->filter()->values()->all();

        if ($data['jenis_soal'] === 'esai') {
            $cleanOptions = [];
            $data['kunci_jawaban'] = trim((string) $data['kunci_jawaban']);
            $data['keywords'] = array_values(array_filter(array_map('trim', $data['keywords'] ?? [])));
            $data['rule_weight'] = $data['rule_weight'] ?? 0.50;
            $data['lsa_weight'] = $data['lsa_weight'] ?? 0.50;
            $data['math_steps'] = array_values(array_filter(array_map('trim', $data['math_steps'] ?? [])));
            $data['math_weight'] = $data['math_weight'] ?? 0.00;
            $data['tgate'] = $data['tgate'] ?? 0.00;
            $data['required_keywords_count'] = !empty($data['required_keywords_count']) ? (int) $data['required_keywords_count'] : null;
        } elseif ($data['jenis_soal'] === 'pilihan_ganda_kompleks') {
            $data['kunci_jawaban'] = json_encode(array_values(array_filter(array_map('trim', (array) $data['kunci_jawaban']))));
        } else {
            $data['kunci_jawaban'] = trim((string) $data['kunci_jawaban']);
        }

        $data['opsi_jawaban'] = $cleanOptions;
        $data['paket_soal'] = isset($data['paket_soal']) && trim((string) $data['paket_soal']) !== '' ? trim((string) $data['paket_soal']) : null;

        $bankSoal->update($data);

        return response()->json($bankSoal->fresh(['mataPelajaran', 'pembuat']));
    }

    public function destroy(Request $request, int $id_soal): JsonResponse
    {
        $bankSoal = BankSoal::query()->findOrFail($id_soal);

        try {
            $gambar_soal = $bankSoal->gambar_soal;
            $audio_soal = $bankSoal->audio_soal;
            $bankSoal->delete();
            if ($gambar_soal && !str_starts_with($gambar_soal, 'data:')) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($gambar_soal);
            }
            if ($audio_soal && !str_starts_with($audio_soal, 'data:')) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($audio_soal);
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
            'soal.*.paket_soal' => ['nullable', 'string', 'max:100'],
            'soal.*.level_kognitif' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'soal.*.opsi_jawaban' => ['nullable', 'array'],
            'soal.*.keywords' => ['nullable', 'array'],
            'soal.*.rule_weight' => ['nullable', 'numeric'],
            'soal.*.lsa_weight' => ['nullable', 'numeric'],
            'soal.*.math_steps' => ['nullable', 'array'],
            'soal.*.math_weight' => ['nullable', 'numeric'],
            'soal.*.tgate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'soal.*.required_keywords_count' => ['nullable', 'integer', 'min:1'],
            'soal.*.gambar_soal_base64' => ['nullable', 'string'],
        ]);

        $penggunaId = $request->user()->id_pengguna;

        $created = [];
        $errors = [];

        foreach ($data['soal'] as $index => $soal) {
            $soal['created_by'] = $penggunaId;
            $soal['id_mapel'] = $data['id_mapel'];

            if (!empty($soal['gambar_soal_base64'])) {
                if (preg_match('/^data:image\/(png|jpe?g|webp);base64,(.+)$/i', $soal['gambar_soal_base64'], $matches)) {
                    $binary = base64_decode($matches[2], true);
                    if ($binary === false) {
                        $errors[] = "Baris " . ($index + 2) . ": Data gambar pendukung tidak valid.";
                    } elseif (strlen($binary) > 2 * 1024 * 1024) {
                        $errors[] = "Baris " . ($index + 2) . ": Ukuran gambar pendukung melebihi 2 MB.";
                    } else {
                        $soal['gambar_soal'] = $soal['gambar_soal_base64'];
                    }
                } else {
                    $errors[] = "Baris " . ($index + 2) . ": Format gambar pendukung harus JPG, JPEG, PNG, atau WEBP.";
                }
            }
            unset($soal['gambar_soal_base64']);

            if ($soal['jenis_soal'] === 'esai') {
                $soal['opsi_jawaban'] = [];
            } else {
                $opsiJawaban = collect($soal['opsi_jawaban'] ?? [])->map(fn($val) => trim((string) $val));

                if ($soal['jenis_soal'] === 'pilihan_ganda_kompleks') {
                    $kunciArr = is_string($soal['kunci_jawaban'])
                        ? array_values(array_filter(array_map('trim', explode(',', $soal['kunci_jawaban']))))
                        : (array) $soal['kunci_jawaban'];

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

            $isEsaiWithoutWeights = ($soal['jenis_soal'] ?? '') === 'esai'
                && !isset($soal['rule_weight'])
                && !isset($soal['lsa_weight'])
                && !isset($soal['math_weight']);
            $soal['rule_weight'] = $soal['rule_weight'] ?? ($isEsaiWithoutWeights ? 0.50 : 0);
            $soal['lsa_weight'] = $soal['lsa_weight'] ?? ($isEsaiWithoutWeights ? 0.50 : 0);
            $soal['math_steps'] = $soal['math_steps'] ?? null;
            $soal['math_weight'] = $soal['math_weight'] ?? 0;
            $soal['tgate'] = $soal['tgate'] ?? 0;
            $soal['required_keywords_count'] = !empty($soal['required_keywords_count']) ? (int) $soal['required_keywords_count'] : null;
            $soal['paket_soal'] = isset($soal['paket_soal']) && trim((string) $soal['paket_soal']) !== '' ? trim((string) $soal['paket_soal']) : null;

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

        $mapel = \App\Models\MataPelajaran::find($data['id_mapel']);
        $namaMapel = $mapel ? $mapel->nama_lengkap : "ID {$data['id_mapel']}";

        LogAktivitas::create([
            'id_pengguna_aktor' => $penggunaId,
            'tipe_aksi' => 'Import Soal',
            'deskripsi' => "Admin mengimpor " . count($inserted) . " soal baru dari file Excel/CSV untuk mata pelajaran {$namaMapel}.",
        ]);

        return response()->json(['message' => count($inserted) . ' soal berhasil diimport.', 'data' => $inserted], 201);
    }
}
