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
        $prompt = $this->buildPrompt($rekap['rekap_level_kognitif'], $rekap['rekap_topik_materi'] ?? []);

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
                    'maxOutputTokens' => 2048,
                ],
            ]);

        if ($response->failed()) {
            Log::error('Gemini API Error Body: ' . $response->body());
            
            // Fallback generation logic if Gemini API is unavailable
            [$narasiKekuatan, $narasiKelemahan] = $this->generateFallbackAnalisis($rekap['rekap_level_kognitif'], $rekap['rekap_topik_materi']);
        } else {
            $rawText = '';
            $parts = data_get($response->json(), 'candidates.0.content.parts', []);
            
            foreach ($parts as $part) {
                if (isset($part['text']) && !isset($part['thought'])) {
                    $rawText = $part['text'];
                }
            }
            
            if (empty($rawText)) {
                $rawText = data_get($response->json(), 'candidates.0.content.parts.0.text', '');
            }

            Log::info('Gemini raw response', ['id_siswa' => $idSiswa, 'id_sesi' => $idSesi, 'raw' => mb_substr($rawText, 0, 500)]);

            [$narasiKekuatan, $narasiKelemahan] = $this->parseGeminiResponse($rawText);

            if (empty($narasiKekuatan) && empty($narasiKelemahan)) {
                [$narasiKekuatan, $narasiKelemahan] = $this->generateFallbackAnalisis($rekap['rekap_level_kognitif'], $rekap['rekap_topik_materi']);
            }
        }

        $existing = AnalisisDiagnostik::query()
            ->where('id_siswa', $idSiswa)
            ->where('id_sesi', $idSesi)
            ->first();

        // Gunakan skor_total dari tabel jika sudah ada (karena cbtSubmit sudah menyimpannya instan)
        $attributes = [
            'skor_total' => $existing ? $existing->skor_total : $skorTotal,
            'tanggal_generate' => now(),
            'narasi_kekuatan' => $narasiKekuatan,
            'narasi_kelemahan' => $narasiKelemahan,
        ];

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

        $rekapTopik = [];

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
            
            $topikMateri = data_get($item, 'detailSesiSoal.bankSoal.topik_materi', 'Umum');
            if (!isset($rekapTopik[$topikMateri])) {
                $rekapTopik[$topikMateri] = ['jumlah_soal' => 0, 'jumlah_benar' => 0, 'skor_diperoleh' => 0.0, 'bobot_total' => 0.0];
            }
            $rekapTopik[$topikMateri]['jumlah_soal']++;
            $rekapTopik[$topikMateri]['skor_diperoleh'] += $skorDiperoleh;
            $rekapTopik[$topikMateri]['bobot_total'] += $bobotNilai;
            $rekapTopik[$topikMateri]['jumlah_benar'] += $isCorrect ? 1 : 0;

            $skorTotal += $skorDiperoleh;
        }

        foreach ($rekap as $level => $data) {
            $rekap[$level]['persentase'] = $data['bobot_total'] > 0
                ? round(($data['skor_diperoleh'] / $data['bobot_total']) * 100, 2)
                : 0.0;
        }

        foreach ($rekapTopik as $topik => $data) {
            $rekapTopik[$topik]['persentase'] = $data['bobot_total'] > 0
                ? round(($data['skor_diperoleh'] / $data['bobot_total']) * 100, 2)
                : 0.0;
        }

        return [
            'id_siswa' => $idSiswa,
            'id_sesi' => $idSesi,
            'skor_total' => round($skorTotal, 2),
            'rekap_level_kognitif' => $rekap,
            'rekap_topik_materi' => $rekapTopik,
        ];
    }

    protected function buildPrompt(array $rekapKognitif, array $rekapTopik = []): string
    {
        $kognitifJson = json_encode($rekapKognitif, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $topikJson = json_encode($rekapTopik, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return <<<PROMPT
Anda adalah asisten analisis diagnostik pembelajaran untuk siswa SMA. Tugas Anda adalah memberikan umpan balik personal.

DATA CAPAIAN PER LEVEL KOGNITIF (Taksonomi Bloom C1-C6):
{$kognitifJson}

DATA CAPAIAN PER TOPIK MATERI:
{$topikJson}

KETERANGAN LEVEL KOGNITIF:
- C1 = Mengingat
- C2 = Memahami
- C3 = Menerapkan/Mengaplikasikan
- C4 = Menganalisis
- C5 = Mengevaluasi
- C6 = Mencipta

BUAT OUTPUT DENGAN ATURAN BERIKUT:
1. Buat properti "narasi_kekuatan": Narasi 2-4 kalimat tentang kelebihan siswa. Sebutkan secara spesifik Level Kognitif DAN Topik Materi mana yang dikuasai. Gunakan nada positif dan membangun.
2. Buat properti "narasi_kelemahan": Narasi 2-4 kalimat tentang area yang perlu ditingkatkan. Sebutkan secara spesifik Level Kognitif DAN Topik Materi yang perlu diperbaiki. Berikan saran konkret dan motivasi.
3. Jika semua persentase 100%, pada narasi_kelemahan tetap beri motivasi untuk mempertahankan kemampuan.
4. Jika semua persentase 0%, pada narasi_kekuatan tetap beri semangat dan motivasi belajar.
5. JANGAN menggunakan markdown code blocks. Jawab HANYA dalam JSON murni.
6. Gunakan HANYA properti "narasi_kekuatan" dan "narasi_kelemahan".
PROMPT;
    }

    protected function parseGeminiResponse(string $rawText): array
    {
        // Bersihkan markdown code blocks jika ada (```json ... ```)
        $cleanText = preg_replace('/^```json\s*/ui', '', trim($rawText));
        $cleanText = preg_replace('/```$/u', '', trim($cleanText));
        $cleanText = trim($cleanText);

        $decoded = json_decode($cleanText, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return [
                trim((string) ($decoded['narasi_kekuatan'] ?? '')),
                trim((string) ($decoded['narasi_kelemahan'] ?? '')),
            ];
        }

        $narasiKekuatan = '';
        $narasiKelemahan = '';

        // Fallback parsing dengan regex jika JSON masih tidak valid
        if (preg_match('/"narasi_kekuatan"\s*:\s*"([^"]*)"/is', $rawText, $matchKekuatan)) {
            $narasiKekuatan = trim(str_replace('\"', '"', $matchKekuatan[1]));
        }

        if (preg_match('/"narasi_kelemahan"\s*:\s*"([^"]*)"/is', $rawText, $matchKelemahan)) {
            $narasiKelemahan = trim(str_replace('\"', '"', $matchKelemahan[1]));
        }

        return [$narasiKekuatan, $narasiKelemahan];
    }

    protected function generateFallbackAnalisis(array $rekapKognitif, array $rekapTopik): array
    {
        $kekuatan = [];
        $kelemahan = [];

        foreach ($rekapKognitif as $level => $data) {
            if ($data['jumlah_soal'] > 0) {
                if ($data['persentase'] >= 75) {
                    $kekuatan[] = "kemampuan kognitif level {$level}";
                } elseif ($data['persentase'] < 50) {
                    $kelemahan[] = "kemampuan kognitif level {$level}";
                }
            }
        }

        foreach ($rekapTopik as $topik => $data) {
            if ($data['jumlah_soal'] > 0) {
                if ($data['persentase'] >= 75) {
                    $kekuatan[] = "penguasaan topik {$topik}";
                } elseif ($data['persentase'] < 50) {
                    $kelemahan[] = "penguasaan topik {$topik}";
                }
            }
        }

        $narasiKekuatan = !empty($kekuatan) 
            ? "Berdasarkan data sistem, Anda menunjukkan pemahaman yang sangat baik pada " . implode(', ', $kekuatan) . ". Terus pertahankan prestasi ini!" 
            : "Anda telah berusaha menyelesaikan asesmen dengan baik, namun perlu lebih banyak latihan agar pemahamannya lebih mantap.";
        
        $narasiKelemahan = !empty($kelemahan) 
            ? "Anda perlu meningkatkan fokus dan berlatih lebih banyak pada " . implode(', ', $kelemahan) . ". Disarankan untuk mengulang kembali materi terkait." 
            : "Anda sudah menguasai sebagian besar materi, namun disarankan untuk terus berlatih soal-soal bervariasi.";

        return [$narasiKekuatan, $narasiKelemahan];
    }

    protected function geminiUrl(): string
    {
        $apiKey = (string) env('GEMINI_API_KEY', '');
        $model = (string) env('GEMINI_MODEL', 'gemini-3.5-flash');

        return sprintf(
            'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s',
            $model,
            $apiKey
        );
    }
}
