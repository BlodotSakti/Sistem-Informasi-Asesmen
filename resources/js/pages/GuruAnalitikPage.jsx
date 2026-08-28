import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { guruNavigation } from './guru/guruNavigation';
import useGuruWorkspace from '../hooks/useGuruWorkspace';
import { apiFetch } from '../lib/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function GuruAnalitikPage({ session, onLogout }) {
    const { workspace, diagnostics, loading: wsLoading, error: wsError } = useGuruWorkspace(session);
    
    const [selectedKelas, setSelectedKelas] = useState('');
    const [selectedSiswa, setSelectedSiswa] = useState('');
    const [kelasOpen, setKelasOpen] = useState(false);
    const [siswaOpen, setSiswaOpen] = useState(false);
    
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    
    // For KKM editing
    const [isEditingKkm, setIsEditingKkm] = useState(null); // id_penugasan
    const [kkmValue, setKkmValue] = useState(75);

    useEffect(() => {
        if (selectedKelas) {
            fetchAnalytics(selectedKelas, selectedSiswa);
        } else {
            setAnalyticsData(null);
        }
    }, [selectedKelas, selectedSiswa]);

    const fetchAnalytics = async (id_kelas, id_siswa) => {
        setAnalyticsLoading(true);
        try {
            let url = `/api/guru/analitik?id_kelas=${id_kelas}`;
            if (id_siswa) {
                url += `&id_siswa=${id_siswa}`;
            }
            
            const res = await apiFetch(url, session);
            setAnalyticsData(res);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const handleUpdateKkm = async (id_penugasan) => {
        try {
            await apiFetch(`/api/guru/penugasan/${id_penugasan}/kkm`, session, {
                method: 'PATCH',
                body: JSON.stringify({ nilai_kkm: kkmValue })
            });
            setIsEditingKkm(null);
            // Refresh analytics to reflect new KKM
            fetchAnalytics(selectedKelas, selectedSiswa);
        } catch (err) {
            alert('Gagal memperbarui KKM: ' + (err.message || 'Unknown error'));
        }
    };

    const students = selectedKelas && workspace?.students_by_class 
        ? workspace.students_by_class[selectedKelas] || [] 
        : [];

    const currentPenugasan = workspace?.teaching_assignments?.filter(p => String(p.id_kelas) === String(selectedKelas)) || [];

    const COLORS = ['#10B981', '#F43F5E']; // Lulus (Emerald), Remedial (Rose)

    return (
        <DashboardLayout
            navigation={guruNavigation}
            user={session?.user}
            profileHref="/guru/profil"
            onLogout={onLogout}
            title="Analitik"
            subtitle="Analisis Ketuntasan dan Tren Nilai"
        >
            <div className="mx-auto max-w-7xl space-y-6">
                {(wsError) && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                        {wsError}
                    </div>
                )}

                {/* Filter Section */}
                <section className="relative z-50 rounded-2xl sm:rounded-[2.5rem] border border-[#EEDCC8]/40 bg-gradient-to-br from-white via-white to-[#EEDCC8]/20 p-5 sm:p-8 backdrop-blur-xl shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Pilih Target Analitik</h3>
                        <p className="mt-1 text-sm text-slate-500">Tentukan kelas dan siswa (opsional) untuk memuat data performa akademik dan diagnostik.</p>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-6 relative z-30">
                        <div className="relative">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Pilih Kelas</label>
                            <button
                                onClick={() => { if(!wsLoading) setKelasOpen(v => !v); setSiswaOpen(false); }}
                                disabled={wsLoading}
                                className={`flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 border shadow-sm ${kelasOpen ? 'bg-primary text-white border-primary shadow-primary/20' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                            >
                                <span className="truncate">{selectedKelas ? workspace?.kelas_options?.find(k => k.id_kelas == selectedKelas)?.nama_kelas : '-- Pilih Kelas --'}</span>
                                <svg className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${kelasOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {kelasOpen && (
                                <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
                                    <div className="p-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                                        <button onClick={() => { setSelectedKelas(''); setSelectedSiswa(''); setKelasOpen(false); }} className={`w-full text-left rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${!selectedKelas ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}>
                                            -- Pilih Kelas --
                                        </button>
                                        {workspace?.kelas_options?.map(k => (
                                            <button key={k.id_kelas} onClick={() => { setSelectedKelas(k.id_kelas); setSelectedSiswa(''); setKelasOpen(false); }} className={`w-full text-left rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${selectedKelas == k.id_kelas ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                                                {k.nama_kelas}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Pilih Siswa (Opsional)</label>
                            <button
                                onClick={() => { if(selectedKelas && !wsLoading) setSiswaOpen(v => !v); setKelasOpen(false); }}
                                disabled={!selectedKelas || wsLoading}
                                className={`flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 border shadow-sm ${siswaOpen ? 'bg-primary text-white border-primary shadow-primary/20' : (!selectedKelas ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300')}`}
                            >
                                <span className="truncate">{selectedSiswa ? students.find(s => s.id_siswa == selectedSiswa)?.nama_lengkap : '-- Semua Siswa --'}</span>
                                <svg className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${siswaOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {siswaOpen && (
                                <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
                                    <div className="p-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                                        <button onClick={() => { setSelectedSiswa(''); setSiswaOpen(false); }} className={`w-full text-left rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${!selectedSiswa ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}>
                                            -- Semua Siswa --
                                        </button>
                                        {students.map(s => (
                                            <button key={s.id_siswa} onClick={() => { setSelectedSiswa(s.id_siswa); setSiswaOpen(false); }} className={`w-full text-left rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${selectedSiswa == s.id_siswa ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                                                {s.nama_lengkap}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {!selectedKelas && (
                    <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-[#EEDCC8]/40 bg-gradient-to-br from-slate-50 to-[#EEDCC8]/10 py-24 px-6 text-center shadow-inner">
                        <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-[#EEDCC8]/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#8A2332]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Pilih Kelas Terlebih Dahulu</h3>
                        <p className="mt-2 text-base text-slate-500 max-w-sm">Analitik performa, kognitif, dan laporan AI akan ditampilkan setelah Anda menentukan pilihan kelas.</p>
                    </div>
                )}

                {selectedKelas && (
                    <>
                        {/* KKM Management Section */}
                        <section className="rounded-2xl sm:rounded-[2.5rem] border border-[#EEDCC8]/40 bg-gradient-to-bl from-white via-white to-[#EEDCC8]/20 p-5 sm:p-8 shadow-sm">
                            <div className="mb-6">
                                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Standar KKM</h3>
                                <p className="mt-1 text-sm text-slate-500">Atur Kriteria Ketuntasan Minimal untuk mengevaluasi performa siswa.</p>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {currentPenugasan.map(p => (
                                    <div key={p.id_penugasan_pembelajaran} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 relative flex flex-col justify-between transition hover:shadow-md hover:border-primary/30">
                                        <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">{p.mataPelajaran?.nama_mapel}</p>
                                        
                                        {isEditingKkm === p.id_penugasan_pembelajaran ? (
                                            <div className="mt-4 flex items-center gap-2">
                                                <input 
                                                    type="number" 
                                                    min="0" max="100"
                                                    value={kkmValue}
                                                    onChange={e => setKkmValue(e.target.value)}
                                                    className="w-20 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                                                />
                                                <button onClick={() => handleUpdateKkm(p.id_penugasan_pembelajaran)} className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 shadow-sm">Simpan</button>
                                                <button onClick={() => setIsEditingKkm(null)} className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300">Batal</button>
                                            </div>
                                        ) : (
                                            <div className="mt-4 flex items-end justify-between">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-extrabold text-slate-900">{p.nilai_kkm ?? 75}</span>
                                                    <span className="text-xs font-bold text-slate-400">KKM</span>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setIsEditingKkm(p.id_penugasan_pembelajaran);
                                                        setKkmValue(p.nilai_kkm ?? 75);
                                                    }}
                                                    className="rounded-full p-2 text-slate-400 bg-white border border-slate-200 hover:text-primary hover:bg-slate-50 transition-colors shadow-sm"
                                                    title="Ubah KKM"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {currentPenugasan.length === 0 && (
                                    <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
                                        <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                        <p className="text-sm font-medium text-slate-500">Tidak ada mata pelajaran yang Anda ampu di kelas ini.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Tren Nilai (if student selected) */}
                            {selectedSiswa && (
                                <section className="rounded-2xl sm:rounded-[2.5rem] border border-[#EEDCC8]/40 bg-gradient-to-tr from-white via-white to-[#EEDCC8]/20 p-5 sm:p-8 shadow-sm lg:col-span-2 flex flex-col min-w-0">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Tren Nilai Individu</h3>
                                        <p className="text-sm text-slate-500 mt-1">Perkembangan nilai historis dari {students.find(s => s.id_siswa == selectedSiswa)?.nama_lengkap}.</p>
                                    </div>
                                    <div className="w-full flex-grow rounded-2xl border border-border/50 bg-white shadow-inner flex flex-col min-h-0 min-w-0 h-[350px] overflow-hidden p-3 sm:p-5">
                                        {analyticsLoading ? (
                                            <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">Memuat grafik...</div>
                                        ) : analyticsData?.tren_nilai?.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={analyticsData.tren_nilai} margin={{ top: 10, right: 30, left: -25, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} interval={0} height={40} />
                                                    <YAxis allowDecimals={false} domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                                                    <Tooltip 
                                                        cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }}
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                        formatter={(value, name, props) => [`${value} Pts`, props.payload.full_name]}
                                                    />
                                                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={{ r: 5, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, stroke: '#fff', strokeWidth: 3 }} name="Nilai Akhir" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex flex-1 flex-col items-center justify-center text-sm font-medium text-slate-400 gap-3">
                                                <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                                                <span>Siswa belum mengikuti ujian apa pun di kelas ini.</span>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Ketuntasan Belajar */}
                            <section className="rounded-2xl sm:rounded-[2.5rem] border border-[#EEDCC8]/40 bg-gradient-to-tl from-white via-white to-[#EEDCC8]/20 p-5 sm:p-8 shadow-sm flex flex-col min-w-0 lg:col-span-2">
                                <div className="mb-6">
                                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Ketuntasan Belajar Kelas</h3>
                                    <p className="text-sm text-slate-500 mt-1">Perbandingan persentase siswa tuntas dan remedial berdasarkan KKM mata pelajaran.</p>
                                </div>
                                <div className="w-full flex-grow rounded-2xl border border-border/50 bg-white shadow-inner flex flex-col min-h-0 min-w-0 h-[350px] overflow-hidden p-3 sm:p-5">
                                    {analyticsLoading ? (
                                        <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">Memuat grafik...</div>
                                    ) : analyticsData?.ketuntasan?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analyticsData.ketuntasan} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} interval={0} height={40} />
                                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                                <Bar dataKey="Tuntas" fill={COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={48} />
                                                <Bar dataKey="Remedial" fill={COLORS[1]} radius={[4, 4, 0, 0]} maxBarSize={48} />
                                                <Bar dataKey="Belum Mengerjakan" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex flex-1 flex-col items-center justify-center text-sm font-medium text-slate-400 gap-3">
                                            <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                                            <span>Belum ada data nilai ujian yang dapat dianalisis untuk ketuntasan.</span>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* ANALITIK AI SECTION */}
                        <div className="rounded-2xl sm:rounded-[2rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary p-4 sm:p-8 text-white shadow-lg flex flex-col relative overflow-hidden mt-6">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Dashboard Analitik</p>
                                    <h3 className="mt-1 text-lg sm:text-2xl font-bold text-[#EEDCC8] tracking-tight">Insight Diagnostik & Area Peningkatan AI</h3>
                                </div>
                                <button 
                                    onClick={() => window.location.href = '/guru/arsip-diagnostik'}
                                    className="flex w-fit items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-accent shadow-sm transition hover:bg-white/20 border border-white/10"
                                >
                                    Lihat Semua Arsip
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </button>
                            </div>
                            <p className="relative z-10 mt-3 text-sm text-accent max-w-lg">Deteksi tren penurunan nilai maupun kelemahan spesifik secara lebih dini untuk evaluasi pembelajaran yang dipersonalisasi.</p>
                            
                            <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 flex-grow">
                                {(diagnostics?.data || []).filter(item => String(item.sesi_asesmen?.id_kelas) === String(selectedKelas) && (!selectedSiswa || String(item.id_siswa) === String(selectedSiswa))).slice(0, 4).map((item) => (
                                    <div key={item.id_analisis} className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20">
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-bold text-white truncate">{item.siswa?.nama_lengkap || 'Siswa'}</p>
                                                <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black tracking-wide ${item.skor_total >= 80 ? 'bg-emerald-500/20 text-emerald-300' : item.skor_total >= 60 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'}`}>{item.skor_total} Pts</span>
                                            </div>
                                            <p className="mt-1.5 text-xs font-medium text-slate-400">
                                                {item.sesi_asesmen?.mata_pelajaran?.nama_mapel || 'Mapel'} • {item.tanggal_generate ? new Date(item.tanggal_generate).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':') + ' WIB' : ''}
                                            </p>
                                        </div>
                                        <div className="mt-5 pt-4 border-t border-white/10">
                                            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Area Peningkatan:</p>
                                            <p className="mt-2 text-sm text-slate-400 line-clamp-3 leading-relaxed">
                                                {item.narasi_kelemahan || 'Masih membutuhkan lebih banyak latihan untuk menemukan pola kelemahan yang spesifik.'}
                                            </p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                                            <button 
                                                onClick={() => window.location.href = `/guru/laporan-diagnostik/${item.id_analisis}`}
                                                className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-slate-400 transition bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg"
                                            >
                                                Lihat Laporan
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {!wsLoading && (diagnostics?.data || []).filter(item => String(item.sesi_asesmen?.id_kelas) === String(selectedKelas) && (!selectedSiswa || String(item.id_siswa) === String(selectedSiswa))).length === 0 ? (
                                    <div className="col-span-full flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-sm text-slate-400 backdrop-blur-sm">
                                        Belum ada data analisis diagnostik AI yang sesuai dengan filter kelas/siswa Anda.
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
