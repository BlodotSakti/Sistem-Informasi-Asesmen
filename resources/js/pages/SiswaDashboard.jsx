import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { siswaNavigation } from './siswa/siswaNavigation';
import { useSiswaData } from './siswa/useSiswaData';

export default function SiswaDashboard({ session, onLogout }) {
    const { summary, loading, error } = useSiswaData(session);
    const cards = summary?.cards || {};

    return (
        <DashboardLayout title="Dashboard Siswa" user={session?.user} navigation={siswaNavigation} onLogout={onLogout} profileHref="/siswa/profil">
            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-3 text-center">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Ringkasan Siswa</p>
                        <h3 className="text-2xl font-semibold text-slate-900">Akses cepat ke setiap halaman siswa</h3>
                        <p className="mx-auto max-w-2xl text-sm text-slate-500">Dashboard ini hanya berisi ringkasan utama. Detail profil, sesi, rencana belajar, tren, dan apresiasi ada di halaman masing-masing.</p>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Rata-rata" value={loading ? '...' : cards.rata_rata ?? 0} description="Nilai semester berjalan" tone="blue" />
                        <StatCard label="Ujian Menunggu" value={loading ? '...' : cards.ujian_menunggu ?? 0} description="CBT terdekat siap dikerjakan" tone="amber" />
                        <StatCard label="Tugas Aktif" value={loading ? '...' : cards.tugas_aktif ?? 0} description="Jawaban yang tercatat" tone="slate" />
                        <StatCard label="Apresiasi" value={loading ? '...' : cards.apresiasi ?? 0} description="Badge dari guru mapel" tone="rose" />
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <a href="/siswa/profil" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Profil</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Buka halaman profil siswa</h3>
                        <p className="mt-2 text-sm text-slate-500">Nama, NISN, kelas aktif, dan riwayat kelas.</p>
                    </a>
                    <a href="/siswa/sesi-aktif" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Sesi Aktif</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Lihat CBT yang sedang berjalan</h3>
                        <p className="mt-2 text-sm text-slate-500">Semua sesi aktif berada di halaman sendiri.</p>
                    </a>
                    <a href="/siswa/rencana-belajar" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Rencana</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Kelola kartu belajar pribadi</h3>
                        <p className="mt-2 text-sm text-slate-500">Tambah dan lihat daftar rencana belajar.</p>
                    </a>
                    <a href="/siswa/tren-nilai" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Tren</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Pantau grafik nilai</h3>
                        <p className="mt-2 text-sm text-slate-500">Visualisasi skor akademik per periode.</p>
                    </a>
                    <a href="/siswa/apresiasi" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:col-span-2 xl:col-span-2">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Apresiasi</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Badge dan catatan terbaru</h3>
                        <p className="mt-2 text-sm text-slate-500">Ringkasan apresiasi guru dan catatan privat terbaru.</p>
                    </a>
                </section>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <section className="grid gap-6 xl:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Kelas Aktif</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Ringkasan kelas yang sedang diikuti</h3>
                        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="font-semibold text-slate-900">{summary?.profile?.kelas_aktif?.nama_kelas || 'Belum ada kelas aktif'}</p>
                            <p className="text-sm text-slate-500">{summary?.profile?.kelas_aktif?.guru_wali ? `Wali kelas: ${summary.profile.kelas_aktif.guru_wali}` : 'Wali kelas belum ditetapkan'}</p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Mapel Aktif</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Mata pelajaran yang terhubung</h3>
                        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="font-semibold text-slate-900">{(summary?.profile?.mata_pelajaran || []).length} mapel aktif</p>
                            <p className="text-sm text-slate-500">Terkait dengan penugasan guru pada kelas aktif.</p>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}