import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import LoginPage from './pages/LoginPage';
import AdminAcademicMappingPage from './pages/AdminAcademicMappingPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminBankSoalPage from './pages/AdminBankSoalPage';
import AdminBackupPage from './pages/AdminBackupPage';
import AdminPenggunaPage from './pages/AdminPenggunaPage';
import AdminTahunAjaranPage from './pages/AdminTahunAjaranPage';
import AdminKelasPage from './pages/AdminKelasPage';
import AdminMataPelajaranPage from './pages/AdminMataPelajaranPage';
import AdminPenempatanSiswaPage from './pages/AdminPenempatanSiswaPage';
import AdminPenugasanGuruPage from './pages/AdminPenugasanGuruPage';
import GuruDashboard from './pages/GuruDashboard';
import GuruJadwalCbtPage from './pages/GuruJadwalCbtPage';
import GuruBankSoalPage from './pages/GuruBankSoalPage';
import GuruBeritaAcaraPage from './pages/GuruBeritaAcaraPage';
import SiswaDashboard from './pages/SiswaDashboard';
import SiswaProfilePage from './pages/SiswaProfilePage';
import SiswaSessionsPage from './pages/SiswaSessionsPage';
import SiswaLearningHistoryPage from './pages/SiswaLearningHistoryPage';
import SiswaAppreciationPage from './pages/SiswaAppreciationPage';
import SiswaCbtPage from './pages/SiswaCbtPage';
import SiswaCbtHistoryPage from './pages/SiswaCbtHistoryPage';
import GuruSiswaPage from './pages/GuruSiswaPage';
import GuruProfilePage from './pages/GuruProfilePage';
import GuruLaporanDiagnostikPage from './pages/GuruLaporanDiagnostikPage';
import GuruArsipDiagnostikPage from './pages/GuruArsipDiagnostikPage';

const STORAGE_KEY = 'sia-session';

function loadSession() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
        return null;
    }
}

function saveSession(session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
}

function apiBase(path) {
    return `${window.location.origin}${path}`;
}

