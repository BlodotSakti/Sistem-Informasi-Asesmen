<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bank_soal', function (Blueprint $table) {
            $table->json('keywords')->nullable()->after('kunci_jawaban');
            $table->decimal('rule_weight', 4, 2)->default(0.50)->after('keywords');
            $table->decimal('lsa_weight', 4, 2)->default(0.50)->after('rule_weight');
        });
    }

    public function down(): void
    {
        Schema::table('bank_soal', function (Blueprint $table) {
            $table->dropColumn(['keywords', 'rule_weight', 'lsa_weight']);
        });
    }
};
