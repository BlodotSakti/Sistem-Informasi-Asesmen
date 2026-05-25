# Changelog

## [Unreleased] - 2026-05-25

### Added

- Master data Tahun Ajaran dengan API CRUD penuh.
- CRUD master data untuk Kelas.
- CRUD master data untuk Mata Pelajaran.
- Bulk import akun Guru dan Siswa dari file Excel.
- Otomatisasi username berdasarkan NIP untuk Guru dan NISN untuk Siswa.
- Default password otomatis untuk akun hasil import.
- Toggle tampil/sembunyi password pada halaman login.
- Panel dashboard admin, guru, dan siswa yang terhubung ke data API.
- Daftar sesi aktif siswa pada dashboard siswa.
- Daftar analisis diagnostik terbaru pada dashboard guru.

### Changed

- Dashboard admin diperbarui agar lebih informatif dan ramah operator sekolah.
- Tampilan manajemen data induk dirapikan agar lebih mudah dipakai.
- Widget lo-fi pada dashboard diganti dengan data yang lebih hidup dan relevan.
- Endpoint API dashboard diperluas untuk mendukung kebutuhan frontend React.

### Validation

- Feature test untuk CRUD Tahun Ajaran.
- Feature test untuk bulk import akun dari Excel.
- Feature test untuk dashboard summary admin, guru, dan siswa.
- Build frontend Vite berhasil.
