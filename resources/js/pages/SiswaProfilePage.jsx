import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';

export default function SiswaProfilePage({ session, onLogout }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadSummary = async () => {
            try {
                setLoading(true);
                const payload = await apiFetch('/api/siswa/dashboard-summary', session);

                if (mounted) {
                    setSummary(payload);
                }
            } catch (exception) {
                if (mounted) {
                    setError(exception.message || 'Gagal memuat profil siswa.');
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

    const profile = summary?.profile || {};
    const subjects = useMemo(() => profile.mata_pelajaran || [], [profile]);
    const learningPlans = useMemo(() => profile.rencana_belajar || [], [profile]);
    const classHistory = useMemo(() => profile.riwayat_kelas || [], [profile]);

    const navigation = [
        { label: 'Dashboard', href: '/siswa/dashboard', badge: 'Home' },
        { label: 'Profil', href: '/siswa/profil', badge: 'Data' },
        { label: 'Sesi Aktif', href: '/siswa/dashboard#sesi', badge: 'CBT' },
        { label: 'Rencana Belajar', href: '/siswa/dashboard#rencana', badge: 'Plan' },
        { label: 'Tren Nilai', href: '/siswa/dashboard#tren', badge: 'Grafik' },
        { label: 'Apresiasi', href: '/siswa/dashboard#badge', badge: 'Badge' },
    ];

    return (
        <DashboardLayout title="Profil Siswa" user={session?.user} navigation={navigation} onLogout={onLogout} profileHref="/siswa/dashboard">
            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-slate-700 text-2xl font-semibold uppercase text-amber-300">
                                {(profile.nama_lengkap || session?.user?.nama_lengkap || 'PR').slice(0, 2)}
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Profil Siswa</p>
                                <h3 className="mt-2 text-3xl font-semibold">{profile.nama_lengkap || session?.user?.nama_lengkap || '-'}</h3>
                                <p className="mt-2 text-sm text-slate-300">NISN: {profile.nisn || session?.user?.profile?.nisn || '-'}</p>
                                <p className="text-sm text-slate-300">
                                    {profile.kelas_aktif?.nama_kelas || 'Belum ada kelas aktif'}
                                    {profile.kelas_aktif?.guru_wali ? ` • Wali kelas: ${profile.kelas_aktif.guru_wali}` : ''}
                                </p>
                            </div>
                        </div>

                        <a href="/siswa/dashboard" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                            Kembali ke Dashboard
                        </a>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Kelas Aktif" value={loading ? '...' : profile.kelas_aktif?.nama_kelas || '0'} description="Kelas yang sedang diikuti" tone="blue" />
                    <StatCard label="Riwayat Kelas" value={loading ? '...' : classHistory.length} description="Jejak perpindahan kelas" tone="amber" />
                    <StatCard label="Mapel Aktif" value={loading ? '...' : subjects.length} description="Penugasan guru terkait" tone="slate" />
                    <StatCard label="Rencana Belajar" value={loading ? '...' : learningPlans.length} description="Kartu yang tersimpan" tone="rose" />
                </section>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Identitas Akademik</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Ringkasan data utama siswa</h3>

                            <div className="mt-6 space-y-3">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Nama Lengkap</p>
                                    <p className="mt-1 font-semibold text-slate-900">{profile.nama_lengkap || session?.user?.nama_lengkap || '-'}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">NISN</p>
                                    <p className="mt-1 font-semibold text-slate-900">{profile.nisn || session?.user?.profile?.nisn || '-'}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Kelas Aktif</p>
                                    <p className="mt-1 font-semibold text-slate-900">{profile.kelas_aktif?.nama_kelas || 'Belum ada kelas aktif'}</p>
                                    <p className="mt-1 text-sm text-slate-500">{profile.kelas_aktif?.guru_wali ? `Wali kelas: ${profile.kelas_aktif.guru_wali}` : 'Wali kelas belum ditetapkan'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Riwayat Kelas</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Perpindahan dan histori kelas</h3>

                            <div className="mt-6 space-y-3">
                                {classHistory.slice(0, 6).map((item) => (
                                    <div key={item.id_kelas_siswa} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                                        <div>
                                            <p className="font-semibold text-slate-900">{item.nama_kelas || '-'}</p>
                                            <p className="text-sm text-slate-500">{item.tahun_ajaran || '-'}</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                            {item.is_aktif ? 'Aktif' : 'Riwayat'}
                                        </span>
                                    </div>
                                ))}
                                {classHistory.length === 0 ? <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Belum ada riwayat kelas.</div> : null}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Mapel Aktif</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Mata pelajaran yang terhubung ke kelas aktif</h3>

                            <div className="mt-6 grid gap-3 md:grid-cols-2">
                                {subjects.slice(0, 6).map((item) => (
                                    <div key={item.id_penugasan_pembelajaran} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="font-semibold text-slate-900">{item.nama_mapel || '-'}</p>
                                        <p className="mt-1 text-sm text-slate-500">{item.guru || '-'} • {item.tahun_ajaran || '-'}</p>
                                    </div>
                                ))}
                                {subjects.length === 0 ? <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 md:col-span-2">Belum ada penugasan mapel untuk kelas aktif.</div> : null}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Rencana Belajar</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Kartu belajar yang sudah disimpan</h3>

                            <div className="mt-6 space-y-3">
                                {learningPlans.slice(0, 6).map((item) => (
                                    <div key={item.id_rencana_belajar} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        <div>
                                            <p className="font-semibold text-slate-900">{item.nama_mapel || '-'}</p>
                                            <p className="text-xs text-slate-500">{item.status} • {item.sumber}</p>
                                        </div>
                                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">Rencana</span>
                                    </div>
                                ))}
                                {learningPlans.length === 0 ? <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Belum ada kartu rencana belajar.</div> : null}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
