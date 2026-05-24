<?php

namespace App\Services;

use App\Models\AnalisisDiagnostik;
use App\Models\JawabanSiswa;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class GeminiService
{
    public function generateAnalisis(int $idSiswa, int $idSesi): AnalisisDiagnostik
    {
        $rekap = $this->buildRekapCognitive($idSiswa, $idSesi);
        $skorTotal = $rekap['skor_total'];
        $prompt = $this->buildPrompt($rekap);

        $narasiKekuatan = '';
        $narasiKelemahan = '';
        $geminiBerhasil = false;

        try {
            $response = Http::timeout(60)
                ->acceptJson()
                ->post($this->geminiUrl(), [
                    'contents' => [
                        [
                            'role' => 'user',
                            'parts' => [
                                [
                                    'text' => $prompt,
                                ],
                            ],
                        ],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.4,
                        'topP' => 0.9,
                        'maxOutputTokens' => 512,
                    ],
                ]);

            if ($response->failed()) {
                throw new \RuntimeException('Gemini API gagal merespons dengan status '.$response->status());
            }

            $rawText = data_get($response->json(), 'candidates.0.content.parts.0.text', '');
            [$narasiKekuatan, $narasiKelemahan] = $this->parseGeminiResponse($rawText);
            $geminiBerhasil = true;
        } catch (Throwable $throwable) {
            Log::warning('Gemini analysis failed, saving score only.', [
                'id_siswa' => $idSiswa,
                'id_sesi' => $idSesi,
                'message' => $throwable->getMessage(),
            ]);
        }

        $existing = AnalisisDiagnostik::query()
            ->where('id_siswa', $idSiswa)
            ->where('id_sesi', $idSesi)
            ->first();

        $attributes = [
            'skor_total' => $skorTotal,
            'tanggal_generate' => now(),
        ];

        if ($geminiBerhasil) {
            $attributes['narasi_kekuatan'] = $narasiKekuatan;
            $attributes['narasi_kelemahan'] = $narasiKelemahan;
        } elseif ($existing === null) {
            $attributes['narasi_kekuatan'] = 'Analisis AI belum tersedia saat ini.';
            $attributes['narasi_kelemahan'] = 'Analisis AI belum tersedia saat ini.';
        }

        return AnalisisDiagnostik::updateOrCreate(
            [
                'id_siswa' => $idSiswa,
                'id_sesi' => $idSesi,
            ],
            $attributes
        );
    }

    public function buildRekapCognitive(int $idSiswa, int $idSesi): array
    {
        $jawaban = JawabanSiswa::query()
            ->with(['detailSesiSoal.bankSoal'])
            ->where('id_siswa', $idSiswa)
            ->whereHas('detailSesiSoal', function ($query) use ($idSesi) {
                $query->where('id_sesi', $idSesi);
            })
            ->get();

        $rekap = [
            'C1' => ['jumlah_soal' => 0, 'jumlah_benar' => 0, 'skor_diperoleh' => 0.0, 'bobot_total' => 0.0],
            'C2' => ['jumlah_soal' => 0, 'jumlah_benar' => 0, 'skor_diperoleh' => 0.0, 'bobot_total' => 0.0],
            'C3' => ['jumlah_soal' => 0, 'jumlah_benar' => 0, 'skor_diperoleh' => 0.0, 'bobot_total' => 0.0],
            'C4' => ['jumlah_soal' => 0, 'jumlah_benar' => 0, 'skor_diperoleh' => 0.0, 'bobot_total' => 0.0],
            'C5' => ['jumlah_soal' => 0, 'jumlah_benar' => 0, 'skor_diperoleh' => 0.0, 'bobot_total' => 0.0],
            'C6' => ['jumlah_soal' => 0, 'jumlah_benar' => 0, 'skor_diperoleh' => 0.0, 'bobot_total' => 0.0],
        ];

        $skorTotal = 0.0;

        foreach ($jawaban as $item) {
            $levelKognitif = data_get($item, 'detailSesiSoal.bankSoal.level_kognitif');
            if (! array_key_exists($levelKognitif, $rekap)) {
                continue;
            }

            $bobotNilai = (float) data_get($item, 'detailSesiSoal.bobot_nilai', 0);
            $skorDiperoleh = (float) $item->skor_diperoleh;
            $isCorrect = (bool) $item->is_correct;

            $rekap[$levelKognitif]['jumlah_soal']++;
            $rekap[$levelKognitif]['skor_diperoleh'] += $skorDiperoleh;
            $rekap[$levelKognitif]['bobot_total'] += $bobotNilai;
            $rekap[$levelKognitif]['jumlah_benar'] += $isCorrect ? 1 : 0;
            $skorTotal += $skorDiperoleh;
        }

        foreach ($rekap as $level => $data) {
            $rekap[$level]['persentase'] = $data['bobot_total'] > 0
                ? round(($data['skor_diperoleh'] / $data['bobot_total']) * 100, 2)
                : 0.0;
        }

        return [
            'id_siswa' => $idSiswa,
            'id_sesi' => $idSesi,
            'skor_total' => round($skorTotal, 2),
            'rekap' => $rekap,
        ];
    }

    protected function buildPrompt(array $rekapData): string
    {
        $rekapJson = json_encode($rekapData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return <<<PROMPT
Anda adalah asisten analisis diagnostik pembelajaran untuk guru SMA.

Berdasarkan data berikut, buat output singkat dan terstruktur dalam bahasa Indonesia:
- narasi_kekuatan: deskripsi singkat kelebihan pemahaman kognitif siswa pada topik tersebut.
- narasi_kelemahan: deskripsi area materi yang perlu diperbaiki.

Gunakan data berikut:
{$rekapJson}

Instruksi output:
1. Jawab hanya dalam format JSON valid.
2. Gunakan properti "narasi_kekuatan" dan "narasi_kelemahan".
3. Jangan menambahkan properti lain.
PROMPT;
    }

    protected function parseGeminiResponse(string $rawText): array
    {
        $decoded = json_decode($rawText, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return [
                trim((string) ($decoded['narasi_kekuatan'] ?? '')),
                trim((string) ($decoded['narasi_kelemahan'] ?? '')),
            ];
        }

        $narasiKekuatan = '';
        $narasiKelemahan = '';

        if (preg_match('/"narasi_kekuatan"\s*:\s*"([^"]*)"/u', $rawText, $matchKekuatan)) {
            $narasiKekuatan = trim($matchKekuatan[1]);
        }

        if (preg_match('/"narasi_kelemahan"\s*:\s*"([^"]*)"/u', $rawText, $matchKelemahan)) {
            $narasiKelemahan = trim($matchKelemahan[1]);
        }

        return [$narasiKekuatan, $narasiKelemahan];
    }

    protected function geminiUrl(): string
    {
        $apiKey = (string) env('GEMINI_API_KEY', '');
        $model = (string) env('GEMINI_MODEL', 'gemini-1.5-flash');

        return sprintf(
            'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s',
            $model,
            $apiKey
        );
    }
}
