<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GuruController;
use App\Http\Controllers\Api\SiswaController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
	Route::get('/auth/me', [AuthController::class, 'me']);
	Route::post('/auth/logout', [AuthController::class, 'logout']);

	Route::prefix('admin')->as('api.admin.')->middleware('role:admin')->group(function (): void {
		Route::get('/dashboard-summary', [AdminController::class, 'dashboardSummary'])->name('dashboard-summary');
		Route::get('/master-data', [AdminController::class, 'masterData'])->name('master-data');

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

		Route::post('/pengguna/bulk-import', [AdminController::class, 'bulkImportPengguna'])->name('pengguna.bulk-import');
	});

	Route::prefix('guru')->as('api.guru.')->middleware('role:guru')->group(function (): void {
		Route::get('/dashboard-summary', [GuruController::class, 'dashboardSummary'])->name('dashboard-summary');
		Route::post('/bank-soal', [GuruController::class, 'bankSoalStore'])->name('bank-soal.store');
		Route::post('/sesi-asesmen', [GuruController::class, 'sesiAsesmenStore'])->name('sesi-asesmen.store');
		Route::post('/berita-acara', [GuruController::class, 'beritaAcaraStore'])->name('berita-acara.store');
		Route::post('/catatan-privat', [GuruController::class, 'catatanPrivatStore'])->name('catatan-privat.store');
		Route::post('/apresiasi', [GuruController::class, 'apresiasiStore'])->name('apresiasi.store');
		Route::get('/analisis-diagnostik', [GuruController::class, 'analisisDiagnostikIndex'])->name('analisis-diagnostik.index');
	});

	Route::prefix('siswa')->as('api.siswa.')->middleware('role:siswa')->group(function (): void {
		Route::get('/dashboard-summary', [SiswaController::class, 'dashboardSummary'])->name('dashboard-summary');
		Route::get('/sesi-asesmen/aktif', [SiswaController::class, 'activeSessions'])->name('sesi-asesmen.aktif');
		Route::post('/jawaban-siswa', [SiswaController::class, 'submitJawaban'])->name('jawaban-siswa.store');
		Route::get('/tren-nilai', [SiswaController::class, 'trendNilai'])->name('tren-nilai.index');
		Route::get('/catatan-privat', [SiswaController::class, 'catatanPrivat'])->name('catatan-privat.index');
		Route::get('/apresiasi', [SiswaController::class, 'apresiasi'])->name('apresiasi.index');
	});
});