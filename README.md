# Pengembangan Sistem Informasi Asesmen Progres Belajar Siswa Berbasis Website (Studi Kasus: SMAN Sumatera Selatan)

![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-8E75FF?style=for-the-badge&logo=google-gemini&logoColor=white)

Repository ini berisi kode sumber (*source code*) untuk **Sistem Informasi Asesmen Progres Belajar Siswa** yang dikembangkan sebagai proyek **Tugas Akhir** program studi Teknik Informatika, Institut Teknologi Sumatera. Sistem ini dirancang untuk mendigitalisasi proses penilaian sekaligus memberikan analisis diagnostik otomatis berbasis kecerdasan buatan.

## 📌 Latar Belakang & Permasalahan
Proses evaluasi belajar konvensional sering kali hanya menghasilkan tumpukan angka tanpa memberikan umpan balik (*feedback*) yang mendalam mengenai peta kemampuan kognitif siswa. Sistem ini hadir untuk menyelesaikan masalah tersebut dengan memetakan hasil ujian berdasarkan **Taksonomi Bloom (C1-C6)** dan menghasilkan analisis personal secara otomatis menggunakan **Gemini AI**.

## 🚀 Fitur Utama Sistem
Sistem dibangun menggunakan arsitektur **Multi-Role (Role-Based Access Control)** yang memisahkan hak akses untuk tiga pengguna utama:

* **Admin**: Manajemen Master Data Akademik (Tahun Ajaran, Kelas, Mata Pelajaran) dan fitur *bulk import* akun Guru/Siswa via Excel.
* **Guru**: Pembuatan Bank Soal berlabel Level Kognitif (C1-C6) & Topik Materi, penjadwalan ujian CBT, pengisian Berita Acara Kelas harian, serta pemberian Catatan Privat dan Lencana (*Badge*) Apresiasi kepada siswa.
* **Siswa**: Ruang ujian CBT interaktif yang dilengkapi dengan *timer* otomatis, serta halaman *Dashboard* personal untuk memantau grafik tren nilai, histori tugas, dan dokumen analisis diagnostik.
* **AI-Powered Diagnostic Analysis**: Integrasi otomatis dengan API Gemini untuk merangkum pencapaian kognitif siswa pasca-ujian menjadi satu paragraf deskriptif terkait kekuatan dan kelemahan belajar mereka.

## 🛠️ Spesifikasi Teknologi (Tech Stack)
* **Backend:** Laravel 11 (sebagai RESTful API & REST Server)
* **Frontend:** React.js dengan Tailwind CSS (Single Page Application)
* **Database:** MySQL (Lingkungan pengembangan menggunakan Laragon)
* **AI Integration:** Google Gemini API Client for Laravel
* **State Management & Tools:** Git & GitHub untuk Version Control

