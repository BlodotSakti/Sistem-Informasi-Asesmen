<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('percobaan_cbt', function (Blueprint $table) {
            $table->id('id_percobaan');
            $table->foreignId('id_sesi')->constrained('sesi_asesmen', 'id_sesi')->cascadeOnDelete();
            $table->foreignId('id_siswa')->constrained('siswa', 'id_siswa')->cascadeOnDelete();
            $table->unsignedInteger('percobaan_ke')->default(1);
            $table->decimal('total_skor', 8, 2)->default(0);
            $table->decimal('total_bobot', 8, 2)->default(0);
            $table->unsignedInteger('jumlah_soal')->default(0);
            $table->unsignedInteger('jumlah_benar')->default(0);
            $table->unsignedInteger('jumlah_salah')->default(0);
            $table->json('data_jawaban')->nullable();
            $table->timestamps();

            $table->unique(['id_siswa', 'id_sesi', 'percobaan_ke'], 'unique_siswa_sesi_percobaan');
            $table->index(['id_sesi', 'id_siswa']);
        });

        // Backfill existing completed sessions from AnalisisDiagnostik / JawabanSiswa
        try {
            $existingAnalisis = \DB::table('analisis_diagnostik')->get();
            foreach ($existingAnalisis as $analisis) {
                $sesi = \DB::table('sesi_asesmen')->where('id_sesi', $analisis->id_sesi)->first();
                if (!$sesi) continue;

                $details = \DB::table('detail_sesi_soal')->where('id_sesi', $analisis->id_sesi)->get();
                $totalBobot = $details->sum('bobot_nilai') ?: 100;
                $jumlahSoal = $details->count();

                $detailIds = $details->pluck('id_detail');
                $jawabans = \DB::table('jawaban_siswa')
                    ->where('id_siswa', $analisis->id_siswa)
                    ->whereIn('id_detail', $detailIds)
                    ->get();

                $jumlahBenar = $jawabans->where('is_correct', 1)->count();
                $jumlahSalah = max(0, $jumlahSoal - $jumlahBenar);

                \DB::table('percobaan_cbt')->insert([
                    'id_sesi' => $analisis->id_sesi,
                    'id_siswa' => $analisis->id_siswa,
                    'percobaan_ke' => 1,
                    'total_skor' => $analisis->skor_total ?? $jawabans->sum('skor_diperoleh') ?? 0,
                    'total_bobot' => $totalBobot,
                    'jumlah_soal' => $jumlahSoal,
                    'jumlah_benar' => $jumlahBenar,
                    'jumlah_salah' => $jumlahSalah,
                    'data_jawaban' => null,
                    'created_at' => $analisis->tanggal_generate ?? $analisis->created_at ?? now(),
                    'updated_at' => $analisis->updated_at ?? now(),
                ]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('PercobaanCbt migration backfill note: ' . $e->getMessage());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('percobaan_cbt');
    }
};
