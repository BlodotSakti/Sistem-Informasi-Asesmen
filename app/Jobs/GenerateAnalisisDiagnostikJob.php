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
            Log::error('GenerateAnalisisDiagnostikJob failed.', [
                'id_siswa' => $this->idSiswa,
                'id_sesi' => $this->idSesi,
                'message' => $throwable->getMessage(),
            ]);
        }
    }
}