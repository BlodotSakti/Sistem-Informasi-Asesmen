import { useMemo, useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { siswaNavigation } from './siswa/siswaNavigation';
import { useSiswaData } from './siswa/useSiswaData';
import BadgeIcon from '../components/ui/BadgeIcon';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts';

const MAPEL_COLORS = [
    '#1E3A5F', '#D9A441', '#8A2332', '#2D9C6F', '#7C3AED',
    '#E76F51', '#3B82F6', '#F59E0B', '#10B981', '#EC4899',
    '#6366F1', '#14B8A6', '#F97316', '#06B6D4', '#8B5CF6',
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const [mainLabel, subLabel] = (label || '').split(' | ');
        return (
            <div className="rounded-2xl border border-border bg-white/80 backdrop-blur-md p-4 shadow-xl min-w-[140px]">
                <p className="mb-1 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    {mainLabel} {subLabel && <span className="block text-xs font-medium text-slate-400 normal-case mt-0.5">{subLabel}</span>}
                </p>
                {payload.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2 mt-1">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color || entry.fill || '#1E3A5F' }} />
                        <span className="text-lg font-black text-primary">
                            {entry.value} <span className="text-xs font-semibold text-slate-400">Pts</span>
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const CustomXAxisTick = ({ x, y, payload, chartMode }) => {
    const value = payload.value || '';
    // For bar chart, only show date/exam label (no mapel name) since colors distinguish them
    const [label] = chartMode === 'bar' ? [value.split(' | ')[0]] : [value];
    const parts = label.split(' | ');
    const mainLabel = parts[0] || '';
    const subLabel = chartMode !== 'bar' ? (parts[1] || '') : '';
    
    // With horizontal scrolling, we don't need to squash labels too much
    const maxLen = 18;
    const displayLabel = mainLabel.length > maxLen ? mainLabel.slice(0, maxLen) + '…' : mainLabel;
    
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="end" fill="#64748b" fontSize={10} fontWeight={600} transform="rotate(-25)">
                <tspan x={0} dy="0em">{displayLabel}</tspan>
                {subLabel && <tspan x={0} dy="1.2em" fill="#94a3b8" fontSize={9} fontWeight={500}>{subLabel}</tspan>}
            </text>
        </g>
    );
};

export default function SiswaDashboard({ session, onLogout }) {
    const { summary, loading, error } = useSiswaData(session);
    const cards = summary?.cards || {};
    
    const [selectedSemester, setSelectedSemester] = useState('all');
    const [selectedMapel, setSelectedMapel] = useState('all');
    const [semesterOpen, setSemesterOpen] = useState(false);
    const [mapelOpen, setMapelOpen] = useState(false);
    const [chartType, setChartType] = useState('area');
    const [chartTypeOpen, setChartTypeOpen] = useState(false);

    const rawTrendPoints = summary?.trend_data || [];
    const periodeOptions = summary?.periode_options || [];
    const mapelOptions = summary?.profile?.mata_pelajaran || [];

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (!e.target.closest('#filter-semester')) setSemesterOpen(false);
            if (!e.target.closest('#filter-mapel')) setMapelOpen(false);
            if (!e.target.closest('#filter-charttype')) setChartTypeOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const chartData = useMemo(() => {
        let filtered = rawTrendPoints;
        
        if (selectedSemester && selectedSemester !== 'all') {
            filtered = filtered.filter(p => p.periode === selectedSemester);
        }
        
        if (selectedMapel && selectedMapel !== 'all') {
            filtered = filtered.filter(p => String(p.id_mapel) === String(selectedMapel));
        }

        filtered = filtered.slice(-10);

        return filtered.map((point, index) => {
            let label = point.label ? `${point.label} (${point.tipe_soal || 'CBT'})` : `M${index + 1}`;
            
            if (selectedMapel === 'all' && point.id_mapel) {
                const mapelObj = mapelOptions.find(m => String(m.id_mapel) === String(point.id_mapel));
                if (mapelObj && mapelObj.nama_mapel) {
                    label = `${label} | ${mapelObj.nama_mapel}`;
                }
            }

            return {
                id: index,
                name: label,
                Nilai: Number(point.value || 0),
            };
        });
    }, [rawTrendPoints, selectedSemester, selectedMapel, mapelOptions]);

    const timelineData = summary?.timeline || [];
    const barChartData = summary?.bar_chart || [];
    const badgeData = summary?.badges || [];

    // Build color map for mapel
    const mapelColorMap = useMemo(() => {
        const map = {};
        mapelOptions.forEach((m, i) => {
            map[String(m.id_mapel)] = MAPEL_COLORS[i % MAPEL_COLORS.length];
        });
        return map;
    }, [mapelOptions]);

    // Bar chart data with color per mapel
    const barColoredData = useMemo(() => {
        return chartData.map((d, idx) => {
            const raw = (() => {
                let filtered = rawTrendPoints;
                if (selectedSemester && selectedSemester !== 'all') {
                    filtered = filtered.filter(p => p.periode === selectedSemester);
                }
                if (selectedMapel && selectedMapel !== 'all') {
                    filtered = filtered.filter(p => String(p.id_mapel) === String(selectedMapel));
                }
                return filtered.slice(-10);
            })();
            const point = raw[idx];
            return {
                ...d,
                fill: point?.id_mapel ? (mapelColorMap[String(point.id_mapel)] || '#94a3b8') : '#1E3A5F',
                mapelName: point?.nama_mapel || '',
            };
        });
    }, [chartData, rawTrendPoints, selectedSemester, selectedMapel, mapelColorMap]);

    const chartTypeOptions = [
        { value: 'area', label: 'Grafik Area', icon: '📈' },
        { value: 'bar', label: 'Grafik Batang', icon: '📊' },
    ];
    const activeChartType = chartTypeOptions.find(o => o.value === chartType) || chartTypeOptions[0];

    const selectedSemesterLabel = selectedSemester === 'all' ? 'Semua Semester' : selectedSemester;
    const selectedMapelLabel = selectedMapel === 'all' ? 'Semua Mapel' : (mapelOptions.find(m => String(m.id_mapel) === String(selectedMapel))?.nama_mapel || 'Mata Pelajaran');
    const hasActiveFilters = selectedSemester !== 'all' || selectedMapel !== 'all';

    // Detect mobile for chart responsiveness
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    return (
        <DashboardLayout title="Dashboard Siswa" user={session?.user} navigation={siswaNavigation} onLogout={onLogout} profileHref="/siswa/profil">
            <div className="space-y-6 lg:space-y-8">
                {/* Hero Section */}
                <section className="overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary px-4 py-6 sm:px-8 sm:py-10 shadow-lg backdrop-blur-xl relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/20 blur-[80px] rounded-full pointer-events-none" />
                    <div className="flex flex-col gap-2 relative z-10">
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] text-accent">Ringkasan Akademik</p>
                        <h3 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#EEDCC8] tracking-tight leading-tight">Halo, {session?.user?.nama_lengkap || 'Siswa'}! 👋</h3>
                        <p className="text-sm sm:text-base text-accent/90 font-medium max-w-2xl">Jelajahi perkembangan nilai, raih lebih banyak lencana, dan jadilah yang terbaik di setiap tantangan asesmen.</p>
                    </div>

                    <div className="mt-5 sm:mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 relative z-10">
                        <StatCard label="Rata-rata Nilai" value={loading ? '...' : cards.rata_rata ?? 0} description="Skor CBT semester ini" tone="blue" className="!bg-[#EEDCC8] !border-transparent" />
                        <StatCard label="Ujian Menunggu" value={loading ? '...' : cards.ujian_menunggu ?? 0} description="Misi CBT yang siap dikerjakan" tone="amber" className="!bg-[#EEDCC8] !border-transparent" />
                        <StatCard label="Asesmen Selesai" value={loading ? '...' : cards.tugas_aktif ?? 0} description="CBT yang telah ditaklukkan" tone="emerald" className="!bg-[#EEDCC8] !border-transparent" />
                        <StatCard label="Total Lencana" value={loading ? '...' : cards.apresiasi ?? 0} description="Penghargaan apresiasi guru" tone="indigo" className="!bg-[#EEDCC8] !border-transparent" />
                    </div>
                </section>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                {/* Main Grid */}
                <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    {/* Left: Chart + Timeline */}
                    <div className="xl:col-span-2 flex flex-col gap-6">

                        {/* Grafik Area */}
                        <div className="rounded-2xl sm:rounded-[2.5rem] border border-border bg-white/70 p-4 sm:p-6 backdrop-blur-xl shadow-sm flex flex-col">
                            {/* Header + Filters */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-secondary">Grafik Performa</p>
                                    <h3 className="mt-1 text-lg sm:text-xl lg:text-2xl font-extrabold text-primary tracking-tight">Tren Perkembangan Nilai</h3>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Chart Type Toggle */}
                                    <div id="filter-charttype" className="relative">
                                        <button
                                            onClick={() => { setChartTypeOpen(v => !v); setSemesterOpen(false); setMapelOpen(false); }}
                                            className="flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold border transition-all duration-200 outline-none whitespace-nowrap bg-slate-900 text-white border-slate-700 shadow-md shadow-slate-900/25 hover:bg-slate-800"
                                        >
                                            <span>{activeChartType?.icon}</span>
                                            <span className="max-w-[100px] truncate hidden sm:inline">{activeChartType?.label}</span>
                                            <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${chartTypeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {chartTypeOpen && (
                                            <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 z-50 min-w-[180px] rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
                                                <div className="p-1.5">
                                                    {chartTypeOptions.map((opt) => {
                                                        const isSelected = opt.value === chartType;
                                                        return (
                                                            <button key={opt.value} onClick={() => { setChartType(opt.value); setChartTypeOpen(false); }}
                                                                className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors ${isSelected ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                                                                <span className="text-base">{opt.icon}</span>
                                                                <span>{opt.label}</span>
                                                                {isSelected && <svg className="w-4 h-4 flex-shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="hidden sm:block w-px h-6 bg-slate-200" />

                                    {/* Semester Filter */}
                                    <div id="filter-semester" className="relative">
                                        <button
                                            onClick={() => { setSemesterOpen(v => !v); setMapelOpen(false); }}
                                            className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold border transition-all duration-200 outline-none whitespace-nowrap
                                                ${selectedSemester !== 'all'
                                                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/25'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-primary/40 hover:bg-slate-50 shadow-sm'
                                                }`}
                                        >
                                            <span>📅</span>
                                            <span className="max-w-[110px] truncate">{selectedSemesterLabel}</span>
                                            <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${semesterOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {semesterOpen && (
                                            <div className="absolute right-0 top-full mt-2 z-50 min-w-[200px] rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
                                                <div className="p-1.5">
                                                    {[{ value: 'all', label: 'Semua Semester' }, ...periodeOptions.map(p => ({ value: p, label: p }))].map((opt) => {
                                                        const isSelected = String(opt.value) === String(selectedSemester);
                                                        return (
                                                            <button key={opt.value} onClick={() => { setSelectedSemester(opt.value); setSemesterOpen(false); }}
                                                                className={`w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors ${isSelected ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                                                                {isSelected ? <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg> : <span className="w-4" />}
                                                                <span>{opt.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Mapel Filter */}
                                    <div id="filter-mapel" className="relative">
                                        <button
                                            onClick={() => { setMapelOpen(v => !v); setSemesterOpen(false); }}
                                            className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold border transition-all duration-200 outline-none whitespace-nowrap
                                                ${selectedMapel !== 'all'
                                                    ? 'bg-secondary text-white border-secondary shadow-md shadow-secondary/25'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-secondary/40 hover:bg-slate-50 shadow-sm'
                                                }`}
                                        >
                                            <span>📚</span>
                                            <span className="max-w-[120px] truncate">{selectedMapelLabel}</span>
                                            <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${mapelOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {mapelOpen && (
                                            <div className="absolute right-0 top-full mt-2 z-50 min-w-[200px] rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
                                                <div className="p-1.5">
                                                    {[{ value: 'all', label: 'Semua Mata Pelajaran' }, ...mapelOptions.map(m => ({ value: m.id_mapel, label: m.nama_mapel }))].map((opt) => {
                                                        const isSelected = String(opt.value) === String(selectedMapel);
                                                        return (
                                                            <button key={opt.value} onClick={() => { setSelectedMapel(opt.value); setMapelOpen(false); }}
                                                                className={`w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors ${isSelected ? 'bg-secondary text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                                                                {isSelected ? <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg> : <span className="w-4" />}
                                                                <span>{opt.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {hasActiveFilters && (
                                        <button onClick={() => { setSelectedSemester('all'); setSelectedMapel('all'); }}
                                            className="rounded-2xl px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors">
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="w-full flex-grow rounded-2xl border border-border/50 bg-white shadow-inner flex flex-col min-h-0 min-w-0 h-[340px] overflow-hidden">
                                {chartData.length > 0 ? (
                                    <div className="flex-1 w-full overflow-x-auto overflow-y-hidden custom-scrollbar p-3 sm:p-5">
                                        <div className="h-full min-w-[600px] sm:min-w-0 relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                {chartType === 'area' ? (
                                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                                                        <defs>
                                                            <linearGradient id="colorNilai" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.4} />
                                                                <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={<CustomXAxisTick chartMode="area" />} interval={0} height={70} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} interval={0} />
                                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }} />
                                                        <Area type="monotone" dataKey="Nilai" stroke="#1E3A5F" strokeWidth={3} fillOpacity={1} fill="url(#colorNilai)" dot={{ r: 5, fill: '#1E3A5F', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#1E3A5F', stroke: '#fff', strokeWidth: 3 }} />
                                                    </AreaChart>
                                                ) : (
                                                    <BarChart data={barColoredData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={<CustomXAxisTick chartMode="bar" />} interval={0} height={70} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} interval={0} />
                                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                                        <Bar dataKey="Nilai" radius={[6, 6, 0, 0]} barSize={32} animationDuration={600}>
                                                            {barColoredData.map((entry, index) => (
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
                                {chartType === 'bar' && barColoredData.length > 0 && selectedMapel === 'all' && (
                                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 pb-4 mt-auto">
                                        {[...new Map(barColoredData.filter(d => d.mapelName).map(d => [d.mapelName, d.fill])).entries()].map(([name, color]) => (
                                            <div key={name} className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                                <span className="text-[10px] font-semibold text-slate-500">{name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timeline Pembelajaran */}
                        <div className="rounded-2xl sm:rounded-[2.5rem] border border-border bg-white/70 p-4 sm:p-6 backdrop-blur-xl shadow-sm">
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Aktivitas</p>
                            <h3 className="mt-1 text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Timeline Pembelajaran</h3>
                            <div className="mt-5 space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                {timelineData.length > 0 ? timelineData.map((item) => (
                                    <div key={item.id} className="relative flex items-start gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full border-4 border-white bg-primary/10 text-primary shadow flex items-center justify-center text-lg z-10 transition-transform hover:scale-110">{item.icon}</div>
                                        <div className="flex-1 min-w-0 p-3 sm:p-4 rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                                            <div className="font-bold text-slate-900 text-sm leading-snug">{item.title}</div>
                                            <div className="text-xs font-medium text-slate-500 mt-1">{item.date}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="ml-14 text-sm text-slate-400 italic py-4">Belum ada aktivitas belajar yang terekam.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-6">
                        {/* Bar Chart */}
                        <div className="rounded-2xl sm:rounded-[2.5rem] border border-border bg-white/70 p-4 sm:p-6 backdrop-blur-xl shadow-sm flex flex-col">
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-secondary">Statistik Nilai</p>
                            <h3 className="mt-1 text-base sm:text-xl font-extrabold text-accent">Rata-rata per Mata Pelajaran</h3>
                            <div className="mt-4 w-full h-56 sm:h-64">
                                {barChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={barChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                            <XAxis type="number" domain={[0, 100]} hide />
                                            <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} width={75} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                            <Bar dataKey="A" fill="#D9A441" radius={[0, 4, 4, 0]} barSize={18} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-slate-400 italic">Data asesmen belum memadai.</div>
                                )}
                            </div>
                            <p className="mt-3 text-[10px] text-center font-medium text-slate-400">Berdasarkan hasil analisis CBT terkini.</p>
                        </div>

                        {/* Galeri Lencana */}
                        <div className="rounded-2xl sm:rounded-[2.5rem] border border-border bg-gradient-to-b from-slate-950 to-slate-900 p-4 sm:p-6 shadow-xl flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-[50px] rounded-full pointer-events-none" />
                            <div className="relative z-10 mb-4">
                                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-amber-400">Gamifikasi</p>
                                <h3 className="mt-1 text-base sm:text-xl font-extrabold text-white">Galeri Lencana</h3>
                                <p className="text-xs text-slate-400 mt-1">Koleksi apresiasi spesial dari gurumu!</p>
                            </div>
                            <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3">
                                {badgeData.length > 0 ? badgeData.map((badge) => (
                                    <div key={badge.id_apresiasi} className="group relative flex flex-col items-center">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/10 transition-transform group-hover:scale-110 group-hover:rotate-3 cursor-pointer">
                                            <BadgeIcon name={badge.jenis_badge} className="w-12 h-12 sm:w-16 sm:h-16" />
                                        </div>
                                        <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-8 w-[150%] bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg z-20 pointer-events-none shadow-xl">
                                            {badge.jenis_badge}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-3 text-center text-xs text-slate-400 italic py-4">Belum ada lencana yang diraih.</div>
                                )}
                                <div className="flex flex-col items-center justify-center">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/50 flex items-center justify-center text-slate-600 text-xl font-black">?</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}