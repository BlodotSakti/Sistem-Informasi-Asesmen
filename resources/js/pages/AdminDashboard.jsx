import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';
import { adminNavigation } from './adminNavigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MENU_META = {
    dashboard: {
        title: 'Dashboard Admin',
        lead: 'Ringkasan sistem, grafik aktivitas, dan log riwayat terbaru.',
    },
};

export default function AdminDashboard({ session, onLogout }) {
    const [data, setData] = useState({
        summary: {
            total_guru: 0,
            total_siswa: 0,
            total_kelas: 0,
        },
        chart: [],
        logs: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const navigation = adminNavigation;

    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true);
            try {
                const payload = await apiFetch('/api/admin/dashboard', session);
                setData(payload);
            } catch (err) {
                setError(err.message || 'Gagal memuat data dashboard.');
            } finally {
                setLoading(false);
            }
        };

        if (session?.token) {
            loadDashboard();
        }
    }, [session]);

    const renderDashboard = () => (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-gradient-to-br from-white via-slate-50 to-indigo-50/30 px-8 py-10 shadow-sm backdrop-blur-xl">
                <div className="grid gap-8 lg:grid-cols-[1.5fr_0.5fr] lg:items-center">
                    <div>
                        <p className="text-xs uppercase tracking-[0.45em] text-indigo-600 font-semibold">Sistem Informasi Asesmen</p>
                        <h3 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-slate-900">
                            Selamat Datang, {session?.user?.admin?.nama_lengkap || session?.user?.username || 'Admin'}
                        </h3>
                        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
                            Pusat pengendalian utama sistem. Pantau ringkasan data, grafik aktivitas pengguna, serta akses cepat ke manajemen data pokok.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <a
                                href="/admin/pengguna"
                                className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-600 hover:scale-105 hover:shadow-indigo-500/25"
                            >
                                Kelola Pengguna
                            </a>
                            <a
                                href="/admin/pemetaan-akademik"
                                className="inline-flex items-center rounded-full border border-slate-200 bg-white/50 px-6 py-3 text-sm font-semibold text-slate-700 backdrop-blur-md transition-all hover:bg-white hover:shadow-sm hover:scale-105"
                            >
                                Lihat Pemetaan Akademik
                            </a>
                        </div>
                    </div>

                    <div className="hidden lg:block relative">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-100 to-cyan-50 blur-2xl opacity-50 rounded-full"></div>
                        <div className="relative grid grid-cols-2 gap-4">
                            <div className="rounded-[1.5rem] bg-white/80 p-5 backdrop-blur-xl border border-white shadow-sm transition hover:shadow-md">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div className="text-3xl font-extrabold text-slate-900">{loading ? '...' : data.summary.total_guru}</div>
                                <div className="text-sm font-medium text-slate-500 mt-1">Guru Aktif</div>
                            </div>
                            <div className="rounded-[1.5rem] bg-white/80 p-5 backdrop-blur-xl border border-white shadow-sm transition hover:shadow-md translate-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                                    </svg>
                                </div>
                                <div className="text-3xl font-extrabold text-slate-900">{loading ? '...' : data.summary.total_siswa}</div>
                                <div className="text-sm font-medium text-slate-500 mt-1">Siswa Terdaftar</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-600">
                    {error}
                </div>
            )}

            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <StatCard 
                    label="Total Guru" 
                    value={loading ? '...' : data.summary.total_guru} 
                    description="Total akun guru yang terdaftar." 
                    tone="blue" 
                />
                <StatCard 
                    label="Total Siswa" 
                    value={loading ? '...' : data.summary.total_siswa} 
                    description="Total data siswa terdaftar." 
                    tone="indigo" 
                />
                <StatCard 
                    label="Kelas Aktif" 
                    value={loading ? '...' : data.summary.total_kelas} 
                    description="Jumlah rombongan belajar saat ini." 
                    tone="cyan" 
                />
                <StatCard 
                    label="Status Server" 
                    value="Online" 
                    description="Sistem beroperasi optimal." 
                    tone="emerald" 
                />
            </section>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <section className="rounded-[2.5rem] border border-slate-200/60 bg-white/60 backdrop-blur-xl p-8 shadow-sm">
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-slate-900">Grafik Pendaftaran Pengguna</h4>
                        <p className="text-sm text-slate-500">Jumlah akun baru yang ditambahkan dalam 7 hari terakhir.</p>
                    </div>
                    <div className="h-[300px] w-full">
                        {loading ? (
                            <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-sm text-slate-400">
                                Memuat grafik...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.chart} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="tanggal" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 12, fill: '#64748b' }} 
                                        dy={10} 
                                    />
                                    <YAxis 
                                        allowDecimals={false} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 12, fill: '#64748b' }} 
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="total" 
                                        name="Akun Baru"
                                        stroke="#4f46e5" 
                                        strokeWidth={3} 
                                        dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                                        activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 2, fill: '#fff' }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>

                <section className="rounded-[2.5rem] border border-slate-200/60 bg-white/60 backdrop-blur-xl p-8 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h4 className="text-lg font-semibold text-slate-900">Catatan Sistem</h4>
                            <p className="text-sm text-slate-500">Log aktivitas terbaru.</p>
                        </div>
                    </div>
                    
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200"></div>
                                    <div className="w-full space-y-2 py-1">
                                        <div className="h-3 w-3/4 rounded bg-slate-200"></div>
                                        <div className="h-2 w-1/2 rounded bg-slate-200"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {data.logs.length === 0 ? (
                                <p className="text-sm text-slate-500 py-4 text-center">Belum ada riwayat aktivitas.</p>
                            ) : (
                                data.logs.map((log) => (
                                    <div key={log.id} className="flex items-start gap-3 rounded-xl p-2 transition hover:bg-slate-50">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                                            {log.role === 'admin' && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {log.role === 'guru' && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                                </svg>
                                            )}
                                            {log.role === 'siswa' && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="truncate text-sm font-medium text-slate-900">{log.nama_lengkap}</p>
                                            <p className="truncate text-xs text-slate-500">{log.deskripsi}</p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <span className="text-xs font-medium text-slate-400">{log.tanggal}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );

    return (
        <DashboardLayout user={session?.user} onLogout={onLogout} title={MENU_META.dashboard.title} navigation={navigation}>
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{MENU_META.dashboard.title}</h1>
                <p className="mt-2 text-sm text-slate-600">{MENU_META.dashboard.lead}</p>
            </div>

            {renderDashboard()}
        </DashboardLayout>
    );
}