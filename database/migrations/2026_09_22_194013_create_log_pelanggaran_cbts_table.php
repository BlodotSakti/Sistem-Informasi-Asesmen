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
        Schema::create('log_pelanggaran_cbt', function (Blueprint $table) {
            $table->id('id_log');
            $table->foreignId('id_sesi')->constrained('sesi_asesmen', 'id_sesi')->cascadeOnDelete();
            $table->foreignId('id_siswa')->constrained('siswa', 'id_siswa')->cascadeOnDelete();
            $table->string('jenis_pelanggaran', 50); // tab_switch, fullscreen_exit, right_click, copy_paste, blur
            $table->text('keterangan')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log_pelanggaran_cbt');
    }
};
