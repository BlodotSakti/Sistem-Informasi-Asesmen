<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\GuruController;
use App\Http\Controllers\Api\SiswaController;
use App\Http\Controllers\Api\AcademicMappingController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
	Route::middleware('active')->group(function (): void {
		Route::get('/auth/me', [AuthController::class, 'me']);
		Route::post('/auth/logout', [AuthController::class, 'logout']);
		Route::post('/auth/profile', [ProfileController::class, 'update']);

		Route::prefix('admin')->as('api.admin.')->middleware('role:admin')->group(function (): void {
			Route::get('/dashboard-summary', [AdminController::class, 'dashboardSummary'])->name('dashboard-summary');
			Route::get('/master-data', [AdminController::class, 'masterData'])->name('master-data');
			Route::get('/academic-mapping', [AcademicMappingController::class, 'index'])->name('academic-mapping');

			Route::get('/pengguna', [AdminController::class, 'penggunaIndex'])->name('pengguna.index');
			Route::post('/pengguna', [AdminController::class, 'penggunaStore'])->name('pengguna.store');
			Route::get('/pengguna/{pengguna}', [AdminController::class, 'penggunaShow'])->name('pengguna.show');
			Route::patch('/pengguna/{pengguna}', [AdminController::class, 'penggunaUpdate'])->name('pengguna.update');
			Route::patch('/pengguna/{pengguna}/arsip', [AdminController::class, 'penggunaArchive'])->name('pengguna.archive');
			Route::patch('/pengguna/{pengguna}/aktifkan', [AdminController::class, 'penggunaRestore'])->name('pengguna.restore');
			Route::delete('/pengguna/{pengguna}', [AdminController::class, 'penggunaDestroy'])->name('pengguna.destroy');
			Route::post('/pengguna/bulk-import', [AdminController::class, 'bulkImportPengguna'])->name('pengguna.bulk-import');

			Route::get('/tahun-ajaran', [AdminController::class, 'tahunAjaranIndex'])->name('tahun-ajaran.index');
			Route::post('/tahun-ajaran', [AdminController::class, 'tahunAjaranStore'])->name('tahun-ajaran.store');
			Route::get('/tahun-ajaran/{tahunAjaran}', [AdminController::class, 'tahunAjaranShow'])->name('tahun-ajaran.show');
			Route::patch('/tahun-ajaran/{tahunAjaran}', [AdminController::class, 'tahunAjaranUpdate'])->name('tahun-ajaran.update');
			Route::delete('/tahun-ajaran/{tahunAjaran}', [AdminController::class, 'tahunAjaranDestroy'])->name('tahun-ajaran.destroy');

			Route::get('/kelas', [AdminController::class, 'kelasIndex'])->name('kelas.index');
			Route::post('/kelas', [AdminController::class, 'kelasStore'])->name('kelas.store');
			Route::get('/kelas/{kelas}', [AdminController::class, 'kelasShow'])->name('kelas.show');
			Route::patch('/kelas/{kelas}', [AdminController::class, 'kelasUpdate'])->name('kelas.update');
			Route::delete('/kelas/{kelas}', [AdminController::class, 'kelasDestroy'])->name('kelas.destroy');

			Route::get('/mata-pelajaran', [AdminController::class, 'mataPelajaranIndex'])->name('mata-pelajaran.index');
			Route::post('/mata-pelajaran', [AdminController::class, 'mataPelajaranStore'])->name('mata-pelajaran.store');
			Route::get('/mata-pelajaran/{mataPelajaran}', [AdminController::class, 'mataPelajaranShow'])->name('mata-pelajaran.show');
			Route::patch('/mata-pelajaran/{mataPelajaran}', [AdminController::class, 'mataPelajaranUpdate'])->name('mata-pelajaran.update');
			Route::delete('/mata-pelajaran/{mataPelajaran}', [AdminController::class, 'mataPelajaranDestroy'])->name('mata-pelajaran.destroy');

			Route::get('/kelas-siswa', [AdminController::class, 'kelasSiswaIndex'])->name('kelas-siswa.index');
			Route::post('/kelas-siswa', [AdminController::class, 'kelasSiswaStore'])->name('kelas-siswa.store');
			Route::post('/kelas-siswa/bulk-import', [AdminController::class, 'kelasSiswaBulkImport'])->name('kelas-siswa.bulk-import');
			Route::get('/kelas-siswa/{kelasSiswa}', [AdminController::class, 'kelasSiswaShow'])->name('kelas-siswa.show');
			Route::patch('/kelas-siswa/{kelasSiswa}', [AdminController::class, 'kelasSiswaUpdate'])->name('kelas-siswa.update');
			Route::delete('/kelas-siswa/{kelasSiswa}', [AdminController::class, 'kelasSiswaDestroy'])->name('kelas-siswa.destroy');

			Route::get('/penugasan-pembelajaran', [AdminController::class, 'penugasanPembelajaranIndex'])->name('penugasan-pembelajaran.index');
			Route::post('/penugasan-pembelajaran', [AdminController::class, 'penugasanPembelajaranStore'])->name('penugasan-pembelajaran.store');
			Route::post('/penugasan-pembelajaran/bulk-import', [AdminController::class, 'penugasanPembelajaranBulkImport'])->name('penugasan-pembelajaran.bulk-import');
			Route::get('/penugasan-pembelajaran/{penugasanPembelajaran}', [AdminController::class, 'penugasanPembelajaranShow'])->name('penugasan-pembelajaran.show');
			Route::patch('/penugasan-pembelajaran/{penugasanPembelajaran}', [AdminController::class, 'penugasanPembelajaranUpdate'])->name('penugasan-pembelajaran.update');
			Route::delete('/penugasan-pembelajaran/{penugasanPembelajaran}', [AdminController::class, 'penugasanPembelajaranDestroy'])->name('penugasan-pembelajaran.destroy');
			Route::get('/import-templates/{type}/{format}', [AdminController::class, 'importTemplate'])->name('import-templates.show');
		});

		Route::prefix('guru')->as('api.guru.')->middleware('role:guru')->group(function (): void {
			Route::get('/dashboard-summary', [GuruController::class, 'dashboardSummary'])->name('dashboard-summary');
			Route::get('/workspace-data', [GuruController::class, 'workspaceData'])->name('workspace-data');
			Route::get('/bank-soal', [GuruController::class, 'bankSoalIndex'])->name('bank-soal.index');
			Route::post('/bank-soal', [GuruController::class, 'bankSoalStore'])->name('bank-soal.store');
			Route::patch('/bank-soal/{id_soal}', [GuruController::class, 'bankSoalUpdate'])->name('bank-soal.update');
			Route::delete('/bank-soal/{id_soal}', [GuruController::class, 'bankSoalDestroy'])->name('bank-soal.destroy');
			Route::get('/sesi-asesmen', [GuruController::class, 'sesiAsesmenIndex'])->name('sesi-asesmen.index');
			Route::post('/sesi-asesmen', [GuruController::class, 'sesiAsesmenStore'])->name('sesi-asesmen.store');
			Route::patch('/sesi-asesmen/{id_sesi}', [GuruController::class, 'sesiAsesmenUpdate'])->name('sesi-asesmen.update');
			Route::delete('/sesi-asesmen/{id_sesi}', [GuruController::class, 'sesiAsesmenDestroy'])->name('sesi-asesmen.destroy');
			Route::get('/sesi-asesmen/{id_sesi}/detail', [GuruController::class, 'sesiAsesmenDetail'])->name('sesi-asesmen.detail');
			Route::get('/berita-acara', [GuruController::class, 'beritaAcaraIndex'])->name('berita-acara.index');
			Route::post('/berita-acara', [GuruController::class, 'beritaAcaraStore'])->name('berita-acara.store');
			Route::patch('/berita-acara/{id_berita_acara}', [GuruController::class, 'beritaAcaraUpdate'])->name('berita-acara.update');
			Route::post('/catatan-privat', [GuruController::class, 'catatanPrivatStore'])->name('catatan-privat.store');
			Route::post('/apresiasi', [GuruController::class, 'apresiasiStore'])->name('apresiasi.store');
			Route::get('/analisis-diagnostik', [GuruController::class, 'analisisDiagnostikIndex'])->name('analisis-diagnostik.index');
		});

		Route::prefix('siswa')->as('api.siswa.')->middleware('role:siswa')->group(function (): void {
			Route::get('/dashboard-summary', [SiswaController::class, 'dashboardSummary'])->name('dashboard-summary');
			Route::get('/sesi-asesmen/aktif', [SiswaController::class, 'activeSessions'])->name('sesi-asesmen.aktif');
			Route::post('/jawaban-siswa', [SiswaController::class, 'submitJawaban'])->name('jawaban-siswa.store');
			Route::get('/tren-nilai', [SiswaController::class, 'trendNilai'])->name('tren-nilai.index');
			Route::get('/riwayat-pembelajaran', [SiswaController::class, 'riwayatPembelajaran'])->name('riwayat-pembelajaran.index');
			Route::get('/catatan-privat', [SiswaController::class, 'catatanPrivat'])->name('catatan-privat.index');
			Route::get('/apresiasi', [SiswaController::class, 'apresiasi'])->name('apresiasi.index');
			Route::get('/rencana-belajar', [SiswaController::class, 'rencanaBelajarIndex'])->name('rencana-belajar.index');
			Route::post('/rencana-belajar', [SiswaController::class, 'rencanaBelajarStore'])->name('rencana-belajar.store');
			Route::get('/cbt/riwayat', [SiswaController::class, 'cbtHistory'])->name('cbt.history');
			Route::get('/cbt/{id_sesi}', [SiswaController::class, 'cbtData'])->name('cbt.data');
			Route::post('/cbt/{id_sesi}/submit', [SiswaController::class, 'cbtSubmit'])->name('cbt.submit');
			Route::post('/cbt/{id_sesi}/save-answer', [SiswaController::class, 'cbtSaveAnswer'])->name('cbt.save-answer');
			Route::get('/cbt/{id_sesi}/review', [SiswaController::class, 'cbtReview'])->name('cbt.review');
		});
    });
});