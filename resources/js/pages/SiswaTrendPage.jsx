import { useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { siswaNavigation } from './siswa/siswaNavigation';
import { useSiswaData } from './siswa/useSiswaData';

export default function SiswaTrendPage({ session, onLogout }) {
    const { summary, loading, error } = useSiswaData(session);
    const trendPoints = summary?.trend || [];
    const [trendSearch, setTrendSearch] = useState('');

    const filteredTrendPoints = useMemo(() => {
        const search = trendSearch.trim().toLowerCase();

        return trendPoints.filter((point, index) => {
            if (search === '') {
                return true;
            }

            const label = point.label || `M${index + 1}`;

            return [label, point.value]
                .filter((value) => value !== null && value !== undefined)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [trendPoints, trendSearch]);

    return (
        <DashboardLayout title="Tren Nilai" user={session?.user} navigation={siswaNavigation} onLogout={onLogout} profileHref="/siswa/profil">
            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Grafik Nilai</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">Tren perkembangan akademik</h3>
                    <p className="mt-2 text-sm text-slate-500">Halaman ini hanya menampilkan visualisasi nilai agar tidak bercampur dengan menu lain.</p>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Rata-rata" value={loading ? '...' : summary?.cards?.rata_rata ?? 0} description="Nilai semester berjalan" tone="blue" />
                        <StatCard label="Tugas Aktif" value={loading ? '...' : summary?.cards?.tugas_aktif ?? 0} description="Jawaban yang tercatat" tone="amber" />
                        <StatCard label="Apresiasi" value={loading ? '...' : summary?.cards?.apresiasi ?? 0} description="Badge dari guru mapel" tone="rose" />
                        <StatCard label="Ujian Menunggu" value={loading ? '...' : summary?.cards?.ujian_menunggu ?? 0} description="CBT terdekat" tone="slate" />
                    </div>
                </section>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex h-80 items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        {filteredTrendPoints.map((point, index) => (
                            <div key={index} className="flex flex-1 flex-col items-center gap-3">
                                <div className="w-full max-w-[44px] rounded-t-2xl bg-gradient-to-t from-slate-900 to-slate-500" style={{ height: `${Math.max(10, Number(point.value || 0)) * 2.5}%` }} />
                                <span className="text-xs text-slate-500">{point.label || `M${index + 1}`}</span>
                            </div>
                        ))}
                    </div>

                    <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
                        <span>Cari tren nilai</span>
                        <input value={trendSearch} onChange={(event) => setTrendSearch(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Label periode atau nilai" />
                    </label>

                    <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Label</th>
                                    <th className="px-4 py-3 font-semibold">Nilai</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredTrendPoints.map((point, index) => (
                                    <tr key={`${point.label || index}`} className="align-top hover:bg-slate-50/70">
                                        <td className="px-4 py-3 font-semibold text-slate-900">{point.label || `M${index + 1}`}</td>
                                        <td className="px-4 py-3 text-slate-600">{point.value ?? '-'}</td>
                                    </tr>
                                ))}
                                {filteredTrendPoints.length === 0 ? (
                                    <tr>
                                        <td colSpan="2" className="px-4 py-4 text-sm text-slate-500">Belum ada data tren nilai.</td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}