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

function toTahunAjaranValue(value) {
    if (!value) return '';
    return String(value).split(' - ')[0].trim();
}

export default function AdminKelasPage({ session, onLogout }) {
    const { masterData, loading, reloadWorkspace } = useAdminWorkspace(session, { loadMasterData: true, loadSummary: false });
    
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    const [classForm, setClassForm] = useState({
        id_guru_wali: '',
        nama_kelas: '',
        tahun_ajaran: '',
    });
    const [classId, setClassId] = useState(null);
    const [classSearch, setClassSearch] = useState('');

    useEffect(() => {
        // Initialize form with defaults once masterData is loaded
        if (!loading && !classId && classForm.id_guru_wali === '' && classForm.tahun_ajaran === '') {
            setClassForm(current => ({
                ...current,
                id_guru_wali: current.id_guru_wali || masterData.guru_options?.[0]?.id_guru || '',
                tahun_ajaran: toTahunAjaranValue(current.tahun_ajaran) || masterData.tahun_ajaran?.[0]?.nama_tahun_ajaran || '',
            }));
        }
    }, [masterData, loading, classId, classForm.id_guru_wali, classForm.tahun_ajaran]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 3600);
    };

    useEffect(() => () => {
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
    }, []);

    const filteredClasses = useMemo(() => {
        const search = classSearch.trim().toLowerCase();
        return (masterData.kelas || []).filter((item) => {
            if (search === '') return true;
            return [item.nama_kelas, item.guru_wali?.nama_lengkap, item.tahun_ajaran]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [classSearch, masterData.kelas]);

    const resetClassForm = () => {
        setClassForm({
            id_guru_wali: masterData.guru_options?.[0]?.id_guru || '',
            nama_kelas: '',
            tahun_ajaran: masterData.tahun_ajaran?.[0]?.nama_tahun_ajaran || '',
        });
        setClassId(null);
    };

    const submitClass = async (event) => {
        event.preventDefault();
        const payload = {
            ...classForm,
            tahun_ajaran: toTahunAjaranValue(classForm.tahun_ajaran),
        };

        try {
            if (classId) {
                await apiFetch(`/api/admin/kelas/${classId}`, session, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                showToast('Kelas berhasil diperbarui.');
            } else {
                await apiFetch('/api/admin/kelas', session, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                showToast('Kelas berhasil ditambahkan.');
            }
            resetClassForm();
            await reloadWorkspace();
        } catch (exception) {
            showToast(exception.message || 'Gagal menyimpan kelas.', 'error');
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

    const title = 'Kelas';

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
                                    Kelola daftar kelas dan tentukan wali kelas untuk masing-masing kelas.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 w-full xl:w-auto xl:flex xl:flex-wrap xl:gap-4">
                                <div className="flex flex-col items-start justify-center rounded-2xl sm:rounded-[1.5rem] bg-[#EEDCC8] p-4 sm:p-6 shadow-sm border border-white/20 transition-transform hover:-translate-y-1">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e2a3a]/10 text-[#1e2a3a] mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <div className="text-3xl font-extrabold text-[#CA8A04]">{loading ? '...' : (masterData.kelas || []).length}</div>
                                    <div className="text-sm font-semibold text-[#CA8A04] mt-1">Total Kelas</div>
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
                        <form onSubmit={submitClass} className="space-y-4 rounded-3xl bg-slate-50 p-5">
                            <div className="grid gap-4">
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Nama Kelas</span>
                                    <input value={classForm.nama_kelas} onChange={(event) => setClassForm((current) => ({ ...current, nama_kelas: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="XI IPA 1" />
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Guru Wali</span>
                                    <select value={classForm.id_guru_wali} onChange={(event) => setClassForm((current) => ({ ...current, id_guru_wali: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                        <option value="">Pilih guru wali</option>
                                        {(masterData.guru_options || []).map((guru) => <option key={guru.id_guru} value={guru.id_guru}>{guru.nama_lengkap} {guru.nip ? `(${guru.nip})` : ''}</option>)}
                                    </select>
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Tahun Ajaran</span>
                                    <select value={toTahunAjaranValue(classForm.tahun_ajaran)} onChange={(event) => setClassForm((current) => ({ ...current, tahun_ajaran: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                        <option value="">Pilih tahun ajaran</option>
                                        {(masterData.tahun_ajaran || []).map((item) => <option key={item.id_tahun_ajaran} value={item.nama_tahun_ajaran}>{item.periode_label || item.nama_tahun_ajaran}</option>)}
                                    </select>
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/85">{classId ? 'Perbarui Kelas' : 'Simpan Kelas'}</button>
                                {classId ? <button type="button" onClick={resetClassForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Batal Edit</button> : null}
                            </div>
                        </form>

                        <div className="overflow-hidden rounded-3xl border border-border bg-white">
                            <div className="border-b border-border px-5 py-4">
                                <h4 className="text-lg font-semibold text-slate-900">Daftar Kelas</h4>
                                <p className="text-sm text-slate-500">Gunakan daftar ini untuk melihat relasi guru wali dan periode kelas.</p>
                            </div>
                            <div className="border-b border-border px-5 py-4">
                                <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Data</p>
                                        <p className="mt-1 font-semibold text-slate-900">{loading ? 'Memuat...' : `${filteredClasses.length} data`}</p>
                                    </div>
                                    <label className="space-y-2 text-sm font-medium text-slate-700">
                                        <span>Cari kelas</span>
                                        <input value={classSearch} onChange={(event) => setClassSearch(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Nama kelas, guru wali, atau tahun ajaran" />
                                    </label>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                    <thead className={TABLE_HEAD_CLASS}>
                                        <tr>
                                            <th className="px-5 py-4 font-semibold">No</th>
                                            <th className="px-5 py-4 font-semibold">Kelas</th>
                                            <th className="px-5 py-4 font-semibold">Guru Wali</th>
                                            <th className="px-5 py-4 font-semibold">Tahun Ajaran</th>
                                            <th className={TABLE_ACTION_HEAD_CLASS}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredClasses.map((item, index) => (
                                            <tr key={item.id_kelas} className={TABLE_BODY_ROW_CLASS}>
                                                <td className={TABLE_NUMBER_CELL_CLASS}>{index + 1}</td>
                                                <td className={TABLE_TITLE_CELL_CLASS}>{item.nama_kelas}</td>
                                                <td className={TABLE_CELL_CLASS}>{item.guru_wali?.nama_lengkap || 'Belum ditentukan'}</td>
                                                <td className={TABLE_CELL_CLASS}>{item.tahun_ajaran}</td>
                                                <td className={TABLE_ACTION_CELL_CLASS}>
                                                    <div className={TABLE_ACTION_WRAP_CLASS}>
                                                        <button type="button" onClick={() => {
                                                            setClassId(item.id_kelas);
                                                            setClassForm({ id_guru_wali: item.id_guru_wali || '', nama_kelas: item.nama_kelas || '', tahun_ajaran: toTahunAjaranValue(item.tahun_ajaran) || '' });
                                                        }} className={TABLE_ACTION_PRIMARY_CLASS}>Edit</button>
                                                        <button type="button" onClick={() => deleteMaster(`/api/admin/kelas/${item.id_kelas}`, 'Kelas')} className={TABLE_ACTION_DANGER_CLASS}>Hapus</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!loading && filteredClasses.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-5 py-6 text-sm text-slate-500">Tidak ada kelas yang cocok dengan pencarian.</td>
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
