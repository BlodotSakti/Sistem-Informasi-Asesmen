# CHANGELOG

## [Unreleased]
### Fixed
- **Bug Fix: Skor melebihi 100** — Perbaikan bug dimana skor siswa bisa melebihi total bobot (misal 115/100) karena data jawaban duplikat di tabel `jawaban_siswa`. Akar masalah: tidak ada unique constraint pada `(id_siswa, id_detail)`, sehingga submit ganda bisa menghasilkan record duplikat.
  - Menambahkan migration `unique index` pada kolom `(id_siswa, id_detail)` di tabel `jawaban_siswa`.
  - Menambahkan deduplikasi input jawaban sebelum proses di `SiswaController@cbtSubmit`.
  - Data duplikat yang sudah ada di database telah dibersihkan.
### Added
- **Integrasi Gemini AI — Analisis Diagnostik Otomatis**: Setelah siswa submit CBT, sistem otomatis mengirim rekap jawaban (per Level Kognitif C1-C6 dan Topik Materi) ke Gemini AI untuk menghasilkan narasi deskriptif kekuatan dan kelemahan siswa. Narasi tersimpan di tabel `analisis_diagnostik` dan ditampilkan di:
  - Halaman Hasil CBT (setelah submit)
  - Riwayat CBT (review) dengan badge "🤖 AI"
  - Sisi Guru (Detail Sesi CBT → Lihat Jawaban siswa)
  - Komponen reusable `AnalisisDiagnostikCard.jsx` menampilkan narasi + progress bar per level kognitif Bloom.
  - Termasuk unit test baru pada `SiswaCbtPage.test.jsx` dan `SiswaCbtHistoryPage.test.jsx`.
- **UI Update (Siswa)**: Visualisasi Grafik Tren Nilai Interaktif di menu Tren Nilai (`SiswaTrendPage.jsx`). Menggunakan library `recharts` untuk menampilkan grafik Area Chart yang mendukung *hover* dan *tooltip* dinamis. Termasuk pengujian unit yang komprehensif (`SiswaTrendPage.test.jsx`).
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
- **Halaman Ringkasan Mengajar (Guru)**: Halaman baru `/guru/siswa` yang menampilkan daftar kelas, mata pelajaran yang diampu, serta daftar lengkap siswa (Nama Lengkap & NISN) dalam setiap kelas yang diajar. Tampilan *user-friendly* dan responsif menggunakan pola Master-Detail (Tabs/Sidebar Kelas di kiri, Daftar Siswa di kanan).
- **Update Tabel Berita Acara (Guru)**: Mengubah tampilan kolom "Catatan / Badge" agar memunculkan **Nama Siswa** yang sebenarnya, alih-alih sekadar "Siswa [ID]". Memanfaatkan dictionary mapping dari `students_by_class`.
- **Backend API (Siswa)**: Endpoint `cbtSaveAnswer`, `cbtHistory`, `cbtReview` di `SiswaController`.
- **Backend API (Guru)**: Endpoint `sesiAsesmenDetail` di `GuruController`.
- **Testing**: 20 tests across 4 test files (`SiswaCbtPage.test.jsx`, `SiswaCbtHistoryPage.test.jsx`, `GuruSesiDetail.test.jsx`, `GuruSesiAsesmen.test.jsx`).
- **Kontrol Pengerjaan Ulang CBT**: Guru dapat mengaktifkan/menonaktifkan opsi "Boleh Dikerjakan Ulang" saat membuat atau mengedit jadwal CBT via toggle switch. Kolom baru `boleh_ulang` ditambahkan ke tabel `sesi_asesmen` (migration).
- **Pembatasan Pengerjaan Siswa**: Jika `boleh_ulang` tidak aktif, siswa yang sudah mengerjakan akan melihat status "Selesai" dan tombol "Sudah Dikerjakan" (disabled) di Sesi Aktif. Jika siswa mencoba mengakses URL langsung, halaman menampilkan pesan khusus "Ujian Sudah Dikerjakan" dengan link ke Riwayat CBT. Jika `boleh_ulang` aktif, siswa dapat mengerjakan ulang melalui tombol "Kerjakan Ulang".
- **UI Guru (Jadwal CBT)**: Kolom "Ulang" ditambahkan di tabel Riwayat Jadwal CBT dengan badge "Boleh" (biru) atau "Sekali" (abu-abu).
### Fixed
- **Bug Fix**: Memperbaiki issue `(data.jawaban_tersimpan || []).forEach is not a function` saat halaman di-refresh. Method `cbtData` sekarang menggunakan `->values()` agar response JSON yang dihasilkan merupakan array sekuensial (bukan object).
- **Bug Fix**: Memperbaiki sistem penilaian auto-save di method `cbtSaveAnswer` agar jawaban siswa saat progres ujian dinilai secara real-time, bukan default `0`. Guru kini dapat melihat skor sebenarnya secara real-time di monitoring CBT meskipun siswa belum submit ujian secara final.