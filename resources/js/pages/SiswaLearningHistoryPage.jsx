import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import FilterSelect from '../components/ui/FilterSelect';
import { apiFetch } from '../lib/api';
import { formatDateLabel } from '../lib/date';
import { siswaNavigation } from './siswa/siswaNavigation';

export default function SiswaLearningHistoryPage({ session, onLogout }) {
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadHistory = async () => {
            try {
                setLoading(true);
                setError('');
                const payload = await apiFetch('/api/siswa/riwayat-pembelajaran', session);

                if (mounted) {
                    setHistory(payload);
                }
            } catch (exception) {
                if (mounted) {
                    setError(exception.message || 'Gagal memuat riwayat pembelajaran.');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        if (session?.token) {
            loadHistory();
        }

        return () => {
            mounted = false;
        };
    }, [session]);

    const rows = history?.data || [];
    const subjects = history?.mata_pelajaran || [];

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();

        return rows.filter((item) => {
            const matchSubject = subjectFilter === '' || String(item.id_mapel) === String(subjectFilter);

            if (!query) {
                return matchSubject;
            }

            return matchSubject && [
                item.nama_kelas,
                item.nama_mapel,
                item.materi_bahasan,
                item.status_kehadiran,
                item.tanggal,
                item.tanggal_raw,
                item.evaluasi_kendala,
                item.catatan_kelas,
                item.pertemuan_label,
                item.catatan_pribadi?.isi_pesan,
                item.apresiasi?.jenis_badge,
                item.apresiasi?.topik_materi,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));
        });
    }, [rows, search, subjectFilter]);

    const statusLabel = (value) => {
        if (value === 'hadir') return 'Hadir';
        if (value === 'izin') return 'Izin';
        if (value === 'sakit') return 'Sakit';
        if (value === 'alpa') return 'Alpa';
        return 'Belum dicatat';
    };

    return (
        <DashboardLayout title="Riwayat Pembelajaran" user={session?.user} navigation={siswaNavigation} onLogout={onLogout} profileHref="/siswa/profil">
            <div className="space-y-6">
                <section className="overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary px-4 py-6 sm:px-8 sm:py-10 shadow-lg backdrop-blur-xl relative">
                    <p className="text-xs uppercase tracking-[0.4em] text-accent font-bold">Riwayat BAP</p>
                    <h3 className="mt-2 text-2xl sm:text-3xl font-semibold text-[#EEDCC8]">Jejak setiap pertemuan dan mata pelajaran</h3>
                    <p className="mt-2 text-sm text-accent">Halaman ini menampilkan topik yang dipelajari, status kehadiran Anda, dan ringkasan per mata pelajaran.</p>

                    <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                        <StatCard 
                            label="Total Pertemuan" 
                            value={loading ? '...' : history?.total_pertemuan ?? 0} 
                            description="Seluruh BAP yang relevan" 
                            tone="blue" 
                            className="!bg-[#EEDCC8] !border-transparent" 
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            }
                        />
                        <StatCard 
                            label="Hadir" 
                            value={loading ? '...' : history?.summary_kehadiran?.hadir ?? 0} 
                            description="Pertemuan yang dihadiri" 
                            tone="emerald" 
                            className="!bg-[#EEDCC8] !border-transparent" 
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                        <StatCard 
                            label="Izin/Sakit" 
                            value={loading ? '...' : (history?.summary_kehadiran?.izin ?? 0) + (history?.summary_kehadiran?.sakit ?? 0)} 
                            description="Absensi yang tercatat" 
                            tone="amber" 
                            className="!bg-[#EEDCC8] !border-transparent" 
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                        <StatCard 
                            label="Alpa" 
                            value={loading ? '...' : history?.summary_kehadiran?.alpa ?? 0} 
                            description="Ketidakhadiran" 
                            tone="rose" 
                            className="!bg-[#EEDCC8] !border-transparent" 
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                    </div>
                </section>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <section className="space-y-6">

                    <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Ringkasan Mapel</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Topik terakhir dan jumlah pertemuan</h3>

                        <div className="mt-6 overflow-x-auto rounded-3xl border border-border">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Mapel</th>
                                        <th className="px-4 py-3 font-semibold">Pertemuan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {subjects.map((item) => (
                                        <tr key={item.id_mapel} className="align-top hover:bg-slate-50/70">
                                            <td className="px-4 py-3 font-semibold text-slate-900">
                                                <div>{item.nama_lengkap || item.nama_mapel || '-'}</div>
                                                <div className="mt-1 text-xs font-normal text-slate-500">Topik terakhir: {item.topik_terakhir || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                <div className="font-semibold text-slate-900">{item.total_pertemuan} pertemuan</div>
                                                <div className="mt-1 text-xs text-slate-500">Terakhir {item.pertemuan_terakhir || '-'}</div>
                                                <div className="mt-1 text-xs text-slate-500">H:{item.hadir} I:{item.izin} S:{item.sakit} A:{item.alpa}</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {subjects.length === 0 ? (
                                        <tr>
                                            <td colSpan="2" className="px-4 py-4 text-sm text-slate-500">Belum ada ringkasan mata pelajaran.</td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Daftar Pertemuan</p>
                                <h3 className="mt-2 text-xl font-semibold text-slate-900">Topik, kehadiran, dan catatan per BAP</h3>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full sm:w-64 pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white outline-none transition focus:border-slate-900" placeholder="Cari riwayat..." />
                                </div>
                                <FilterSelect
                                    value={subjectFilter}
                                    onChange={setSubjectFilter}
                                    options={[
                                        { value: '', label: 'Semua Mapel' },
                                        ...subjects.map((item) => ({ value: String(item.id_mapel), label: item.nama_lengkap || item.nama_mapel }))
                                    ]}
                                    placeholder="Semua Mapel"
                                    icon="📚"
                                    align="right"
                                />
                            </div>
                        </div>

                        <div className="mt-6 overflow-x-auto rounded-3xl border border-border">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Tanggal</th>
                                        <th className="px-4 py-3 font-semibold">Kelas</th>
                                        <th className="px-4 py-3 font-semibold">Mapel</th>
                                        <th className="px-4 py-3 font-semibold">Pertemuan</th>
                                        <th className="px-4 py-3 font-semibold">Topik</th>
                                        <th className="px-4 py-3 font-semibold">Penguatan</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredRows.map((item) => (
                                        <tr key={item.id_berita_acara} className="align-top hover:bg-slate-50/70">
                                            <td className="px-4 py-3 text-slate-600">{formatDateLabel(item.tanggal || item.tanggal_raw)}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-900">{item.nama_kelas || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.nama_lengkap || item.nama_mapel || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.pertemuan_label || `Pertemuan ke-${item.pertemuan_ke}`}</td>
                                            <td className="px-4 py-3 text-slate-600">
                                                <p className="font-medium text-slate-900">{item.materi_bahasan}</p>
                                                <p className="mt-1 text-xs text-slate-500">{item.evaluasi_kendala || '-'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.catatan_pribadi || item.apresiasi ? (
                                                    <div className="space-y-2">
                                                        {item.catatan_pribadi ? (
                                                            <div className="rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                                                <p className="font-semibold">Catatan pribadi</p>
                                                                <p className="mt-1">{item.catatan_pribadi.isi_pesan}</p>
                                                                <p className="mt-1 text-amber-700">{item.catatan_pribadi.guru?.nama_lengkap || '-'} • {item.catatan_pribadi.tanggal || '-'}</p>
                                                            </div>
                                                        ) : null}
                                                        {item.apresiasi ? (
                                                            <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                                                                <p className="font-semibold">Apresiasi</p>
                                                                <p className="mt-1">{item.apresiasi.jenis_badge} • {item.apresiasi.topik_materi}</p>
                                                                <p className="mt-1 text-emerald-700">{item.apresiasi.guru?.nama_lengkap || '-'} • {item.apresiasi.tanggal || '-'}</p>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">Belum ada penguatan</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.status_kehadiran === 'hadir' ? 'bg-emerald-100 text-emerald-700' : item.status_kehadiran === 'izin' ? 'bg-amber-100 text-amber-800' : item.status_kehadiran === 'sakit' ? 'bg-sky-100 text-sky-700' : item.status_kehadiran === 'alpa' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
                                                    {statusLabel(item.status_kehadiran)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && filteredRows.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-4 text-sm text-slate-500">Belum ada riwayat pembelajaran yang cocok.</td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
