<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\JawabanSiswa;
use App\Models\AnalisisDiagnostik;
use App\Http\Controllers\Api\SiswaController;
use Illuminate\Support\Facades\DB;

class RecalculatePgKompleksScores extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'assessment:recalculate-pg-kompleks {--dry-run : Simulasi tanpa menyimpan perubahan ke database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Menghitung ulang skor dan status kebenaran jawaban pilihan ganda kompleks dengan aturan exact match (semua benar, tidak kurang tidak lebih)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = (bool) $this->option('dry-run');

        if ($isDryRun) {
            $this->info("=== MODE DRY RUN (TIDAK ADA PERUBAHAN KE DATABASE) ===");
        } else {
            $this->info("=== REKALKULASI NILAI PILIHAN GANDA KOMPLEKS (EXACT MATCH) ===");
        }

        $controller = new SiswaController();

        $jawabanList = JawabanSiswa::whereHas('detailSesiSoal.bankSoal', function ($q) {
            $q->where('jenis_soal', 'pilihan_ganda_kompleks');
        })
        ->with(['detailSesiSoal.bankSoal'])
        ->get();

        $this->line("Ditemukan " . $jawabanList->count() . " jawaban siswa untuk soal PG Kompleks.\n");

        $changedAnswers = 0;
        $affectedSessions = []; // key: "$idSiswa-$idSesi" => ['id_siswa' => $idSiswa, 'id_sesi' => $idSesi]

        DB::beginTransaction();

        try {
            foreach ($jawabanList as $jawaban) {
                $detail = $jawaban->detailSesiSoal;
                $bankSoal = $detail?->bankSoal;
                if (!$bankSoal) {
                    continue;
                }

                $bobot = (float) $detail->bobot_nilai;
                $eval = $controller->evaluatePgKompleks($bankSoal->kunci_jawaban, $jawaban->teks_jawaban, $bobot);

                $oldIsCorrect = (bool) $jawaban->is_correct;
                $oldSkor = (float) $jawaban->skor_diperoleh;

                $isDifferent = ($oldIsCorrect !== $eval['is_correct']) || (abs($oldSkor - $eval['skor_diperoleh']) > 0.001);

                if ($isDifferent) {
                    $changedAnswers++;
                    $this->warn(sprintf(
                        "Jawaban ID %d (Siswa ID: %d, Sesi ID: %d):\n  - Kunci: %s\n  - Jawab: %s\n  - Sebelum: is_correct=%s, skor=%.2f\n  - Sesudah: is_correct=%s, skor=%.2f",
                        $jawaban->id_jawaban,
                        $jawaban->id_siswa,
                        $detail->id_sesi,
                        $bankSoal->kunci_jawaban,
                        $jawaban->teks_jawaban ?: '(kosong)',
                        $oldIsCorrect ? 'true' : 'false',
                        $oldSkor,
                        $eval['is_correct'] ? 'true' : 'false',
                        $eval['skor_diperoleh']
                    ));

                    if (!$isDryRun) {
                        $jawaban->update([
                            'is_correct' => $eval['is_correct'],
                            'skor_diperoleh' => $eval['skor_diperoleh'],
                        ]);
                    }

                    if ($detail->id_sesi) {
                        $key = "{$jawaban->id_siswa}-{$detail->id_sesi}";
                        $affectedSessions[$key] = [
                            'id_siswa' => $jawaban->id_siswa,
                            'id_sesi' => $detail->id_sesi,
                        ];
                    }
                }
            }

            // Update Analisis Diagnostik total skor for affected sessions
            $updatedAnalisisCount = 0;
            if (!$isDryRun && count($affectedSessions) > 0) {
                foreach ($affectedSessions as $sess) {
                    $siswaId = $sess['id_siswa'];
                    $sesiId = $sess['id_sesi'];

                    $newTotalSkor = JawabanSiswa::where('id_siswa', $siswaId)
                        ->whereHas('detailSesiSoal', function ($q) use ($sesiId) {
                            $q->where('id_sesi', $sesiId);
                        })
                        ->sum('skor_diperoleh');

                    $analisis = AnalisisDiagnostik::where('id_siswa', $siswaId)
                        ->where('id_sesi', $sesiId)
                        ->first();

                    if ($analisis) {
                        $analisis->update([
                            'skor_total' => $newTotalSkor,
                        ]);
                        $updatedAnalisisCount++;
                        $this->info("Analisis Diagnostik Siswa ID {$siswaId} (Sesi {$sesiId}) diupdate ke skor_total: {$newTotalSkor}");
                    }
                }
            }

            if ($isDryRun) {
                DB::rollBack();
                $this->info("\n[DRY RUN SELESAI] Total jawaban yang akan berubah: {$changedAnswers}. Sesi terdampak: " . count($affectedSessions));
            } else {
                DB::commit();
                $this->info("\n[SELESAI] Berhasil memperbarui {$changedAnswers} jawaban siswa dan {$updatedAnalisisCount} record analisis diagnostik.");
            }

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error("Gagal melakukan rekalkulasi: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
