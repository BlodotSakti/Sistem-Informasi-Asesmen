import React from 'react';
import { LayoutDashboard, User, Users, Calendar, Database, ClipboardCheck } from 'lucide-react';

export const guruNavigation = [
    { label: 'Dashboard', href: '/guru/dashboard', badge: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Profil', href: '/guru/profil', badge: 'Akun', icon: <User className="w-5 h-5" /> },
    { label: 'Daftar Siswa', href: '/guru/siswa', badge: 'Data', icon: <Users className="w-5 h-5" /> },
    { label: 'Jadwal CBT', href: '/guru/jadwal-cbt', badge: 'Ujian', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Bank Soal', href: '/guru/bank-soal', badge: 'Soal', icon: <Database className="w-5 h-5" /> },
    { label: 'Berita Acara', href: '/guru/berita-acara', badge: 'Presensi', icon: <ClipboardCheck className="w-5 h-5" /> },
];
