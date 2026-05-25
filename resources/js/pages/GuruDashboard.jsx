import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';

export default function GuruDashboard({ session, onLogout }) {
    const [summary, setSummary] = useState(null);
    const [diagnostics, setDiagnostics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadSummary = async () => {
            try {
                setLoading(true);
                const [summaryPayload, diagnosticsPayload] = await Promise.all([
                    apiFetch('/api/guru/dashboard-summary', session),
                    apiFetch('/api/guru/analisis-diagnostik', session),
                ]);

                if (mounted) {
                    setSummary(summaryPayload);
                    setDiagnostics(diagnosticsPayload);
                }
            } catch (exception) {
                if (mounted) {
                    setError(exception.message || 'Gagal memuat ringkasan guru.');
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

    const navigation = [
        { label: 'Dashboard', href: '/guru/dashboard', badge: 'Home' },
        { label: 'Bank Soal', href: '/guru/dashboard#bank-soal', badge: 'Soal' },
        { label: 'Sesi Asesmen', href: '/guru/dashboard#sesi', badge: 'CBT' },
        { label: 'Catatan Privat', href: '/guru/dashboard#catatan', badge: 'Pesan' },
    ];

    return (
        <DashboardLayout
            title="Dashboard Guru"
            user={session?.user}
            navigation={navigation}
            onLogout={onLogout}
        >
            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Ringkasan Kegiatan</p>
                            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Data saat ini dari aktivitas Anda</h3>
                        </div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Aktif</span>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="Total Kelas"
                            value={loading ? '...' : summary?.cards?.total_kelas ?? 0}
                            description="Kelas yang diampu"
                            tone="slate"
                        />
                        <StatCard
                            label="Total Bank Soal"
                            value={loading ? '...' : summary?.cards?.total_bank_soal ?? 0}
                            description="Soal terinput dalam sistem"
                            tone="blue"
                        />
                        <StatCard
                            label="Ujian Aktif"
                            value={loading ? '...' : summary?.cards?.ujian_aktif ?? 0}
                            description="Jadwal CBT berjalan"
                            tone="amber"
                        />
                        <StatCard
                            label="Total Berita Acara"
                            value={loading ? '...' : summary?.cards?.total_berita_acara ?? 0}
                            description="Dokumentasi kegiatan"
                            tone="rose"
                        />
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Panduan Awal</p>
                        <h3 className="mt-3 text-2xl font-semibold">Start point untuk guru</h3>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-white/5 p-4">
                                <p className="text-sm text-slate-300">1. Siapkan bank soal</p>
                                <p className="mt-1 text-sm text-slate-400">Buat soal sesuai topik dan level kognitif.</p>
                            </div>
                            <div className="rounded-2xl bg-white/5 p-4">
                                <p className="text-sm text-slate-300">2. Bentuk sesi asesmen</p>
                                <p className="mt-1 text-sm text-slate-400">Atur kelas, mapel, durasi, dan jenis asesmen.</p>
                            </div>
                            <div className="rounded-2xl bg-white/5 p-4">
                                <p className="text-sm text-slate-300">3. Catat progres kelas</p>
                                <p className="mt-1 text-sm text-slate-400">Tambahkan berita acara dan catatan privat bila perlu.</p>
                            </div>
                            <div className="rounded-2xl bg-white/5 p-4">
                                <p className="text-sm text-slate-300">4. Pantau analisis AI</p>
                                <p className="mt-1 text-sm text-slate-400">Lihat kelemahan dan kekuatan siswa secara ringkas.</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Jadwal Asesmen (CBT) Mendatang</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Arahkan perhatian ke jadwal terdekat</h3>

                        {error ? (
                            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </div>
                        ) : null}

                        <div className="mt-6 space-y-4">
                            {(summary?.upcoming_schedules || []).map((item) => (
                                <div key={item.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="mt-1 h-12 w-12 rounded-2xl bg-rose-200" />
                                    <div>
                                        <p className="font-semibold text-slate-900">{item.title}</p>
                                        <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
                                        <p className="mt-2 text-sm font-medium text-slate-700">{item.note}</p>
                                    </div>
                                </div>
                            ))}
                            {!loading && (summary?.upcoming_schedules || []).length === 0 ? (
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                    Belum ada jadwal mendatang.
                                </div>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Analisis Diagnostik Terbaru</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Pantau siswa yang butuh perhatian</h3>

                        <div className="mt-6 space-y-3">
                            {(diagnostics?.data || []).slice(0, 4).map((item) => (
                                <div key={item.id_analisis} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-slate-900">{item.siswa?.nama_lengkap || 'Siswa'}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {item.sesi_asesmen?.jenis_asesmen || item.sesiAsesmen?.jenis_asesmen || 'asesmen'} • {item.tanggal_generate}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                                            {item.skor_total}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                                        {item.narasi_kelemahan || 'Belum ada narasi kelemahan.'}
                                    </p>
                                </div>
                            ))}

                            {!loading && (diagnostics?.data || []).length === 0 ? (
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                    Belum ada analisis diagnostik yang tersedia.
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Insight Guru</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Prioritas tindak lanjut</h3>

                        <div className="mt-6 space-y-3 text-sm text-slate-600">
                            {(summary?.quick_tips || []).map((tip) => (
                                <div key={tip} className="rounded-2xl bg-slate-50 px-4 py-3">
                                    {tip}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}