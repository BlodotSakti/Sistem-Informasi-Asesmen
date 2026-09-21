import React, { useMemo, useRef, useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch } from '../lib/api';
import { adminNavigation } from './adminNavigation';
import useAdminWorkspace from '../hooks/useAdminWorkspace';
import FilterSelect from '../components/ui/FilterSelect';

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

export default function AdminMataPelajaranPage({ session, onLogout }) {
    const { masterData, loading, reloadWorkspace } = useAdminWorkspace(session, { loadMasterData: true, loadSummary: false });
    
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const formRef = useRef(null);

    const [mapelForm, setMapelForm] = useState({
        nama_mapel: '',
        tingkat: '',
    });
    const [mapelId, setMapelId] = useState(null);
    const [mapelSearch, setMapelSearch] = useState('');
    const [mapelFilterName, setMapelFilterName] = useState('');
    const [mapelFilterLevel, setMapelFilterLevel] = useState('');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 3600);
    };

    useEffect(() => () => {
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
    }, []);

    const uniqueMapelNames = useMemo(() => {
        const names = new Set();
        (masterData.mata_pelajaran || []).forEach(item => {
            if (item.nama_mapel) names.add(item.nama_mapel);
        });
        return Array.from(names).sort();
    }, [masterData.mata_pelajaran]);

    const uniqueTingkat = useMemo(() => {
        const levels = new Set();
        (masterData.mata_pelajaran || []).forEach(item => {
            if (item.tingkat) levels.add(item.tingkat);
        });
        return Array.from(levels).sort();
    }, [masterData.mata_pelajaran]);

    const filteredMapel = useMemo(() => {
        const search = mapelSearch.trim().toLowerCase();
        return (masterData.mata_pelajaran || []).filter((item) => {
            if (mapelFilterName && item.nama_mapel !== mapelFilterName) return false;
            if (mapelFilterLevel && item.tingkat !== mapelFilterLevel) return false;
            if (search === '') return true;
            return [item.nama_mapel, item.tingkat]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [mapelSearch, mapelFilterName, mapelFilterLevel, masterData.mata_pelajaran]);

    const resetMapelForm = () => {
        setMapelForm({ nama_mapel: '', tingkat: '' });
        setMapelId(null);
    };

    const submitMapel = async (event) => {
        event.preventDefault();
        try {
            if (mapelId) {
                await apiFetch(`/api/admin/mata-pelajaran/${mapelId}`, session, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(mapelForm),
                });
                showToast('Mata pelajaran berhasil diperbarui.');
            } else {
                await apiFetch('/api/admin/mata-pelajaran', session, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(mapelForm),
                });
                showToast('Mata pelajaran berhasil ditambahkan.');
            }
            resetMapelForm();
            await reloadWorkspace();
        } catch (exception) {
            showToast(exception.message || 'Gagal menyimpan mata pelajaran.', 'error');
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

    const title = 'Mata Pelajaran';

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
                                    Kelola daftar mata pelajaran yang akan diujikan dalam sistem asesmen.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 w-full xl:w-auto xl:flex xl:flex-wrap xl:gap-4">
                                <div className="flex flex-col items-start justify-center rounded-2xl sm:rounded-[1.5rem] bg-[#EEDCC8] p-4 sm:p-6 shadow-sm border border-white/20 transition-transform hover:-translate-y-1">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e2a3a]/10 text-[#1e2a3a] mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <div className="text-3xl font-extrabold text-[#CA8A04]">{loading ? '...' : (masterData.mata_pelajaran || []).length}</div>
                                    <div className="text-sm font-semibold text-[#CA8A04] mt-1">Total Mapel</div>
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
                        <form ref={formRef} onSubmit={submitMapel} className="space-y-4 rounded-3xl bg-slate-50 p-5 scroll-mt-24">
                            <div className="grid gap-4">
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Nama Mata Pelajaran</span>
                                    <input value={mapelForm.nama_mapel} onChange={(event) => setMapelForm((current) => ({ ...current, nama_mapel: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Matematika" />
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Tingkat</span>
                                    <select value={mapelForm.tingkat} onChange={(event) => setMapelForm((current) => ({ ...current, tingkat: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                        <option value="">Pilih tingkat kelas</option>
                                        <option value="X">X</option>
                                        <option value="XI">XI</option>
                                        <option value="XII">XII</option>
                                    </select>
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/85">{mapelId ? 'Perbarui Mapel' : 'Simpan Mapel'}</button>
                                {mapelId ? <button type="button" onClick={resetMapelForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Batal Edit</button> : null}
                            </div>
                        </form>

                        <div className="rounded-3xl border border-border bg-white">
                            <div className="border-b border-border px-5 py-4">
                                <h4 className="text-lg font-semibold text-slate-900">Daftar Mata Pelajaran</h4>
                                <p className="text-sm text-slate-500">Data mapel dipakai untuk bank soal dan jadwal sesi asesmen.</p>
                            </div>
                            <div className="border-b border-border px-5 py-4">
                                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 shrink-0">
                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Data</p>
                                        <p className="mt-1 font-semibold text-slate-900">{loading ? 'Memuat...' : `${filteredMapel.length} data`}</p>
                                    </div>
                                    <label className="flex-1 space-y-2 text-sm font-medium text-slate-700">
                                        <span>Cari mapel</span>
                                        <input value={mapelSearch} onChange={(event) => setMapelSearch(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Nama mapel atau tingkat" />
                                    </label>
                                    <div className="shrink-0 flex flex-col gap-1">
                                        <span className="text-sm font-medium text-slate-700">Mapel</span>
                                        <FilterSelect
                                            value={mapelFilterName}
                                            onChange={setMapelFilterName}
                                            options={[
                                                { value: '', label: 'Semua Mapel' },
                                                ...uniqueMapelNames.map(name => ({ value: name, label: name }))
                                            ]}
                                            placeholder="Semua Mapel"
                                            icon="📚"
                                            align="right"
                                            accentClass="bg-primary border-primary text-white shadow-md shadow-blue-900"
                                            dropdownAccentClass="bg-primary border-primary text-white shadow-md shadow-blue-900"
                                        />
                                    </div>
                                    <div className="shrink-0 flex flex-col gap-1">
                                        <span className="text-sm font-medium text-slate-700">Tingkat</span>
                                        <FilterSelect
                                            value={mapelFilterLevel}
                                            onChange={setMapelFilterLevel}
                                            options={[
                                                { value: '', label: 'Semua Tingkat' },
                                                ...uniqueTingkat.map(level => ({ value: level, label: `Tingkat ${level}` }))
                                            ]}
                                            placeholder="Semua Tingkat"
                                            icon="🏫"
                                            align="right"
                                            accentClass="bg-accent border-accent text-white shadow-md shadow-gold-900"
                                            dropdownAccentClass="bg-accent border-accent text-white shadow-md shadow-gold-900"
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-500 mb-2 italic flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                Geser tabel ke kanan/kiri untuk melihat detail selengkapnya
                            </p>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                    <thead className={TABLE_HEAD_CLASS}>
                                        <tr>
                                            <th className="px-5 py-4 font-semibold">No</th>
                                            <th className="px-5 py-4 font-semibold">Mata Pelajaran</th>
                                            <th className="px-5 py-4 font-semibold">Tingkat</th>
                                            <th className={TABLE_ACTION_HEAD_CLASS}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredMapel.map((item, index) => (
                                            <tr key={item.id_mapel} className={TABLE_BODY_ROW_CLASS}>
                                                <td className={TABLE_NUMBER_CELL_CLASS}>{index + 1}</td>
                                                <td className={TABLE_TITLE_CELL_CLASS}>{item.nama_lengkap || item.nama_mapel}</td>
                                                <td className={TABLE_CELL_CLASS}>Tingkat {item.tingkat}</td>
                                                <td className={TABLE_ACTION_CELL_CLASS}>
                                                    <div className={TABLE_ACTION_WRAP_CLASS}>
                                                        <button type="button" onClick={() => {
                                                            setMapelId(item.id_mapel);
                                                            setMapelForm({ nama_mapel: item.nama_mapel || '', tingkat: item.tingkat || '' });
                                                            setTimeout(() => {
                                                                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                            }, 50);
                                                        }} className={TABLE_ACTION_PRIMARY_CLASS}>Edit</button>
                                                        <button type="button" onClick={() => deleteMaster(`/api/admin/mata-pelajaran/${item.id_mapel}`, 'Mata pelajaran')} className={TABLE_ACTION_DANGER_CLASS}>Hapus</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!loading && filteredMapel.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-5 py-6 text-sm text-slate-500">Tidak ada mata pelajaran yang cocok dengan pencarian.</td>
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
