<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penugasan_pembelajaran', function (Blueprint $table): void {
            $table->id('id_penugasan_pembelajaran');
            $table->foreignId('id_kelas')
                ->constrained('kelas', 'id_kelas')
                ->cascadeOnDelete();
            $table->foreignId('id_mapel')
                ->constrained('mata_pelajaran', 'id_mapel')
                ->cascadeOnDelete();
            $table->foreignId('id_guru')
                ->constrained('guru', 'id_guru')
                ->cascadeOnDelete();
            $table->string('tahun_ajaran');
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();

            $table->unique(['id_kelas', 'id_mapel', 'id_guru', 'tahun_ajaran'], 'penugasan_pembelajaran_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penugasan_pembelajaran');
    }
};