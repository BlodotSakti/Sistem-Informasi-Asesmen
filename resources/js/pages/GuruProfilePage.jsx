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

                <section className="grid gap-4 md:grid-cols-2">
                    <StatCard label="Penugasan Kelas" value={assignments.length} description="Kelas yang diampu saat ini" tone="blue" className="border-border bg-white p-6 shadow-sm !border-transparent" />
                    <StatCard label="Role Sistem" value="Guru" description="Hak akses aplikasi" tone="slate" className="border-border bg-white p-6 shadow-sm !border-transparent" />
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Identitas Pribadi</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Ringkasan data utama</h3>

                            <div className="mt-6 space-y-3">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Nama Lengkap</p>
                                    <p className="mt-1 font-semibold text-slate-900">{profile.nama_lengkap || session?.user?.nama_lengkap || '-'}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">NIP</p>
                                    <p className="mt-1 font-semibold text-slate-900">{profile.nip || '-'}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Username Login</p>
                                    <p className="mt-1 font-semibold text-slate-900">{session?.user?.username || '-'}</p>
                                </div>
                            </div>
                        </div>

                        <ProfileCredentialsForm session={session} />
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Daftar Penugasan</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Kelas & Mata Pelajaran Diampu</h3>

                            <div className="mt-6 overflow-x-auto rounded-3xl border border-border">
                                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                    <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Kelas</th>
                                            <th className="px-4 py-3 font-semibold">Mata Pelajaran</th>
                                            <th className="px-4 py-3 font-semibold">Tahun Ajaran</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {assignments.map((item) => (
                                            <tr key={item.id_penugasan_pembelajaran} className="align-top hover:bg-slate-50/70">
                                                <td className="px-4 py-3 font-semibold text-slate-900">{item.kelas?.nama_kelas || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{item.mata_pelajaran?.nama_mapel || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{item.tahun_ajaran || '-'}</td>
                                            </tr>
                                        ))}
                                        {assignments.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="px-4 py-4 text-sm text-slate-500 text-center">Belum ada penugasan untuk guru ini.</td>
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
