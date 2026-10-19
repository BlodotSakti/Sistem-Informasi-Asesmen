<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan kolom tgate (Threshold Gate) pada bank_soal.
     * Nilai 0-100: persentase minimal skor faktual (kata kunci + matematis)
     * agar LSA diaktifkan. Default 0 = gate tidak aktif (perilaku lama tetap sama).
     */
    public function up(): void
    {
        Schema::table('bank_soal', function (Blueprint $table) {
            $table->decimal('tgate', 5, 2)->default(0.00)->after('math_weight');
        });
    }

    public function down(): void
    {
        Schema::table('bank_soal', function (Blueprint $table) {
            $table->dropColumn('tgate');
        });
    }
};
