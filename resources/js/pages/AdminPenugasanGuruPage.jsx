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

export default function AdminPenugasanGuruPage({ session, onLogout }) {
    const { masterData, loading, reloadWorkspace } = useAdminWorkspace(session, { loadMasterData: true, loadSummary: false });
    
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const formRef = useRef(null);

    const [teachingAssignmentForm, setTeachingAssignmentForm] = useState({
        id_kelas: '',
        id_mapel: '',
        id_guru: '',
        tahun_ajaran: '',
        is_aktif: true,
    });
    const [teachingAssignmentId, setTeachingAssignmentId] = useState(null);
    
    const [teachingAssignmentFilters, setTeachingAssignmentFilters] = useState({
        search: '',
        status: 'all',
        tingkat: '',
        tahun_ajaran: '',
    });
    const [teachingAssignmentImport, setTeachingAssignmentImport] = useState({ file: null });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 3600);
    };

    useEffect(() => () => {
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
    }, []);

    useEffect(() => {
        if (!loading && !teachingAssignmentId && teachingAssignmentForm.id_kelas === '' && teachingAssignmentForm.id_mapel === '' && teachingAssignmentForm.id_guru === '') {
            setTeachingAssignmentForm(current => ({
                ...current,
                id_kelas: current.id_kelas || masterData.kelas?.[0]?.id_kelas || '',
                id_mapel: current.id_mapel || masterData.mata_pelajaran?.[0]?.id_mapel || '',
                id_guru: current.id_guru || masterData.guru_options?.[0]?.id_guru || '',
                tahun_ajaran: current.tahun_ajaran || masterData.tahun_ajaran?.[0]?.periode_label || masterData.kelas?.[0]?.tahun_ajaran || '',
            }));
        }
    }, [masterData, loading, teachingAssignmentId, teachingAssignmentForm.id_kelas, teachingAssignmentForm.id_mapel, teachingAssignmentForm.id_guru]);

    const uniqueTahunAjaran = useMemo(() => {
        const years = new Set();
        (masterData.penugasan_pembelajaran || []).forEach(item => {
            if (item.tahun_ajaran) years.add(item.tahun_ajaran);
        });
        return Array.from(years).sort().reverse();
    }, [masterData.penugasan_pembelajaran]);

    const filteredTeachingAssignments = useMemo(() => {
        const search = teachingAssignmentFilters.search.trim().toLowerCase();
        return (masterData.penugasan_pembelajaran || []).filter((item) => {
            const matchesStatus = teachingAssignmentFilters.status === 'all'
                || (teachingAssignmentFilters.status === 'active' && item.is_aktif)
                || (teachingAssignmentFilters.status === 'inactive' && !item.is_aktif);

            if (!matchesStatus) return false;

            if (teachingAssignmentFilters.tingkat) {
                const nameUpper = (item.kelas?.nama_kelas || '').toUpperCase();
                if (nameUpper !== teachingAssignmentFilters.tingkat && !nameUpper.startsWith(teachingAssignmentFilters.tingkat + ' ')) {
                    return false;
                }
            }

            if (teachingAssignmentFilters.tahun_ajaran && item.tahun_ajaran !== teachingAssignmentFilters.tahun_ajaran) {
                return false;
            }

            if (search === '') return true;

            return [
                item.mata_pelajaran?.nama_lengkap, item.mata_pelajaran?.nama_mapel,
                item.kelas?.nama_kelas, item.guru?.nama_lengkap, item.tahun_ajaran
            ].filter(Boolean).some((value) => String(value).toLowerCase().includes(search));
        });
    }, [teachingAssignmentFilters, masterData.penugasan_pembelajaran]);

    const resetTeachingAssignmentForm = () => {
        setTeachingAssignmentForm({
            id_kelas: masterData.kelas?.[0]?.id_kelas || '',
            id_mapel: masterData.mata_pelajaran?.[0]?.id_mapel || '',
            id_guru: masterData.guru_options?.[0]?.id_guru || '',
            tahun_ajaran: masterData.tahun_ajaran?.[0]?.periode_label || masterData.kelas?.[0]?.tahun_ajaran || '',
            is_aktif: true,
        });
        setTeachingAssignmentId(null);
    };

    const submitTeachingAssignment = async (event) => {
        event.preventDefault();
        const payload = {
            ...teachingAssignmentForm,
            id_kelas: Number(teachingAssignmentForm.id_kelas),
            id_mapel: Number(teachingAssignmentForm.id_mapel),
            id_guru: Number(teachingAssignmentForm.id_guru),
            is_aktif: Boolean(teachingAssignmentForm.is_aktif),
        };

        try {
            if (teachingAssignmentId) {
                await apiFetch(`/api/admin/penugasan-pembelajaran/${teachingAssignmentId}`, session, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                showToast('Penugasan pembelajaran berhasil diperbarui.');
            } else {
                await apiFetch('/api/admin/penugasan-pembelajaran', session, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                showToast('Penugasan pembelajaran berhasil ditambahkan.');
            }
            resetTeachingAssignmentForm();
            await reloadWorkspace();
        } catch (exception) {
            showToast(exception.message || 'Gagal menyimpan penugasan pembelajaran.', 'error');
        }
    };

    const submitTeachingAssignmentImport = async (event) => {
        event.preventDefault();
        if (!teachingAssignmentImport.file) {
            showToast('Pilih file import penugasan terlebih dahulu.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', teachingAssignmentImport.file);

        try {
            const payload = await apiFetch('/api/admin/penugasan-pembelajaran/bulk-import', session, {
                method: 'POST',
                body: formData,
            });
            showToast(`${payload.message || 'Import penugasan selesai.'} Created: ${payload.created || 0}, Updated: ${payload.updated || 0}, Skipped: ${payload.skipped || 0}.`);
            setTeachingAssignmentImport({ file: null });
            await reloadWorkspace();
        } catch (exception) {
            showToast(exception.message || 'Import penugasan gagal.', 'error');
        }
    };

    const downloadImportTemplate = async (type, format) => {
        try {
            const response = await fetch(`${window.location.origin}/api/admin/import-templates/${type}/${format}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/octet-stream',
                    Authorization: `Bearer ${session?.token}`,
                    'X-CSRF-TOKEN': window.__APP_CSRF__,
                },
            });

            if (!response.ok) throw new Error('Gagal mengunduh template.');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${type === 'kelas-siswa' ? 'template-relasi-siswa-kelas' : 'template-penugasan-pembelajaran'}.${format}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showToast('Template berhasil diunduh.');
        } catch (exception) {
            showToast(exception.message || 'Gagal mengunduh template.', 'error');
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

    const title = 'Penugasan Guru';

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
                                    Kelola penugasan guru mengampu mata pelajaran pada kelas tertentu.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 w-full xl:w-auto xl:flex xl:flex-wrap xl:gap-4">
                                <div className="flex flex-col items-start justify-center rounded-2xl sm:rounded-[1.5rem] bg-[#EEDCC8] p-4 sm:p-6 shadow-sm border border-white/20 transition-transform hover:-translate-y-1">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e2a3a]/10 text-[#1e2a3a] mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <div className="text-3xl font-extrabold text-[#CA8A04]">{loading ? '...' : (masterData.penugasan_pembelajaran || []).length}</div>
                                    <div className="text-sm font-semibold text-[#CA8A04] mt-1">Total Penugasan</div>
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
                        <form ref={formRef} onSubmit={submitTeachingAssignment} className="space-y-4 rounded-3xl bg-slate-50 p-5 scroll-mt-24">
                            <div className="grid gap-4">
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Kelas</span>
                                    <select 
                                        value={teachingAssignmentForm.id_kelas} 
                                        onChange={(event) => {
                                            const selectedId = event.target.value;
                                            const selectedKelas = (masterData.kelas || []).find(k => String(k.id_kelas) === String(selectedId));
                                            setTeachingAssignmentForm((current) => ({ 
                                                ...current, 
                                                id_kelas: selectedId,
                                                tahun_ajaran: selectedKelas ? selectedKelas.tahun_ajaran : current.tahun_ajaran 
                                            }));
                                        }} 
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                    >
                                        <option value="">Pilih kelas</option>
                                        {(masterData.kelas || []).map((kelas) => <option key={kelas.id_kelas} value={kelas.id_kelas}>{kelas.nama_kelas} • {kelas.tahun_ajaran}</option>)}
                                    </select>
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Mata Pelajaran</span>
                                    <select value={teachingAssignmentForm.id_mapel} onChange={(event) => setTeachingAssignmentForm((current) => ({ ...current, id_mapel: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                        <option value="">Pilih mata pelajaran</option>
                                        {(masterData.mata_pelajaran || []).map((mapel) => <option key={mapel.id_mapel} value={mapel.id_mapel}>{mapel.nama_lengkap || mapel.nama_mapel}</option>)}
                                    </select>
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Guru Pengampu</span>
                                    <select value={teachingAssignmentForm.id_guru} onChange={(event) => setTeachingAssignmentForm((current) => ({ ...current, id_guru: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                        <option value="">Pilih guru</option>
                                        {(masterData.guru_options || []).map((guru) => <option key={guru.id_guru} value={guru.id_guru}>{guru.nama_lengkap} {guru.nip ? `(${guru.nip})` : ''}</option>)}
                                    </select>
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Tahun Ajaran</span>
                                    <select value={teachingAssignmentForm.tahun_ajaran} onChange={(event) => setTeachingAssignmentForm((current) => ({ ...current, tahun_ajaran: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                        <option value="">Pilih tahun ajaran</option>
                                        {(masterData.tahun_ajaran || []).map((item) => <option key={item.id_tahun_ajaran} value={item.periode_label || item.nama_tahun_ajaran}>{item.periode_label || item.nama_tahun_ajaran}</option>)}
                                    </select>
                                </label>
                                <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                                    <input type="checkbox" checked={Boolean(teachingAssignmentForm.is_aktif)} onChange={(event) => setTeachingAssignmentForm((current) => ({ ...current, is_aktif: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-text-primary focus:ring-slate-900" />
                                    Status penugasan aktif
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/85">{teachingAssignmentId ? 'Perbarui Penugasan' : 'Simpan Penugasan'}</button>
                                {teachingAssignmentId ? <button type="button" onClick={resetTeachingAssignmentForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Batal Edit</button> : null}
                            </div>
                        </form>

                        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-50/40 p-6 shadow-sm mb-6">
                            <div className="mb-4">
                                <h4 className="text-lg font-semibold text-emerald-900">Import Penugasan Pembelajaran</h4>
                                <p className="text-sm text-emerald-700 mt-1">Gunakan template Excel atau CSV untuk menempatkan banyak penugasan ke kelas sekaligus.</p>
                            </div>
                            <form onSubmit={submitTeachingAssignmentImport} className="flex flex-col gap-3 rounded-2xl bg-white p-4 border border-emerald-100 lg:flex-row lg:items-end shadow-sm">
                                <label className="flex-1 space-y-2 text-sm font-medium text-emerald-800">
                                    <span>Pilih File Import (.xlsx, .xls, .csv)</span>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(event) => setTeachingAssignmentImport({ file: event.target.files?.[0] || null })}
                                        className="w-full rounded-xl border border-dashed border-emerald-300 bg-emerald-50/30 px-4 py-3 text-sm text-slate-600 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-600"
                                    />
                                </label>
                                <button type="submit" className="rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-600 shadow-sm whitespace-nowrap">
                                    Import Penugasan
                                </button>
                            </form>
                            <div className="mt-4 flex flex-wrap gap-3">
                                <button type="button" onClick={() => downloadImportTemplate('penugasan-pembelajaran', 'csv')} className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 hover:border-emerald-300 shadow-sm">
                                    Unduh Template CSV
                                </button>
                                <button type="button" onClick={() => downloadImportTemplate('penugasan-pembelajaran', 'xlsx')} className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 hover:border-emerald-300 shadow-sm">
                                    Unduh Template XLSX
                                </button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-border bg-white">
                            <div className="border-b border-border px-5 py-4">
                                <h4 className="text-lg font-semibold text-slate-900">Daftar Penugasan Guru-Mapel</h4>
                                <p className="text-sm text-slate-500">Penugasan ini menjadi dasar validasi guru saat membuat bank soal dan sesi asesmen.</p>
                            </div>
                            <div className="border-b border-border px-5 py-4">
                                <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap xl:flex-nowrap">
                                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 shrink-0 w-full sm:w-auto">
                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Data</p>
                                        <p className="mt-1 font-semibold text-slate-900">{loading ? 'Memuat...' : `${filteredTeachingAssignments.length} data`}</p>
                                    </div>
                                    <label className="flex-1 space-y-2 text-sm font-medium text-slate-700 w-full sm:w-auto min-w-[200px]">
                                        <span>Cari penugasan</span>
                                        <input
                                            value={teachingAssignmentFilters.search}
                                            onChange={(event) => setTeachingAssignmentFilters((current) => ({ ...current, search: event.target.value }))}
                                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                            placeholder="Nama mapel, kelas, guru, atau tahun ajaran"
                                        />
                                    </label>
                                    <div className="shrink-0 flex flex-col gap-1 w-full sm:w-auto">
                                        <span className="text-sm font-medium text-slate-700">Tingkat Kelas</span>
                                        <FilterSelect
                                            value={teachingAssignmentFilters.tingkat}
                                            onChange={(val) => setTeachingAssignmentFilters((current) => ({ ...current, tingkat: val }))}
                                            options={[
                                                { value: '', label: 'Semua Tingkat' },
                                                { value: 'X', label: 'Kelas X' },
                                                { value: 'XI', label: 'Kelas XI' },
                                                { value: 'XII', label: 'Kelas XII' },
                                            ]}
                                            placeholder="Semua Tingkat"
                                            icon="🏫"
                                            align="right"
                                            accentClass="bg-primary border-primary text-white shadow-md shadow-blue-900"
                                            dropdownAccentClass="bg-primary border-primary text-white shadow-md shadow-blue-900"
                                        />
                                    </div>
                                    <div className="shrink-0 flex flex-col gap-1 w-full sm:w-auto">
                                        <span className="text-sm font-medium text-slate-700">Tahun Ajaran</span>
                                        <FilterSelect
                                            value={teachingAssignmentFilters.tahun_ajaran}
                                            onChange={(val) => setTeachingAssignmentFilters((current) => ({ ...current, tahun_ajaran: val }))}
                                            options={[
                                                { value: '', label: 'Semua Tahun' },
                                                ...uniqueTahunAjaran.map(year => ({ value: year, label: year }))
                                            ]}
                                            placeholder="Semua Tahun"
                                            icon="📅"
                                            align="right"
                                            accentClass="bg-secondary border-secondary text-white shadow-md shadow-red-900"
                                            dropdownAccentClass="bg-secondary border-secondary text-white shadow-md shadow-red-900"
                                        />
                                    </div>
                                    <div className="shrink-0 flex flex-col gap-1 w-full sm:w-auto">
                                        <span className="text-sm font-medium text-slate-700">Status</span>
                                        <FilterSelect
                                            value={teachingAssignmentFilters.status}
                                            onChange={(val) => setTeachingAssignmentFilters((current) => ({ ...current, status: val }))}
                                            options={[
                                                { value: 'all', label: 'Semua status' },
                                                { value: 'active', label: 'Aktif' },
                                                { value: 'inactive', label: 'Nonaktif' },
                                            ]}
                                            placeholder="Semua status"
                                            icon="📋"
                                            align="right"
                                            accentClass="bg-accent border-accent text-white shadow-md shadow-gold-900"
                                            dropdownAccentClass="bg-accent border-accent text-white shadow-md shadow-gold-900"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                    <thead className={TABLE_HEAD_CLASS}>
                                        <tr>
                                            <th className="px-5 py-4 font-semibold">No</th>
                                            <th className="px-5 py-4 font-semibold">Mapel</th>
                                            <th className="px-5 py-4 font-semibold">Kelas</th>
                                            <th className="px-5 py-4 font-semibold">Guru</th>
                                            <th className="px-5 py-4 font-semibold">Tahun Ajaran</th>
                                            <th className="px-5 py-4 font-semibold">Status</th>
                                            <th className={TABLE_ACTION_HEAD_CLASS}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredTeachingAssignments.map((item, index) => (
                                            <tr key={item.id_penugasan_pembelajaran} className={TABLE_BODY_ROW_CLASS}>
                                                <td className={TABLE_NUMBER_CELL_CLASS}>{index + 1}</td>
                                                <td className={TABLE_TITLE_CELL_CLASS}>{item.mata_pelajaran?.nama_lengkap || item.mata_pelajaran?.nama_mapel || '-'}</td>
                                                <td className={TABLE_CELL_CLASS}>{item.kelas?.nama_kelas || '-'}</td>
                                                <td className={TABLE_CELL_CLASS}>{item.guru?.nama_lengkap || '-'}</td>
                                                <td className={TABLE_CELL_CLASS}>{item.tahun_ajaran || '-'}</td>
                                                <td className="px-5 py-4">
                                                    {item.is_aktif ? <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Aktif</span> : <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Nonaktif</span>}
                                                </td>
                                                <td className={TABLE_ACTION_CELL_CLASS}>
                                                    <div className={TABLE_ACTION_WRAP_CLASS}>
                                                        <button type="button" onClick={() => {
                                                            setTeachingAssignmentId(item.id_penugasan_pembelajaran);
                                                            setTeachingAssignmentForm({
                                                                id_kelas: item.id_kelas || '',
                                                                id_mapel: item.id_mapel || '',
                                                                id_guru: item.id_guru || '',
                                                                tahun_ajaran: item.tahun_ajaran || '',
                                                                is_aktif: Boolean(item.is_aktif),
                                                            });
                                                            setTimeout(() => {
                                                                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                            }, 50);
                                                        }} className={TABLE_ACTION_PRIMARY_CLASS}>Edit</button>
                                                        <button type="button" onClick={() => deleteMaster(`/api/admin/penugasan-pembelajaran/${item.id_penugasan_pembelajaran}`, 'Penugasan pembelajaran')} className={TABLE_ACTION_DANGER_CLASS}>Hapus</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!loading && filteredTeachingAssignments.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-5 py-6 text-sm text-slate-500">Tidak ada penugasan pembelajaran yang cocok dengan filter saat ini.</td>
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
