import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';
import { siswaNavigation } from './siswa/siswaNavigation';
import ProfileCredentialsForm from '../components/profile/ProfileCredentialsForm';

export default function SiswaProfilePage({ session, onLogout }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [classHistorySearch, setClassHistorySearch] = useState('');
    const [subjectSearch, setSubjectSearch] = useState('');

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

    return (
        <DashboardLayout title="Profil Siswa" user={session?.user} navigation={siswaNavigation} onLogout={onLogout} profileHref="/siswa/dashboard">
            <div className="space-y-6">
                <section className="rounded-3xl border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary p-6 text-white shadow-sm">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#EEDCC8]/20 bg-accent/20 text-2xl font-semibold uppercase text-[#EEDCC8]">
                                {(profile.nama_lengkap || session?.user?.nama_lengkap || 'PR').slice(0, 2)}
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-accent">Profil Siswa</p>
                                <h3 className="mt-2 text-2xl sm:text-3xl font-semibold text-[#EEDCC8]">{profile.nama_lengkap || session?.user?.nama_lengkap || '-'}</h3>
                                <p className="mt-2 text-sm text-accent">NISN: {profile.nisn || session?.user?.profile?.nisn || '-'}</p>
                                <p className="text-sm text-accent">
                                    {profile.kelas_aktif?.nama_kelas || 'Belum ada kelas aktif'}
                                    {profile.kelas_aktif?.guru_wali ? ` • Wali kelas: ${profile.kelas_aktif.guru_wali}` : ''}
                                </p>
                            </div>
                        </div>

                        {/*<a href="/siswa/dashboard" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                            Kembali ke Dashboard
                        </a>*/}
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                    <StatCard 
                        label="Kelas Aktif" 
                        value={loading ? '...' : profile.kelas_aktif?.nama_kelas || '0'} 
                        description="Kelas yang sedang diikuti" 
                        tone="blue" 
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        }
                    />
                    <StatCard 
                        label="Riwayat Kelas" 
                        value={loading ? '...' : classHistory.length} 
                        description="Jejak perpindahan kelas" 
                        tone="amber" 
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <StatCard 
                        label="Mapel Aktif" 
                        value={loading ? '...' : subjects.length} 
                        description="Penugasan guru terkait" 
                        tone="slate" 
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        }
                    />
                </section>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Identitas Akademik</p>
                                    <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">Ringkasan Data Utama Siswa</h3>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 transition-colors hover:bg-slate-50">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Nama Lengkap</p>
                                    <p className="text-base font-semibold text-slate-800">{profile.nama_lengkap || session?.user?.nama_lengkap || '-'}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 transition-colors hover:bg-slate-50">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">NISN</p>
                                    <p className="text-base font-semibold text-slate-800">{profile.nisn || session?.user?.profile?.nisn || '-'}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 transition-colors hover:bg-slate-50">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Kelas Aktif</p>
                                    <p className="text-base font-semibold text-slate-800">{profile.kelas_aktif?.nama_kelas || 'Belum ada kelas aktif'}</p>
                                    <p className="mt-1 text-sm text-slate-500">{profile.kelas_aktif?.guru_wali ? `Wali kelas: ${profile.kelas_aktif.guru_wali}` : 'Wali kelas belum ditetapkan'}</p>
                                </div>
                            </div>
                        </div>

                        <ProfileCredentialsForm session={session} />

                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Riwayat Kelas</p>
                                    <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">Perpindahan dan Histori Kelas</h3>
                                </div>
                            </div>

                            <label className="mb-6 block space-y-2 text-sm font-medium text-slate-700">
                                <span>Cari riwayat kelas</span>
                                <input value={classHistorySearch} onChange={(event) => setClassHistorySearch(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-slate-800 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:text-slate-400" placeholder="Nama kelas, tahun ajaran, atau status" />
                            </label>

                            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                                <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                                    <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                        <tr>
                                            <th className="px-5 py-4">Kelas</th>
                                            <th className="px-5 py-4">Tahun Ajaran</th>
                                            <th className="px-5 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {filteredClassHistory.map((item) => (
                                            <tr key={item.id_kelas_siswa} className="transition-colors hover:bg-slate-50/50">
                                                <td className="px-5 py-4 font-semibold text-slate-800">{item.nama_kelas || '-'}</td>
                                                <td className="px-5 py-4 text-slate-600 font-medium">{item.tahun_ajaran || '-'}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.is_aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                                        {item.is_aktif ? 'Aktif' : 'Riwayat'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredClassHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="px-5 py-8 text-sm text-slate-400 text-center italic">Belum ada riwayat kelas.</td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </div>


                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Mapel Aktif</p>
                                    <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">Mata Pelajaran yang Terhubung</h3>
                                </div>
                            </div>

                            <label className="mb-6 block space-y-2 text-sm font-medium text-slate-700">
                                <span>Cari mapel aktif</span>
                                <input value={subjectSearch} onChange={(event) => setSubjectSearch(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-slate-800 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:text-slate-400" placeholder="Mata pelajaran, guru, atau tahun ajaran" />
                            </label>

                            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                                <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                                    <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                        <tr>
                                            <th className="px-5 py-4">Mata Pelajaran</th>
                                            <th className="px-5 py-4">Guru</th>
                                            <th className="px-5 py-4">Tahun Ajaran</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {filteredSubjects.map((item) => (
                                            <tr key={item.id_penugasan_pembelajaran} className="transition-colors hover:bg-slate-50/50">
                                                <td className="px-5 py-4 font-semibold text-slate-800">{item.nama_lengkap || item.nama_mapel || '-'}</td>
                                                <td className="px-5 py-4 text-slate-600 font-medium">{item.guru || '-'}</td>
                                                <td className="px-5 py-4 text-slate-500">{item.tahun_ajaran || '-'}</td>
                                            </tr>
                                        ))}
                                        {filteredSubjects.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="px-5 py-8 text-sm text-slate-400 text-center italic">Belum ada penugasan mapel untuk kelas aktif.</td>
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
