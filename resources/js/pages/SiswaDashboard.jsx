import { useMemo } from 'react';
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
    ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-2xl border border-border bg-white/80 backdrop-blur-md p-4 shadow-xl">
                <p className="mb-1 text-sm font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-black text-primary">
                    {payload[0].value} <span className="text-sm font-semibold text-slate-400">Pts</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function SiswaDashboard({ session, onLogout }) {
    const { summary, loading, error } = useSiswaData(session);
    const cards = summary?.cards || {};
    const trendPoints = summary?.trend || [];

    const chartData = useMemo(() => {
        return trendPoints.map((point, index) => ({
            id: index,
            name: point.label ? `${point.label} (Ke-${index + 1})` : `M${index + 1}`,
            Nilai: Number(point.value || 0),
        }));
    }, [trendPoints]);

    const timelineData = summary?.timeline || [];
    const barChartData = summary?.bar_chart || [];
    const badgeData = summary?.badges || [];

    return (
        <DashboardLayout title="Dashboard Siswa" user={session?.user} navigation={siswaNavigation} onLogout={onLogout} profileHref="/siswa/profil">
            <div className="space-y-8">
                <section className="overflow-hidden rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary px-8 py-10 shadow-lg backdrop-blur-xl relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/20 blur-[80px] rounded-full"></div>
                    <div className="flex flex-col gap-3 relative z-10">
                        <p className="text-xs font-bold uppercase tracking-[0.4em] text-accent">Ringkasan Akademik</p>
                        <h3 className="text-4xl font-extrabold text-[#EEDCC8] tracking-tight">Halo, {session?.user?.nama_lengkap || 'Siswa'}! 👋</h3>
                        <p className="max-w-2xl text-base text-accent font-medium">Jelajahi perkembangan nilai, raih lebih banyak lencana, dan jadilah yang terbaik di setiap tantangan asesmen.</p>
                    </div>

                    <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4 relative z-10">
                        <StatCard label="Rata-rata Nilai" value={loading ? '...' : cards.rata_rata ?? 0} description="Skor CBT semester ini" tone="blue" className="!bg-[#EEDCC8] !border-transparent" />
                        <StatCard label="Ujian Menunggu" value={loading ? '...' : cards.ujian_menunggu ?? 0} description="Misi CBT yang siap dikerjakan" tone="amber" className="!bg-[#EEDCC8] !border-transparent" />
                        <StatCard label="Asesmen Selesai" value={loading ? '...' : cards.tugas_aktif ?? 0} description="CBT yang telah ditaklukkan" tone="emerald" className="!bg-[#EEDCC8] !border-transparent" />
                        <StatCard label="Total Lencana" value={loading ? '...' : cards.apresiasi ?? 0} description="Penghargaan apresiasi guru" tone="indigo" className="!bg-[#EEDCC8] !border-transparent" />
                    </div>
                </section>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <section className="grid gap-6 xl:grid-cols-3">
                    <div className="xl:col-span-2 space-y-6">
                        {/* Grafik Area */}
                        <div className="rounded-[2.5rem] border border-border bg-white/60 p-8 backdrop-blur-xl shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Grafik Performa</p>
                                    <h3 className="mt-2 text-2xl font-extrabold text-primary tracking-tight">Tren Perkembangan Nilai</h3>
                                </div>
                            </div>
                            <div className="h-72 w-full flex-grow rounded-3xl border border-border/50 bg-white p-5 shadow-inner">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorNilai" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                                                dy={10}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }} />
                                            <Area 
                                                type="monotone" 
                                                dataKey="Nilai" 
                                                stroke="#1E3A5F" 
                                                strokeWidth={4}
                                                fillOpacity={1} 
                                                fill="url(#colorNilai)" 
                                                activeDot={{ r: 8, fill: '#1E3A5F', stroke: '#fff', strokeWidth: 3, shadow: '0 0 10px rgba(79,70,229,0.5)' }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center text-sm text-slate-500 font-medium">
                                        <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                        </svg>
                                        Belum ada data tren asesmen untuk divisualisasikan.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timeline Pembelajaran */}
                        <div className="rounded-[2.5rem] border border-border bg-white/60 p-8 backdrop-blur-xl shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Aktivitas</p>
                            <h3 className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">Timeline Pembelajaran</h3>
                            <div className="mt-6 space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                {timelineData.length > 0 ? timelineData.map((item) => (
                                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-primary/10 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 text-lg z-10 transition-transform group-hover:scale-110">
                                            {item.icon}
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-primary/10">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="font-bold text-slate-900">{item.title}</div>
                                            </div>
                                            <div className="text-sm font-medium text-slate-500">{item.date}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center text-sm text-slate-500 italic py-4">Belum ada aktivitas belajar yang terekam.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* Bar Chart: Rata-rata per Mapel */}
                        <div className="rounded-[2.5rem] border border-border bg-white/60 p-8 backdrop-blur-xl shadow-sm flex flex-col items-center">
                            <div className="w-full text-left mb-4">
                                <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Statistik Nilai</p>
                                <h3 className="mt-2 text-xl font-extrabold text-accent">Rata-rata per Mata Pelajaran</h3>
                            </div>
                            <div className="w-full h-64">
                                {barChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                            <XAxis type="number" domain={[0, 100]} hide />
                                            <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} width={80} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                            <Bar dataKey="A" fill="#D9A441" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-slate-500 italic">Data asesmen belum memadai.</div>
                                )}
                            </div>
                            <p className="mt-2 text-xs text-center font-medium text-slate-500">Berdasarkan hasil analisis CBT terkini.</p>
                        </div>

                        {/* Galeri Lencana */}
                        <div className="rounded-[2.5rem] border border-border bg-gradient-to-b from-slate-950 to-slate-900 p-8 shadow-xl flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-[50px] rounded-full"></div>
                            <div className="relative z-10 w-full text-left mb-6">
                                <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400">Gamifikasi</p>
                                <h3 className="mt-2 text-2xl font-extrabold text-white">Galeri Lencana</h3>
                                <p className="text-sm text-slate-400 mt-1">Koleksi apresiasi spesial dari gurumu!</p>
                            </div>
                            <div className="relative z-10 grid grid-cols-3 gap-3">
                                {badgeData.length > 0 ? badgeData.map((badge) => {
                                    return (
                                        <div key={badge.id_apresiasi} className="group relative flex flex-col items-center">
                                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center p-0.5 shadow-lg shadow-amber-500/10 transition-transform group-hover:scale-110 group-hover:rotate-3 cursor-pointer`}>
                                                <BadgeIcon name={badge.jenis_badge} className="w-16 h-16" />
                                            </div>
                                            <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-8 w-[150%] bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg z-20 pointer-events-none shadow-xl">
                                                {badge.jenis_badge}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="col-span-3 text-center text-xs text-slate-400 italic">Belum ada lencana yang diraih.</div>
                                )}
                                {/* Empty Slot */}
                                <div className="flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/50 flex items-center justify-center text-slate-600 text-xl font-black">
                                        ?
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}