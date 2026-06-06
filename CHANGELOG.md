# CHANGELOG

## [Unreleased]
### Added
- **Backend API**: Added `cbtData` and `cbtSubmit` endpoints in `SiswaController` to fetch CBT session questions and auto-submit student answers. Support for partial points in complex multiple choice questions (pilihan_ganda_kompleks) has been added.
- **Backend API**: Added `bankSoalStore` and `sesiAsesmenStore` in `GuruController` to support transactional session creation.
- **Database**: Added `pilihan_ganda_kompleks` enum to `bank_soal` table.
- **Frontend Page (Siswa)**: Created `SiswaCbtPage.jsx` component representing the CBT execution interface.
  - Features: Multiple choice, complex multiple choice (checkboxes), and essay handling. Question palette with status indicators (Unanswered, Answered, Active), Countdown Timer, Auto-submit on timeout.
  - Security: Basic browser lockdown (disables right-click, alerts on tab change).
- **Frontend Routing**: Added `/siswa/cbt/:id` route in `app.jsx` and `web.php`.
- **UI Update (Siswa)**: Added "Kerjakan" button in `SiswaSessionsPage.jsx` to navigate to active exams.
- **UI Update (Guru)**: Modifikasi `Bank Soal` mode for `pilihan_ganda_kompleks` options. Added Modal "Buat Jadwal CBT" to combine multiple questions into one session.
- **Testing**: Configured Vitest and React Testing Library setup in `vite.config.js` and `package.json`. Added `SiswaCbtPage.test.jsx` and `GuruSesiAsesmen.test.jsx`.
- **Persistensi Jawaban CBT**: Jawaban siswa tersimpan otomatis ke `localStorage` dan auto-save ke backend (`POST /api/siswa/cbt/{id_sesi}/save-answer`) setiap 2 detik. Jawaban tidak hilang saat halaman di-refresh.
- **Tampilan Hasil Nilai Setelah Submit**: Setelah submit, halaman CBT menampilkan skor total, persentase, jumlah benar/salah, dan ringkasan per soal dengan jawaban benar vs jawaban siswa.
- **Halaman Riwayat CBT (Siswa)**: Halaman baru `/siswa/riwayat-cbt` menampilkan daftar semua CBT yang pernah dikerjakan, skor, dan fitur Review per soal dengan jawaban siswa, kunci jawaban benar, dan indikator benar/salah.
- **Monitoring CBT (Guru)**: Tombol "Detail" di Jadwal CBT (`GET /api/guru/sesi-asesmen/{id_sesi}/detail`) membuka modal monitoring lengkap: statistik (rata-rata, tertinggi, terendah), daftar soal & kunci, status pengerjaan siswa (sudah/belum), skor, dan detail jawaban per siswa.
- **Backend API (Siswa)**: Endpoint `cbtSaveAnswer`, `cbtHistory`, `cbtReview` di `SiswaController`.
- **Backend API (Guru)**: Endpoint `sesiAsesmenDetail` di `GuruController`.
- **Testing**: 20 tests across 4 test files (`SiswaCbtPage.test.jsx`, `SiswaCbtHistoryPage.test.jsx`, `GuruSesiDetail.test.jsx`, `GuruSesiAsesmen.test.jsx`).
### Fixed
- **Bug Fix**: Memperbaiki issue `(data.jawaban_tersimpan || []).forEach is not a function` saat halaman di-refresh. Method `cbtData` sekarang menggunakan `->values()` agar response JSON yang dihasilkan merupakan array sekuensial (bukan object).
- **Bug Fix**: Memperbaiki sistem penilaian auto-save di method `cbtSaveAnswer` agar jawaban siswa saat progres ujian dinilai secara real-time, bukan default `0`. Guru kini dapat melihat skor sebenarnya secara real-time di monitoring CBT meskipun siswa belum submit ujian secara final.