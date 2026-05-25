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
            'id_guru' => $guru->guru->id_guru,
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
        $response->assertJsonPath('cards.tugas_aktif', 0);
        $response->assertJsonPath('profile.kelas_aktif.nama_kelas', 'XI IPA 1');
        $response->assertJsonCount(1, 'available_subjects');
        $response->assertJsonStructure(['cards', 'trend', 'highlight']);
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