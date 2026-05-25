<?php

namespace Tests\Feature\Api;

use App\Models\Guru;
use App\Models\Kelas;
use App\Models\MataPelajaran;
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