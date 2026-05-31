<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('bank_soal', 'opsi_jawaban')) {
            Schema::table('bank_soal', function (Blueprint $table) {
                $table->json('opsi_jawaban')->nullable()->after('jenis_soal');
            });
        }

        Schema::table('berita_acara', function (Blueprint $table) {
            if (! Schema::hasColumn('berita_acara', 'id_mapel')) {
                $table->foreignId('id_mapel')
                    ->nullable()
                    ->after('id_kelas')
                    ->constrained('mata_pelajaran', 'id_mapel')
                    ->cascadeOnDelete();
            }

            if (! Schema::hasColumn('berita_acara', 'kehadiran_siswa')) {
                $table->json('kehadiran_siswa')->nullable()->after('materi_bahasan');
            }

            if (! Schema::hasColumn('berita_acara', 'evaluasi_kendala')) {
                $table->longText('evaluasi_kendala')->nullable()->after('kehadiran_siswa');
            }
        });
    }

    public function down(): void
    {
        Schema::table('berita_acara', function (Blueprint $table) {
            if (Schema::hasColumn('berita_acara', 'id_mapel')) {
                $table->dropForeign(['id_mapel']);
                $table->dropColumn('id_mapel');
            }

            if (Schema::hasColumn('berita_acara', 'kehadiran_siswa')) {
                $table->dropColumn('kehadiran_siswa');
            }

            if (Schema::hasColumn('berita_acara', 'evaluasi_kendala')) {
                $table->dropColumn('evaluasi_kendala');
            }
        });

        if (Schema::hasColumn('bank_soal', 'opsi_jawaban')) {
            Schema::table('bank_soal', function (Blueprint $table) {
                $table->dropColumn('opsi_jawaban');
            });
        }
    }
};
