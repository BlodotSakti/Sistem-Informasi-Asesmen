import React, { useMemo, useRef, useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch } from '../lib/api';
import { adminNavigation } from './adminNavigation';
import useAdminWorkspace from '../hooks/useAdminWorkspace';

const TABLE_HEAD_CLASS = 'border-b border-border bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500';
const TABLE_BODY_ROW_CLASS = 'align-top hover:bg-slate-50/70';
const TABLE_TITLE_CELL_CLASS = 'px-5 py-4 font-semibold text-slate-900';
const TABLE_CELL_CLASS = 'px-5 py-4 text-slate-600';
const TABLE_NUMBER_CELL_CLASS = 'px-5 py-4 font-semibold text-slate-500';
const TABLE_ACTION_HEAD_CLASS = 'px-5 py-4 font-semibold xl:text-right';
const TABLE_ACTION_CELL_CLASS = 'px-5 py-4 xl:text-right';
const TABLE_ACTION_WRAP_CLASS = 'flex flex-wrap gap-2 xl:justify-end';
const TABLE_ACTION_PRIMARY_CLASS = 'rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100';
const TABLE_ACTION_DANGER_CLASS = 'rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50';

function toInputDate(value) {
    if (!value) return '';
    return String(value).split('T')[0];
}

export default function AdminTahunAjaranPage({ session, onLogout }) {
    const { masterData, loading, reloadWorkspace } = useAdminWorkspace(session, { loadMasterData: true, loadSummary: false });
    
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    const [yearForm, setYearForm] = useState({
        nama_tahun_ajaran: '',
        semester: 'ganjil',
        tanggal_mulai: '',
        tanggal_selesai: '',
        is_aktif: true,
        keterangan: '',
    });
    const [yearId, setYearId] = useState(null);
    const [yearSearch, setYearSearch] = useState('');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 3600);
    };

    useEffect(() => () => {
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
    }, []);

    const filteredYears = useMemo(() => {
        const search = yearSearch.trim().toLowerCase();
        return (masterData.tahun_ajaran || []).filter((item) => {
            if (search === '') return true;
            return [item.nama_tahun_ajaran, item.semester, item.keterangan, item.periode_label]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [masterData.tahun_ajaran, yearSearch]);

    const resetYearForm = () => {
        setYearForm({
            nama_tahun_ajaran: '',
            semester: 'ganjil',
            tanggal_mulai: '',
            tanggal_selesai: '',
            is_aktif: true,
            keterangan: '',
        });
        setYearId(null);
    };

    const submitYear = async (event) => {
        event.preventDefault();
        const payload = {
            ...yearForm,
            is_aktif: Boolean(yearForm.is_aktif),
        };

        try {
            if (yearId) {
                await apiFetch(`/api/admin/tahun-ajaran/${yearId}`, session, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                showToast('Tahun ajaran berhasil diperbarui.');
            } else {
                await apiFetch('/api/admin/tahun-ajaran', session, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                showToast('Tahun ajaran berhasil ditambahkan.');
            }
            resetYearForm();
            await reloadWorkspace();
        } catch (exception) {
            showToast(exception.message || 'Gagal menyimpan tahun ajaran.', 'error');
        }
    };

    const deleteMaster = async (path, label) => {
        if (!window.confirm(`Hapus ${label} ini?`)) return;
        try {
            await apiFetch(path, session, { method: 'DELETE' });
            showToast(`${label} berhasil dihapus.`);
            await reloadWorkspace();
        } catch (exception) {
            showToast(exception.message || `Gagal menghapus ${label}.`, 'error');
        }
    };

    const title = 'Tahun Ajaran';

    return (
        <DashboardLayout title={title} user={session?.user} navigation={adminNavigation} onLogout={onLogout}>
            <div className="font-sans text-slate-900 selection:bg-primary/10 flex flex-col">
                <main className="flex-1 max-w-7xl mx-auto w-full">
                    <section className="mb-8 overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary px-4 py-6 sm:px-8 sm:py-10 shadow-lg backdrop-blur-xl relative">
                        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 sm:gap-8">
                            <div className="flex-1">
                                <p className="text-xs font-bold uppercase tracking-[0.4em] text-accent">{title}</p>
                                <h3 className="mt-4 text-xl sm:text-3xl font-semibold leading-tight text-[#EEDCC8] md:text-4xl">{title}</h3>
                                <p className="mt-4 max-w-xl text-sm leading-7 text-accent md:text-base">
                                    Kelola tahun ajaran akademik yang aktif untuk referensi seluruh sistem ujian dan penjadwalan.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 w-full xl:w-auto xl:flex xl:flex-wrap xl:gap-4">
                                <div className="flex flex-col items-start justify-center rounded-2xl sm:rounded-[1.5rem] bg-[#EEDCC8] p-4 sm:p-6 shadow-sm border border-white/20 transition-transform hover:-translate-y-1">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e2a3a]/10 text-[#1e2a3a] mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="text-3xl font-extrabold text-[#CA8A04]">{loading ? '...' : (masterData.tahun_ajaran || []).length}</div>
                                    <div className="text-sm font-semibold text-[#CA8A04] mt-1">Tahun Ajaran</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {toast && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-slate-900/20 backdrop-blur-sm animate-fade-in">
                            <div className={`pointer-events-auto flex items-center gap-4 rounded-2xl px-8 py-5 shadow-2xl border bg-white scale-110 ${toast.type === 'error' ? 'border-rose-200' : 'border-emerald-200'}`}>
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toast.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {toast.type === 'error' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    )}
                                </div>
                                <div className="text-base font-bold text-slate-800">{toast.message}</div>
                                <button type="button" onClick={() => setToast(null)} className="ml-4 rounded-full p-1 opacity-70 hover:bg-slate-100 hover:opacity-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <form onSubmit={submitYear} className="space-y-4 rounded-3xl bg-slate-50 p-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                                    <span>Nama Tahun Ajaran</span>
                                    <input value={yearForm.nama_tahun_ajaran} onChange={(event) => setYearForm((current) => ({ ...current, nama_tahun_ajaran: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="2025/2026" />
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                                    <span>Semester</span>
                                    <select value={yearForm.semester} onChange={(event) => setYearForm((current) => ({ ...current, semester: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                        <option value="ganjil">Ganjil</option>
                                        <option value="genap">Genap</option>
                                    </select>
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Tanggal Mulai</span>
                                    <input type="date" value={yearForm.tanggal_mulai} onChange={(event) => setYearForm((current) => ({ ...current, tanggal_mulai: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Tanggal Selesai</span>
                                    <input type="date" value={yearForm.tanggal_selesai} onChange={(event) => setYearForm((current) => ({ ...current, tanggal_selesai: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
                                </label>
                                <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 md:col-span-2">
                                    <input type="checkbox" checked={Boolean(yearForm.is_aktif)} onChange={(event) => setYearForm((current) => ({ ...current, is_aktif: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-text-primary focus:ring-slate-900" />
                                    Jadikan periode aktif
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                                    <span>Keterangan</span>
                                    <textarea value={yearForm.keterangan} onChange={(event) => setYearForm((current) => ({ ...current, keterangan: event.target.value }))} rows="3" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Contoh: Periode aktif semester ganjil" />
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/85">{yearId ? 'Perbarui Tahun Ajaran' : 'Simpan Tahun Ajaran'}</button>
                                {yearId ? <button type="button" onClick={resetYearForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Batal Edit</button> : null}
                            </div>
                        </form>

                        <div className="overflow-hidden rounded-3xl border border-border bg-white">
                            <div className="border-b border-border px-5 py-4">
                                <h4 className="text-lg font-semibold text-slate-900">Daftar Tahun Ajaran</h4>
                                <p className="text-sm text-slate-500">Gunakan satu data aktif untuk membantu filter kelas dan laporan.</p>
                            </div>
                            <div className="border-b border-border px-5 py-4">
                                <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Data</p>
                                        <p className="mt-1 font-semibold text-slate-900">{loading ? 'Memuat...' : `${filteredYears.length} data`}</p>
                                    </div>
                                    <label className="space-y-2 text-sm font-medium text-slate-700">
                                        <span>Cari tahun ajaran</span>
                                        <input value={yearSearch} onChange={(event) => setYearSearch(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Nama tahun ajaran, semester, atau keterangan" />
                                    </label>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                    <thead className={TABLE_HEAD_CLASS}>
                                        <tr>
                                            <th className="px-5 py-4 font-semibold">No</th>
                                            <th className="px-5 py-4 font-semibold">Tahun Ajaran</th>
                                            <th className="px-5 py-4 font-semibold">Semester</th>
                                            <th className="px-5 py-4 font-semibold">Periode</th>
                                            <th className="px-5 py-4 font-semibold">Status</th>
                                            <th className="px-5 py-4 font-semibold">Keterangan</th>
                                            <th className={TABLE_ACTION_HEAD_CLASS}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredYears.map((item, index) => (
                                            <tr key={item.id_tahun_ajaran} className={TABLE_BODY_ROW_CLASS}>
                                                <td className={TABLE_NUMBER_CELL_CLASS}>{index + 1}</td>
                                                <td className={TABLE_TITLE_CELL_CLASS}>{item.nama_tahun_ajaran}</td>
                                                <td className={TABLE_CELL_CLASS}>Semester {String(item.semester || 'ganjil').toUpperCase()}</td>
                                                <td className={TABLE_CELL_CLASS}>{toInputDate(item.tanggal_mulai)} sampai {toInputDate(item.tanggal_selesai)}</td>
                                                <td className="px-5 py-4">
                                                    {item.is_aktif ? <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Aktif</span> : <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Nonaktif</span>}
                                                </td>
                                                <td className={TABLE_CELL_CLASS}>{item.keterangan || '-'}</td>
                                                <td className={TABLE_ACTION_CELL_CLASS}>
                                                    <div className={TABLE_ACTION_WRAP_CLASS}>
                                                        <button type="button" onClick={() => {
                                                            setYearId(item.id_tahun_ajaran);
                                                            setYearForm({
                                                                nama_tahun_ajaran: item.nama_tahun_ajaran || '',
                                                                semester: item.semester || 'ganjil',
                                                                tanggal_mulai: toInputDate(item.tanggal_mulai),
                                                                tanggal_selesai: toInputDate(item.tanggal_selesai),
                                                                is_aktif: Boolean(item.is_aktif),
                                                                keterangan: item.keterangan || '',
                                                            });
                                                        }} className={TABLE_ACTION_PRIMARY_CLASS}>Edit</button>
                                                        <button type="button" onClick={() => deleteMaster(`/api/admin/tahun-ajaran/${item.id_tahun_ajaran}`, 'Tahun ajaran')} className={TABLE_ACTION_DANGER_CLASS}>Hapus</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!loading && filteredYears.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-5 py-6 text-sm text-slate-500">Tidak ada tahun ajaran yang cocok dengan pencarian.</td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </DashboardLayout>
    );
}
