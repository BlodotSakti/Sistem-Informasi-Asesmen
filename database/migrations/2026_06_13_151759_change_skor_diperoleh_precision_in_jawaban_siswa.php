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
        Schema::table('jawaban_siswa', function (Blueprint $table) {
            $table->decimal('skor_diperoleh', 8, 4)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jawaban_siswa', function (Blueprint $table) {
            $table->decimal('skor_diperoleh', 8, 2)->change();
        });
    }
};
