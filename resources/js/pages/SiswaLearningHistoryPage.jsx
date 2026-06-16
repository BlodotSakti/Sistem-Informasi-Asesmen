import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
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
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Riwayat BAP</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">Jejak setiap pertemuan dan mata pelajaran</h3>
                    <p className="mt-2 text-sm text-slate-500">Halaman ini menampilkan topik yang dipelajari, status kehadiran Anda, dan ringkasan per mata pelajaran.</p>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Total Pertemuan" value={loading ? '...' : history?.total_pertemuan ?? 0} description="Seluruh BAP yang relevan" tone="blue" />
                        <StatCard label="Hadir" value={loading ? '...' : history?.summary_kehadiran?.hadir ?? 0} description="Pertemuan yang dihadiri" tone="emerald" />
                        <StatCard label="Izin/Sakit" value={loading ? '...' : (history?.summary_kehadiran?.izin ?? 0) + (history?.summary_kehadiran?.sakit ?? 0)} description="Absensi yang tercatat" tone="amber" />
                        <StatCard label="Alpa" value={loading ? '...' : history?.summary_kehadiran?.alpa ?? 0} description="Ketidakhadiran" tone="rose" />
                    </div>
                </section>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <section className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Filter Mapel</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Saring riwayat per mata pelajaran</h3>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <label className="block space-y-2 text-sm font-medium text-slate-700">
                                <span>Cari riwayat</span>
                                <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Kelas, mapel, topik, status, atau catatan" />
                            </label>

                            <label className="block space-y-2 text-sm font-medium text-slate-700">
                                <span>Mata pelajaran</span>
                                <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                    <option value="">Semua mapel</option>
                                    {subjects.map((item) => (
                                        <option key={item.id_mapel} value={item.id_mapel}>{item.nama_lengkap || item.nama_mapel}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Ringkasan Mapel</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Topik terakhir dan jumlah pertemuan</h3>

                        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
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

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Daftar Pertemuan</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Topik, kehadiran, dan catatan per BAP</h3>

                        <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
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
