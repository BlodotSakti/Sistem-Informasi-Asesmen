import { useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { formatDateLabel } from '../lib/date';
import { siswaNavigation } from './siswa/siswaNavigation';
import { useSiswaData } from './siswa/useSiswaData';

export default function SiswaAppreciationPage({ session, onLogout }) {
    const { summary, loading, error } = useSiswaData(session);
    const [noteSearch, setNoteSearch] = useState('');

    const filteredNotes = useMemo(() => {
        const search = noteSearch.trim().toLowerCase();
        const notes = summary?.highlight?.notes || [];

        return notes.filter((note) => {
            if (search === '') {
                return true;
            }

            return [note.guru?.nama_lengkap, note.isi_pesan, note.tanggal, formatDateLabel(note.tanggal)]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [noteSearch, summary?.highlight?.notes]);

    return (
        <DashboardLayout title="Apresiasi" user={session?.user} navigation={siswaNavigation} onLogout={onLogout} profileHref="/siswa/profil">
            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Badge dan Catatan</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">Semua apresiasi di satu halaman</h3>
                    <p className="mt-2 text-sm text-slate-500">Badge, catatan privat, dan apresiasi terbaru ditaruh di halaman khusus supaya dashboard tetap ringkas.</p>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Apresiasi" value={loading ? '...' : summary?.cards?.apresiasi ?? 0} description="Total badge masuk" tone="rose" />
                        <StatCard label="Skor Terbaru" value={loading ? '...' : summary?.highlight?.latest_score ?? 0} description="Dari analisis terakhir" tone="blue" />
                        <StatCard label="Catatan Privat" value={loading ? '...' : (summary?.highlight?.notes || []).length} description="Pesan terbaru guru" tone="amber" />
                        <StatCard label="Akses Cepat" value={loading ? '...' : '1 halaman'} description="Fokus ke penghargaan" tone="slate" />
                    </div>
                </section>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <section className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Badge Terbaru</p>
                        <h3 className="mt-2 text-2xl font-semibold">Apresiasi terakhir</h3>

                        {summary?.highlight?.badge ? (
                            <div className="mt-6 rounded-2xl bg-white/5 p-4">
                                <p className="font-semibold">{summary.highlight.badge.jenis_badge || 'Apresiasi'}</p>
                                <p className="mt-1 text-sm text-slate-300">Diberikan oleh: {summary.highlight.badge.guru?.nama_lengkap || '-'}</p>
                                <p className="text-sm text-slate-300">Topik: {summary.highlight.badge.topik_materi || '-'}</p>
                            </div>
                        ) : (
                            <div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm text-slate-300">Belum ada badge apresiasi.</div>
                        )}
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Catatan Privat</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Pesan terbaru dari guru</h3>

                        <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
                            <span>Cari catatan privat</span>
                            <input value={noteSearch} onChange={(event) => setNoteSearch(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Nama guru, isi pesan, atau tanggal" />
                        </label>

                        <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Guru</th>
                                        <th className="px-4 py-3 font-semibold">Pesan</th>
                                        <th className="px-4 py-3 font-semibold">Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredNotes.map((note) => (
                                        <tr key={`${note.tanggal}-${note.id_catatan}`} className="align-top hover:bg-slate-50/70">
                                            <td className="px-4 py-3 font-semibold text-slate-900">{note.guru?.nama_lengkap || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600">{note.isi_pesan}</td>
                                            <td className="px-4 py-3 text-slate-600">{formatDateLabel(note.tanggal)}</td>
                                        </tr>
                                    ))}
                                    {filteredNotes.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-4 py-4 text-sm text-slate-500">Belum ada catatan privat.</td>
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