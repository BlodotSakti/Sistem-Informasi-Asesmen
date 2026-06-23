import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch } from '../lib/api';
import { guruNavigation } from './guru/guruNavigation';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

export default function GuruLaporanDiagnostikPage({ session, onLogout, idAnalisis }) {
    const [laporan, setLaporan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadLaporan = async () => {
            try {
                setLoading(true);
                const response = await apiFetch(`/api/guru/analisis-diagnostik/${idAnalisis}`, session);
                if (mounted) {
                    setLaporan(response.data);
                }
            } catch (err) {
                if (mounted) {
                    setError(err.message || 'Gagal memuat laporan diagnostik');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        if (idAnalisis) {
            loadLaporan();
        }

        return () => {
            mounted = false;
        };
    }, [idAnalisis, session]);

    const levelKognitifLabels = {
        C1: 'Mengingat',
        C2: 'Memahami',
        C3: 'Mengaplikasikan',
        C4: 'Menganalisis',
        C5: 'Mengevaluasi',
        C6: 'Mencipta',
    };

    const rekapKognitif = laporan?.rekap_kognitif || {};
    const chartData = Object.keys(levelKognitifLabels).map(level => {
        const persentase = rekapKognitif[level]?.persentase || 0;
        return {
            subject: `${level} (${levelKognitifLabels[level]})`,
            A: persentase,
            fullMark: 100
        };
    });

    const getScoreColor = (skor) => {
        if (skor >= 80) return 'text-emerald-500';
        if (skor >= 60) return 'text-amber-500';
        return 'text-rose-500';
    };

    const getScoreGradient = (skor) => {
        if (skor >= 80) return 'from-emerald-400 to-teal-500';
        if (skor >= 60) return 'from-amber-400 to-orange-500';
        return 'from-rose-400 to-red-500';
    };

    if (loading) {
        return (
            <DashboardLayout title="Laporan Diagnostik AI" user={session?.user} navigation={guruNavigation} onLogout={onLogout} profileHref="/guru/profil">
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !laporan) {
        return (
            <DashboardLayout title="Laporan Diagnostik AI" user={session?.user} navigation={guruNavigation} onLogout={onLogout} profileHref="/guru/profil">
                <div className="rounded-3xl bg-white p-8 text-center shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800">Ups, Terjadi Kesalahan</h3>
                    <p className="mt-2 text-slate-500">{error || 'Data laporan tidak ditemukan.'}</p>
                    <button onClick={() => window.location.href = '/guru/dashboard'} className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800">
                        Kembali ke Dashboard
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Laporan Diagnostik AI" user={session?.user} navigation={guruNavigation} onLogout={onLogout} profileHref="/guru/profil">
            <div className="space-y-6">
                
                {/* Header Action */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button onClick={() => window.location.href = '/guru/dashboard'} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Kembali
                        </button>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Evaluasi Diagnostik</h2>
                        <p className="text-slate-500 mt-1">Laporan komprehensif didukung oleh analitik AI.</p>
                    </div>
                    <button onClick={() => window.print()} className="flex w-fit items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Cetak Laporan
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Kolom Kiri: Profil & Skor */}
                    <div className="space-y-6 lg:col-span-1">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Profil Siswa</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase">Nama Lengkap</p>
                                    <p className="text-lg font-bold text-slate-800">{laporan.siswa?.nama_lengkap}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase">Kelas & NISN</p>
                                    <p className="text-md font-bold text-slate-700">{laporan.sesi_asesmen?.kelas?.nama_kelas} • {laporan.siswa?.nisn}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase">Mata Pelajaran</p>
                                    <p className="text-md font-bold text-slate-700">{laporan.sesi_asesmen?.mata_pelajaran?.nama_mapel}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase">Waktu Analisis</p>
                                    <p className="text-md font-medium text-slate-600">{new Date(laporan.tanggal_generate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Skor Akhir</h3>
                            <div className="relative inline-flex items-center justify-center p-6">
                                <div className={`absolute inset-0 bg-gradient-to-tr ${getScoreGradient(laporan.skor_total)} opacity-20 blur-xl rounded-full`}></div>
                                <span className={`text-6xl font-black tracking-tighter ${getScoreColor(laporan.skor_total)} drop-shadow-sm`}>
                                    {laporan.skor_total}
                                </span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-500">Skor maksimum: 100</p>
                        </div>
                    </div>

                    {/* Kolom Kanan: Visual & Narasi */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Radar Chart Visualisasi */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-[400px] flex flex-col">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Distribusi Level Kognitif</h3>
                                    <p className="text-xs font-medium text-slate-500">Analisis kemampuan berdasarkan Taksonomi Bloom (Persentase Benar)</p>
                                </div>
                            </div>
                            
                            <div className="flex-1 w-full relative">
                                {Object.keys(rekapKognitif).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="Skor" dataKey="A" stroke="#4f46e5" strokeWidth={3} fill="#6366f1" fillOpacity={0.4} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-sm italic text-slate-400">Data rekap kognitif tidak tersedia.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Narasi AI Box */}
                        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                                    <span className="text-xl">🤖</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Saran & Evaluasi AI</h3>
                                    <p className="text-xs font-medium text-slate-500">Dihasilkan secara otomatis oleh sistem kecerdasan buatan.</p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-200/50 text-emerald-700">💪</span>
                                        <h4 className="font-bold text-emerald-900 tracking-tight">Kekuatan Siswa</h4>
                                    </div>
                                    <p className="text-sm leading-relaxed text-emerald-900/80">
                                        {laporan.narasi_kekuatan || <em className="text-slate-500 opacity-70">Belum ada analisis kekuatan yang tercatat.</em>}
                                    </p>
                                </div>
                                
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-200/50 text-amber-700">🎯</span>
                                        <h4 className="font-bold text-amber-900 tracking-tight">Fokus Perbaikan</h4>
                                    </div>
                                    <p className="text-sm leading-relaxed text-amber-900/80">
                                        {laporan.narasi_kelemahan || <em className="text-slate-500 opacity-70">Belum ada saran perbaikan yang tercatat.</em>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
