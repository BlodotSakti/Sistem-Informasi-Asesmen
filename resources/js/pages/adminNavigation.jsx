import React from 'react';
import { 
    LayoutDashboard, 
    Users, 
    CalendarDays, 
    School, 
    BookOpen, 
    UserPlus, 
    Network, 
    Map, 
    Database, 
    FileUp,
    HardDriveDownload
} from 'lucide-react';

export const adminNavigation = [
    { label: 'Dashboard', href: '/admin/dashboard', badge: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Akun Pengguna', href: '/admin/pengguna', badge: 'CRUD', icon: <Users className="w-5 h-5" /> },
    { label: 'Tahun Ajaran', href: '/admin/tahun-ajaran', badge: 'Master', icon: <CalendarDays className="w-5 h-5" /> },
    { label: 'Kelas', href: '/admin/kelas', badge: 'CRUD', icon: <School className="w-5 h-5" /> },
    { label: 'Mata Pelajaran', href: '/admin/mata-pelajaran', badge: 'CRUD', icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Penempatan Siswa', href: '/admin/kelas-siswa', badge: 'Relasi', icon: <UserPlus className="w-5 h-5" /> },
    { label: 'Penugasan Guru', href: '/admin/penugasan-pembelajaran', badge: 'Relasi', icon: <Network className="w-5 h-5" /> },
    { label: 'Pemetaan Akademik', href: '/admin/pemetaan-akademik', badge: 'Lihat', icon: <Map className="w-5 h-5" /> },
    { label: 'Bank Soal', href: '/admin/bank-soal', badge: 'Pool', icon: <Database className="w-5 h-5" /> },
    { label: 'Import Akun', href: '/admin/import-akun', badge: 'Excel', icon: <FileUp className="w-5 h-5" /> },
    { label: 'Backup & Restore', href: '/admin/backup', badge: 'Data', icon: <HardDriveDownload className="w-5 h-5" /> },
];
