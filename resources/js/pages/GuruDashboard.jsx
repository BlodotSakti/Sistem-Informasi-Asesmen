import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import useGuruWorkspace from '../hooks/useGuruWorkspace';
import { guruNavigation } from './guru/guruNavigation';

export default function GuruDashboard({ session, onLogout }) {
    const { summary, diagnostics, loading, error } = useGuruWorkspace(session);

    return (
        <DashboardLayout
            navigation={guruNavigation}
            user={session?.user}
            profileHref="/guru/profil"
            onLogout={onLogout}
            title="Dashboard Guru"
            subtitle="Ringkasan Aktivitas Harian"
        >
            <div className="mx-auto max-w-7xl space-y-6">
                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                        {error}
                    </div>
                )}

                <div className="space-y-8">
                    <section className="overflow-hidden rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary p-8 shadow-lg backdrop-blur-xl relative">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.4em] text-accent">Ringkasan Aktivitas Harian</p>
                                <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-[#EEDCC8]">Halo, {session?.user?.nama_lengkap || 'Guru'}! 👋</h3>
                                <p className="mt-2 max-w-2xl text-base text-accent">Fokus pada apa yang paling penting hari ini. Kelola penilaian, buat soal, atau persiapkan asesmen CBT selanjutnya.</p>
                            </div>
                            <div className="flex gap-3 mt-4 sm:mt-0">
                                <button onClick={() => window.location.href='/guru/bank-soal'} className="rounded-full border border-[#EEDCC8]/20 bg-white/10 px-6 py-3 text-sm font-semibold text-[#EEDCC8] shadow-md transition-all hover:bg-white/20 hover:scale-105 backdrop-blur-md">
                                    + Buat Soal
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4 relative z-10">
                            <StatCard label="Kelas Diampu" value={loading ? '...' : summary?.cards?.total_kelas ?? 0} description="Total kelas aktif" tone="slate" className="!bg-[#EEDCC8] !border-transparent" />
                            <StatCard label="Bank Soal" value={loading ? '...' : summary?.cards?.total_bank_soal ?? 0} description="Soal yang Anda buat" tone="blue" className="!bg-[#EEDCC8] !border-transparent" />
                            <StatCard label="Penugasan" value={loading ? '...' : summary?.cards?.total_penugasan ?? 0} description="Relasi mapel & kelas" tone="emerald" className="!bg-[#EEDCC8] !border-transparent" />
                            <StatCard label="Ujian Aktif" value={loading ? '...' : summary?.cards?.ujian_aktif ?? 0} description="Jadwal CBT aktif" tone="amber" className="!bg-[#EEDCC8] !border-transparent" />
                        </div>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[1fr_2fr]">
                        <div className="rounded-[2rem] border border-border bg-white/60 p-6 backdrop-blur-xl shadow-sm flex flex-col">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">To-Do Prioritas</p>
                            <h3 className="mt-2 text-xl font-bold text-slate-900">Jadwal Asesmen</h3>
                            <p className="mt-1 text-sm text-slate-500">Daftar agenda CBT terdekat yang butuh perhatian.</p>
                            <div className="mt-6 flex-grow space-y-4">
                                {(summary?.upcoming_schedules || []).map((item) => (
                                    <div key={item.title + item.meta} className="rounded-2xl border border-border bg-white p-5 transition-all hover:bg-slate-50 hover:shadow-md cursor-default shadow-sm group">
                                        <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{item.title}</p>
                                        <p className="mt-1 text-sm text-slate-500 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {item.meta}
                                        </p>
                                        <p className="mt-3 inline-block rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200/50">{item.note}</p>
                                    </div>
                                ))}
                                {!loading && (summary?.upcoming_schedules || []).length === 0 ? (
                                    <div className="flex h-32 flex-col items-center justify-center rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 text-center border border-dashed border-slate-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        Tidak ada jadwal mendesak.
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary p-8 text-white shadow-lg flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Dashboard Analitik</p>
                                    <h3 className="mt-1 text-2xl font-bold text-[#EEDCC8] tracking-tight">Insight Diagnostik & Area Peningkatan</h3>
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
                            
                            <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2 flex-grow">
                                {(diagnostics?.data || []).slice(0, 4).map((item) => (
                                    <div key={item.id_analisis} className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20">
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-bold text-white truncate">{item.siswa?.nama_lengkap || 'Siswa'}</p>
                                                <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black tracking-wide ${item.skor_total >= 80 ? 'bg-emerald-500/20 text-emerald-300' : item.skor_total >= 60 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'}`}>{item.skor_total} Pts</span>
                                            </div>
                                            <p className="mt-1.5 text-xs font-medium text-slate-400">{item.sesi_asesmen?.mata_pelajaran?.nama_mapel || 'Mapel'} • {item.tanggal_generate}</p>
                                        </div>
                                        <div className="mt-5 pt-4 border-t border-white/10">
                                            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Area Peningkatan:</p>
                                            <p className="mt-2 text-sm text-slate-400 line-clamp-3 leading-relaxed">
                                                {item.area_peningkatan || 'Masih membutuhkan lebih banyak latihan untuk menemukan pola kelemahan yang spesifik.'}
                                            </p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                                            <button 
                                                onClick={() => window.location.href = `/guru/laporan-diagnostik/${item.id_analisis}`}
                                                className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-slate-400 transition bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg"
                                            >
                                                Lihat Laporan Lengkap
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {!loading && (diagnostics?.data || []).length === 0 ? (
                                    <div className="col-span-full flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-sm text-slate-400 backdrop-blur-sm">
                                        Belum ada data analisis diagnostik yang diproses oleh AI.
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </DashboardLayout>
    );
}
