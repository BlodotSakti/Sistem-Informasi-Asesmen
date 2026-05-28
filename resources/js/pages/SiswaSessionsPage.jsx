import { useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { siswaNavigation } from './siswa/siswaNavigation';
import { useSiswaData } from './siswa/useSiswaData';

export default function SiswaSessionsPage({ session, onLogout }) {
    const { summary, activeSessions, loading, error } = useSiswaData(session, { includeActiveSessions: true });
    const sessions = activeSessions?.data || [];
    const [sessionSearch, setSessionSearch] = useState('');

    const filteredSessions = useMemo(() => {
        const search = sessionSearch.trim().toLowerCase();

        return sessions.filter((item) => {
            if (search === '') {
                return true;
            }

            return [item.mata_pelajaran?.nama_mapel, item.mataPelajaran?.nama_mapel, item.kelas?.nama_kelas, item.tipe_soal, item.jenis_asesmen, item.waktu_mulai]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [sessionSearch, sessions]);

    return (
        <DashboardLayout title="Sesi Aktif" user={session?.user} navigation={siswaNavigation} onLogout={onLogout} profileHref="/siswa/profil">
            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Sesi CBT</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">Semua sesi yang sedang aktif</h3>
                    <p className="mt-2 text-sm text-slate-500">Halaman ini khusus untuk melihat jadwal CBT yang bisa diakses siswa saat ini.</p>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Sesi Aktif" value={loading ? '...' : sessions.length} description="Jadwal yang tersedia" tone="blue" />
                        <StatCard label="Kelas Aktif" value={loading ? '...' : summary?.profile?.kelas_aktif?.nama_kelas || '-'} description="Kelas yang dipakai filter" tone="amber" />
                        <StatCard label="Mapel Aktif" value={loading ? '...' : (summary?.profile?.mata_pelajaran || []).length} description="Mapel terkait kelas" tone="slate" />
                        <StatCard label="Ujian Menunggu" value={loading ? '...' : summary?.cards?.ujian_menunggu ?? 0} description="Dari ringkasan siswa" tone="rose" />
                    </div>
                </section>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <label className="mb-4 block space-y-2 text-sm font-medium text-slate-700">
                        <span>Cari sesi aktif</span>
                        <input value={sessionSearch} onChange={(event) => setSessionSearch(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Mapel, kelas, jenis asesmen, atau waktu" />
                    </label>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Mata Pelajaran</th>
                                    <th className="px-4 py-3 font-semibold">Kelas</th>
                                    <th className="px-4 py-3 font-semibold">Jenis</th>
                                    <th className="px-4 py-3 font-semibold">Durasi</th>
                                    <th className="px-4 py-3 font-semibold">Mulai</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredSessions.map((item) => (
                                    <tr key={item.id_sesi} className="align-top hover:bg-slate-50/70">
                                        <td className="px-4 py-3 font-semibold text-slate-900">{item.mata_pelajaran?.nama_mapel || item.mataPelajaran?.nama_mapel || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.kelas?.nama_kelas || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.tipe_soal || '-'} • {item.jenis_asesmen || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.durasi_menit || 0} menit</td>
                                        <td className="px-4 py-3 text-slate-600">{item.waktu_mulai || '-'}</td>
                                    </tr>
                                ))}
                                {!loading && filteredSessions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-4 text-sm text-slate-500">Belum ada sesi aktif untuk kelas ini.</td>
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