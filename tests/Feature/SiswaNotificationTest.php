<?php

namespace Tests\Feature;

use App\Models\Pengguna;
use App\Models\Siswa;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\KelasSiswa;
use App\Models\MataPelajaran;
use App\Models\SesiAsesmen;
use App\Models\Apresiasi;
use App\Models\CatatanPrivat;
use App\Models\BeritaAcara;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiswaNotificationTest extends TestCase
{
    use RefreshDatabase;

    private Pengguna $siswaUser;
    private Siswa $siswa;
    private Guru $guru;

    protected function setUp(): void
    {
        parent::setUp();

        $this->siswaUser = Pengguna::create([
            'username' => 'siswa' . uniqid(),
            'password' => 'secret',
            'role' => 'siswa',
        ]);
        
        $this->siswa = Siswa::create([
            'id_pengguna' => $this->siswaUser->id_pengguna,
            'nisn' => '123456789' . rand(10, 99),
            'nama_lengkap' => 'Siswa Test',
        ]);

        $guruUser = Pengguna::create([
            'username' => 'guru' . uniqid(),
            'password' => 'secret',
            'role' => 'guru',
        ]);
        
        $this->guru = Guru::create([
            'id_pengguna' => $guruUser->id_pengguna,
            'nip' => '19880101' . rand(100, 999),
            'nama_lengkap' => 'Guru Test'
        ]);

        \App\Models\TahunAjaran::create([
            'nama_tahun_ajaran' => '2023/2024',
            'semester' => 'ganjil',
            'tanggal_mulai' => now()->startOfMonth()->toDateString(),
            'tanggal_selesai' => now()->addMonths(10)->toDateString(),
            'is_aktif' => true,
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $this->guru->id_guru,
            'nama_kelas' => 'XII IPA 1',
            'tahun_ajaran' => '2023/2024',
        ]);
        
        KelasSiswa::create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $this->siswa->id_siswa,
            'tahun_ajaran' => '2023/2024',
            'is_aktif' => true,
            'tanggal_masuk' => now()->toDateString(),
        ]);

        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Matematika',
            'tingkat' => 'XII',
        ]);

        // Create Berita Acara for Apresiasi and Catatan
        $bap = BeritaAcara::create([
            'id_guru' => $this->guru->id_guru,
            'id_kelas' => $kelas->id_kelas,
            'pertemuan_ke' => 1,
            'tanggal' => now()->toDateString(),
            'materi_bahasan' => 'Materi',
            'catatan_kelas' => 'Tidak ada catatan khusus.',
        ]);

        // 1. Apresiasi
        Apresiasi::create([
            'id_siswa' => $this->siswa->id_siswa,
            'id_guru' => $this->guru->id_guru,
            'id_berita_acara' => $bap->id_berita_acara,
            'jenis_badge' => 'Bintang Sains',
            'topik_materi' => 'Aljabar',
            'tanggal' => now()->subHours(2)->toDateString(),
        ]);

        // 2. Catatan Privat
        CatatanPrivat::create([
            'id_siswa' => $this->siswa->id_siswa,
            'id_guru' => $this->guru->id_guru,
            'id_berita_acara' => $bap->id_berita_acara,
            'isi_pesan' => 'Tingkatkan lagi belajarnya.',
            'tanggal' => now()->subHour()->toDateString(),
        ]);

        // 3. Sesi Asesmen
        SesiAsesmen::create([
            'id_guru' => $this->guru->id_guru,
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'waktu_mulai' => now()->addHours(5), // Dalam 24 jam ke depan
            'waktu_selesai' => now()->addHours(7),
            'durasi_menit' => 120,
            'tipe_soal' => 'CBT',
            'jenis_asesmen' => 'ujian',
        ]);
        
        // Sesi Asesmen di luar 24 jam (seharusnya tidak masuk)
        SesiAsesmen::create([
            'id_guru' => $this->guru->id_guru,
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'waktu_mulai' => now()->addHours(48),
            'waktu_selesai' => now()->addHours(50),
            'durasi_menit' => 120,
            'tipe_soal' => 'CBT',
            'jenis_asesmen' => 'ujian',
        ]);
    }

    public function test_can_fetch_unified_notifications()
    {
        $token = $this->siswaUser->createToken('test')->plainTextToken;
        $response = $this->withToken($token)->getJson('/api/siswa/notifications');

        $response->assertStatus(200);

        // Harus ada 3 notifikasi: 1 badge, 1 catatan, 1 ujian (karena 1 ujian di luar 24 jam)
        $response->assertJsonCount(3);
        
        // Cek tipe notifikasi (struktur responsenya JSON array obj)
        $response->assertJsonFragment([
            'type' => 'badge',
            'title' => 'Lencana Apresiasi',
        ]);

        $response->assertJsonFragment([
            'type' => 'catatan',
            'title' => 'Catatan Privat Baru',
        ]);

        $response->assertJsonFragment([
            'type' => 'ujian',
            'title' => 'Pengingat Ujian Baru',
        ]);
    }
}
