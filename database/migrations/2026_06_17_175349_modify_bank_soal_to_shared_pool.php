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

        $bankSoals = DB::table('bank_soal')->get();
        foreach ($bankSoals as $soal) {
            $guru = DB::table('guru')->where('id_guru', $soal->id_guru)->first();
            if ($guru) {
                DB::table('bank_soal')->where('id_soal', $soal->id_soal)->update(['created_by' => $guru->id_pengguna]);
            }
        }

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

        $bankSoals = DB::table('bank_soal')->get();
        foreach ($bankSoals as $soal) {
            $guru = DB::table('guru')->where('id_pengguna', $soal->created_by)->first();
            if ($guru) {
                DB::table('bank_soal')->where('id_soal', $soal->id_soal)->update(['id_guru' => $guru->id_guru]);
            }
        }

        Schema::table('bank_soal', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn('created_by');
        });
    }
};
