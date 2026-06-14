<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Mencegah duplikasi jawaban siswa untuk soal yang sama.
     * Setiap siswa hanya boleh punya 1 jawaban per detail soal.
     */
    public function up(): void
    {
        // Hapus duplikat yang ada sebelum menambahkan unique index
        $duplicates = DB::table('jawaban_siswa')
            ->select('id_siswa', 'id_detail')
            ->selectRaw('MIN(id_jawaban) as keep_id')
            ->groupBy('id_siswa', 'id_detail')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $dup) {
            DB::table('jawaban_siswa')
                ->where('id_siswa', $dup->id_siswa)
                ->where('id_detail', $dup->id_detail)
                ->where('id_jawaban', '!=', $dup->keep_id)
                ->delete();
        }

        Schema::table('jawaban_siswa', function (Blueprint $table) {
            $table->unique(['id_siswa', 'id_detail'], 'jawaban_siswa_unique_siswa_detail');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jawaban_siswa', function (Blueprint $table) {
            $table->dropUnique('jawaban_siswa_unique_siswa_detail');
        });
    }
};
