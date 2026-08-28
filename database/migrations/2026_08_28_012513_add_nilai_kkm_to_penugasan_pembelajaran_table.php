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
        Schema::table('penugasan_pembelajaran', function (Blueprint $table) {
            $table->integer('nilai_kkm')->nullable()->default(75)->after('is_aktif');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('penugasan_pembelajaran', function (Blueprint $table) {
            $table->dropColumn('nilai_kkm');
        });
    }
};
