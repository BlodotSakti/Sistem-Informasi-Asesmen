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
        // 1. Add created_by column
        Schema::table('bank_soal', function (Blueprint $table) {
            $table->unsignedBigInteger('created_by')->after('id_soal')->nullable();
        });

        // 2. Map existing id_guru to created_by (pengguna ID)
        DB::statement('
            UPDATE bank_soal
            INNER JOIN guru ON bank_soal.id_guru = guru.id_guru
            SET bank_soal.created_by = guru.id_pengguna
        ');

        // Make it required and add foreign key
        Schema::table('bank_soal', function (Blueprint $table) {
            $table->unsignedBigInteger('created_by')->nullable(false)->change();
            $table->foreign('created_by')
                ->references('id_pengguna')
                ->on('pengguna')
                ->cascadeOnDelete();
        });

        // 3. Drop old id_guru
        Schema::table('bank_soal', function (Blueprint $table) {
            $table->dropForeign(['id_guru']);
            $table->dropColumn('id_guru');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bank_soal', function (Blueprint $table) {
            $table->foreignId('id_guru')->after('id_soal')->nullable()->constrained('guru', 'id_guru')->cascadeOnDelete();
        });

        DB::statement('
            UPDATE bank_soal
            INNER JOIN guru ON bank_soal.created_by = guru.id_pengguna
            SET bank_soal.id_guru = guru.id_guru
        ');

        Schema::table('bank_soal', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn('created_by');
        });
    }
};
