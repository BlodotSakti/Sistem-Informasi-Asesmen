import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import GuruDashboard from './pages/GuruDashboard';
import SiswaDashboard from './pages/SiswaDashboard';

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

        const protectedRoutes = ['/admin/dashboard', '/guru/dashboard', '/siswa/dashboard'];

        if (protectedRoutes.includes(pathname) && !session?.token) {
            window.location.replace('/login');
            return;
        }

        if (session?.role && protectedRoutes.includes(pathname) && pathname !== `/${session.role}/dashboard`) {
            window.location.replace(`/${session.role}/dashboard`);
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
        if (pathname === '/admin/dashboard') {
            return <AdminDashboard session={session} onLogout={onLogout} />;
        }

        if (pathname === '/guru/dashboard') {
            return <GuruDashboard session={session} onLogout={onLogout} />;
        }

        if (pathname === '/siswa/dashboard') {
            return <SiswaDashboard session={session} onLogout={onLogout} />;
        }

        return <LoginPage session={session} onLogin={onLogin} />;
    }, [onLogout, pathname, session]);

    return page;
}

createRoot(document.getElementById('app')).render(<App />);