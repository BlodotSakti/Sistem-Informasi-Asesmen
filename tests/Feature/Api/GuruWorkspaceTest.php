<?php

namespace Tests\Feature\Api;

use App\Models\Kelas;
use App\Models\KelasSiswa;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\PenugasanPembelajaran;
use App\Models\BeritaAcara;
use App\Models\Apresiasi;
use App\Models\CatatanPrivat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuruWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_guru_can_create_pilihan_ganda_bank_soal_with_bloom_mapping(): void
    {
        $guru = $this->makeUser('guru', 'guru11', 'Guru Sebelas', ['nip' => '198801012026010111']);

        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Matematika',
            'tingkat' => 'XI',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'XI IPA 1',
            'tahun_ajaran' => '2026/2027',
        ]);

        PenugasanPembelajaran::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => true,
        ]);

        $response = $this->withToken($this->loginToken('guru11'))->postJson('/api/guru/bank-soal', [
            'id_mapel' => $mapel->id_mapel,
            'isi_soal' => 'Hasil dari 2x + 3 = 11 adalah ...',
            'jenis_soal' => 'pilihan_ganda',
            'opsi_jawaban' => ['x = 2', 'x = 3', 'x = 4', 'x = 5'],
            'kunci_jawaban' => 'x = 4',
            'topik_materi' => 'Persamaan Linear',
            'level_kognitif' => 'C2',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('topik_materi', 'Persamaan Linear');
        $response->assertJsonPath('level_kognitif', 'C2');
        $response->assertJsonPath('opsi_jawaban.2', 'x = 4');

        $this->assertDatabaseHas('bank_soal', [
            'created_by' => $guru->id_pengguna,
            'id_mapel' => $mapel->id_mapel,
            'jenis_soal' => 'pilihan_ganda',
            'kunci_jawaban' => 'x = 4',
            'topik_materi' => 'Persamaan Linear',
            'level_kognitif' => 'C2',
        ]);
    }

    public function test_bank_soal_requires_topik_and_bloom_before_save(): void
    {
        $guru = $this->makeUser('guru', 'guru12', 'Guru Dua Belas', ['nip' => '198801012026010112']);

        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Biologi',
            'tingkat' => 'XI',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'XI IPA 2',
            'tahun_ajaran' => '2026/2027',
        ]);

        PenugasanPembelajaran::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => true,
        ]);

        $response = $this->withToken($this->loginToken('guru12'))->postJson('/api/guru/bank-soal', [
            'id_mapel' => $mapel->id_mapel,
            'isi_soal' => 'Jelaskan fungsi klorofil.',
            'jenis_soal' => 'esai',
            'kunci_jawaban' => 'Berperan dalam fotosintesis',
            'topik_materi' => '',
            'level_kognitif' => '',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['topik_materi', 'level_kognitif']);
    }

    public function test_berita_acara_requires_complete_attendance_for_all_active_students(): void
    {
        $guru = $this->makeUser('guru', 'guru13', 'Guru Tiga Belas', ['nip' => '198801012026010113']);
        $siswaA = $this->makeUser('siswa', 'siswa13a', 'Siswa Tiga Belas A', ['nisn' => '1300000001']);
        $siswaB = $this->makeUser('siswa', 'siswa13b', 'Siswa Tiga Belas B', ['nisn' => '1300000002']);

        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Fisika',
            'tingkat' => 'XI',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'XI IPA 3',
            'tahun_ajaran' => '2026/2027',
        ]);

        PenugasanPembelajaran::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => true,
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswaA->siswa->id_siswa,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => true,
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswaB->siswa->id_siswa,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => true,
        ]);

        $response = $this->withToken($this->loginToken('guru13'))->postJson('/api/guru/berita-acara', [
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'pertemuan_ke' => 4,
            'tanggal' => '2026-08-20',
            'materi_bahasan' => 'Gerak parabola',
            'evaluasi_kendala' => 'Sebagian siswa masih bingung pada vektor kecepatan.',
            'catatan_kelas' => 'Perlu latihan tambahan minggu depan.',
            'kehadiran_siswa' => [
                [
                    'id_siswa' => $siswaA->siswa->id_siswa,
                    'status_kehadiran' => 'hadir',
                ],
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'Presensi tidak lengkap. Semua siswa aktif di kelas harus dicatat kehadirannya.');
    }

    public function test_guru_can_create_berita_acara_with_attendance_and_evaluation(): void
    {
        $guru = $this->makeUser('guru', 'guru14', 'Guru Empat Belas', ['nip' => '198801012026010114']);
        $siswaA = $this->makeUser('siswa', 'siswa14a', 'Siswa Empat Belas A', ['nisn' => '1400000001']);
        $siswaB = $this->makeUser('siswa', 'siswa14b', 'Siswa Empat Belas B', ['nisn' => '1400000002']);

        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Kimia',
            'tingkat' => 'XI',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'XI IPA 4',
            'tahun_ajaran' => '2026/2027',
        ]);

        PenugasanPembelajaran::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => true,
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswaA->siswa->id_siswa,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => true,
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswaB->siswa->id_siswa,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => true,
        ]);

        $response = $this->withToken($this->loginToken('guru14'))->postJson('/api/guru/berita-acara', [
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'pertemuan_ke' => 5,
            'tanggal' => '2026-08-27',
            'materi_bahasan' => 'Laju reaksi',
            'evaluasi_kendala' => 'Siswa perlu penguatan pada konsep energi aktivasi.',
            'catatan_kelas' => 'Kelas kondusif dan diskusi berjalan aktif.',
            'kehadiran_siswa' => [
                ['id_siswa' => $siswaA->siswa->id_siswa, 'status_kehadiran' => 'hadir'],
                ['id_siswa' => $siswaB->siswa->id_siswa, 'status_kehadiran' => 'izin'],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('id_mapel', $mapel->id_mapel);
        $response->assertJsonPath('kehadiran_siswa.1.status_kehadiran', 'izin');

        $this->assertDatabaseHas('berita_acara', [
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'pertemuan_ke' => 5,
            'materi_bahasan' => 'Laju reaksi',
        ]);
    }

    public function test_guru_can_add_optional_private_notes_and_badges_from_berita_acara(): void
    {
        $guru = $this->makeUser('guru', 'guru15', 'Guru Lima Belas', ['nip' => '198801012026010115']);
        $siswaA = $this->makeUser('siswa', 'siswa15a', 'Siswa Lima Belas A', ['nisn' => '1500000001']);
        $siswaB = $this->makeUser('siswa', 'siswa15b', 'Siswa Lima Belas B', ['nisn' => '1500000002']);

        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Sejarah',
            'tingkat' => 'XI',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'XI IPS 1',
            'tahun_ajaran' => '2026/2027',
        ]);

        PenugasanPembelajaran::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => true,
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswaA->siswa->id_siswa,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => true,
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswaB->siswa->id_siswa,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => true,
        ]);

        $response = $this->withToken($this->loginToken('guru15'))->postJson('/api/guru/berita-acara', [
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'pertemuan_ke' => 2,
            'tanggal' => '2026-09-01',
            'materi_bahasan' => 'Revolusi Industri',
            'evaluasi_kendala' => 'Diskusi aktif namun perlu penguatan istilah.',
            'catatan_kelas' => 'Pertemuan berjalan lancar.',
            'kehadiran_siswa' => [
                ['id_siswa' => $siswaA->siswa->id_siswa, 'status_kehadiran' => 'hadir', 'catatan_pribadi' => 'Bagus dalam diskusi kelas.'],
                ['id_siswa' => $siswaB->siswa->id_siswa, 'status_kehadiran' => 'hadir', 'jenis_badge' => 'emas'],
            ],
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('catatan_privat', [
            'id_guru' => $guru->guru->id_guru,
            'id_siswa' => $siswaA->siswa->id_siswa,
            'isi_pesan' => 'Bagus dalam diskusi kelas.',
        ]);

        $this->assertDatabaseHas('apresiasi', [
            'id_guru' => $guru->guru->id_guru,
            'id_siswa' => $siswaB->siswa->id_siswa,
            'jenis_badge' => 'emas',
            'topik_materi' => 'Revolusi Industri',
        ]);
    }

    public function test_guru_can_update_berita_acara(): void
    {
        $guru = $this->makeUser('guru', 'guru16', 'Guru Enam Belas', ['nip' => '198801012026010116']);
        $siswaA = $this->makeUser('siswa', 'siswa16a', 'Siswa Enam Belas A', ['nisn' => '1600000001']);
        $siswaB = $this->makeUser('siswa', 'siswa16b', 'Siswa Enam Belas B', ['nisn' => '1600000002']);

        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Bahasa Indonesia',
            'tingkat' => 'XI',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->guru->id_guru,
            'nama_kelas' => 'XI IPS 2',
            'tahun_ajaran' => '2026/2027',
        ]);

        PenugasanPembelajaran::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => true,
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswaA->siswa->id_siswa,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => true,
        ]);

        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswaB->siswa->id_siswa,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => true,
        ]);

        $beritaAcara = BeritaAcara::create([
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->guru->id_guru,
            'pertemuan_ke' => 1,
            'tanggal' => '2026-09-15',
            'materi_bahasan' => 'Teks laporan hasil observasi',
            'evaluasi_kendala' => 'Perlu penguatan struktur teks.',
            'catatan_kelas' => 'Pertemuan awal semester.',
            'kehadiran_siswa' => [
                ['id_siswa' => $siswaA->siswa->id_siswa, 'status_kehadiran' => 'hadir'],
                ['id_siswa' => $siswaB->siswa->id_siswa, 'status_kehadiran' => 'alpa'],
            ],
        ]);

        $response = $this->withToken($this->loginToken('guru16'))->patchJson('/api/guru/berita-acara/'.$beritaAcara->id_berita_acara, [
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'pertemuan_ke' => 2,
            'tanggal' => '2026-09-16',
            'materi_bahasan' => 'Teks eksposisi',
            'evaluasi_kendala' => 'Lebih banyak latihan soal.',
            'catatan_kelas' => 'Revisi materi berjalan baik.',
            'kehadiran_siswa' => [
                ['id_siswa' => $siswaA->siswa->id_siswa, 'status_kehadiran' => 'hadir'],
                ['id_siswa' => $siswaB->siswa->id_siswa, 'status_kehadiran' => 'izin'],
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('pertemuan_ke', 2);
        $response->assertJsonPath('kehadiran_siswa.1.status_kehadiran', 'izin');

        $this->assertDatabaseHas('berita_acara', [
            'id_berita_acara' => $beritaAcara->id_berita_acara,
            'pertemuan_ke' => 2,
            'materi_bahasan' => 'Teks eksposisi',
        ]);
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
                'nip' => $profileData['nip'] ?? '198801012026010000',
            ]),
            'siswa' => $pengguna->siswa()->create([
                'nama_lengkap' => $namaLengkap,
                'nisn' => $profileData['nisn'] ?? '1000000000',
            ]),
            default => null,
        };

        return $pengguna->fresh(['admin', 'guru', 'siswa']);
    }
}
