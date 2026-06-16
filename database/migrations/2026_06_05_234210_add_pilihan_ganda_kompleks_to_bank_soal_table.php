<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE bank_soal MODIFY COLUMN jenis_soal ENUM('pilihan_ganda', 'esai', 'pilihan_ganda_kompleks') NOT NULL");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE bank_soal MODIFY COLUMN jenis_soal ENUM('pilihan_ganda', 'esai') NOT NULL");
        }
    }
};
