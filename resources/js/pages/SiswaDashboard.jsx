import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';

export default function SiswaDashboard({ session, onLogout }) {
    const [summary, setSummary] = useState(null);
    const [activeSessions, setActiveSessions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    const navigation = [
        { label: 'Dashboard', href: '/siswa/dashboard', badge: 'Home' },
        { label: 'Sesi Aktif', href: '/siswa/dashboard#sesi', badge: 'CBT' },
        { label: 'Tren Nilai', href: '/siswa/dashboard#tren', badge: 'Grafik' },
        { label: 'Apresiasi', href: '/siswa/dashboard#badge', badge: 'Badge' },
    ];

    return (
        <DashboardLayout
            title="Dashboard Siswa"
            user={session?.user}
            navigation={navigation}
            onLogout={onLogout}
        >
            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-3 text-center">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Kinerja Akademis</p>
                        <h3 className="text-2xl font-semibold text-slate-900">Laporan Rata-rata dan Ujian Menunggu</h3>
                        <p className="mx-auto max-w-2xl text-sm text-slate-500">
                            Gambaran awal performa akademik Anda ditampilkan secara ringkas agar mudah dipantau setiap minggu.
                        </p>

                        <div className="mt-2 flex flex-wrap justify-center gap-3">
                            <button className="rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700">
                                Buat Jadwal
                            </button>
                            <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white">
                                Lihat Detail
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="Rata-rata"
                            value={loading ? '...' : summary?.cards?.rata_rata ?? 0}
                            description="Nilai semester berjalan"
                            tone="blue"
                        />
                        <StatCard
                            label="Ujian Menunggu"
                            value={loading ? '...' : summary?.cards?.ujian_menunggu ?? 0}
                            description="CBT terdekat siap dikerjakan"
                            tone="amber"
                        />
                        <StatCard
                            label="Tugas Aktif"
                            value={loading ? '...' : summary?.cards?.tugas_aktif ?? 0}
                            description="Jawaban yang tercatat"
                            tone="slate"
                        />
                        <StatCard
                            label="Apresiasi"
                            value={loading ? '...' : summary?.cards?.apresiasi ?? 0}
                            description="Badge dari guru mapel"
                            tone="rose"
                        />
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Sesi Aktif</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Daftar CBT yang sedang tersedia</h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {activeSessions?.data?.length || 0} sesi
                        </span>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        {(activeSessions?.data || []).slice(0, 4).map((sessionItem) => (
                            <div key={sessionItem.id_sesi} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-900">{sessionItem.kelas?.nama_kelas || 'Kelas'}</p>
                                        <p className="mt-1 text-sm text-slate-500">{sessionItem.mata_pelajaran?.nama_mapel || sessionItem.mataPelajaran?.nama_mapel || '-'}</p>
                                    </div>
                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                        {sessionItem.jenis_asesmen}
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600">
                                    <span>{sessionItem.tipe_soal}</span>
                                    <span>{sessionItem.durasi_menit} menit</span>
                                </div>
                            </div>
                        ))}

                        {!loading && (activeSessions?.data || []).length === 0 ? (
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 lg:col-span-2">
                                Belum ada sesi aktif yang tersedia saat ini.
                            </div>
                        ) : null}
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Grafik Tren Belajar (Semester Ganjil)</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Visualisasi progres akademik</h3>

                        {error ? (
                            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </div>
                        ) : null}

                        <div className="mt-6 rounded-3xl bg-slate-50 p-5">
                            <div className="flex h-80 items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                                {trendPoints.map((point, index) => (
                                    <div key={index} className="flex flex-1 flex-col items-center gap-3">
                                        <div
                                            className="w-full max-w-[44px] rounded-t-2xl bg-gradient-to-t from-slate-900 to-slate-500"
                                            style={{ height: `${Math.max(10, Number(point.value || 0)) * 2.5}%` }}
                                        />
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

                        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
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
                                    <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300">
                                        Belum ada badge apresiasi.
                                    </div>
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