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