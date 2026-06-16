<?php

namespace App\Jobs;

use App\Services\GeminiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class GenerateAnalisisDiagnostikJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Jumlah percobaan maksimal sebelum job gagal sepenuhnya.
     * @var int
     */
    public $tries = 5;

    /**
     * Waktu tunggu (detik) sebelum mencoba kembali setelah gagal.
     * @var int
     */
    public $backoff = 15;

    public function __construct(
        public readonly int $idSiswa,
        public readonly int $idSesi,
    ) {
    }

    public function handle(GeminiService $geminiService): void
    {
        try {
            $geminiService->generateAnalisis($this->idSiswa, $this->idSesi);
        } catch (Throwable $throwable) {
            Log::warning('GenerateAnalisisDiagnostikJob failed, releasing to queue.', [
                'id_siswa' => $this->idSiswa,
                'id_sesi' => $this->idSesi,
                'message' => $throwable->getMessage(),
                'attempts' => $this->attempts(),
            ]);

            // Jika masih ada percobaan tersisa, lepaskan (release) job kembali ke antrean dengan jeda 15 detik
            if ($this->attempts() < $this->tries) {
                $this->release(15);
            } else {
                Log::error('GenerateAnalisisDiagnostikJob failed permanently after max attempts.', [
                    'id_siswa' => $this->idSiswa,
                    'id_sesi' => $this->idSesi,
                    'message' => $throwable->getMessage(),
                ]);
                throw $throwable;
            }
        }
    }
}