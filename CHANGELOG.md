# Changelog

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