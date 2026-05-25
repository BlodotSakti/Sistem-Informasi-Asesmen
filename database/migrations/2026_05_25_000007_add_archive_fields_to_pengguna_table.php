<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengguna', function (Blueprint $table): void {
            $table->boolean('is_aktif')->default(true)->after('role');
            $table->timestamp('diarsipkan_pada')->nullable()->after('is_aktif');
            $table->text('diarsipkan_alasan')->nullable()->after('diarsipkan_pada');
        });
    }

    public function down(): void
    {
        Schema::table('pengguna', function (Blueprint $table): void {
            $table->dropColumn(['is_aktif', 'diarsipkan_pada', 'diarsipkan_alasan']);
        });
    }
};