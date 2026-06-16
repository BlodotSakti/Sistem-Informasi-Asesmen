import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';
import { siswaNavigation } from './siswa/siswaNavigation';

export default function SiswaProfilePage({ session, onLogout }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [classHistorySearch, setClassHistorySearch] = useState('');
    const [subjectSearch, setSubjectSearch] = useState('');
    const [learningPlanSearch, setLearningPlanSearch] = useState('');

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

    const filteredClassHistory = useMemo(() => {
        const search = classHistorySearch.trim().toLowerCase();

        return classHistory.filter((item) => {
            if (search === '') {
                return true;
            }

            return [item.nama_kelas, item.tahun_ajaran, item.is_aktif ? 'aktif' : 'riwayat']
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [classHistory, classHistorySearch]);

    const filteredSubjects = useMemo(() => {
        const search = subjectSearch.trim().toLowerCase();

        return subjects.filter((item) => {
            if (search === '') {
                return true;
            }

            return [item.nama_mapel, item.guru, item.tahun_ajaran]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [subjectSearch, subjects]);

    const filteredLearningPlans = useMemo(() => {
        const search = learningPlanSearch.trim().toLowerCase();

        return learningPlans.filter((item) => {
            if (search === '') {
                return true;
            }

            return [item.nama_mapel, item.status, item.sumber]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [learningPlanSearch, learningPlans]);

    return (
        <DashboardLayout title="Profil Siswa" user={session?.user} navigation={siswaNavigation} onLogout={onLogout} profileHref="/siswa/dashboard">
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

                            <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
                                <span>Cari riwayat kelas</span>
                                <input value={classHistorySearch} onChange={(event) => setClassHistorySearch(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Nama kelas, tahun ajaran, atau status" />
                            </label>

                            <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Kelas</th>
                                            <th className="px-4 py-3 font-semibold">Tahun Ajaran</th>
                                            <th className="px-4 py-3 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredClassHistory.map((item) => (
                                            <tr key={item.id_kelas_siswa} className="align-top hover:bg-slate-50/70">
                                                <td className="px-4 py-3 font-semibold text-slate-900">{item.nama_kelas || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{item.tahun_ajaran || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.is_aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                                        {item.is_aktif ? 'Aktif' : 'Riwayat'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredClassHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="px-4 py-4 text-sm text-slate-500">Belum ada riwayat kelas.</td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Mapel Aktif</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Mata pelajaran yang terhubung ke kelas aktif</h3>

                            <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
                                <span>Cari mapel aktif</span>
                                <input value={subjectSearch} onChange={(event) => setSubjectSearch(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Mata pelajaran, guru, atau tahun ajaran" />
                            </label>

                            <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Mata Pelajaran</th>
                                            <th className="px-4 py-3 font-semibold">Guru</th>
                                            <th className="px-4 py-3 font-semibold">Tahun Ajaran</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredSubjects.map((item) => (
                                            <tr key={item.id_penugasan_pembelajaran} className="align-top hover:bg-slate-50/70">
                                                <td className="px-4 py-3 font-semibold text-slate-900">{item.nama_lengkap || item.nama_mapel || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{item.guru || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{item.tahun_ajaran || '-'}</td>
                                            </tr>
                                        ))}
                                        {filteredSubjects.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="px-4 py-4 text-sm text-slate-500">Belum ada penugasan mapel untuk kelas aktif.</td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Rencana Belajar</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Kartu belajar yang sudah disimpan</h3>

                            <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
                                <span>Cari rencana belajar</span>
                                <input value={learningPlanSearch} onChange={(event) => setLearningPlanSearch(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Mapel, status, atau sumber" />
                            </label>

                            <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Mapel</th>
                                            <th className="px-4 py-3 font-semibold">Status</th>
                                            <th className="px-4 py-3 font-semibold">Sumber</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredLearningPlans.map((item) => (
                                            <tr key={item.id_rencana_belajar} className="align-top hover:bg-slate-50/70">
                                                <td className="px-4 py-3 font-semibold text-slate-900">{item.nama_lengkap || item.nama_mapel || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{item.status || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{item.sumber || '-'}</td>
                                            </tr>
                                        ))}
                                        {filteredLearningPlans.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="px-4 py-4 text-sm text-slate-500">Belum ada kartu rencana belajar.</td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
