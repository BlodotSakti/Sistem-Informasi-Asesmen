import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import useGuruWorkspace from '../hooks/useGuruWorkspace';
import { guruNavigation } from './guru/guruNavigation';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export default function GuruDashboard({ session, onLogout }) {
    const { summary, diagnostics, loading, error } = useGuruWorkspace(session);
    const [chartType, setChartType] = useState('aktivitas');
    const [chartTypeOpen, setChartTypeOpen] = useState(false);

    const COLORS = ['#8A2332', '#EEDCC8', '#F59E0B', '#A2AB73', '#3368A0', '#1E3A5F'];

    const getActiveChartData = () => {
        if (!summary?.chart) return [];
        switch (chartType) {
            case 'aktivitas': return summary.chart.ujian_per_bulan || [];
            case 'rata_rata': return summary.chart.rata_rata_per_kelas || [];
            case 'kognitif': return summary.chart.kognitif_soal || [];
            case 'siswa': return summary.chart.siswa_per_kelas || [];
            case 'apresiasi': return summary.chart.apresiasi || [];
            default: return [];
        }
    };
    const activeChartData = getActiveChartData();
    const isChartDataEmpty = !activeChartData || activeChartData.length === 0;

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
                    <section className="overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary p-4 sm:p-8 shadow-lg backdrop-blur-xl relative">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.4em] text-accent">Ringkasan Aktivitas Harian</p>
                                <h3 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#EEDCC8]">Halo, {session?.user?.nama_lengkap || 'Guru'}! 👋</h3>
                                <p className="mt-2 max-w-2xl text-base text-accent">Fokus pada apa yang paling penting hari ini. Kelola penilaian, buat soal, atau persiapkan asesmen CBT selanjutnya.</p>
                            </div>
                            <div className="flex gap-3 mt-4 sm:mt-0">
                                <button onClick={() => window.location.href='/guru/bank-soal'} className="rounded-full border border-[#EEDCC8]/20 bg-white/10 px-6 py-3 text-sm font-semibold text-[#EEDCC8] shadow-md transition-all hover:bg-white/20 hover:scale-105 backdrop-blur-md">
                                    + Buat Soal
                                </button>
                            </div>
                        </div>

                    </section>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                        <StatCard 
                            label="Kelas Diampu" 
                            value={loading ? '...' : summary?.cards?.total_kelas ?? 0} 
                            description="Total kelas aktif" 
                            tone="slate" 
                            className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow" 
                            icon={<svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        />
                        <StatCard 
                            label="Bank Soal" 
                            value={loading ? '...' : summary?.cards?.total_bank_soal ?? 0} 
                            description="Soal yang Anda buat" 
                            tone="blue" 
                            className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow" 
                            icon={<svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                        />
                        <StatCard 
                            label="Penugasan" 
                            value={loading ? '...' : summary?.cards?.total_penugasan ?? 0} 
                            description="Relasi mapel & kelas" 
                            tone="emerald" 
                            className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow" 
                            icon={<svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                        />
                        <StatCard 
                            label="Ujian Aktif" 
                            value={loading ? '...' : summary?.cards?.ujian_aktif ?? 0} 
                            description="Jadwal CBT aktif" 
                            tone="amber" 
                            className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow" 
                            icon={<svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        />
                    </div>

                    {/* STATISTIK & TO-DO SECTION */}
                    <div className="grid gap-6 xl:grid-cols-3">
                        {/* CHART SECTION */}
                        <section className="rounded-2xl sm:rounded-[2.5rem] border border-border bg-white/60 backdrop-blur-xl p-4 sm:p-8 shadow-sm flex flex-col min-w-0 xl:col-span-2">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                <div>
                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Statistik</p>
                                    <h3 className="mt-1 text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Perkembangan & Aktivitas</h3>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setChartTypeOpen(v => !v)}
                                        className="flex w-full sm:w-auto items-center justify-between gap-2 rounded-2xl px-4 py-2 text-sm font-semibold bg-white text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 hover:bg-slate-50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{chartType === 'aktivitas' ? '📈' : chartType === 'rata_rata' ? '📊' : chartType === 'kognitif' ? '🍩' : chartType === 'siswa' ? '👥' : '🏅'}</span>
                                            <span>{chartType === 'aktivitas' ? 'Aktivitas Ujian per Bulan' : chartType === 'rata_rata' ? 'Rata-rata Nilai Kelas' : chartType === 'kognitif' ? 'Distribusi Level Kognitif Soal' : chartType === 'siswa' ? 'Jumlah Siswa per Kelas' : 'Lencana & Catatan Pribadi'}</span>
                                        </div>
                                        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${chartTypeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    {chartTypeOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-full sm:w-64 z-50 rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
                                            <div className="p-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                                                {[
                                                    { value: 'aktivitas', label: 'Aktivitas Ujian per Bulan' },
                                                    { value: 'rata_rata', label: 'Rata-rata Nilai Kelas' },
                                                    { value: 'kognitif', label: 'Distribusi Level Kognitif Soal' },
                                                    { value: 'siswa', label: 'Jumlah Siswa per Kelas' },
                                                    { value: 'apresiasi', label: 'Lencana & Catatan Pribadi' }
                                                ].map((opt) => (
                                                    <button key={opt.value} onClick={() => { setChartType(opt.value); setChartTypeOpen(false); }} className={`w-full text-left rounded-xl px-3 py-2 text-sm font-medium transition-colors ${chartType === opt.value ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="w-full flex-grow rounded-2xl border border-border/50 bg-white shadow-inner flex flex-col min-h-0 min-w-0 h-[340px] overflow-hidden p-3 sm:p-5">
                                {isChartDataEmpty && !loading ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-sm text-slate-400 font-medium gap-3">
                                        <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                        </svg>
                                        <span>Tidak ada data untuk ditampilkan</span>
                                    </div>
                                ) : chartType === 'aktivitas' ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={summary?.chart?.ujian_per_bulan || []} margin={{ top: 10, right: 30, left: -25, bottom: 20 }}>
                                            <defs>
                                                <linearGradient id="colorUjian" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8A2332" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#8A2332" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} interval={0} height={60} angle={-45} textAnchor="end" />
                                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }} />
                                            <Area type="monotone" dataKey="value" stroke="#8A2332" strokeWidth={3} fillOpacity={1} fill="url(#colorUjian)" name="Jumlah Ujian" dot={{ r: 5, fill: '#8A2332', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#8A2332', stroke: '#fff', strokeWidth: 3 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : chartType === 'rata_rata' ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={summary?.chart?.rata_rata_per_kelas || []} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} interval={0} height={40} />
                                            <YAxis domain={[0, 100]} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                                            <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32} animationDuration={600} name="Rata-rata Nilai">
                                                {(summary?.chart?.rata_rata_per_kelas || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : chartType === 'kognitif' ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart margin={{ top: 10, bottom: 20 }}>
                                            <Pie data={summary?.chart?.kognitif_soal || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" nameKey="name" stroke="none" label={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}>
                                                {(summary?.chart?.kognitif_soal || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : chartType === 'siswa' ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={summary?.chart?.siswa_per_kelas || []} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} interval={0} height={40} />
                                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                                            <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32} animationDuration={600} name="Jumlah Siswa">
                                                {(summary?.chart?.siswa_per_kelas || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart margin={{ top: 10, bottom: 20 }}>
                                            <Pie data={summary?.chart?.apresiasi || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" nameKey="name" stroke="none" label={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}>
                                                {(summary?.chart?.apresiasi || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </section>
                        
                        <section className="rounded-2xl sm:rounded-[2rem] border border-border bg-white/60 p-4 sm:p-6 backdrop-blur-xl shadow-sm flex flex-col">
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
                        </section>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
