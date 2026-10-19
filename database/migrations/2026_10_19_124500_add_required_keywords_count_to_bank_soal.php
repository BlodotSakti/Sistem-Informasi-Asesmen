<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan kolom required_keywords_count pada bank_soal.
     * Jika diisi (misal: 5), siswa yang berhasil menyebutkan minimal 5 dari N opsi kata kunci
     * akan mendapatkan nilai 100% pada aspek rule-based.
     * Default null = seluruh kata kunci harus ada.
     */
    public function up(): void
    {
        Schema::table('bank_soal', function (Blueprint $table) {
            $table->unsignedInteger('required_keywords_count')->nullable()->after('tgate');
        });
    }

    public function down(): void
    {
        Schema::table('bank_soal', function (Blueprint $table) {
            $table->dropColumn('required_keywords_count');
        });
    }
};
