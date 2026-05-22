<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin', function (Blueprint $table) {
            $table->unsignedBigInteger('id_pengguna')->primary();
            $table->string('nama_lengkap');
            $table->timestamps();

            $table->foreign('id_pengguna')
                ->references('id_pengguna')
                ->on('pengguna')
                ->cascadeOnDelete();
        });

        Schema::create('guru', function (Blueprint $table) {
            $table->id('id_guru');
            $table->foreignId('id_pengguna')
                ->constrained('pengguna', 'id_pengguna')
                ->cascadeOnDelete();
            $table->string('nama_lengkap');
            $table->string('nip')->unique();
            $table->timestamps();
        });

        Schema::create('siswa', function (Blueprint $table) {
            $table->id('id_siswa');
            $table->foreignId('id_pengguna')
                ->constrained('pengguna', 'id_pengguna')
                ->cascadeOnDelete();
            $table->string('nama_lengkap');
            $table->string('nisn')->unique();
            $table->timestamps();
        });

        Schema::create('kelas', function (Blueprint $table) {
            $table->id('id_kelas');
            $table->foreignId('id_guru_wali')
                ->constrained('guru', 'id_guru')
                ->cascadeOnDelete();
            $table->string('nama_kelas');
            $table->string('tahun_ajaran');
            $table->timestamps();
        });

        Schema::create('mata_pelajaran', function (Blueprint $table) {
            $table->id('id_mapel');
            $table->string('nama_mapel');
            $table->string('tingkat');
            $table->timestamps();
        });

        Schema::create('bank_soal', function (Blueprint $table) {
            $table->id('id_soal');
            $table->foreignId('id_guru')
                ->constrained('guru', 'id_guru')
                ->cascadeOnDelete();
            $table->foreignId('id_mapel')
                ->constrained('mata_pelajaran', 'id_mapel')
                ->cascadeOnDelete();
            $table->longText('isi_soal');
            $table->enum('jenis_soal', ['pilihan_ganda', 'esai']);
            $table->text('kunci_jawaban');
            $table->string('topik_materi');
            $table->enum('level_kognitif', ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
            $table->timestamps();
        });

        Schema::create('sesi_asesmen', function (Blueprint $table) {
            $table->id('id_sesi');
            $table->foreignId('id_kelas')
                ->constrained('kelas', 'id_kelas')
                ->cascadeOnDelete();
            $table->foreignId('id_mapel')
                ->constrained('mata_pelajaran', 'id_mapel')
                ->cascadeOnDelete();
            $table->string('tipe_soal');
            $table->enum('jenis_asesmen', ['pretest', 'posttest', 'ujian']);
            $table->dateTime('waktu_mulai');
            $table->unsignedInteger('durasi_menit');
            $table->timestamps();
        });

        Schema::create('detail_sesi_soal', function (Blueprint $table) {
            $table->id('id_detail');
            $table->foreignId('id_sesi')
                ->constrained('sesi_asesmen', 'id_sesi')
                ->cascadeOnDelete();
            $table->foreignId('id_soal')
                ->constrained('bank_soal', 'id_soal')
                ->cascadeOnDelete();
            $table->decimal('bobot_nilai', 8, 2);
            $table->timestamps();
        });

        Schema::create('jawaban_siswa', function (Blueprint $table) {
            $table->id('id_jawaban');
            $table->foreignId('id_siswa')
                ->constrained('siswa', 'id_siswa')
                ->cascadeOnDelete();
            $table->foreignId('id_detail')
                ->constrained('detail_sesi_soal', 'id_detail')
                ->cascadeOnDelete();
            $table->longText('teks_jawaban');
            $table->boolean('is_correct')->default(false);
            $table->decimal('skor_diperoleh', 8, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('analisis_diagnostik', function (Blueprint $table) {
            $table->id('id_analisis');
            $table->foreignId('id_siswa')
                ->constrained('siswa', 'id_siswa')
                ->cascadeOnDelete();
            $table->foreignId('id_sesi')
                ->constrained('sesi_asesmen', 'id_sesi')
                ->cascadeOnDelete();
            $table->decimal('skor_total', 8, 2);
            $table->longText('narasi_kekuatan');
            $table->longText('narasi_kelemahan');
            $table->dateTime('tanggal_generate');
            $table->timestamps();
        });

        Schema::create('berita_acara', function (Blueprint $table) {
            $table->id('id_berita_acara');
            $table->foreignId('id_kelas')
                ->constrained('kelas', 'id_kelas')
                ->cascadeOnDelete();
            $table->foreignId('id_guru')
                ->constrained('guru', 'id_guru')
                ->cascadeOnDelete();
            $table->unsignedSmallInteger('pertemuan_ke');
            $table->date('tanggal');
            $table->string('materi_bahasan');
            $table->longText('catatan_kelas');
            $table->timestamps();
        });

        Schema::create('catatan_privat', function (Blueprint $table) {
            $table->id('id_catatan');
            $table->foreignId('id_guru')
                ->constrained('guru', 'id_guru')
                ->cascadeOnDelete();
            $table->foreignId('id_siswa')
                ->constrained('siswa', 'id_siswa')
                ->cascadeOnDelete();
            $table->date('tanggal');
            $table->longText('isi_pesan');
            $table->timestamps();
        });

        Schema::create('apresiasi', function (Blueprint $table) {
            $table->id('id_apresiasi');
            $table->foreignId('id_guru')
                ->constrained('guru', 'id_guru')
                ->cascadeOnDelete();
            $table->foreignId('id_siswa')
                ->constrained('siswa', 'id_siswa')
                ->cascadeOnDelete();
            $table->date('tanggal');
            $table->enum('jenis_badge', ['emas', 'perak', 'perunggu']);
            $table->string('topik_materi');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apresiasi');
        Schema::dropIfExists('catatan_privat');
        Schema::dropIfExists('berita_acara');
        Schema::dropIfExists('analisis_diagnostik');
        Schema::dropIfExists('jawaban_siswa');
        Schema::dropIfExists('detail_sesi_soal');
        Schema::dropIfExists('sesi_asesmen');
        Schema::dropIfExists('bank_soal');
        Schema::dropIfExists('mata_pelajaran');
        Schema::dropIfExists('kelas');
        Schema::dropIfExists('siswa');
        Schema::dropIfExists('guru');
        Schema::dropIfExists('admin');
    }
};