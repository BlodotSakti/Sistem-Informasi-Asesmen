import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';
import { siswaNavigation } from './siswa/siswaNavigation';
import { useSiswaData } from './siswa/useSiswaData';

export default function SiswaLearningPlanPage({ session, onLogout }) {
    const { summary, loading, error, setSummary } = useSiswaData(session);
    const [plans, setPlans] = useState([]);
    const [planForm, setPlanForm] = useState({ id_mapel: '', catatan: '', sumber: 'manual', status: 'direncanakan' });
    const [planSaving, setPlanSaving] = useState(false);
    const [planMessage, setPlanMessage] = useState('');
    const [planSearch, setPlanSearch] = useState('');

    const filteredPlans = useMemo(() => {
        const search = planSearch.trim().toLowerCase();

        return plans.filter((item) => {
            if (search === '') {
                return true;
            }

            return [item.mata_pelajaran?.nama_mapel, item.mataPelajaran?.nama_mapel, item.status, item.sumber, item.catatan]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [planSearch, plans]);

    useEffect(() => {
        let mounted = true;

        const loadPlans = async () => {
            try {
                const payload = await apiFetch('/api/siswa/rencana-belajar', session);
                if (mounted) {
                    setPlans(payload.data || []);
                }
            } catch (exception) {
                if (mounted) {
                    setPlanMessage(exception.message || 'Gagal memuat rencana belajar.');
                }
            }
        };

        if (session?.token) {
            loadPlans();
        }

        return () => {
            mounted = false;
        };
    }, [session]);

    const resetPlanForm = () => {
        setPlanForm({ id_mapel: '', catatan: '', sumber: 'manual', status: 'direncanakan' });
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
                body: JSON.stringify({ ...planForm, id_mapel: Number(planForm.id_mapel) }),
            });

            setPlanMessage('Rencana belajar berhasil disimpan.');
            resetPlanForm();

            const summaryPayload = await apiFetch('/api/siswa/dashboard-summary', session);
            setSummary(summaryPayload);

            const plansPayload = await apiFetch('/api/siswa/rencana-belajar', session);
            setPlans(plansPayload.data || []);
        } catch (exception) {
            setPlanMessage(exception.message || 'Gagal menyimpan rencana belajar.');
        } finally {
            setPlanSaving(false);
        }
    };

    return (
        <DashboardLayout title="Rencana Belajar" user={session?.user} navigation={siswaNavigation} onLogout={onLogout} profileHref="/siswa/profil">
            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Rencana Belajar</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">Kelola kartu belajar pribadi</h3>
                    <p className="mt-2 text-sm text-slate-500">Menu ini khusus untuk menambah dan melihat target belajar siswa tanpa menumpuk di dashboard.</p>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Total Rencana" value={loading ? '...' : plans.length} description="Kartu yang tersimpan" tone="blue" />
                        <StatCard label="Mapel Aktif" value={loading ? '...' : (summary?.available_subjects || []).length} description="Pilihan mapel tersedia" tone="amber" />
                        <StatCard label="Sumber Manual" value={loading ? '...' : (plans.filter((item) => item.sumber === 'manual').length)} description="Kartu yang dibuat sendiri" tone="slate" />
                        <StatCard label="Status Selesai" value={loading ? '...' : (plans.filter((item) => item.status === 'selesai').length)} description="Target yang sudah tuntas" tone="rose" />
                    </div>
                </section>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <section className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Tambah Rencana</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Isi satu kartu belajar baru</h3>

                        <form className="mt-6 space-y-4" onSubmit={submitLearningPlan}>
                            <label className="space-y-2 text-sm text-slate-600">
                                <span className="font-medium text-slate-700">Mata Pelajaran</span>
                                <select value={planForm.id_mapel} onChange={(event) => setPlanForm((current) => ({ ...current, id_mapel: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                    <option value="">Pilih mapel</option>
                                    {(summary?.available_subjects || []).map((item) => (
                                        <option key={item.id_penugasan_pembelajaran} value={item.id_mapel}>{item.nama_mapel} {item.guru ? `- ${item.guru}` : ''}</option>
                                    ))}
                                </select>
                            </label>

                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm text-slate-600">
                                    <span className="font-medium text-slate-700">Status</span>
                                    <select value={planForm.status} onChange={(event) => setPlanForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                        <option value="direncanakan">Direncanakan</option>
                                        <option value="sedang_dipelajari">Sedang Dipelajari</option>
                                        <option value="selesai">Selesai</option>
                                    </select>
                                </label>

                                <label className="space-y-2 text-sm text-slate-600">
                                    <span className="font-medium text-slate-700">Sumber</span>
                                    <select value={planForm.sumber} onChange={(event) => setPlanForm((current) => ({ ...current, sumber: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                        <option value="manual">Manual</option>
                                        <option value="kelas">Kelas</option>
                                        <option value="guru">Guru</option>
                                    </select>
                                </label>
                            </div>

                            <label className="space-y-2 text-sm text-slate-600">
                                <span className="font-medium text-slate-700">Catatan</span>
                                <textarea value={planForm.catatan} onChange={(event) => setPlanForm((current) => ({ ...current, catatan: event.target.value }))} className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Contoh: ulangi bab pecahan tiap malam Selasa" />
                            </label>

                            <div className="flex flex-wrap items-center gap-3">
                                <button type="submit" disabled={planSaving} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
                                    {planSaving ? 'Menyimpan...' : 'Simpan Rencana'}
                                </button>
                                <button type="button" onClick={resetPlanForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                    Reset
                                </button>
                            </div>

                            {planMessage ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{planMessage}</div> : null}
                        </form>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Daftar Rencana</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Kartu belajar yang sudah disimpan</h3>

                        <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
                            <span>Cari rencana belajar</span>
                            <input value={planSearch} onChange={(event) => setPlanSearch(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Mapel, status, sumber, atau catatan" />
                        </label>

                        <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Mapel</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3 font-semibold">Sumber</th>
                                        <th className="px-4 py-3 font-semibold">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredPlans.map((item) => (
                                        <tr key={item.id_rencana_belajar} className="align-top hover:bg-slate-50/70">
                                            <td className="px-4 py-3 font-semibold text-slate-900">{item.mata_pelajaran?.nama_mapel || item.mataPelajaran?.nama_mapel || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.status || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.sumber || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.catatan || '-'}</td>
                                        </tr>
                                    ))}
                                    {filteredPlans.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-4 text-sm text-slate-500">Belum ada kartu rencana belajar.</td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}