import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { guruNavigation } from './guru/guruNavigation';
import StatCard from '../components/ui/StatCard';

function apiBase(path) {
    return `${window.location.origin}${path}`;
}

export default function GuruSiswaPage({ session, onLogout }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [workspace, setWorkspace] = useState(null);
    const [activeKelasId, setActiveKelasId] = useState(null);

    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            try {
                const response = await fetch(apiBase('/api/guru/workspace-data'), {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${session.token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Gagal memuat data workspace guru');
                }

                const data = await response.json();
                
                if (mounted) {
                    setWorkspace(data);
                    if (data.kelas_options?.length > 0) {
                        setActiveKelasId(data.kelas_options[0].id_kelas);
                    }
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        };

        if (session?.token) {
            loadData();
        }

        return () => { mounted = false; };
    }, [session]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-blue-600"></div>
                    <p className="mt-4 text-sm font-medium text-slate-500">Memuat data kelas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-rose-700 shadow-sm max-w-md text-center">
                    <h2 className="text-lg font-bold mb-2">Terjadi Kesalahan</h2>
                    <p className="text-sm">{error}</p>
                    <a href="/guru/dashboard" className="mt-4 inline-block text-sm font-semibold text-rose-600 hover:text-rose-800">Kembali ke Dashboard</a>
                </div>
            </div>
        );
    }

    const { kelas_options = [], students_by_class = {}, teaching_assignments = [] } = workspace || {};
    const activeKelas = kelas_options.find(k => k.id_kelas === activeKelasId);
    const activeStudents = students_by_class[activeKelasId] || [];
    
    const activeMapel = teaching_assignments
        .filter(a => a.id_kelas === activeKelasId)
        .map(a => a.mata_pelajaran?.nama_lengkap || a.mata_pelajaran?.nama_mapel)
        .filter(Boolean);

    const navigation = guruNavigation;

    return (
        <DashboardLayout title="Daftar Siswa & Kelas" user={session?.user} navigation={navigation} onLogout={onLogout}>
            <div className="font-sans text-slate-900 selection:bg-primary/10 flex flex-col">
                <main className="flex-1 max-w-7xl mx-auto w-full">
                    <section className="mb-8 overflow-hidden rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary p-8 shadow-lg backdrop-blur-xl relative">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.4em] text-accent">Daftar Kelas & Siswa</p>
                                <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-[#EEDCC8]">Daftar Kelas & Siswa</h3>
                                <p className="mt-2 max-w-2xl text-base text-accent">Lihat seluruh kelas dan daftar siswa yang berada di bawah bimbingan Anda. Pilih kelas pada tab di bawah untuk melihat detail lebih lanjut.</p>
                            </div>
                        </div>
        
                        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3 relative z-10">
                            <StatCard label="Total Kelas" value={loading ? '...' : kelas_options.length} description="Kelas yang diampu" tone="slate" className="!bg-[#EEDCC8] !border-transparent" />
                            <StatCard label="Total Siswa" value={loading ? '...' : (Object.values(students_by_class).flat().length)} description="Seluruh siswa yang diajar" tone="blue" className="!bg-[#EEDCC8] !border-transparent" />
                            <StatCard label="Mata Pelajaran" value={loading ? '...' : (new Set(teaching_assignments.map(a => a.id_mapel)).size)} description="Mapel yang diampu" tone="emerald" className="!bg-[#EEDCC8] !border-transparent" />
                        </div>
                    </section>

                {kelas_options.length === 0 ? (
                    <div className="rounded-3xl border border-border bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-slate-900">Tidak Ada Kelas Aktif</h3>
                        <p className="mt-2 text-slate-500 max-w-md mx-auto">Anda belum memiliki jadwal mengajar di kelas manapun. Hubungi administrator jika Anda merasa ini adalah sebuah kesalahan.</p>
                        <a href="/guru/dashboard" className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/85">Kembali ke Dashboard</a>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* Sidebar / Tabs */}
                        <div className="w-full lg:w-64 shrink-0">
                            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Pilih Kelas</h3>
                            <nav className="flex flex-col space-y-1">
                                {kelas_options.map(kelas => {
                                    const isActive = activeKelasId === kelas.id_kelas;
                                    return (
                                        <button
                                            key={kelas.id_kelas}
                                            onClick={() => setActiveKelasId(kelas.id_kelas)}
                                            className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all ${
                                                isActive 
                                                    ? 'bg-primary text-white shadow-md' 
                                                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                        >
                                            <span className="font-semibold">{kelas.nama_kelas}</span>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isActive ? 'bg-primary/50 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                {students_by_class[kelas.id_kelas]?.length || 0} Siswa
                                            </span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 w-full space-y-6">
                            {/* Class Overview Card */}
                            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">{activeKelas?.nama_kelas}</h3>
                                    <p className="text-sm text-slate-500 mt-1">Tahun Ajaran {activeKelas?.tahun_ajaran}</p>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {activeMapel.length > 0 ? activeMapel.map((m, idx) => (
                                        <span key={idx} className="inline-flex items-center rounded-lg bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary ring-1 ring-inset ring-primary/10">
                                            {m}
                                        </span>
                                    )) : (
                                        <span className="text-sm text-slate-500 italic">Tidak ada mapel terdaftar</span>
                                    )}
                                </div>
                            </div>

                            {/* Students Table */}
                            <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
                                <div className="border-b border-border bg-slate-50 px-6 py-4 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-900">Daftar Siswa</h3>
                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-text-primary">
                                        Total: {activeStudents.length}
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm divide-y divide-slate-200">
                                        <thead className="bg-slate-50/50">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold text-slate-500 w-16">No</th>
                                                <th className="px-6 py-4 font-semibold text-slate-500">Nama Siswa</th>
                                                <th className="px-6 py-4 font-semibold text-slate-500 w-48">NISN</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {activeStudents.map((student, index) => (
                                                <tr key={student.id_siswa} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500 font-medium">{index + 1}</td>
                                                    <td className="px-6 py-4 text-slate-900 font-semibold">{student.nama_lengkap}</td>
                                                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">{student.nisn || '-'}</td>
                                                </tr>
                                            ))}
                                            {activeStudents.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="px-6 py-8 text-center text-slate-500">
                                                        Belum ada siswa terdaftar di kelas ini.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                </main>
            </div>
        </DashboardLayout>
    );
}
