import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';
import { adminNavigation } from './adminNavigation';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CHART_COLORS = [
    '#1E3A5F', '#D9A441', '#8A2332', '#2D9C6F', '#7C3AED',
    '#E76F51', '#3B82F6', '#F59E0B', '#10B981', '#EC4899',
    '#6366F1', '#14B8A6', '#F97316', '#06B6D4', '#8B5CF6',
];

const CustomXAxisTick = ({ x, y, payload }) => {
    const value = payload.value || '';
    const maxLen = 15;
    const displayLabel = value.length > maxLen ? value.slice(0, maxLen) + '…' : value;
    
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="end" fill="#64748b" fontSize={10} fontWeight={600} transform="rotate(-25)">
                {displayLabel}
            </text>
        </g>
    );
};

const MENU_META = {
    dashboard: {
        title: 'Dashboard Admin',
        lead: 'Ringkasan sistem, grafik aktivitas, dan log riwayat terbaru.',
    },
};

export default function AdminDashboard({ session, onLogout }) {
    const [data, setData] = useState({
        summary: {
            total_pengguna_aktif: 0,
            total_pengguna_arsip: 0,
            total_kelas: 0,
            total_mapel: 0,
        },
        chart: {},
        tahun_ajaran_options: [],
        logs: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [chartType, setChartType] = useState(() => localStorage.getItem('adminChartType') || 'bar');
    const [dataType, setDataType] = useState(() => localStorage.getItem('adminDataType') || 'siswa_per_kelas');
    const [selectedSemester, setSelectedSemester] = useState(() => localStorage.getItem('adminSelectedSemester') || 'all');
    
    useEffect(() => {
        localStorage.setItem('adminChartType', chartType);
        localStorage.setItem('adminDataType', dataType);
        localStorage.setItem('adminSelectedSemester', selectedSemester);
    }, [chartType, dataType, selectedSemester]);
    
    const [chartTypeOpen, setChartTypeOpen] = useState(false);
    const [dataTypeOpen, setDataTypeOpen] = useState(false);
    const [semesterOpen, setSemesterOpen] = useState(false);

    const activeChartData = useMemo(() => {
        if (!data.chart || Object.keys(data.chart).length === 0) return [];
        let ds = data.chart[dataType] || [];
        
        if (dataType === 'siswa_per_kelas' || dataType === 'siswa_per_tingkat') {
            if (selectedSemester === 'all') {
                const agg = {};
                Object.values(ds).flat().forEach(item => {
                    if (!agg[item.name]) agg[item.name] = 0;
                    agg[item.name] += item.value;
                });
                return Object.keys(agg).map(k => ({ name: k, value: agg[k] })).sort((a,b) => a.name.localeCompare(b.name));
            } else {
                return ds[selectedSemester] || [];
            }
        }
        return ds;
    }, [data.chart, dataType, selectedSemester]);

    const activeChartDataColored = useMemo(() => {
        return activeChartData.map((entry, index) => ({
            ...entry,
            fill: CHART_COLORS[index % CHART_COLORS.length]
        }));
    }, [activeChartData]);

    const DATA_TYPE_LABELS = {
        'siswa_per_kelas': 'Siswa per Kelas',
        'siswa_per_tingkat': 'Siswa per Tingkat',
        'soal_per_mapel': 'Soal per Mapel',
        'soal_per_tingkat_kelas': 'Soal per Tingkat',
        'soal_per_level_kognitif': 'Soal per Level Kognitif',
        'kelas_per_semester': 'Kelas per Semester',
    };

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
            <section className="overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary px-4 py-6 sm:px-8 sm:py-10 shadow-lg backdrop-blur-xl">
                <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1.5fr_0.5fr] lg:items-center">
                    <div>
                        <p className="text-xs uppercase tracking-[0.45em] text-accent font-bold">Sistem Informasi Asesmen</p>
                        <h3 className="mt-4 max-w-2xl text-2xl sm:text-4xl font-extrabold tracking-tight text-[#EEDCC8]">
                            Selamat Datang, {session?.user?.admin?.nama_lengkap || session?.user?.username || 'Admin'}
                        </h3>
                        <p className="mt-4 max-w-2xl text-base leading-relaxed text-accent">
                            Pusat pengendalian utama sistem. Pantau ringkasan data, grafik aktivitas pengguna, serta akses cepat ke manajemen data pokok.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <a
                                href="/admin/pengguna"
                                className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-[#EEDCC8] shadow-md transition-all hover:bg-accent hover:scale-105 hover:shadow-primary/25"
                            >
                                Kelola Pengguna
                            </a>
                            <a
                                href="/admin/pemetaan-akademik"
                                className="inline-flex items-center rounded-full border border-border bg-accent px-6 py-3 text-sm font-semibold text-[#EEDCC8] backdrop-blur-md transition-all hover:bg-accent hover:shadow-sm hover:scale-105"
                            >
                                Lihat Pemetaan Akademik
                            </a>
                        </div>
                    </div>

                    <div className="lg:hidden grid grid-cols-2 gap-3 mt-6">
                        <div className="rounded-2xl sm:rounded-[1.5rem] bg-[#EEDCC8] p-4 sm:p-5 border border-white shadow-sm">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div className="text-2xl font-extrabold text-accent">{loading ? '...' : data.summary.total_guru}</div>
                            <div className="text-xs sm:text-sm font-medium text-accent mt-1">Guru Aktif</div>
                        </div>
                        <div className="rounded-2xl sm:rounded-[1.5rem] bg-[#EEDCC8] p-4 sm:p-5 border border-white shadow-sm">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10 text-info mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                                </svg>
                            </div>
                            <div className="text-2xl font-extrabold text-accent">{loading ? '...' : data.summary.total_siswa}</div>
                            <div className="text-xs sm:text-sm font-medium text-accent mt-1">Siswa Terdaftar</div>
                        </div>
                    </div>

                    <div className="hidden lg:block relative">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 to-info/5 blur-2xl opacity-50 rounded-full"></div>
                        <div className="relative grid grid-cols-2 gap-4">
                            <div className="rounded-[1.5rem] bg-[#EEDCC8] p-5 backdrop-blur-xl border border-white shadow-sm transition hover:shadow-md">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div className="text-3xl font-extrabold text-accent">{loading ? '...' : data.summary.total_guru}</div>
                                <div className="text-sm font-medium text-accent mt-1">Guru Aktif</div>
                            </div>
                            <div className="rounded-[1.5rem] bg-[#EEDCC8] p-5 backdrop-blur-xl border border-white shadow-sm transition hover:shadow-md translate-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/10 text-info mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                                    </svg>
                                </div>
                                <div className="text-3xl font-extrabold text-accent">{loading ? '...' : data.summary.total_siswa}</div>
                                <div className="text-sm font-medium text-accent mt-1">Siswa Terdaftar</div>
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
                    label="Total Pengguna Aktif" 
                    value={loading ? '...' : data.summary.total_pengguna_aktif} 
                    description="Total akun yang aktif dan bisa digunakan." 
                    tone="blue" 
                />
                <StatCard 
                    label="Total Pengguna Diarsipkan" 
                    value={loading ? '...' : data.summary.total_pengguna_arsip} 
                    description="Total akun yang telah dinonaktifkan." 
                    tone="indigo" 
                />
                <StatCard 
                    label="Kelas Aktif" 
                    value={loading ? '...' : data.summary.total_kelas} 
                    description="Jumlah rombongan belajar saat ini." 
                    tone="cyan" 
                />
                <StatCard 
                    label="Total Mata Pelajaran" 
                    value={loading ? '...' : data.summary.total_mapel} 
                    description="Mata pelajaran yang terdaftar." 
                    tone="emerald" 
                />
            </section>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr] w-full min-w-0">
                <section className="rounded-2xl sm:rounded-[2.5rem] border border-border bg-white/60 backdrop-blur-xl p-4 sm:p-8 shadow-sm flex flex-col min-w-0">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-slate-500">GRAFIK ANALITIK</h4>
                            <h3 className="mt-1 text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Statistik Data</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {/* Chart Type Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => { setChartTypeOpen(v => !v); setDataTypeOpen(false); setSemesterOpen(false); }}
                                    className="flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold bg-[#111827] text-white border border-[#111827] shadow-lg shadow-slate-900/20 transition-all duration-200"
                                >
                                    <span>{chartType === 'area' ? '📈' : '📊'}</span>
                                    <span>{chartType === 'area' ? 'Grafik Area' : 'Grafik Batang'}</span>
                                    <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${chartTypeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {chartTypeOpen && (
                                    <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-48 z-50 rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
                                        <div className="p-1.5">
                                            {[
                                                { value: 'area', label: 'Grafik Area', icon: '📈' },
                                                { value: 'bar', label: 'Grafik Batang', icon: '📊' }
                                            ].map((opt) => (
                                                <button key={opt.value} onClick={() => { setChartType(opt.value); setChartTypeOpen(false); }} className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${chartType === opt.value ? 'bg-[#111827] text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                                                    <span>{opt.icon}</span>
                                                    <span>{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Data Type Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => { setDataTypeOpen(v => !v); setChartTypeOpen(false); setSemesterOpen(false); }}
                                    className="flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold border transition-all duration-200 bg-white text-slate-700 border-slate-200 hover:border-primary/40 hover:bg-slate-50 shadow-sm"
                                >
                                    <span>📑</span>
                                    <span>{DATA_TYPE_LABELS[dataType]}</span>
                                    <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${dataTypeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {dataTypeOpen && (
                                    <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-56 z-50 rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
                                        <div className="p-1.5">
                                            {Object.entries(DATA_TYPE_LABELS).map(([key, label]) => (
                                                <button key={key} onClick={() => { setDataType(key); setDataTypeOpen(false); }} className={`w-full text-left rounded-xl px-3 py-2 text-sm font-medium transition-colors ${dataType === key ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Semester Dropdown (only for class/siswa) */}
                            {(dataType === 'siswa_per_kelas' || dataType === 'siswa_per_tingkat') && (
                                <div className="relative">
                                    <button
                                        onClick={() => { setSemesterOpen(v => !v); setChartTypeOpen(false); setDataTypeOpen(false); }}
                                        className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold border transition-all duration-200 ${selectedSemester !== 'all' ? 'bg-primary text-white border-primary shadow-md shadow-primary/25' : 'bg-white text-slate-700 border-slate-200 hover:border-primary/40 hover:bg-slate-50 shadow-sm'}`}
                                    >
                                        <span>📅</span>
                                        <span className="max-w-[110px] truncate">{selectedSemester === 'all' ? 'Semua Semester' : selectedSemester}</span>
                                        <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${semesterOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    {semesterOpen && (
                                        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-64 z-50 rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
                                            <div className="p-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                                                {[{ value: 'all', label: 'Semua Semester' }, ...data.tahun_ajaran_options.map(p => ({ value: p, label: p }))].map((opt) => (
                                                    <button key={opt.value} onClick={() => { setSelectedSemester(opt.value); setSemesterOpen(false); }} className={`w-full text-left rounded-xl px-3 py-2 text-sm font-medium transition-colors ${selectedSemester === opt.value ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="w-full flex-grow rounded-2xl border border-border/50 bg-white shadow-inner flex flex-col min-h-0 min-w-0 h-[340px] overflow-hidden">
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
                                Memuat grafik...
                            </div>
                        ) : activeChartDataColored.length > 0 ? (
                            <div className="flex-1 w-full overflow-x-auto overflow-y-hidden custom-scrollbar p-3 sm:p-5">
                                <div className="h-full min-w-[600px] sm:min-w-0 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        {chartType === 'area' ? (
                                            <AreaChart data={activeChartDataColored} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                                                <defs>
                                                    <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8A2332" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#8A2332" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={<CustomXAxisTick />} interval={0} height={70} />
                                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }} />
                                                <Area type="monotone" dataKey="value" stroke="#8A2332" strokeWidth={3} fillOpacity={1} fill="url(#colorArea)" dot={{ r: 5, fill: '#8A2332', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#8A2332', stroke: '#fff', strokeWidth: 3 }} />
                                            </AreaChart>
                                        ) : (
                                            <BarChart data={activeChartDataColored} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={<CustomXAxisTick />} interval={0} height={70} />
                                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f8fafc' }} />
                                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32} animationDuration={600}>
                                                    {activeChartDataColored.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-sm text-slate-400 font-medium gap-3 p-5">
                                <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                                <span>Belum ada data untuk filter yang dipilih</span>
                            </div>
                        )}
                        
                        {/* Legend for bar chart */}
                        {chartType === 'bar' && activeChartDataColored.length > 0 && (
                            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 pb-4">
                                {activeChartDataColored.map((item) => (
                                    <div key={item.name} className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                                        <span className="text-[10px] font-semibold text-slate-500">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl sm:rounded-[2.5rem] border border-border bg-white/60 backdrop-blur-xl p-4 sm:p-8 shadow-sm flex flex-col min-w-0">
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
                        <div className="flex flex-col gap-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
                            {data.logs.length === 0 ? (
                                <p className="text-sm text-slate-500 py-4 text-center">Belum ada riwayat aktivitas.</p>
                            ) : (
                                data.logs.map((log) => (
                                    <div key={log.id} className="flex items-start gap-3 rounded-xl p-2 transition hover:bg-slate-50">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
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
            {renderDashboard()}
        </DashboardLayout>
    );
}