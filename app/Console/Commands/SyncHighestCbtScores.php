<?php

namespace App\Console\Commands;

use App\Models\PercobaanCbt;
use App\Models\AnalisisDiagnostik;
use App\Jobs\GenerateAnalisisDiagnostikJob;
use Illuminate\Console\Command;

class SyncHighestCbtScores extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cbt:sync-highest-scores {--dispatch-ai : Dispatch AI diagnostic job for updated sessions}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sinkronisasi nilai dan jawaban sesi CBT multi-attempt agar menggunakan percobaan tertinggi';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Memeriksa riwayat percobaan CBT...');

        $distinctPairs = PercobaanCbt::select('id_siswa', 'id_sesi')
            ->distinct()
            ->get();

        $updatedCount = 0;

        foreach ($distinctPairs as $pair) {
            $highest = PercobaanCbt::syncHighestAttempt($pair->id_siswa, $pair->id_sesi);
            if ($highest) {
                $this->line("Siswa ID: {$pair->id_siswa}, Sesi ID: {$pair->id_sesi} -> Percobaan tertinggi: ke-{$highest->percobaan_ke} (Skor: {$highest->total_skor})");
                $updatedCount++;

                if ($this->option('dispatch-ai')) {
                    GenerateAnalisisDiagnostikJob::dispatch($pair->id_siswa, $pair->id_sesi);
                }
            }
        }

        $this->info("Berhasil menyinkronkan {$updatedCount} sesi siswa ke nilai tertinggi.");
        return 0;
    }
}
