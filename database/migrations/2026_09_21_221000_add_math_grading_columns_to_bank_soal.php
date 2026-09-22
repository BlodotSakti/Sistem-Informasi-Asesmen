<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bank_soal', function (Blueprint $table) {
            $table->json('math_steps')->nullable()->after('lsa_weight');
            $table->decimal('math_weight', 4, 2)->default(0.00)->after('math_steps');
        });
    }

    public function down(): void
    {
        Schema::table('bank_soal', function (Blueprint $table) {
            $table->dropColumn(['math_steps', 'math_weight']);
        });
    }
};
