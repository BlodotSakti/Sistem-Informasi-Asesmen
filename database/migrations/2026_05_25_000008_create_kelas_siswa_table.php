<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kelas_siswa', function (Blueprint $table): void {
            $table->id('id_kelas_siswa');
            $table->foreignId('id_kelas')
                ->constrained('kelas', 'id_kelas')
                ->cascadeOnDelete();
            $table->foreignId('id_siswa')
                ->constrained('siswa', 'id_siswa')
                ->cascadeOnDelete();
            $table->string('tahun_ajaran');
            $table->boolean('is_aktif')->default(true);
            $table->date('tanggal_masuk')->nullable();
            $table->date('tanggal_keluar')->nullable();
            $table->timestamps();

            $table->unique(['id_kelas', 'id_siswa', 'tahun_ajaran']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kelas_siswa');
    }
};