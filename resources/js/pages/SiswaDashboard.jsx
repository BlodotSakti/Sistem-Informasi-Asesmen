import { useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { siswaNavigation } from './siswa/siswaNavigation';
import { useSiswaData } from './siswa/useSiswaData';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
                <p className="mb-1 text-sm font-semibold text-slate-600">{label}</p>
                <p className="text-2xl font-bold text-blue-600">
                    {payload[0].value} <span className="text-sm font-normal text-slate-500">Poin</span>
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

    return (
        <DashboardLayout title="Dashboard Siswa" user={session?.user} navigation={siswaNavigation} onLogout={onLogout} profileHref="/siswa/profil">
            <div className="space-y-6">
                <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800 px-6 py-8 text-white shadow-2xl shadow-slate-950/20 lg:px-8">
                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-indigo-300">Ringkasan Siswa</p>
                        <h3 className="text-2xl font-semibold text-slate-100">Halo, {session?.user?.nama_lengkap || 'Siswa'}! 👋</h3>
                        <p className="max-w-2xl text-sm text-slate-300">Selamat datang di dashboard akademik Anda. Pantau perkembangan nilai, ujian terdekat, dan apresiasi yang Anda raih di sini.</p>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Rata-rata Nilai" value={loading ? '...' : cards.rata_rata ?? 0} description="Rata-rata CBT semester ini" tone="blue" />
                        <StatCard label="Ujian Menunggu" value={loading ? '...' : cards.ujian_menunggu ?? 0} description="CBT terdekat siap dikerjakan" tone="amber" />
                        <StatCard label="Tugas / Sesi Selesai" value={loading ? '...' : cards.tugas_aktif ?? 0} description="CBT yang telah dikerjakan" tone="slate" />
                        <StatCard label="Badge Apresiasi" value={loading ? '...' : cards.apresiasi ?? 0} description="Apresiasi dari guru" tone="rose" />
                    </div>
                </section>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <section className="grid gap-6 xl:grid-cols-3">
                    <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Grafik Nilai</p>
                                <h3 className="mt-2 text-xl font-semibold text-slate-900">Tren Perkembangan Akademik</h3>
                            </div>
                        </div>
                        <div className="h-72 w-full flex-grow rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorNilai" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 12 }} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <Area 
                                            type="monotone" 
                                            dataKey="Nilai" 
                                            stroke="#2563eb" 
                                            strokeWidth={3}
                                            fillOpacity={1} 
                                            fill="url(#colorNilai)" 
                                            activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                    Belum ada data tren nilai yang cukup untuk divisualisasikan.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Kelas Aktif</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Kelas & Wali</h3>
                            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="font-semibold text-slate-900">{summary?.profile?.kelas_aktif?.nama_kelas || 'Belum ada kelas aktif'}</p>
                                <p className="text-sm text-slate-500">{summary?.profile?.kelas_aktif?.guru_wali ? `Wali kelas: ${summary.profile.kelas_aktif.guru_wali}` : 'Wali kelas belum ditetapkan'}</p>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Mapel Aktif</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Tergabung di Kelas</h3>
                            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="font-semibold text-slate-900">{(summary?.profile?.mata_pelajaran || []).length} Mata Pelajaran</p>
                                <p className="text-sm text-slate-500">Terkait dengan penugasan guru di kelas.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}