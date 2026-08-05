import { useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { siswaNavigation } from './siswa/siswaNavigation';
import { useSiswaData } from './siswa/useSiswaData';
import { formatDateTimeLabel } from '../lib/date';

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
                <section className="overflow-hidden rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary px-8 py-10 shadow-lg backdrop-blur-xl relative">
                    <p className="text-xs uppercase tracking-[0.4em] text-accent font-bold">Sesi CBT</p>
                    <h3 className="mt-2 text-3xl font-semibold text-[#EEDCC8]">Semua sesi yang sedang aktif</h3>
                    <p className="mt-2 text-sm text-accent">Halaman ini khusus untuk melihat jadwal CBT yang bisa diakses siswa saat ini.</p>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Sesi Aktif" value={loading ? '...' : sessions.length} description="Jadwal yang tersedia" tone="blue" className="!bg-[#EEDCC8] !border-transparent" />
                        <StatCard label="Kelas Aktif" value={loading ? '...' : summary?.profile?.kelas_aktif?.nama_kelas || '-'} description="Kelas yang dipakai filter" tone="amber" className="!bg-[#EEDCC8] !border-transparent" />
                        <StatCard label="Mapel Aktif" value={loading ? '...' : (summary?.profile?.mata_pelajaran || []).length} description="Mapel terkait kelas" tone="slate" className="!bg-[#EEDCC8] !border-transparent" />
                        <StatCard label="Ujian Menunggu" value={loading ? '...' : summary?.cards?.ujian_menunggu ?? 0} description="Dari ringkasan siswa" tone="rose" className="!bg-[#EEDCC8] !border-transparent" />
                    </div>
                </section>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                    <label className="mb-4 block space-y-2 text-sm font-medium text-slate-700">
                        <span>Cari sesi aktif</span>
                        <input value={sessionSearch} onChange={(event) => setSessionSearch(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Mapel, kelas, jenis asesmen, atau waktu" />
                    </label>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Mata Pelajaran</th>
                                    <th className="px-4 py-3 font-semibold">Kelas</th>
                                    <th className="px-4 py-3 font-semibold">Jenis</th>
                                    <th className="px-4 py-3 font-semibold">Durasi</th>
                                    <th className="px-4 py-3 font-semibold">Waktu Pelaksanaan</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredSessions.map((item) => {
                                    const sudahDikerjakan = !!item.sudah_dikerjakan;
                                    const bolehUlang = !!item.boleh_ulang;
                                    const isExpired = item.waktu_selesai && new Date() > new Date(item.waktu_selesai);
                                    const isBelumMulai = item.waktu_mulai && new Date() < new Date(item.waktu_mulai);
                                    const isActiveRow = !sudahDikerjakan && !isExpired && !isBelumMulai;
                                    
                                    return (
                                    <tr key={item.id_sesi} className={`align-top transition-colors ${isActiveRow ? 'bg-blue-50/80 hover:bg-blue-50/100' : 'hover:bg-slate-50/70'}`}>
                                        <td className="px-4 py-3 font-semibold text-slate-900">{item.mata_pelajaran?.nama_lengkap || item.mata_pelajaran?.nama_mapel || item.mataPelajaran?.nama_lengkap || item.mataPelajaran?.nama_mapel || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.kelas?.nama_kelas || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.tipe_soal || '-'} • {item.jenis_asesmen || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.durasi_menit || 0} menit</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            <div className="font-medium text-slate-900">{formatDateTimeLabel(item.waktu_mulai)}</div>
                                            {item.waktu_selesai ? <div className="mt-1 text-xs text-rose-600 font-medium">S/d: {formatDateTimeLabel(item.waktu_selesai)}</div> : null}
                                        </td>
                                        <td className="px-4 py-3">
                                            {sudahDikerjakan ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                    Selesai
                                                </span>
                                            ) : isExpired ? (
                                                <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                                                    Waktu Habis
                                                </span>
                                            ) : isBelumMulai ? (
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                    Sesi Belum Dimulai
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                                    Belum Dikerjakan
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {sudahDikerjakan && !bolehUlang ? (
                                                <span className="inline-flex items-center justify-center rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 cursor-not-allowed">
                                                    Sudah Dikerjakan
                                                </span>
                                            ) : isExpired && !sudahDikerjakan ? (
                                                <span className="inline-flex items-center justify-center rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 cursor-not-allowed">
                                                    CBT Sudah Ditutup
                                                </span>
                                            ) : isBelumMulai ? (
                                                <span className="inline-flex items-center justify-center rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 cursor-not-allowed">
                                                    Sesi Belum Dimulai
                                                </span>
                                            ) : (
                                                <a
                                                    href={`/siswa/cbt/${item.id_sesi}`}
                                                    className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/85 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                                >
                                                    {sudahDikerjakan ? 'Kerjakan Ulang' : 'Kerjakan'}
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                    );
                                })}
                                {!loading && filteredSessions.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-4 text-center text-sm text-slate-500">Belum ada sesi aktif untuk kelas ini.</td>
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