<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bank_soal', function (Blueprint $table) {
            if (!Schema::hasColumn('bank_soal', 'audio_soal')) {
                $table->string('audio_soal')->nullable()->after('gambar_soal');
            }
            if (!Schema::hasColumn('bank_soal', 'batas_putar_audio')) {
                $table->unsignedInteger('batas_putar_audio')->nullable()->after('audio_soal');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bank_soal', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('bank_soal', 'audio_soal')) {
                $cols[] = 'audio_soal';
            }
            if (Schema::hasColumn('bank_soal', 'batas_putar_audio')) {
                $cols[] = 'batas_putar_audio';
            }
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};