function App() {
    const [session, setSession] = useState(() => loadSession());
    const pathname = window.location.pathname;

    useEffect(() => {
        if (pathname === '/login' && session?.role) {
            window.location.replace(`/${session.role}/dashboard`);
            return;
        }

        const protectedRoutes = [
            '/admin/dashboard',
            '/admin/pengguna',
            '/admin/tahun-ajaran',
            '/admin/kelas',
            '/admin/mata-pelajaran',
            '/admin/kelas-siswa',
            '/admin/penugasan-pembelajaran',
            '/admin/pemetaan-akademik',
            '/admin/bank-soal',
            '/guru/dashboard',
            '/guru/jadwal-cbt',
            '/guru/bank-soal',
            '/guru/berita-acara',
            '/guru/siswa',
            '/guru/profil',
            '/guru/arsip-diagnostik',
            '/siswa/dashboard',
            '/siswa/profil',
            '/siswa/sesi-aktif',
            '/siswa/riwayat-pembelajaran',
            '/siswa/apresiasi',
            '/siswa/riwayat-cbt',
        ];

        if (protectedRoutes.includes(pathname) && !session?.token) {
            window.location.replace('/login');
            return;
        }

        if (session?.role && pathname.startsWith('/admin/') && session.role !== 'admin') {
            window.location.replace(`/${session.role}/dashboard`);
        }

        if (session?.role && pathname.startsWith('/guru/') && session.role !== 'guru') {
            window.location.replace(`/${session.role}/dashboard`);
        }

        if (session?.role && pathname.startsWith('/siswa/') && session.role !== 'siswa') {
            window.location.replace(`/${session.role}/dashboard`);
        }

        // Specific check for CBT path because it has an ID
        if (pathname.startsWith('/siswa/cbt/') && !session?.token) {
            window.location.replace('/login');
            return;
        }

        if (pathname.startsWith('/guru/laporan-diagnostik/') && !session?.token) {
            window.location.replace('/login');
            return;
        }
    }, [pathname, session]);

    const onLogin = async (credentials) => {
        const response = await fetch(apiBase('/api/auth/login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': window.__APP_CSRF__,
            },
            body: JSON.stringify(credentials),
        });

        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.message || 'Login gagal.');
        }

        const nextSession = {
            token: payload.token,
            role: payload.user.role,
            user: payload.user,
        };

        saveSession(nextSession);
        setSession(nextSession);
        window.location.replace(`/${payload.user.role}/dashboard`);
    };

    const onLogout = async () => {
        if (session?.token) {
            await fetch(apiBase('/api/auth/logout'), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${session.token}`,
                    'X-CSRF-TOKEN': window.__APP_CSRF__,
                },
            }).catch(() => null);
        }

        clearSession();
        setSession(null);
        window.location.replace('/login');
    };

    const page = useMemo(() => {
        const adminRouteMap = {
            '/admin/dashboard': 'dashboard',
            '/admin/pengguna': 'pengguna',
            '/admin/tahun-ajaran': 'tahun-ajaran',
            '/admin/kelas': 'kelas',
            '/admin/mata-pelajaran': 'mata-pelajaran',
            '/admin/kelas-siswa': 'kelas-siswa',
            '/admin/penugasan-pembelajaran': 'penugasan-pembelajaran',
            '/admin/pemetaan-akademik': 'pemetaan-akademik',
        };

        if (pathname === '/admin/pemetaan-akademik') {
            return <AdminAcademicMappingPage session={session} onLogout={onLogout} />;
        }
        if (pathname === '/admin/dashboard') {
            return <AdminDashboard session={session} onLogout={onLogout} />;
        }
        if (pathname === '/admin/pengguna') {
            return <AdminPenggunaPage session={session} onLogout={onLogout} mode="pengguna" />;
        }
        if (pathname === '/admin/tahun-ajaran') {
            return <AdminTahunAjaranPage session={session} onLogout={onLogout} />;
        }
        if (pathname === '/admin/kelas') {
            return <AdminKelasPage session={session} onLogout={onLogout} />;
        }
        if (pathname === '/admin/mata-pelajaran') {
            return <AdminMataPelajaranPage session={session} onLogout={onLogout} />;
        }
        if (pathname === '/admin/kelas-siswa') {
            return <AdminPenempatanSiswaPage session={session} onLogout={onLogout} />;
        }
        if (pathname === '/admin/penugasan-pembelajaran') {
            return <AdminPenugasanGuruPage session={session} onLogout={onLogout} />;
        }

        if (pathname === '/admin/bank-soal') {
            return <AdminBankSoalPage session={session} onLogout={onLogout} />;
        }

        if (pathname === '/admin/backup') {
            return <AdminBackupPage session={session} onLogout={onLogout} />;
        }

        if (pathname === '/guru/dashboard') {
            return <GuruDashboard session={session} onLogout={onLogout} />;
        }

        if (pathname === '/guru/jadwal-cbt') {
            return <GuruJadwalCbtPage session={session} onLogout={onLogout} />;
        }

        if (pathname === '/guru/bank-soal') {
            return <GuruBankSoalPage session={session} onLogout={onLogout} />;
        }

        if (pathname === '/guru/berita-acara') {
            return <GuruBeritaAcaraPage session={session} onLogout={onLogout} />;
        }

        if (pathname === '/guru/siswa') return <GuruSiswaPage session={session} onLogout={onLogout} />;

        if (pathname === '/guru/profil') {
            return <GuruProfilePage session={session} onLogout={onLogout} />;
        }

        if (pathname === '/guru/arsip-diagnostik') {
            return <GuruArsipDiagnostikPage session={session} onLogout={onLogout} />;
        }

        if (pathname.startsWith('/guru/laporan-diagnostik/')) {
            const idAnalisis = pathname.split('/')[3];
            return <GuruLaporanDiagnostikPage session={session} onLogout={onLogout} idAnalisis={idAnalisis} />;
        }

        if (pathname === '/siswa/dashboard') return <SiswaDashboard session={session} onLogout={onLogout} />;

        if (pathname === '/siswa/profil') {
            return <SiswaProfilePage session={session} onLogout={onLogout} />;
        }

        if (pathname === '/siswa/sesi-aktif') {
            return <SiswaSessionsPage session={session} onLogout={onLogout} />;
        }


        if (pathname === '/siswa/riwayat-pembelajaran') {
            return <SiswaLearningHistoryPage session={session} onLogout={onLogout} />;
        }

        if (pathname === '/siswa/apresiasi') {
            return <SiswaAppreciationPage session={session} onLogout={onLogout} />;
        }

        if (pathname === '/siswa/riwayat-cbt') {
            return <SiswaCbtHistoryPage session={session} onLogout={onLogout} />;
        }

        if (pathname.startsWith('/siswa/cbt/')) {
            const idSesi = pathname.split('/')[3];
            return <SiswaCbtPage session={session} onLogout={onLogout} idSesi={idSesi} />;
        }

        return <LoginPage session={session} onLogin={onLogin} />;
    }, [onLogout, pathname, session]);

    return page;
}

createRoot(document.getElementById('app')).render(<App />);