import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';

export default function AdminDashboard({ session, onLogout }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadSummary = async () => {
            try {
                setLoading(true);
                const payload = await apiFetch('/api/admin/dashboard-summary', session);

                if (mounted) {
                    setSummary(payload);
                }
            } catch (exception) {
                if (mounted) {
                    setError(exception.message || 'Gagal memuat ringkasan admin.');
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
        { label: 'Dashboard', href: '/admin/dashboard', badge: 'Home' },
        { label: 'Manajemen Kelas', href: '/admin/dashboard#kelas', badge: 'CRUD' },
        { label: 'Mata Pelajaran', href: '/admin/dashboard#mapel', badge: 'CRUD' },
        { label: 'Import Akun', href: '/admin/dashboard#import', badge: 'Excel' },
    ];

    return (
        <DashboardLayout
            title="Dashboard Admin"
            user={session?.user}
            navigation={navigation}
            onLogout={onLogout}
        >
            <div className="space-y-6">
                <section className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        label="Total Guru"
                        value={loading ? '...' : summary?.cards?.total_guru ?? 0}
                        description="Guru aktif dalam sistem"
                        tone="blue"
                    />
                    <StatCard
                        label="Total Siswa"
                        value={loading ? '...' : summary?.cards?.total_siswa ?? 0}
                        description="Data siswa terdaftar"
                        tone="amber"
                    />
                    <StatCard
                        label="Total Kelas"
                        value={loading ? '...' : summary?.cards?.total_kelas ?? 0}
                        description="Kelas berjalan semester ini"
                        tone="slate"
                    />
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Distribusi Aktivitas</p>
                                <h3 className="mt-2 text-xl font-semibold text-slate-900">Statistik penggunaan sistem</h3>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">7 hari terakhir</span>
                        </div>

                        {error ? (
                            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </div>
                        ) : null}

                        <div className="mt-8 flex h-80 items-end gap-4 rounded-2xl bg-slate-50 p-4">
                            {(summary?.chart?.values || [12, 18, 14, 22, 16, 20, 24]).map((height, index) => (
                                <div key={index} className="flex flex-1 flex-col items-center gap-3">
                                    <div
                                        className="w-full max-w-[42px] rounded-t-2xl bg-slate-900/80 shadow-[0_14px_40px_rgba(15,23,42,0.25)]"
                                        style={{ height: `${Math.max(10, Number(height)) * 3}%` }}
                                    />
                                    <span className="text-xs text-slate-500">{summary?.chart?.labels?.[index] || `H${index + 1}`}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Aksi Cepat</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Start point yang berguna untuk operator</h3>
                        <div className="mt-6 space-y-3 text-sm text-slate-600">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">Buat akun guru baru dan pasangkan ke profilnya.</div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">Sinkronisasi data kelas sebelum jadwal asesmen dimulai.</div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">Impor akun siswa dari Excel untuk awal semester.</div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Log Aktivitas Terakhir</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Riwayat perubahan terbaru</h3>
                        </div>
                        <span className="text-sm text-slate-500">Terbaru diperbarui otomatis</span>
                    </div>

                    <div className="mt-6 space-y-3">
                            {(summary?.recent_activities || []).map((item) => (
                                <div key={`${item.tanggal}-${item.deskripsi}`} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                                    <span className="mr-2 text-slate-500">[{item.tanggal}]</span>
                                    {item.deskripsi}
                                </div>
                            ))}
                            {!loading && (summary?.recent_activities || []).length === 0 ? (
                                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                                    Belum ada aktivitas terbaru.
                                </div>
                            ) : null}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}