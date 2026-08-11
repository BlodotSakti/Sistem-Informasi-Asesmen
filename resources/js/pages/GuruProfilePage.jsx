import { useMemo } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import ProfileCredentialsForm from '../components/profile/ProfileCredentialsForm';
import { guruNavigation } from './guru/guruNavigation';

export default function GuruProfilePage({ session, onLogout }) {
    const profile = session?.user?.profile || {};
    const assignments = useMemo(() => profile.penugasan_pembelajaran || [], [profile]);

    return (
        <DashboardLayout title="Profil Guru" user={session?.user} navigation={guruNavigation} onLogout={onLogout} profileHref="/guru/dashboard">
            <div className="space-y-6">
                <section className="relative overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary p-4 sm:p-8 shadow-lg backdrop-blur-xl">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#EEDCC8]/20 bg-white/10 text-2xl font-semibold uppercase text-[#EEDCC8] shadow-inner backdrop-blur-sm">
                                {(profile.nama_lengkap || session?.user?.nama_lengkap || 'GU').slice(0, 2)}
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.4em] text-accent font-bold">Profil Guru</p>
                                <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#EEDCC8]">{profile.nama_lengkap || session?.user?.nama_lengkap || '-'}</h3>
                                <p className="mt-2 text-sm text-accent">NIP: {profile.nip || '-'}</p>
                            </div>
                        </div>

                        {/*<a href="/guru/dashboard" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                            Kembali ke Dashboard
                        </a>*/}
                    </div>
                </section>

                

                <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Identitas Pribadi</p>
                                    <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">Ringkasan Data Utama</h3>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 transition-colors hover:bg-slate-50">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Nama Lengkap</p>
                                    <p className="text-base font-semibold text-slate-800">{profile.nama_lengkap || session?.user?.nama_lengkap || '-'}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 transition-colors hover:bg-slate-50">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">NIP</p>
                                    <p className="text-base font-semibold text-slate-800">{profile.nip || '-'}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 transition-colors hover:bg-slate-50">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Username Login</p>
                                    <p className="text-base font-semibold text-slate-800">{session?.user?.username || '-'}</p>
                                </div>
                            </div>
                        </div>

                        <ProfileCredentialsForm session={session} />
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Daftar Penugasan</p>
                                    <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">Kelas & Mata Pelajaran</h3>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                                <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                                    <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                        <tr>
                                            <th className="px-5 py-4">Kelas</th>
                                            <th className="px-5 py-4">Mata Pelajaran</th>
                                            <th className="px-5 py-4">Tahun Ajaran</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {assignments.map((item) => (
                                            <tr key={item.id_penugasan_pembelajaran} className="transition-colors hover:bg-slate-50/50">
                                                <td className="px-5 py-4 font-semibold text-slate-800">{item.kelas?.nama_kelas || '-'}</td>
                                                <td className="px-5 py-4 text-slate-600 font-medium">{item.mata_pelajaran?.nama_mapel || '-'}</td>
                                                <td className="px-5 py-4 text-slate-500">{item.tahun_ajaran || '-'}</td>
                                            </tr>
                                        ))}
                                        {assignments.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="px-5 py-8 text-sm text-slate-400 text-center italic">Belum ada penugasan kelas.</td>
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
