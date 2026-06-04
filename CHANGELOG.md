# Changelog

## 2026-06-03

- Added optional per-student catatan pribadi and apresiasi badges in guru BAP, linked to the saved berita acara.
- Strengthened student learning history with per-meeting note/badge details, better subject summaries, and human-readable dates.
- Fixed guru and student history tables to display formatted dates instead of raw ISO timestamps.
- Reflowed student learning-history and appreciation sections into a vertical layout.
- Added BAP edit actions, PATCH support, and success popup/toast feedback for guru create/update flows.

## 2026-05-25

- Added master data management for Tahun Ajaran with full CRUD API and admin UI.
- Connected Kelas and Mata Pelajaran CRUD to a more user-friendly admin dashboard layout.
- Implemented real Excel bulk import for Guru and Siswa accounts with automatic username extraction from NIP/NISN.
- Added automatic default password generation for imported accounts.
- Added tests for tahun ajaran CRUD and Excel import flow.
- Added sticky sidebar navigation and route-based admin pages.
- Added toast notifications for Excel import success and failure states.
- Added semester selection for Tahun Ajaran and limited mapel tingkat to X, XI, and XII.
- Added class-enrollment, teaching-assignment, and student learning-plan relations for profile-aware dashboards.
- Added admin CRUD pages and API endpoints for Siswa-Kelas placement and Guru-Mapel teaching assignments.
- Added search/filter controls and Excel/CSV bulk import for Siswa-Kelas and Guru-Mapel relation management.
- Surfaced relation counts on the admin and guru dashboards so the latest assignment data is visible at a glance.
- Added downloadable CSV/XLSX templates for Siswa-Kelas and Guru-Mapel bulk import flows.
- Split student navigation into separate route-based pages for dashboard, profile, sessions, learning plans, trends, and appreciation.
- Added dedicated guru pages for Bank Soal and Berita Acara with route-based navigation and user-friendly forms.
- Enhanced Bank Soal validation with mandatory topik materi + Bloom level (C1-C6), pilihan ganda option checks, and assignment-aware mapel validation.
- Enhanced Berita Acara with per-student attendance input, meeting evaluation/kendala notes, and strict validation requiring complete attendance for all active class students.
- Added guru workspace API endpoints to serve assignment-based options and recent Bank Soal/Berita Acara data for integrated UI flows.
- Added feature tests for new guru Bank Soal and Berita Acara behavior, plus web shell tests for new guru routes.