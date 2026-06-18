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

        $this->siswaUser = Pengguna::factory()->create(['role' => 'siswa']);
        $this->siswa = Siswa::factory()->create([
            'id_pengguna' => $this->siswaUser->id_pengguna,
        ]);

        $guruUser = Pengguna::factory()->create(['role' => 'guru']);
        $this->guru = Guru::factory()->create([
            'id_pengguna' => $guruUser->id_pengguna,
            'nama_lengkap' => 'Guru Test'
        ]);

        $kelas = Kelas::factory()->create();
        KelasSiswa::factory()->create([
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $this->siswa->id_siswa,
            'is_aktif' => true,
        ]);

        $mapel = MataPelajaran::factory()->create(['nama_mapel' => 'Matematika']);

        // Create Berita Acara for Apresiasi and Catatan
        $bap = BeritaAcara::factory()->create([
            'id_guru' => $this->guru->id_guru,
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
        ]);

        // 1. Apresiasi
        Apresiasi::factory()->create([
            'id_siswa' => $this->siswa->id_siswa,
            'id_guru' => $this->guru->id_guru,
            'id_berita_acara' => $bap->id_berita_acara,
            'jenis_badge' => 'Bintang Sains',
            'topik_materi' => 'Aljabar',
            'tanggal' => now()->subHours(2),
        ]);

        // 2. Catatan Privat
        CatatanPrivat::factory()->create([
            'id_siswa' => $this->siswa->id_siswa,
            'id_guru' => $this->guru->id_guru,
            'id_berita_acara' => $bap->id_berita_acara,
            'isi_pesan' => 'Tingkatkan lagi belajarnya.',
            'tanggal' => now()->subHour(),
        ]);

        // 3. Sesi Asesmen
        SesiAsesmen::factory()->create([
            'id_guru' => $this->guru->id_guru,
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'waktu_mulai' => now()->addHours(5), // Dalam 24 jam ke depan
            'waktu_selesai' => now()->addHours(7),
        ]);
        
        // Sesi Asesmen di luar 24 jam (seharusnya tidak masuk)
        SesiAsesmen::factory()->create([
            'id_guru' => $this->guru->id_guru,
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'waktu_mulai' => now()->addHours(48),
            'waktu_selesai' => now()->addHours(50),
        ]);
    }

    public function test_can_fetch_unified_notifications()
    {
        $response = $this->actingAs($this->siswaUser)
            ->getJson('/api/siswa/notifications');

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
            'title' => 'Pengingat Ujian',
        ]);
    }
}
