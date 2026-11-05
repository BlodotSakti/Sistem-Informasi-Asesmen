<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bank_soal', function (Blueprint $table) {
            $table->longText('gambar_soal')->nullable()->change();
            $table->longText('audio_soal')->nullable()->change();
        });

        // Migrate any existing files on local disk to Base64 in database
        // so media is persistent across ephemeral container restarts (e.g. on Render)
        $rows = DB::table('bank_soal')
            ->whereNotNull('gambar_soal')
            ->orWhereNotNull('audio_soal')
            ->get();

        foreach ($rows as $row) {
            $updates = [];

            if ($row->gambar_soal && !str_starts_with($row->gambar_soal, 'data:') && !str_starts_with($row->gambar_soal, 'http')) {
                if (Storage::disk('public')->exists($row->gambar_soal)) {
                    $mime = Storage::disk('public')->mimeType($row->gambar_soal) ?: 'image/png';
                    $content = Storage::disk('public')->get($row->gambar_soal);
                    $updates['gambar_soal'] = 'data:' . $mime . ';base64,' . base64_encode($content);
                }
            }

            if ($row->audio_soal && !str_starts_with($row->audio_soal, 'data:') && !str_starts_with($row->audio_soal, 'http')) {
                if (Storage::disk('public')->exists($row->audio_soal)) {
                    $mime = Storage::disk('public')->mimeType($row->audio_soal) ?: 'audio/mpeg';
                    $content = Storage::disk('public')->get($row->audio_soal);
                    $updates['audio_soal'] = 'data:' . $mime . ';base64,' . base64_encode($content);
                }
            }

            if (!empty($updates)) {
                DB::table('bank_soal')->where('id_soal', $row->id_soal)->update($updates);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bank_soal', function (Blueprint $table) {
            $table->string('gambar_soal', 255)->nullable()->change();
            $table->string('audio_soal', 255)->nullable()->change();
        });
    }
};

