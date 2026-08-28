<?php

namespace Tests\Feature\Api;

use App\Models\AnalisisDiagnostik;
use App\Models\Apresiasi;
use App\Models\BeritaAcara;
use App\Models\BankSoal;
use App\Models\CatatanPrivat;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\KelasSiswa;
use App\Models\MataPelajaran;
use App\Models\PenugasanPembelajaran;
use App\Models\Pengguna;
use App\Models\RencanaBelajar;
use App\Models\TahunAjaran;
use App\Models\SesiAsesmen;
use App\Models\Siswa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardSummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_summary_returns_counts(): void
    {
        $admin = $this->makeUser('admin', 'operator01', 'Operator Sekolah');
        $guru = $this->makeUser('guru', 'guru01', 'Guru Satu', ['nip' => '198801012026010001']);
        $siswa = $this->makeUser('siswa', 'siswa01', 'Siswa Satu', ['nisn' => '1234567890']);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'XI IPA 1',
            'tahun_ajaran' => '2025/2026',
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswa->siswa->id_siswa,
            'tahun_ajaran' => '2025/2026',
            'is_aktif' => true,
        ]);

        TahunAjaran::create([
            'nama_tahun_ajaran' => '2025/2026',
            'semester' => 'ganjil',
            'tanggal_mulai' => now()->startOfMonth()->toDateString(),
            'tanggal_selesai' => now()->addMonths(10)->toDateString(),
            'is_aktif' => true,
            'keterangan' => 'Periode aktif utama',
        ]);

        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Matematika',
            'tingkat' => 'XI',
        ]);

        PenugasanPembelajaran::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'tahun_ajaran' => '2025/2026',
            'is_aktif' => true,
        ]);

        $response = $this->withToken($this->loginToken('operator01'))->getJson('/api/admin/dashboard-summary');

        $response->assertOk();
        $response->assertJsonPath('cards.total_guru', 1);
        $response->assertJsonPath('cards.total_siswa', 1);
        $response->assertJsonPath('cards.total_kelas', 1);
        $response->assertJsonPath('cards.total_tahun_ajaran', 1);
        $response->assertJsonPath('cards.total_mapel', 1);
        $response->assertJsonPath('cards.total_kelas_siswa', 1);
        $response->assertJsonPath('cards.total_penugasan_pembelajaran', 1);
        $response->assertJsonStructure(['cards', 'chart', 'recent_activities']);
    }

    public function test_guru_dashboard_summary_returns_kpi_and_schedules(): void
    {
        $guru = $this->makeUser('guru', 'guru01', 'Guru Satu', ['nip' => '198801012026010001']);
        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Fisika',
            'tingkat' => 'XI',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'XI IPA 1',
            'tahun_ajaran' => '2025/2026',
        ]);

        PenugasanPembelajaran::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'tahun_ajaran' => '2025/2026',
            'is_aktif' => true,
        ]);

        BankSoal::create([
            'created_by' => $guru->id_pengguna,
            'id_mapel' => $mapel->id_mapel,
            'isi_soal' => 'Contoh soal',
            'jenis_soal' => 'esai',
            'kunci_jawaban' => 'A',
            'topik_materi' => 'Gerak',
            'level_kognitif' => 'C1',
        ]);

        BeritaAcara::create([
            'id_kelas' => $kelas->id_kelas,
            'id_guru' => $guru->guru->id_guru,
            'pertemuan_ke' => 1,
            'tanggal' => now()->toDateString(),
            'materi_bahasan' => 'Pendahuluan',
            'catatan_kelas' => 'Kelas berjalan baik.',
        ]);

        SesiAsesmen::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'tipe_soal' => 'CBT',
            'jenis_asesmen' => 'posttest',
            'waktu_mulai' => now()->addDay(),
            'durasi_menit' => 60,
        ]);

        $response = $this->withToken($this->loginToken('guru01'))->getJson('/api/guru/dashboard-summary');

        $response->assertOk();
        $response->assertJsonPath('cards.total_kelas', 1);
        $response->assertJsonPath('cards.total_bank_soal', 1);
        $response->assertJsonPath('cards.total_penugasan', 1);
        $response->assertJsonPath('cards.total_berita_acara', 1);
        $response->assertJsonCount(1, 'teaching_assignments');
        $response->assertJsonStructure(['cards', 'upcoming_schedules', 'quick_tips']);
    }

    public function test_guru_diagnostic_index_returns_paginated_items(): void
    {
        $guru = $this->makeUser('guru', 'guru02', 'Guru Dua', ['nip' => '198801012026010002']);
        $siswa = $this->makeUser('siswa', 'siswa02', 'Siswa Dua', ['nisn' => '1234567891']);
        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Biologi',
            'tingkat' => 'XI',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'XI IPA 2',
            'tahun_ajaran' => '2025/2026',
        ]);

        $sesi = SesiAsesmen::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'tipe_soal' => 'CBT',
            'jenis_asesmen' => 'posttest',
            'waktu_mulai' => now()->subDay(),
            'durasi_menit' => 60,
        ]);

        AnalisisDiagnostik::create([
            'id_siswa' => $siswa->siswa->id_siswa,
            'id_sesi' => $sesi->id_sesi,
            'skor_total' => 79,
            'narasi_kekuatan' => 'Cukup baik',
            'narasi_kelemahan' => 'Perlu penguatan',
            'tanggal_generate' => now(),
        ]);

        $response = $this->withToken($this->loginToken('guru02'))->getJson('/api/guru/analisis-diagnostik');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonStructure(['data']);
    }

    public function test_siswa_dashboard_summary_returns_trend_and_highlight(): void
    {
        $siswa = $this->makeUser('siswa', 'siswa01', 'Siswa Satu', ['nisn' => '1234567890']);
        $guru = $this->makeUser('guru', 'guru01', 'Guru Satu', ['nip' => '198801012026010001']);
        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Kimia',
            'tingkat' => 'XI',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'XI IPA 1',
            'tahun_ajaran' => '2025/2026',
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswa->siswa->id_siswa,
            'tahun_ajaran' => '2025/2026',
            'is_aktif' => true,
            'tanggal_masuk' => now()->subMonths(2)->toDateString(),
        ]);

        PenugasanPembelajaran::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'tahun_ajaran' => '2025/2026',
            'is_aktif' => true,
        ]);

        RencanaBelajar::create([
            'id_siswa' => $siswa->siswa->id_siswa,
            'id_mapel' => $mapel->id_mapel,
            'sumber' => 'manual',
            'status' => 'direncanakan',
            'catatan' => 'Latihan tambahan sebelum ujian',
        ]);

        $sesi = SesiAsesmen::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'tipe_soal' => 'CBT',
            'jenis_asesmen' => 'posttest',
            'waktu_mulai' => now()->addDay(),
            'durasi_menit' => 60,
        ]);

        AnalisisDiagnostik::create([
            'id_siswa' => $siswa->siswa->id_siswa,
            'id_sesi' => $sesi->id_sesi,
            'skor_total' => 85,
            'narasi_kekuatan' => 'Baik',
            'narasi_kelemahan' => 'Perlu latihan',
            'tanggal_generate' => now()->subDays(2),
        ]);

        Apresiasi::create([
            'id_guru' => $guru->guru->id_guru,
            'id_siswa' => $siswa->siswa->id_siswa,
            'tanggal' => now()->toDateString(),
            'jenis_badge' => 'emas',
            'topik_materi' => 'Kimia Dasar',
        ]);

        CatatanPrivat::create([
            'id_guru' => $guru->guru->id_guru,
            'id_siswa' => $siswa->siswa->id_siswa,
            'tanggal' => now()->toDateString(),
            'isi_pesan' => 'Tingkatkan latihan soal.',
        ]);

        $response = $this->withToken($this->loginToken('siswa01'))->getJson('/api/siswa/dashboard-summary');

        $response->assertOk();
        $response->assertJsonPath('cards.apresiasi', 1);
        $response->assertJsonPath('cards.tugas_aktif', 1);
        $response->assertJsonPath('profile.kelas_aktif.nama_kelas', 'XI IPA 1');
        $response->assertJsonCount(1, 'available_subjects');
        $response->assertJsonStructure(['cards', 'trend_data', 'highlight']);
    }

    public function test_siswa_active_sessions_endpoint_returns_list_for_widget(): void
    {
        $siswa = $this->makeUser('siswa', 'siswa03', 'Siswa Tiga', ['nisn' => '1234567892']);
        $guru = $this->makeUser('guru', 'guru03', 'Guru Tiga', ['nip' => '198801012026010003']);
        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Fisika',
            'tingkat' => 'XI',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'XI IPA 3',
            'tahun_ajaran' => '2025/2026',
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswa->siswa->id_siswa,
            'tahun_ajaran' => '2025/2026',
            'is_aktif' => true,
            'tanggal_masuk' => now()->subMonth()->toDateString(),
        ]);

        PenugasanPembelajaran::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'tahun_ajaran' => '2025/2026',
            'is_aktif' => true,
        ]);

        SesiAsesmen::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'tipe_soal' => 'CBT',
            'jenis_asesmen' => 'posttest',
            'waktu_mulai' => now()->subHour(),
            'durasi_menit' => 60,
        ]);

        $kelasLain = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'XI IPA 4',
            'tahun_ajaran' => '2025/2026',
        ]);

        SesiAsesmen::create([
            'id_kelas' => $kelasLain->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'tipe_soal' => 'CBT',
            'jenis_asesmen' => 'posttest',
            'waktu_mulai' => now()->subHour(),
            'durasi_menit' => 60,
        ]);

        $response = $this->withToken($this->loginToken('siswa03'))->getJson('/api/siswa/sesi-asesmen/aktif');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonStructure(['data']);
    }

    public function test_siswa_riwayat_pembelajaran_returns_bap_with_attendance_status(): void
    {
        $siswa = $this->makeUser('siswa', 'siswa05', 'Siswa Lima', ['nisn' => '1234567894']);
        $guru = $this->makeUser('guru', 'guru05', 'Guru Lima', ['nip' => '198801012026010005']);
        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Geografi',
            'tingkat' => 'XI',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'XI IPS 2',
            'tahun_ajaran' => '2025/2026',
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswa->siswa->id_siswa,
            'tahun_ajaran' => '2025/2026',
            'is_aktif' => true,
            'tanggal_masuk' => now()->subMonths(2)->toDateString(),
        ]);

        PenugasanPembelajaran::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'tahun_ajaran' => '2025/2026',
            'is_aktif' => true,
        ]);

        $beritaAcara = BeritaAcara::create([
            'id_kelas' => $kelas->id_kelas,
            'id_guru' => $guru->guru->id_guru,
            'id_mapel' => $mapel->id_mapel,
            'pertemuan_ke' => 3,
            'tanggal' => now()->toDateString(),
            'materi_bahasan' => 'Peta Dunia',
            'evaluasi_kendala' => 'Perlu penguatan simbol peta.',
            'catatan_kelas' => 'Diskusi berjalan aktif.',
            'kehadiran_siswa' => [
                [
                    'id_siswa' => $siswa->siswa->id_siswa,
                    'status_kehadiran' => 'hadir',
                    'catatan_pribadi' => 'Aktif bertanya selama diskusi.',
                    'jenis_badge' => 'emas',
                ],
            ],
        ]);

        CatatanPrivat::create([
            'id_guru' => $guru->guru->id_guru,
            'id_siswa' => $siswa->siswa->id_siswa,
            'id_berita_acara' => $beritaAcara->id_berita_acara,
            'tanggal' => now()->toDateString(),
            'isi_pesan' => 'Aktif bertanya selama diskusi.',
        ]);

        Apresiasi::create([
            'id_guru' => $guru->guru->id_guru,
            'id_siswa' => $siswa->siswa->id_siswa,
            'id_berita_acara' => $beritaAcara->id_berita_acara,
            'tanggal' => now()->toDateString(),
            'jenis_badge' => 'emas',
            'topik_materi' => 'Peta Dunia',
        ]);

        $response = $this->withToken($this->loginToken('siswa05'))->getJson('/api/siswa/riwayat-pembelajaran');

        $response->assertOk();
        $response->assertJsonPath('total_pertemuan', 1);
        $response->assertJsonPath('summary_kehadiran.hadir', 1);
        $response->assertJsonPath('data.0.nama_mapel', 'Geografi');
        $response->assertJsonPath('data.0.status_kehadiran', 'hadir');
        $response->assertJsonPath('data.0.materi_bahasan', 'Peta Dunia');
        $response->assertJsonPath('data.0.catatan_pribadi.isi_pesan', 'Aktif bertanya selama diskusi.');
        $response->assertJsonPath('data.0.apresiasi.jenis_badge', 'emas');
        $response->assertJsonPath('mata_pelajaran.0.hadir', 1);
        $response->assertJsonPath('mata_pelajaran.0.catatan_pribadi', 1);
    }

    public function test_guru_berita_acara_store_can_create_optional_student_notes_and_badges(): void
    {
        $guru = $this->makeUser('guru', 'guru06', 'Guru Enam', ['nip' => '198801012026010006']);
        $siswa = $this->makeUser('siswa', 'siswa06', 'Siswa Enam', ['nisn' => '1234567896']);
        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Sejarah',
            'tingkat' => 'X',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'X IPS 1',
            'tahun_ajaran' => '2025/2026',
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswa->siswa->id_siswa,
            'tahun_ajaran' => '2025/2026',
            'is_aktif' => true,
            'tanggal_masuk' => now()->subMonths(1)->toDateString(),
        ]);

        PenugasanPembelajaran::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'tahun_ajaran' => '2025/2026',
            'is_aktif' => true,
        ]);

        $response = $this->withToken($this->loginToken('guru06'))->postJson('/api/guru/berita-acara', [
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'pertemuan_ke' => 1,
            'tanggal' => now()->toDateString(),
            'materi_bahasan' => 'Proklamasi Kemerdekaan',
            'evaluasi_kendala' => 'Perlu penguatan kronologi.',
            'catatan_kelas' => 'Diskusi berjalan aktif.',
            'kehadiran_siswa' => [
                [
                    'id_siswa' => $siswa->siswa->id_siswa,
                    'status_kehadiran' => 'hadir',
                    'catatan_pribadi' => 'Berani menjawab pertanyaan kelas.',
                    'jenis_badge' => 'perak',
                ],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('kehadiran_siswa.0.catatan_pribadi', 'Berani menjawab pertanyaan kelas.');
        $response->assertJsonPath('kehadiran_siswa.0.jenis_badge', 'perak');

        $idBeritaAcara = $response->json('id_berita_acara');

        $this->assertDatabaseHas('catatan_privat', [
            'id_berita_acara' => $idBeritaAcara,
            'id_siswa' => $siswa->siswa->id_siswa,
            'isi_pesan' => 'Berani menjawab pertanyaan kelas.',
        ]);

        $this->assertDatabaseHas('apresiasi', [
            'id_berita_acara' => $idBeritaAcara,
            'id_siswa' => $siswa->siswa->id_siswa,
            'jenis_badge' => 'perak',
            'topik_materi' => 'Proklamasi Kemerdekaan',
        ]);
    }

    public function test_guru_can_update_existing_berita_acara_and_refresh_linked_notes(): void
    {
        $guru = $this->makeUser('guru', 'guru07', 'Guru Tujuh', ['nip' => '198801012026010007']);
        $siswa = $this->makeUser('siswa', 'siswa07', 'Siswa Tujuh', ['nisn' => '1234567897']);
        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Bahasa Indonesia',
            'tingkat' => 'XI',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'XI IPA 1',
            'tahun_ajaran' => '2025/2026',
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswa->siswa->id_siswa,
            'tahun_ajaran' => '2025/2026',
            'is_aktif' => true,
            'tanggal_masuk' => now()->subMonths(1)->toDateString(),
        ]);

        PenugasanPembelajaran::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'tahun_ajaran' => '2025/2026',
            'is_aktif' => true,
        ]);

        $beritaAcara = BeritaAcara::create([
            'id_kelas' => $kelas->id_kelas,
            'id_guru' => $guru->guru->id_guru,
            'id_mapel' => $mapel->id_mapel,
            'pertemuan_ke' => 1,
            'tanggal' => now()->subDay()->toDateString(),
            'materi_bahasan' => 'Teks prosedur',
            'evaluasi_kendala' => 'Awal masih kaku.',
            'catatan_kelas' => 'Pertemuan awal.',
            'kehadiran_siswa' => [
                [
                    'id_siswa' => $siswa->siswa->id_siswa,
                    'status_kehadiran' => 'hadir',
                    'catatan_pribadi' => 'Aktif pada awal pembelajaran.',
                    'jenis_badge' => 'perunggu',
                ],
            ],
        ]);

        CatatanPrivat::create([
            'id_guru' => $guru->guru->id_guru,
            'id_siswa' => $siswa->siswa->id_siswa,
            'id_berita_acara' => $beritaAcara->id_berita_acara,
            'tanggal' => now()->subDay()->toDateString(),
            'isi_pesan' => 'Aktif pada awal pembelajaran.',
        ]);

        Apresiasi::create([
            'id_guru' => $guru->guru->id_guru,
            'id_siswa' => $siswa->siswa->id_siswa,
            'id_berita_acara' => $beritaAcara->id_berita_acara,
            'tanggal' => now()->subDay()->toDateString(),
            'jenis_badge' => 'perunggu',
            'topik_materi' => 'Teks prosedur',
        ]);

        $response = $this->withToken($this->loginToken('guru07'))->patchJson('/api/guru/berita-acara/' . $beritaAcara->id_berita_acara, [
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'pertemuan_ke' => 2,
            'tanggal' => now()->toDateString(),
            'materi_bahasan' => 'Teks eksplanasi',
            'evaluasi_kendala' => 'Perlu latihan struktur.',
            'catatan_kelas' => 'Pertemuan kedua.',
            'kehadiran_siswa' => [
                [
                    'id_siswa' => $siswa->siswa->id_siswa,
                    'status_kehadiran' => 'hadir',
                    'catatan_pribadi' => 'Menjawab dengan lebih yakin.',
                    'jenis_badge' => 'emas',
                ],
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('pertemuan_ke', 2);
        $response->assertJsonPath('kehadiran_siswa.0.catatan_pribadi', 'Menjawab dengan lebih yakin.');
        $response->assertJsonPath('kehadiran_siswa.0.jenis_badge', 'emas');

        $this->assertDatabaseCount('catatan_privat', 1);
        $this->assertDatabaseCount('apresiasi', 1);
        $this->assertDatabaseHas('catatan_privat', [
            'id_berita_acara' => $beritaAcara->id_berita_acara,
            'isi_pesan' => 'Menjawab dengan lebih yakin.',
        ]);
        $this->assertDatabaseHas('apresiasi', [
            'id_berita_acara' => $beritaAcara->id_berita_acara,
            'jenis_badge' => 'emas',
            'topik_materi' => 'Teks eksplanasi',
        ]);
    }

    public function test_siswa_riwayat_pembelajaran_keeps_bap_for_multiple_class_periods_in_same_class(): void
    {
        $siswa = $this->makeUser('siswa', 'siswa05b', 'Siswa Lima B', ['nisn' => '1234567895']);
        $guru = $this->makeUser('guru', 'guru05b', 'Guru Lima B', ['nip' => '198801012026010055']);
        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Geografi',
            'tingkat' => 'XI',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'XI IPS 3',
            'tahun_ajaran' => '2025/2026',
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswa->siswa->id_siswa,
            'tahun_ajaran' => '2024/2025',
            'is_aktif' => false,
            'tanggal_masuk' => '2024-01-01',
            'tanggal_keluar' => '2024-06-01',
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswa->siswa->id_siswa,
            'tahun_ajaran' => '2025/2026',
            'is_aktif' => true,
            'tanggal_masuk' => '2025-01-01',
        ]);

        PenugasanPembelajaran::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'tahun_ajaran' => '2025/2026',
            'is_aktif' => true,
        ]);

        BeritaAcara::create([
            'id_kelas' => $kelas->id_kelas,
            'id_guru' => $guru->guru->id_guru,
            'id_mapel' => $mapel->id_mapel,
            'pertemuan_ke' => 2,
            'tanggal' => '2025-05-15',
            'materi_bahasan' => 'Atlas dan peta',
            'evaluasi_kendala' => 'Perlu latihan membaca skala.',
            'catatan_kelas' => 'Siswa cukup aktif.',
            'kehadiran_siswa' => [
                [
                    'id_siswa' => $siswa->siswa->id_siswa,
                    'status_kehadiran' => 'hadir',
                ],
            ],
        ]);

        $response = $this->withToken($this->loginToken('siswa05b'))->getJson('/api/siswa/riwayat-pembelajaran');

        $response->assertOk();
        $response->assertJsonPath('total_pertemuan', 1);
        $response->assertJsonPath('data.0.materi_bahasan', 'Atlas dan peta');
        $response->assertJsonPath('data.0.status_kehadiran', 'hadir');
    }

    public function test_guru_cannot_create_bank_soal_for_unassigned_mapel(): void
    {
        $guru = $this->makeUser('guru', 'guru04', 'Guru Empat', ['nip' => '198801012026010004']);
        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Sosiologi',
            'tingkat' => 'XI',
        ]);

        $response = $this->withToken($this->loginToken('guru04'))->postJson('/api/guru/bank-soal', [
            'id_mapel' => $mapel->id_mapel,
            'isi_soal' => 'Contoh soal',
            'jenis_soal' => 'esai',
            'kunci_jawaban' => 'A',
            'topik_materi' => 'Interaksi sosial',
            'level_kognitif' => 'C1',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'Guru belum ditugaskan untuk mengampu mata pelajaran ini.');
    }

    protected function loginToken(string $username): string
    {
        return $this->postJson('/api/auth/login', [
            'username' => $username,
            'password' => 'secret123',
        ])->json('token');
    }

    protected function makeUser(string $role, string $username, string $namaLengkap, array $profileData = []): Pengguna
    {
        $pengguna = Pengguna::create([
            'username' => $username,
            'password' => 'secret123',
            'role' => $role,
        ]);

        match ($role) {
            'admin' => $pengguna->admin()->create([
                'nama_lengkap' => $namaLengkap,
            ]),
            'guru' => $pengguna->guru()->create([
                'nama_lengkap' => $namaLengkap,
                'nip' => $profileData['nip'] ?? '198801012026010001',
            ]),
            'siswa' => $pengguna->siswa()->create([
                'nama_lengkap' => $namaLengkap,
                'nisn' => $profileData['nisn'] ?? '1234567890',
            ]),
            default => null,
        };

        return $pengguna->fresh(['admin', 'guru', 'siswa']);
    }
}