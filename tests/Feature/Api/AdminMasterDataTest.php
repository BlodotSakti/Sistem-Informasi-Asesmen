<?php

namespace Tests\Feature\Api;

use App\Models\Guru;
use App\Models\Kelas;
use App\Models\KelasSiswa;
use App\Models\MataPelajaran;
use App\Models\PenugasanPembelajaran;
use App\Models\Pengguna;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class AdminMasterDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_tahun_ajaran(): void
    {
        $this->createAdminUser();

        $token = $this->loginToken('operator01');

        $create = $this->withToken($token)->postJson('/api/admin/tahun-ajaran', [
            'nama_tahun_ajaran' => '2026/2027',
            'semester' => 'ganjil',
            'tanggal_mulai' => '2026-07-01',
            'tanggal_selesai' => '2027-06-30',
            'is_aktif' => true,
            'keterangan' => 'Tahun ajaran baru',
        ]);

        $create->assertCreated();
        $create->assertJsonPath('nama_tahun_ajaran', '2026/2027');
        $create->assertJsonPath('semester', 'ganjil');

        $tahunAjaran = TahunAjaran::query()->firstOrFail();

        $update = $this->withToken($token)->patchJson('/api/admin/tahun-ajaran/' . $tahunAjaran->id_tahun_ajaran, [
            'keterangan' => 'Sudah diperbarui',
        ]);

        $update->assertOk();
        $update->assertJsonPath('keterangan', 'Sudah diperbarui');

        $list = $this->withToken($token)->getJson('/api/admin/tahun-ajaran');
        $list->assertOk();
        $list->assertJsonFragment(['nama_tahun_ajaran' => '2026/2027']);

        $delete = $this->withToken($token)->deleteJson('/api/admin/tahun-ajaran/' . $tahunAjaran->id_tahun_ajaran);
        $delete->assertNoContent();
    }

    public function test_admin_can_create_mata_pelajaran_with_limited_tingkat_values(): void
    {
        $this->createAdminUser();
        $token = $this->loginToken('operator01');

        $create = $this->withToken($token)->postJson('/api/admin/mata-pelajaran', [
            'nama_mapel' => 'Matematika',
            'tingkat' => 'XI',
        ]);

        $create->assertCreated();
        $create->assertJsonPath('tingkat', 'XI');

        $invalid = $this->withToken($token)->postJson('/api/admin/mata-pelajaran', [
            'nama_mapel' => 'Fisika',
            'tingkat' => 'XIV',
        ]);

        $invalid->assertStatus(422);
        $invalid->assertJsonValidationErrors(['tingkat']);
    }

    public function test_bulk_import_creates_guru_and_siswa_accounts_from_excel(): void
    {
        $this->createAdminUser();
        $token = $this->loginToken('operator01');

        $filePath = $this->makeExcelFixture([
            ['role', 'nama_lengkap', 'nip', 'nisn'],
            ['guru', 'Guru Excel', '198801012026010099', ''],
            ['siswa', 'Siswa Excel', '', '1234567899'],
        ]);

        $upload = UploadedFile::fake()->createWithContent('akun.xlsx', file_get_contents($filePath));

        $response = $this->withToken($token)->post('/api/admin/pengguna/bulk-import', [
            'file' => $upload,
            'default_role' => 'guru',
        ]);

        $response->assertOk();
        $response->assertJsonPath('created', 2);
        $response->assertJsonPath('default_password', 'SIA@12345');

        $this->assertDatabaseHas('pengguna', [
            'username' => '198801012026010099',
            'role' => 'guru',
        ]);

        $this->assertDatabaseHas('pengguna', [
            'username' => '1234567899',
            'role' => 'siswa',
        ]);

        $this->assertDatabaseHas('guru', [
            'nip' => '198801012026010099',
            'nama_lengkap' => 'Guru Excel',
        ]);

        $this->assertDatabaseHas('siswa', [
            'nisn' => '1234567899',
            'nama_lengkap' => 'Siswa Excel',
        ]);

        $loginGuru = $this->postJson('/api/auth/login', [
            'username' => '198801012026010099',
            'password' => 'SIA@12345',
        ]);

        $loginGuru->assertOk();

        $loginSiswa = $this->postJson('/api/auth/login', [
            'username' => '1234567899',
            'password' => 'SIA@12345',
        ]);

        $loginSiswa->assertOk();
    }

    public function test_bulk_import_skips_duplicate_nip_and_nisn_rows(): void
    {
        $this->createAdminUser();
        $token = $this->loginToken('operator01');

        $existingGuruUser = Pengguna::create([
            'username' => '198801012026010099',
            'password' => 'secret123',
            'role' => 'guru',
        ]);

        $existingGuruUser->guru()->create([
            'nama_lengkap' => 'Guru Lama',
            'nip' => '198801012026010099',
        ]);

        $existingSiswaUser = Pengguna::create([
            'username' => '1234567899',
            'password' => 'secret123',
            'role' => 'siswa',
        ]);

        $existingSiswaUser->siswa()->create([
            'nama_lengkap' => 'Siswa Lama',
            'nisn' => '1234567899',
        ]);

        $filePath = $this->makeExcelFixture([
            ['role', 'nama_lengkap', 'nip', 'nisn'],
            ['guru', 'Guru Duplikat', '198801012026010099', ''],
            ['siswa', 'Siswa Duplikat', '', '1234567899'],
        ]);

        $upload = UploadedFile::fake()->createWithContent('duplikat.xlsx', file_get_contents($filePath));

        $response = $this->withToken($token)->post('/api/admin/pengguna/bulk-import', [
            'file' => $upload,
            'default_role' => 'guru',
        ]);

        $response->assertOk();
        $response->assertJsonPath('created', 0);
        $response->assertJsonPath('skipped', 2);
        $response->assertJsonCount(2, 'skipped_rows');

        $this->assertDatabaseHas('guru', [
            'nip' => '198801012026010099',
            'nama_lengkap' => 'Guru Lama',
        ]);

        $this->assertDatabaseHas('siswa', [
            'nisn' => '1234567899',
            'nama_lengkap' => 'Siswa Lama',
        ]);
    }

    public function test_admin_can_manage_kelas_siswa_relations(): void
    {
        $this->createAdminUser();
        $token = $this->loginToken('operator01');

        $guruUser = Pengguna::create([
            'username' => '198801012026010777',
            'password' => 'secret123',
            'role' => 'guru',
        ]);
        $guru = $guruUser->guru()->create([
            'nama_lengkap' => 'Guru Wali Uji',
            'nip' => '198801012026010777',
        ]);

        $siswaUser = Pengguna::create([
            'username' => '1234500011',
            'password' => 'secret123',
            'role' => 'siswa',
        ]);
        $siswa = $siswaUser->siswa()->create([
            'nama_lengkap' => 'Siswa Uji',
            'nisn' => '1234500011',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->id_guru,
            'nama_kelas' => 'XI IPA Uji',
            'tahun_ajaran' => '2026/2027 - Semester Ganjil',
        ]);

        $create = $this->withToken($token)->postJson('/api/admin/kelas-siswa', [
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswa->id_siswa,
            'is_aktif' => true,
            'tanggal_masuk' => '2026-07-10',
        ]);

        $create->assertCreated();
        $create->assertJsonPath('id_kelas', $kelas->id_kelas);
        $create->assertJsonPath('id_siswa', $siswa->id_siswa);

        $idRelasi = $create->json('id_kelas_siswa');

        $update = $this->withToken($token)->patchJson('/api/admin/kelas-siswa/' . $idRelasi, [
            'is_aktif' => false,
            'tanggal_keluar' => '2026-12-20',
        ]);

        $update->assertOk();
        $update->assertJsonPath('is_aktif', false);

        $list = $this->withToken($token)->getJson('/api/admin/kelas-siswa');
        $list->assertOk();
        $list->assertJsonFragment(['id_kelas_siswa' => $idRelasi]);

        $delete = $this->withToken($token)->deleteJson('/api/admin/kelas-siswa/' . $idRelasi);
        $delete->assertNoContent();
    }

    public function test_admin_can_manage_penugasan_pembelajaran_relations(): void
    {
        $this->createAdminUser();
        $token = $this->loginToken('operator01');

        $guruUser = Pengguna::create([
            'username' => '198801012026010778',
            'password' => 'secret123',
            'role' => 'guru',
        ]);
        $guru = $guruUser->guru()->create([
            'nama_lengkap' => 'Guru Pengampu Uji',
            'nip' => '198801012026010778',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->id_guru,
            'nama_kelas' => 'XI IPS Uji',
            'tahun_ajaran' => '2026/2027 - Semester Ganjil',
        ]);

        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Sejarah',
            'tingkat' => 'XI',
        ]);

        $create = $this->withToken($token)->postJson('/api/admin/penugasan-pembelajaran', [
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->id_guru,
            'is_aktif' => true,
        ]);

        $create->assertCreated();
        $create->assertJsonPath('id_kelas', $kelas->id_kelas);
        $create->assertJsonPath('id_mapel', $mapel->id_mapel);
        $create->assertJsonPath('id_guru', $guru->id_guru);

        $idRelasi = $create->json('id_penugasan_pembelajaran');

        $update = $this->withToken($token)->patchJson('/api/admin/penugasan-pembelajaran/' . $idRelasi, [
            'is_aktif' => false,
        ]);

        $update->assertOk();
        $update->assertJsonPath('is_aktif', false);

        $list = $this->withToken($token)->getJson('/api/admin/penugasan-pembelajaran');
        $list->assertOk();
        $list->assertJsonFragment(['id_penugasan_pembelajaran' => $idRelasi]);

        $delete = $this->withToken($token)->deleteJson('/api/admin/penugasan-pembelajaran/' . $idRelasi);
        $delete->assertNoContent();
    }

    public function test_admin_can_bulk_import_kelas_siswa_relations(): void
    {
        $this->createAdminUser();
        $token = $this->loginToken('operator01');

        $guruUser = Pengguna::create([
            'username' => '198801012026010779',
            'password' => 'secret123',
            'role' => 'guru',
        ]);
        $guru = $guruUser->guru()->create([
            'nama_lengkap' => 'Guru Import Uji',
            'nip' => '198801012026010779',
        ]);

        $siswaUser = Pengguna::create([
            'username' => '1234500012',
            'password' => 'secret123',
            'role' => 'siswa',
        ]);
        $siswa = $siswaUser->siswa()->create([
            'nama_lengkap' => 'Siswa Import Uji',
            'nisn' => '1234500012',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->id_guru,
            'nama_kelas' => 'XI IPA Import',
            'tahun_ajaran' => '2026/2027',
        ]);

        $filePath = $this->makeExcelFixture([
            ['id_kelas', 'id_siswa', 'tahun_ajaran', 'is_aktif', 'tanggal_masuk', 'tanggal_keluar'],
            [$kelas->id_kelas, $siswa->id_siswa, '2026/2027', true, '2026-07-10', ''],
            [$kelas->id_kelas, $siswa->id_siswa, '2026/2027', false, '2026-07-10', '2026-12-20'],
        ]);

        $upload = UploadedFile::fake()->createWithContent('kelas-siswa.xlsx', file_get_contents($filePath));

        $response = $this->withToken($token)->post('/api/admin/kelas-siswa/bulk-import', [
            'file' => $upload,
        ]);

        $response->assertOk();
        $response->assertJsonPath('created', 1);
        $response->assertJsonPath('updated', 1);

        $this->assertDatabaseCount('kelas_siswa', 1);
        $this->assertDatabaseHas('kelas_siswa', [
            'id_kelas' => $kelas->id_kelas,
            'id_siswa' => $siswa->id_siswa,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => 0,
            'tanggal_keluar' => '2026-12-20 00:00:00',
        ]);
    }

    public function test_admin_can_bulk_import_penugasan_pembelajaran_relations(): void
    {
        $this->createAdminUser();
        $token = $this->loginToken('operator01');

        $guruUser = Pengguna::create([
            'username' => '198801012026010780',
            'password' => 'secret123',
            'role' => 'guru',
        ]);
        $guru = $guruUser->guru()->create([
            'nama_lengkap' => 'Guru Mapel Import',
            'nip' => '198801012026010780',
        ]);

        $kelas = Kelas::create([
            'id_guru_wali' => $guru->id_guru,
            'nama_kelas' => 'XI IPS Import',
            'tahun_ajaran' => '2026/2027',
        ]);

        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Ekonomi',
            'tingkat' => 'XI',
        ]);

        $filePath = $this->makeExcelFixture([
            ['id_kelas', 'id_mapel', 'id_guru', 'tahun_ajaran', 'is_aktif'],
            [$kelas->id_kelas, $mapel->id_mapel, $guru->id_guru, '2026/2027', true],
            [$kelas->id_kelas, $mapel->id_mapel, $guru->id_guru, '2026/2027', false],
        ]);

        $upload = UploadedFile::fake()->createWithContent('penugasan.xlsx', file_get_contents($filePath));

        $response = $this->withToken($token)->post('/api/admin/penugasan-pembelajaran/bulk-import', [
            'file' => $upload,
        ]);

        $response->assertOk();
        $response->assertJsonPath('created', 1);
        $response->assertJsonPath('updated', 1);

        $this->assertDatabaseCount('penugasan_pembelajaran', 1);
        $this->assertDatabaseHas('penugasan_pembelajaran', [
            'id_kelas' => $kelas->id_kelas,
            'id_mapel' => $mapel->id_mapel,
            'id_guru' => $guru->id_guru,
            'tahun_ajaran' => '2026/2027',
            'is_aktif' => 0,
        ]);
    }

    public function test_admin_can_download_kelas_siswa_template_files(): void
    {
        $this->createAdminUser();
        $token = $this->loginToken('operator01');

        $csv = $this->withToken($token)->get('/api/admin/import-templates/kelas-siswa/csv');

        $csv->assertOk();
        $csv->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $csv->assertHeader('content-disposition', 'attachment; filename=template-relasi-siswa-kelas.csv');

        $xlsx = $this->withToken($token)->get('/api/admin/import-templates/kelas-siswa/xlsx');

        $xlsx->assertOk();
        $xlsx->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $xlsx->assertHeader('content-disposition', 'attachment; filename=template-relasi-siswa-kelas.xlsx');
    }

    public function test_admin_can_download_penugasan_template_files(): void
    {
        $this->createAdminUser();
        $token = $this->loginToken('operator01');

        $csv = $this->withToken($token)->get('/api/admin/import-templates/penugasan-pembelajaran/csv');

        $csv->assertOk();
        $csv->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $csv->assertHeader('content-disposition', 'attachment; filename=template-penugasan-pembelajaran.csv');

        $xlsx = $this->withToken($token)->get('/api/admin/import-templates/penugasan-pembelajaran/xlsx');

        $xlsx->assertOk();
        $xlsx->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $xlsx->assertHeader('content-disposition', 'attachment; filename=template-penugasan-pembelajaran.xlsx');
    }

    protected function createAdminUser(): Pengguna
    {
        $pengguna = Pengguna::create([
            'username' => 'operator01',
            'password' => 'secret123',
            'role' => 'admin',
        ]);

        $pengguna->admin()->create([
            'nama_lengkap' => 'Operator Sekolah',
        ]);

        return $pengguna->fresh(['admin']);
    }

    protected function loginToken(string $username): string
    {
        return $this->postJson('/api/auth/login', [
            'username' => $username,
            'password' => 'secret123',
        ])->json('token');
    }

    protected function makeExcelFixture(array $rows): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        foreach ($rows as $rowIndex => $row) {
            foreach ($row as $columnIndex => $value) {
                $sheet->setCellValue(Coordinate::stringFromColumnIndex($columnIndex + 1) . ($rowIndex + 1), $value);
            }
        }

        $filePath = tempnam(sys_get_temp_dir(), 'sia_excel_') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save($filePath);

        return $filePath;
    }
}