<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tahun_ajaran', function (Blueprint $table): void {
            $table->enum('semester', ['ganjil', 'genap'])->default('ganjil')->after('nama_tahun_ajaran');
        });

        Schema::table('tahun_ajaran', function (Blueprint $table): void {
            $table->dropUnique('tahun_ajaran_nama_tahun_ajaran_unique');
            $table->unique(['nama_tahun_ajaran', 'semester'], 'tahun_ajaran_nama_semester_unique');
        });
    }

    public function down(): void
    {
        Schema::table('tahun_ajaran', function (Blueprint $table): void {
            $table->dropUnique('tahun_ajaran_nama_semester_unique');
            $table->unique('nama_tahun_ajaran');
            $table->dropColumn('semester');
        });
    }
};