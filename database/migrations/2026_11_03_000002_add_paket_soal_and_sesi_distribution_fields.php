<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bank_soal', function (Blueprint $table) {
            if (!Schema::hasColumn('bank_soal', 'paket_soal')) {
                $table->string('paket_soal', 100)->nullable()->index()->after('topik_materi');
            }
        });

        Schema::table('sesi_asesmen', function (Blueprint $table) {
            if (!Schema::hasColumn('sesi_asesmen', 'target_bobot_total')) {
                $table->decimal('target_bobot_total', 8, 2)->default(100.00)->after('durasi_menit');
            }
            if (!Schema::hasColumn('sesi_asesmen', 'distribusi_paket')) {
                $table->boolean('distribusi_paket')->default(false)->after('tampilkan_kunci');
            }
            if (!Schema::hasColumn('sesi_asesmen', 'acak_soal')) {
                $table->boolean('acak_soal')->default(false)->after('distribusi_paket');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bank_soal', function (Blueprint $table) {
            if (Schema::hasColumn('bank_soal', 'paket_soal')) {
                $table->dropColumn('paket_soal');
            }
        });

        Schema::table('sesi_asesmen', function (Blueprint $table) {
            $columns = [];
            foreach (['target_bobot_total', 'distribusi_paket', 'acak_soal'] as $col) {
                if (Schema::hasColumn('sesi_asesmen', $col)) {
                    $columns[] = $col;
                }
            }
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
