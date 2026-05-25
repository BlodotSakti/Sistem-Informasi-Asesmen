import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';

export default function SiswaDashboard({ session, onLogout }) {
    const [summary, setSummary] = useState(null);
    const [activeSessions, setActiveSessions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [planForm, setPlanForm] = useState({
        id_mapel: '',
        catatan: '',
        sumber: 'manual',
        status: 'direncanakan',
    });
    const [planSaving, setPlanSaving] = useState(false);
    const [planMessage, setPlanMessage] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadSummary = async () => {
            try {
                setLoading(true);
                const [summaryPayload, sessionsPayload] = await Promise.all([
                    apiFetch('/api/siswa/dashboard-summary', session),
                    apiFetch('/api/siswa/sesi-asesmen/aktif', session),
                ]);

                if (mounted) {
                    setSummary(summaryPayload);
                    setActiveSessions(sessionsPayload);
                }
            } catch (exception) {
                if (mounted) {
                    setError(exception.message || 'Gagal memuat ringkasan siswa.');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        if (session?.token) {
            loadSummary();
        }

        return () => {
            mounted = false;
        };
    }, [session]);

    const trendPoints = useMemo(() => summary?.trend || [], [summary]);
    const subjectOptions = summary?.available_subjects || [];

    const navigation = [
        { label: 'Dashboard', href: '/siswa/dashboard', badge: 'Home' },
        { label: 'Profil', href: '/siswa/profil', badge: 'Data' },
        { label: 'Sesi Aktif', href: '/siswa/dashboard#sesi', badge: 'CBT' },
        { label: 'Rencana Belajar', href: '/siswa/dashboard#rencana', badge: 'Plan' },
        { label: 'Tren Nilai', href: '/siswa/dashboard#tren', badge: 'Grafik' },
        { label: 'Apresiasi', href: '/siswa/dashboard#badge', badge: 'Badge' },
    ];

    const resetPlanForm = () => {
        setPlanForm({
            id_mapel: '',
            catatan: '',
            sumber: 'manual',
            status: 'direncanakan',
        });
    };

    const submitLearningPlan = async (event) => {
        event.preventDefault();

        if (!planForm.id_mapel) {
            setPlanMessage('Pilih mata pelajaran terlebih dahulu.');
            return;
        }

        setPlanSaving(true);
        setPlanMessage('');

        try {
            await apiFetch('/api/siswa/rencana-belajar', session, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...planForm,
                    id_mapel: Number(planForm.id_mapel),
                }),
            });

            setPlanMessage('Rencana belajar berhasil disimpan.');
            resetPlanForm();

            const summaryPayload = await apiFetch('/api/siswa/dashboard-summary', session);
            setSummary(summaryPayload);
        } catch (exception) {
            setPlanMessage(exception.message || 'Gagal menyimpan rencana belajar.');
        } finally {
            setPlanSaving(false);
        }
    };

    return (
        <DashboardLayout title="Dashboard Siswa" user={session?.user} navigation={navigation} onLogout={onLogout} profileHref="/siswa/profil">
            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-3 text-center">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Kinerja Akademis</p>
                        <h3 className="text-2xl font-semibold text-slate-900">Laporan Rata-rata dan Ujian Menunggu</h3>
                        <p className="mx-auto max-w-2xl text-sm text-slate-500">
                            Gambaran awal performa akademik Anda ditampilkan secara ringkas agar mudah dipantau setiap minggu.
                        </p>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Rata-rata" value={loading ? '...' : summary?.cards?.rata_rata ?? 0} description="Nilai semester berjalan" tone="blue" />
                        <StatCard label="Ujian Menunggu" value={loading ? '...' : summary?.cards?.ujian_menunggu ?? 0} description="CBT terdekat siap dikerjakan" tone="amber" />
                        <StatCard label="Tugas Aktif" value={loading ? '...' : summary?.cards?.tugas_aktif ?? 0} description="Jawaban yang tercatat" tone="slate" />
                        <StatCard label="Apresiasi" value={loading ? '...' : summary?.cards?.apresiasi ?? 0} description="Badge dari guru mapel" tone="rose" />
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Ringkasan Cepat</p>
                        <h3 className="mt-2 text-2xl font-semibold">Fokus belajar hari ini</h3>

                        <div className="mt-6 space-y-4">
                            <div className="rounded-2xl bg-white/5 p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Kelas Aktif</p>
                                <p className="mt-2 text-lg font-semibold">{summary?.profile?.kelas_aktif?.nama_kelas || 'Belum ada kelas aktif'}</p>
                                <p className="mt-1 text-sm text-slate-300">{summary?.profile?.kelas_aktif?.guru_wali ? `Wali kelas: ${summary.profile.kelas_aktif.guru_wali}` : 'Wali kelas belum ditetapkan'}</p>
                            </div>
                            <div className="rounded-2xl bg-white/5 p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Mapel Aktif</p>
                                <p className="mt-2 text-lg font-semibold">{(summary?.profile?.mata_pelajaran || []).length} mata pelajaran</p>
                                <p className="mt-1 text-sm text-slate-300">Terkait dengan penugasan guru pada kelas aktif</p>
                            </div>
                            <div className="rounded-2xl bg-white/5 p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Rencana Belajar</p>
                                <p className="mt-2 text-lg font-semibold">{(summary?.profile?.rencana_belajar || []).length} kartu aktif</p>
                                <p className="mt-1 text-sm text-slate-300">Kartu yang sudah disimpan untuk belajar mandiri</p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Riwayat Kelas</p>
                            <div className="mt-3 space-y-2 text-sm text-slate-200">
                                {(summary?.profile?.riwayat_kelas || []).slice(0, 4).map((item) => (
                                    <div key={item.id_kelas_siswa} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
                                        <span>{item.nama_kelas || '-'}</span>
                                        <span className="text-slate-400">{item.tahun_ajaran || '-'}</span>
                                    </div>
                                ))}
                                {(summary?.profile?.riwayat_kelas || []).length === 0 ? <p className="text-sm text-slate-400">Belum ada riwayat kelas.</p> : null}
                            </div>
                        </div>
                    </div>

                    <div id="rencana" className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Kartu Rencana Belajar</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Tambah mapel ke rencana pribadi</h3>

                            <form className="mt-6 space-y-4" onSubmit={submitLearningPlan}>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="space-y-2 text-sm text-slate-600">
                                        <span className="font-medium text-slate-700">Mata Pelajaran</span>
                                        <select value={planForm.id_mapel} onChange={(event) => setPlanForm((current) => ({ ...current, id_mapel: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                            <option value="">Pilih mapel</option>
                                            {subjectOptions.map((item) => (
                                                <option key={item.id_penugasan_pembelajaran} value={item.id_mapel}>
                                                    {item.nama_mapel} {item.guru ? `- ${item.guru}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="space-y-2 text-sm text-slate-600">
                                        <span className="font-medium text-slate-700">Status</span>
                                        <select value={planForm.status} onChange={(event) => setPlanForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                            <option value="direncanakan">Direncanakan</option>
                                            <option value="sedang_dipelajari">Sedang Dipelajari</option>
                                            <option value="selesai">Selesai</option>
                                        </select>
                                    </label>
                                </div>

                                <label className="space-y-2 text-sm text-slate-600">
                                    <span className="font-medium text-slate-700">Catatan</span>
                                    <textarea value={planForm.catatan} onChange={(event) => setPlanForm((current) => ({ ...current, catatan: event.target.value }))} className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Contoh: ulangi bab pecahan tiap malam Selasa" />
                                </label>

                                <div className="flex flex-wrap items-center gap-3">
                                    <button type="submit" disabled={planSaving} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
                                        {planSaving ? 'Menyimpan...' : 'Simpan ke Rencana Belajar'}
                                    </button>
                                    <button type="button" onClick={resetPlanForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                        Reset
                                    </button>
                                </div>

                                {planMessage ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{planMessage}</div> : null}
                            </form>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Mapel Terkait Kelas</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Penugasan guru dan mapel aktif</h3>

                            <div className="mt-6 grid gap-3 md:grid-cols-2">
                                {(summary?.profile?.mata_pelajaran || []).slice(0, 6).map((item) => (
                                    <div key={item.id_penugasan_pembelajaran} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="font-semibold text-slate-900">{item.nama_mapel || '-'}</p>
                                        <p className="mt-1 text-sm text-slate-500">{item.guru || '-'} • {item.tahun_ajaran || '-'}</p>
                                    </div>
                                ))}
                                {(summary?.profile?.mata_pelajaran || []).length === 0 ? <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 md:col-span-2">Belum ada penugasan mapel untuk kelas aktif.</div> : null}
                            </div>

                            <div className="mt-6 space-y-2">
                                <p className="text-sm font-medium text-slate-700">Rencana yang sudah tersimpan</p>
                                {(summary?.profile?.rencana_belajar || []).slice(0, 5).map((item) => (
                                    <div key={item.id_rencana_belajar} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        <div>
                                            <p className="font-medium text-slate-900">{item.nama_mapel || '-'}</p>
                                            <p className="text-xs text-slate-500">{item.status} • {item.sumber}</p>
                                        </div>
                                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">Rencana</span>
                                    </div>
                                ))}
                                {(summary?.profile?.rencana_belajar || []).length === 0 ? <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Belum ada kartu rencana belajar.</div> : null}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]" id="tren">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Grafik Tren Belajar (Semester Ganjil)</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Visualisasi progres akademik</h3>

                        {error ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                        <div className="mt-6 rounded-3xl bg-slate-50 p-5">
                            <div className="flex h-80 items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                                {trendPoints.map((point, index) => (
                                    <div key={index} className="flex flex-1 flex-col items-center gap-3">
                                        <div className="w-full max-w-[44px] rounded-t-2xl bg-gradient-to-t from-slate-900 to-slate-500" style={{ height: `${Math.max(10, Number(point.value || 0)) * 2.5}%` }} />
                                        <span className="text-xs text-slate-500">{point.label || `M${index + 1}`}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Akses Cepat</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Apa yang perlu dipantau siswa</h3>
                            <ul className="mt-6 space-y-3 text-sm text-slate-600">
                                <li className="rounded-2xl bg-slate-50 px-4 py-3">Sesi CBT yang masih aktif</li>
                                <li className="rounded-2xl bg-slate-50 px-4 py-3">Catatan privat dari guru</li>
                                <li className="rounded-2xl bg-slate-50 px-4 py-3">Badge apresiasi terbaru</li>
                                <li className="rounded-2xl bg-slate-50 px-4 py-3">Tren nilai per minggu</li>
                            </ul>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm" id="badge">
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Apresiasi Terkini</p>
                            <div className="mt-5 space-y-3">
                                {summary?.highlight?.badge ? (
                                    <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-700" />
                                        <div>
                                            <p className="font-semibold">{summary.highlight.badge.jenis_badge || 'Apresiasi'}</p>
                                            <p className="mt-1 text-sm text-slate-300">Diberikan oleh: {summary.highlight.badge.guru?.nama_lengkap || '-'}</p>
                                            <p className="text-sm text-slate-300">Topik: {summary.highlight.badge.topik_materi || '-'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300">Belum ada badge apresiasi.</div>
                                )}

                                {(summary?.highlight?.notes || []).slice(0, 3).map((note) => (
                                    <div key={`${note.tanggal}-${note.id_catatan}`} className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300">
                                        <p className="font-medium text-white">Catatan privat</p>
                                        <p className="mt-1">{note.isi_pesan}</p>
                                        <p className="mt-2 text-xs text-slate-400">{note.tanggal} - {note.guru?.nama_lengkap || '-'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}