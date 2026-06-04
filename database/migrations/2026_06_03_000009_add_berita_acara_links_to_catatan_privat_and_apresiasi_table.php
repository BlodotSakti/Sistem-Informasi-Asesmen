<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catatan_privat', function (Blueprint $table): void {
            $table->foreignId('id_berita_acara')
                ->nullable()
                ->after('id_siswa')
                ->constrained('berita_acara', 'id_berita_acara')
                ->cascadeOnDelete();
        });

        Schema::table('apresiasi', function (Blueprint $table): void {
            $table->foreignId('id_berita_acara')
                ->nullable()
                ->after('id_siswa')
                ->constrained('berita_acara', 'id_berita_acara')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('apresiasi', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('id_berita_acara');
        });

        Schema::table('catatan_privat', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('id_berita_acara');
        });
    }
};