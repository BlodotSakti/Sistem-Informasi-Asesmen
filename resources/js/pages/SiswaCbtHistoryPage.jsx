import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import AnalisisDiagnostikCard from '../components/ui/AnalisisDiagnostikCard';
import { siswaNavigation } from './siswa/siswaNavigation';
import { apiFetch } from '../lib/api';

export default function SiswaCbtHistoryPage({ session, onLogout }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reviewData, setReviewData] = useState(null);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!session?.token) return;
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                const data = await apiFetch('/api/siswa/cbt/riwayat', session);
                if (mounted) setHistory(data?.data || []);
            } catch (err) {
                if (mounted) setError(err.message || 'Gagal memuat riwayat CBT.');
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => { mounted = false; };
    }, [session]);

    const filteredHistory = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();
        if (!search) return history;
        return history.filter((item) =>
            [item.mata_pelajaran, item.kelas, item.jenis_asesmen, item.tipe_soal]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(search))
        );
    }, [searchTerm, history]);

    const stats = useMemo(() => {
        if (history.length === 0) return { total: 0, rataRata: 0, tertinggi: 0 };
        const scores = history.map(h => h.total_bobot > 0 ? (h.total_skor / h.total_bobot) * 100 : 0);
        return {
            total: history.length,
            rataRata: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
            tertinggi: Number(Math.max(...scores).toFixed(2)),
        };
    }, [history]);

    const openReview = async (idSesi) => {
        try {
            setReviewLoading(true);
            setReviewData(null);
            const data = await apiFetch(`/api/siswa/cbt/${idSesi}/review`, session);
            setReviewData(data);
        } catch (err) {
            alert(err.message || 'Gagal memuat review.');
        } finally {
            setReviewLoading(false);
        }
    };

    const formatJawaban = (value, jenisSoal) => {
        if (!value) return '-';
        if (jenisSoal === 'pilihan_ganda_kompleks') {
            try {
                const arr = JSON.parse(value);
                if (Array.isArray(arr)) return arr.join(', ');
            } catch { /* fallback */ }
        }
        return value;
    };

    return (
        <DashboardLayout title="Riwayat CBT" user={session?.user} navigation={siswaNavigation} onLogout={onLogout} profileHref="/siswa/profil">
            <div className="space-y-6">
                {/* Stats */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Riwayat Ujian CBT</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">Nilai CBT yang pernah dikerjakan</h3>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <StatCard label="Total CBT" value={loading ? '...' : stats.total} description="Ujian yang pernah dikerjakan" tone="blue" />
                        <StatCard label="Rata-Rata" value={loading ? '...' : `${stats.rataRata}%`} description="Persentase rata-rata skor" tone="amber" />
                        <StatCard label="Tertinggi" value={loading ? '...' : `${stats.tertinggi}%`} description="Persentase skor tertinggi" tone="emerald" />
                    </div>
                </section>

                {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

                {/* Table */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <label className="mb-4 block space-y-2 text-sm font-medium text-slate-700">
                        <span>Cari riwayat</span>
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Mapel, kelas, jenis..." />
                    </label>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Mata Pelajaran</th>
                                    <th className="px-4 py-3 font-semibold">Kelas</th>
                                    <th className="px-4 py-3 font-semibold">Jenis</th>
                                    <th className="px-4 py-3 font-semibold">Soal</th>
                                    <th className="px-4 py-3 font-semibold">Benar</th>
                                    <th className="px-4 py-3 font-semibold">Skor</th>
                                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredHistory.map((item) => {
                                    const persen = item.total_bobot > 0 ? Number(((item.total_skor / item.total_bobot) * 100).toFixed(2)) : 0;
                                    return (
                                        <tr key={item.id_sesi} className="align-top hover:bg-slate-50/70">
                                            <td className="px-4 py-3 font-semibold text-slate-900">{item.mata_pelajaran || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.kelas || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600 capitalize">{item.jenis_asesmen}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.jumlah_dijawab}/{item.jumlah_soal}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.jumlah_benar}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${persen >= 70 ? 'bg-emerald-100 text-emerald-700' : persen >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {Number(item.total_skor).toFixed(2)}/{item.total_bobot} ({persen}%)
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {item.has_analisis && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">🤖 AI</span>}
                                                    <button onClick={() => openReview(item.id_sesi)} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
                                                        Review
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!loading && filteredHistory.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">Belum ada riwayat CBT.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Review Modal */}
                {(reviewData || reviewLoading) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => !reviewLoading && setReviewData(null)}>
                        <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                            {reviewLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                                </div>
                            ) : reviewData ? (
                                <>
                                    <div className="border-b border-slate-200 px-6 py-5 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">Review: {reviewData.sesi.mata_pelajaran}</h3>
                                            <p className="text-sm text-slate-500 capitalize">{reviewData.sesi.jenis_asesmen} — {reviewData.sesi.kelas}</p>
                                        </div>
                                        <button onClick={() => setReviewData(null)} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
                                    </div>
                                    <div className="px-6 py-4">
                                        {/* Score summary */}
                                        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                                            <div className="rounded-2xl bg-blue-50 px-4 py-4 text-center">
                                                <p className="text-2xl font-bold text-blue-700">{Number(reviewData.total_skor).toFixed(2)}/{reviewData.total_bobot}</p>
                                                <p className="text-xs text-blue-500">Total Skor</p>
                                            </div>
                                            <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-center">
                                                <p className="text-2xl font-bold text-emerald-700">{reviewData.jumlah_benar}</p>
                                                <p className="text-xs text-emerald-500">Benar</p>
                                            </div>
                                            <div className="rounded-2xl bg-rose-50 px-4 py-4 text-center">
                                                <p className="text-2xl font-bold text-rose-700">{reviewData.jumlah_soal - reviewData.jumlah_benar}</p>
                                                <p className="text-xs text-rose-500">Salah</p>
                                            </div>
                                            <div className="rounded-2xl bg-amber-50 px-4 py-4 text-center">
                                                <p className="text-2xl font-bold text-amber-700">
                                                    {reviewData.total_bobot > 0 ? Number(((reviewData.total_skor / reviewData.total_bobot) * 100).toFixed(2)) : 0}%
                                                </p>
                                                <p className="text-xs text-amber-500">Persentase</p>
                                            </div>
                                        </div>

                                        {/* Questions */}
                                        <div className="space-y-4">
                                            {(reviewData.soal || []).map((item, idx) => (
                                                <div key={item.id_detail} className={`rounded-2xl border p-4 ${item.is_correct ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'}`}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-semibold text-slate-800">Soal {idx + 1}</h4>
                                                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                            {item.is_correct ? '✓ Benar' : '✗ Salah'} — {item.skor_diperoleh}/{item.bobot_nilai}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mb-3">{item.isi_soal}</p>

                                                    {/* Options with highlights */}
                                                    {item.opsi_jawaban && item.opsi_jawaban.length > 0 && (
                                                        <div className="grid gap-2 mb-3">
                                                            {item.opsi_jawaban.map((opsi, oIdx) => {
                                                                let kunciArr = [item.kunci_jawaban];
                                                                try { const p = JSON.parse(item.kunci_jawaban); if (Array.isArray(p)) kunciArr = p; } catch {}
                                                                let jawabanArr = [item.jawaban_siswa];
                                                                try { const p = JSON.parse(item.jawaban_siswa); if (Array.isArray(p)) jawabanArr = p; } catch {}

                                                                const isCorrectOption = kunciArr.includes(opsi);
                                                                const isChosenOption = jawabanArr.includes(opsi);

                                                                let style = 'border-slate-200 bg-white text-slate-600';
                                                                let label = '';
                                                                let icon = '○';

                                                                if (isChosenOption && isCorrectOption) {
                                                                    style = 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm';
                                                                    icon = '✓';
                                                                    label = 'Pilihan Anda (Benar)';
                                                                } else if (isChosenOption && !isCorrectOption) {
                                                                    style = 'border-rose-300 bg-rose-50 text-rose-800 shadow-sm';
                                                                    icon = '✗';
                                                                    label = 'Pilihan Anda (Salah)';
                                                                } else if (!isChosenOption && isCorrectOption) {
                                                                    style = 'border-emerald-300 bg-emerald-50/40 text-emerald-700 border-dashed';
                                                                    icon = '✓';
                                                                    label = 'Kunci Jawaban';
                                                                } else {
                                                                    icon = '○';
                                                                }

                                                                return (
                                                                    <div key={oIdx} className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between transition-all ${style}`}>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={`text-lg font-bold ${icon === '○' ? 'text-slate-300' : ''}`}>{icon}</span>
                                                                            <span className="font-medium">{opsi}</span>
                                                                        </div>
                                                                        {label && <span className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</span>}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Essay answers */}
                                                    {item.jenis_soal === 'essay' && (
                                                        <div className="grid gap-2 text-sm sm:grid-cols-2">
                                                            <div className="rounded-xl bg-white/80 border border-slate-200 px-4 py-2">
                                                                <span className="font-medium text-slate-500">Jawaban Anda:</span>
                                                                <p className="mt-1 text-slate-700">{item.jawaban_siswa || <em className="text-slate-400">Tidak dijawab</em>}</p>
                                                            </div>
                                                            <div className="rounded-xl bg-white/80 border border-slate-200 px-4 py-2">
                                                                <span className="font-medium text-slate-500">Kunci Jawaban:</span>
                                                                <p className="mt-1 text-slate-700">{formatJawaban(item.kunci_jawaban, item.jenis_soal)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Analisis Diagnostik AI */}
                                        <AnalisisDiagnostikCard analisis={reviewData.analisis_diagnostik} />
                                    </div>
                                    <div className="border-t border-slate-200 px-6 py-4 text-right">
                                        <button onClick={() => setReviewData(null)} className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Tutup</button>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
