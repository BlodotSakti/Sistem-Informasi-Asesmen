import React from 'react';
import { LayoutDashboard, User, PlayCircle, History, BookOpen, Award } from 'lucide-react';

export const siswaNavigation = [
    { label: 'Dashboard', href: '/siswa/dashboard', badge: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Profil', href: '/siswa/profil', badge: 'Data', icon: <User className="w-5 h-5" /> },
    { label: 'Sesi Aktif', href: '/siswa/sesi-aktif', badge: 'CBT', icon: <PlayCircle className="w-5 h-5" /> },
    { label: 'Riwayat CBT', href: '/siswa/riwayat-cbt', badge: 'Nilai', icon: <History className="w-5 h-5" /> },
    { label: 'Riwayat Pembelajaran', href: '/siswa/riwayat-pembelajaran', badge: 'BAP', icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Apresiasi', href: '/siswa/apresiasi', badge: 'Badge', icon: <Award className="w-5 h-5" /> },
];