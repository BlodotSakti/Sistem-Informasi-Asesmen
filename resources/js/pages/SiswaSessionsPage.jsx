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
    const [tokenModalOpen, setTokenModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [tokenInput, setTokenInput] = useState('');

    const handleStartExam = (item) => {
        if (item.has_token) {
            setSelectedSession(item);
            setTokenInput('');
            setTokenModalOpen(true);
        } else {
            window.location.href = `/siswa/cbt/${item.id_sesi}`;
        }
    };

    const submitToken = (e) => {
        e.preventDefault();
        if (!tokenInput.trim()) return;
        window.location.href = `/siswa/cbt/${selectedSession.id_sesi}?token=${tokenInput.trim().toUpperCase()}`;
    };

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
                <section className="overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary px-4 py-6 sm:px-8 sm:py-10 shadow-lg backdrop-blur-xl relative">
                    <p className="text-xs uppercase tracking-[0.4em] text-accent font-bold">Sesi CBT</p>
                    <h3 className="mt-2 text-2xl sm:text-3xl font-semibold text-[#EEDCC8]">Semua sesi yang sedang aktif</h3>
                    <p className="mt-2 text-sm text-accent">Halaman ini khusus untuk melihat jadwal CBT yang bisa diakses siswa saat ini.</p>

                    <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                        <StatCard 
                            label="Sesi Aktif" 
                            value={loading ? '...' : sessions.length} 
                            description="Jadwal yang tersedia" 
                            tone="blue" 
                            className="!bg-[#EEDCC8] !border-transparent" 
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                        <StatCard 
                            label="Kelas Aktif" 
                            value={loading ? '...' : summary?.profile?.kelas_aktif?.nama_kelas || '-'} 
                            description="Kelas yang dipakai filter" 
                            tone="amber" 
                            className="!bg-[#EEDCC8] !border-transparent" 
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            }
                        />
                        <StatCard 
                            label="Mapel Aktif" 
                            value={loading ? '...' : (summary?.profile?.mata_pelajaran || []).length} 
                            description="Mapel terkait kelas" 
                            tone="slate" 
                            className="!bg-[#EEDCC8] !border-transparent" 
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            }
                        />
                        <StatCard 
                            label="Ujian Menunggu" 
                            value={loading ? '...' : summary?.cards?.ujian_menunggu ?? 0} 
                            description="Dari ringkasan siswa" 
                            tone="rose" 
                            className="!bg-[#EEDCC8] !border-transparent" 
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                    </div>
                </section>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                    <label className="mb-4 block space-y-2 text-sm font-medium text-slate-700">
                        <span>Cari sesi aktif</span>
                        <input value={sessionSearch} onChange={(event) => setSessionSearch(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Mapel, kelas, jenis asesmen, atau waktu" />
                    </label>
                    <p className="text-[11px] sm:text-xs text-slate-500 mb-2 italic flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                        Geser tabel ke kanan/kiri untuk melihat detail selengkapnya
                    </p>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-center w-12">No.</th>
                                    <th className="px-4 py-3 font-semibold">Mata Pelajaran</th>
                                    <th className="px-4 py-3 font-semibold">Kelas</th>
                                    <th className="px-4 py-3 font-semibold">Jenis Asesmen</th>
                                    <th className="px-4 py-3 font-semibold">Durasi</th>
                                    <th className="px-4 py-3 font-semibold">Waktu Pelaksanaan</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredSessions.map((item, index) => {
                                    const sudahDikerjakan = !!item.sudah_dikerjakan;
                                    const bolehUlang = !!item.boleh_ulang;
                                    const isExpired = item.waktu_selesai && new Date() > new Date(item.waktu_selesai);
                                    const isBelumMulai = item.waktu_mulai && new Date() < new Date(item.waktu_mulai);
                                    const isActiveRow = !sudahDikerjakan && !isExpired && !isBelumMulai;
                                    
                                    return (
                                    <tr key={item.id_sesi} className={`align-top transition-colors ${isActiveRow ? 'bg-blue-50/80 hover:bg-blue-50/100' : 'hover:bg-slate-50/70'}`}>
                                        <td className="px-4 py-3 font-semibold text-slate-500 text-center">{index + 1}</td>
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
                                                <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 text-center">
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
                                                <button
                                                    onClick={() => handleStartExam(item)}
                                                    className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/85 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                                >
                                                    {sudahDikerjakan ? 'Kerjakan Ulang' : 'Kerjakan'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    );
                                })}
                                {!loading && filteredSessions.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-4 text-center text-sm text-slate-500">Belum ada sesi aktif untuk kelas ini.</td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {tokenModalOpen && selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <form onSubmit={submitToken} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Token Ujian Dibutuhkan</h3>
                        <p className="mt-1 text-sm text-slate-500">Silakan masukkan token untuk memulai sesi ujian <strong>{selectedSession.mata_pelajaran?.nama_lengkap || selectedSession.mata_pelajaran?.nama_mapel || selectedSession.mataPelajaran?.nama_lengkap || selectedSession.mataPelajaran?.nama_mapel || 'Mata Pelajaran'} - {selectedSession.tipe_soal} ({selectedSession.jenis_asesmen})</strong>.</p>
                        
                        <div className="mt-5 mb-6">
                            <input
                                type="text"
                                autoFocus
                                required
                                value={tokenInput}
                                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                                placeholder="Masukkan Token CBT"
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-center font-mono text-lg font-bold tracking-widest outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 uppercase"
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setTokenModalOpen(false); setSelectedSession(null); }}
                                className="w-full rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={!tokenInput.trim()}
                                className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                            >
                                Mulai Ujian
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </DashboardLayout>
    );
}