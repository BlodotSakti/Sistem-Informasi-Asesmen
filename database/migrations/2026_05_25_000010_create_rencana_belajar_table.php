<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rencana_belajar', function (Blueprint $table): void {
            $table->id('id_rencana_belajar');
            $table->foreignId('id_siswa')
                ->constrained('siswa', 'id_siswa')
                ->cascadeOnDelete();
            $table->foreignId('id_mapel')
                ->constrained('mata_pelajaran', 'id_mapel')
                ->cascadeOnDelete();
            $table->enum('sumber', ['manual', 'kelas', 'guru'])->default('manual');
            $table->enum('status', ['direncanakan', 'sedang_dipelajari', 'selesai'])->default('direncanakan');
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->unique(['id_siswa', 'id_mapel']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rencana_belajar');
    }
};