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

function toInputDate(value) {
    if (!value) return '';
    return String(value).split('T')[0];
}

export default function AdminPenempatanSiswaPage({ session, onLogout }) {
    const { masterData, loading, reloadWorkspace } = useAdminWorkspace(session, { loadMasterData: true, loadSummary: false });
    
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const formRef = useRef(null);

    const [classStudentForm, setClassStudentForm] = useState({
        id_kelas: '',
        id_siswa: '',
        tahun_ajaran: '',
        is_aktif: true,
        tanggal_masuk: '',
        tanggal_keluar: '',
    });
    const [classStudentId, setClassStudentId] = useState(null);
    
    const [classStudentFilters, setClassStudentFilters] = useState({
        search: '',
        status: 'all',
        tingkat: '',
        tahun_ajaran: '',
    });
    const [classStudentImport, setClassStudentImport] = useState({ file: null });
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 3600);
    };

    useEffect(() => () => {
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
    }, []);

    useEffect(() => {
        // Initialize form with defaults once masterData is loaded
        if (!loading && !classStudentId && classStudentForm.id_kelas === '' && classStudentForm.id_siswa === '') {
            setClassStudentForm(current => ({
                ...current,
                id_kelas: current.id_kelas || masterData.kelas?.[0]?.id_kelas || '',
                id_siswa: current.id_siswa || masterData.siswa_options?.[0]?.id_siswa || '',
                tahun_ajaran: current.tahun_ajaran || masterData.kelas?.[0]?.tahun_ajaran || masterData.tahun_ajaran?.[0]?.nama_tahun_ajaran || '',
            }));
        }
    }, [masterData, loading, classStudentId, classStudentForm.id_kelas, classStudentForm.id_siswa]);

    const uniqueTahunAjaran = useMemo(() => {
        const years = new Set();
        (masterData.kelas_siswa || []).forEach(item => {
            if (item.tahun_ajaran) years.add(item.tahun_ajaran);
        });
        return Array.from(years).sort().reverse();
    }, [masterData.kelas_siswa]);

    const filteredClassStudents = useMemo(() => {
        const search = classStudentFilters.search.trim().toLowerCase();
        return (masterData.kelas_siswa || []).filter((item) => {
            const matchesStatus = classStudentFilters.status === 'all'
                || (classStudentFilters.status === 'active' && item.is_aktif)
                || (classStudentFilters.status === 'inactive' && !item.is_aktif);

            if (!matchesStatus) return false;

            if (classStudentFilters.tingkat) {
                const nameUpper = (item.kelas?.nama_kelas || '').toUpperCase();
                if (nameUpper !== classStudentFilters.tingkat && !nameUpper.startsWith(classStudentFilters.tingkat + ' ')) {
                    return false;
                }
            }

            if (classStudentFilters.tahun_ajaran && item.tahun_ajaran !== classStudentFilters.tahun_ajaran) {
                return false;
            }

            if (search === '') return true;

            return [item.siswa?.nama_lengkap, item.siswa?.nisn, item.kelas?.nama_kelas, item.tahun_ajaran]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [classStudentFilters, masterData.kelas_siswa]);

    const totalItems = filteredClassStudents.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const paginatedClassStudents = filteredClassStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [classStudentFilters]);

    const resetClassStudentForm = () => {
        setClassStudentForm({
            id_kelas: masterData.kelas?.[0]?.id_kelas || '',
            id_siswa: masterData.siswa_options?.[0]?.id_siswa || '',
            tahun_ajaran: masterData.kelas?.[0]?.tahun_ajaran || masterData.tahun_ajaran?.[0]?.nama_tahun_ajaran || '',
            is_aktif: true,
            tanggal_masuk: '',
            tanggal_keluar: '',
        });
        setClassStudentId(null);
    };

    const submitClassStudent = async (event) => {
        event.preventDefault();
        const payload = {
            ...classStudentForm,
            id_kelas: Number(classStudentForm.id_kelas),
            id_siswa: Number(classStudentForm.id_siswa),
            is_aktif: Boolean(classStudentForm.is_aktif),
        };

        try {
            if (classStudentId) {
                await apiFetch(`/api/admin/kelas-siswa/${classStudentId}`, session, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                showToast('Penempatan siswa-kelas berhasil diperbarui.');
            } else {
                await apiFetch('/api/admin/kelas-siswa', session, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                showToast('Penempatan siswa-kelas berhasil ditambahkan.');
            }
            resetClassStudentForm();
            await reloadWorkspace();
        } catch (exception) {
            showToast(exception.message || 'Gagal menyimpan penempatan siswa.', 'error');
        }
    };

    const submitClassStudentImport = async (event) => {
        event.preventDefault();
        setImportResult(null);

        if (!classStudentImport.file) {
            showToast('Pilih file import relasi siswa-kelas terlebih dahulu.', 'error');
            return;
        }

        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', classStudentImport.file);

        try {
            const payload = await apiFetch('/api/admin/kelas-siswa/bulk-import', session, {
                method: 'POST',
                body: formData,
            });
            setImportResult(payload);
            showToast(`${payload.message || 'Import relasi siswa-kelas selesai.'}`);
            setClassStudentImport({ file: null });
            await reloadWorkspace();
        } catch (exception) {
            showToast(exception.message || 'Import relasi siswa-kelas gagal.', 'error');
        } finally {
            setIsImporting(false);
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

            if (!response.ok) {
                throw new Error('Gagal mengunduh template.');
            }

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

    const title = 'Penempatan Siswa';

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
                                    Kelola penempatan siswa ke dalam kelas yang tersedia pada tahun ajaran aktif.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 w-full xl:w-auto xl:flex xl:flex-wrap xl:gap-4">
                                <div className="flex flex-col items-start justify-center rounded-2xl sm:rounded-[1.5rem] bg-[#EEDCC8] p-4 sm:p-6 shadow-sm border border-white/20 transition-transform hover:-translate-y-1">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e2a3a]/10 text-[#1e2a3a] mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <div className="text-3xl font-extrabold text-[#CA8A04]">{loading ? '...' : (masterData.kelas_siswa || []).length}</div>
                                    <div className="text-sm font-semibold text-[#CA8A04] mt-1">Total Relasi</div>
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
                        <form ref={formRef} onSubmit={submitClassStudent} className="space-y-4 rounded-3xl bg-slate-50 p-5 scroll-mt-24">
                            <div className="grid gap-4">
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Kelas</span>
                                    <select 
                                        value={classStudentForm.id_kelas} 
                                        onChange={(event) => {
                                            const selectedId = event.target.value;
                                            const selectedKelas = (masterData.kelas || []).find(k => String(k.id_kelas) === String(selectedId));
                                            setClassStudentForm((current) => ({ 
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
                                    <span>Siswa</span>
                                    <select value={classStudentForm.id_siswa} onChange={(event) => setClassStudentForm((current) => ({ ...current, id_siswa: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                        <option value="">Pilih siswa</option>
                                        {(masterData.siswa_options || []).map((siswa) => <option key={siswa.id_siswa} value={siswa.id_siswa}>{siswa.nama_lengkap} {siswa.nisn ? `(${siswa.nisn})` : ''}</option>)}
                                    </select>
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Tahun Ajaran</span>
                                    <select value={classStudentForm.tahun_ajaran} onChange={(event) => setClassStudentForm((current) => ({ ...current, tahun_ajaran: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                        <option value="">Pilih tahun ajaran</option>
                                        {(masterData.tahun_ajaran || []).map((item) => <option key={item.id_tahun_ajaran} value={item.periode_label || item.nama_tahun_ajaran}>{item.periode_label || item.nama_tahun_ajaran}</option>)}
                                    </select>
                                </label>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="space-y-2 text-sm font-medium text-slate-700">
                                        <span>Tanggal Masuk</span>
                                        <input type="date" value={classStudentForm.tanggal_masuk} onChange={(event) => setClassStudentForm((current) => ({ ...current, tanggal_masuk: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
                                    </label>
                                    <label className="space-y-2 text-sm font-medium text-slate-700">
                                        <span>Tanggal Keluar</span>
                                        <input type="date" value={classStudentForm.tanggal_keluar} onChange={(event) => setClassStudentForm((current) => ({ ...current, tanggal_keluar: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
                                    </label>
                                </div>
                                <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                                    <input type="checkbox" checked={Boolean(classStudentForm.is_aktif)} onChange={(event) => setClassStudentForm((current) => ({ ...current, is_aktif: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-text-primary focus:ring-slate-900" />
                                    Status relasi aktif
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/85">{classStudentId ? 'Perbarui Relasi' : 'Simpan Relasi'}</button>
                                {classStudentId ? <button type="button" onClick={resetClassStudentForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Batal Edit</button> : null}
                            </div>
                        </form>

                        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-50/40 p-6 shadow-sm mb-6">
                            <div className="mb-4">
                                <h4 className="text-lg font-semibold text-emerald-900">Import Relasi Siswa-Kelas</h4>
                                <p className="text-sm text-emerald-700 mt-1">Gunakan template Excel atau CSV untuk menempatkan banyak siswa ke kelas sekaligus.</p>
                            </div>
                            <form onSubmit={submitClassStudentImport} className="flex flex-col gap-3 rounded-2xl bg-white p-4 border border-emerald-100 lg:flex-row lg:items-end shadow-sm">
                                <label className="flex-1 space-y-2 text-sm font-medium text-emerald-800">
                                    <span>Pilih File Import (.xlsx, .xls, .csv)</span>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(event) => setClassStudentImport({ file: event.target.files?.[0] || null })}
                                        className="w-full rounded-xl border border-dashed border-emerald-300 bg-emerald-50/30 px-4 py-3 text-sm text-slate-600 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-600"
                                    />
                                </label>
                                <button type="submit" disabled={isImporting} className="rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-600 shadow-sm whitespace-nowrap disabled:opacity-75 disabled:cursor-not-allowed flex items-center gap-2">
                                    {isImporting ? (
                                        <>
                                            <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Mengimpor...
                                        </>
                                    ) : (
                                        'Import Relasi'
                                    )}
                                </button>
                            </form>
                            
                            {importResult && (
                                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Ringkasan Import
                                    </h5>
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div className="rounded-lg bg-emerald-50 p-3 text-center border border-emerald-100">
                                            <div className="text-2xl font-bold text-emerald-700">{importResult.created}</div>
                                            <div className="text-xs font-medium text-emerald-600 mt-1 uppercase tracking-wide">Baru</div>
                                        </div>
                                        <div className="rounded-lg bg-blue-50 p-3 text-center border border-blue-100">
                                            <div className="text-2xl font-bold text-blue-700">{importResult.updated}</div>
                                            <div className="text-xs font-medium text-blue-600 mt-1 uppercase tracking-wide">Diperbarui</div>
                                        </div>
                                        <div className="rounded-lg bg-rose-50 p-3 text-center border border-rose-100">
                                            <div className="text-2xl font-bold text-rose-700">{importResult.skipped}</div>
                                            <div className="text-xs font-medium text-rose-600 mt-1 uppercase tracking-wide">Dilewati</div>
                                        </div>
                                    </div>
                                    {importResult.skipped_rows && importResult.skipped_rows.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm font-semibold text-rose-700 mb-2 flex items-center gap-1.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                Detail Data Dilewati (Baris Excel):
                                            </p>
                                            <div className="max-h-40 overflow-y-auto rounded-lg border border-rose-100 bg-rose-50/50 p-2">
                                                <ul className="space-y-1">
                                                    {importResult.skipped_rows.map((skip, idx) => (
                                                        <li key={idx} className="text-xs text-rose-600 flex items-start">
                                                            <span className="font-mono font-medium min-w-[60px] inline-block">Baris {skip.row}:</span>
                                                            <span className="flex-1">{skip.reason}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="mt-4 flex flex-wrap gap-3">
                                <button type="button" onClick={() => downloadImportTemplate('kelas-siswa', 'csv')} className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 hover:border-emerald-300 shadow-sm">
                                    Unduh Template CSV
                                </button>
                                <button type="button" onClick={() => downloadImportTemplate('kelas-siswa', 'xlsx')} className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 hover:border-emerald-300 shadow-sm">
                                    Unduh Template XLSX
                                </button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-border bg-white">
                            <div className="border-b border-border px-5 py-4">
                                <h4 className="text-lg font-semibold text-slate-900">Daftar Relasi Siswa-Kelas</h4>
                                <p className="text-sm text-slate-500">Satu siswa dapat memiliki banyak riwayat kelas, tetapi hanya satu yang aktif.</p>
                            </div>
                            <div className="border-b border-border px-5 py-4">
                                <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap xl:flex-nowrap">
                                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 shrink-0 w-full sm:w-auto">
                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Data</p>
                                        <p className="mt-1 font-semibold text-slate-900">{loading ? 'Memuat...' : `${filteredClassStudents.length} data`}</p>
                                    </div>
                                    <label className="flex-1 space-y-2 text-sm font-medium text-slate-700 w-full sm:w-auto min-w-[200px]">
                                        <span>Cari relasi</span>
                                        <input
                                            value={classStudentFilters.search}
                                            onChange={(event) => setClassStudentFilters((current) => ({ ...current, search: event.target.value }))}
                                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                            placeholder="Nama siswa, kelas, atau tahun ajaran"
                                        />
                                    </label>
                                    <div className="shrink-0 flex flex-col gap-1 w-full sm:w-auto">
                                        <span className="text-sm font-medium text-slate-700">Tingkat Kelas</span>
                                        <FilterSelect
                                            value={classStudentFilters.tingkat}
                                            onChange={(val) => setClassStudentFilters((current) => ({ ...current, tingkat: val }))}
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
                                            value={classStudentFilters.tahun_ajaran}
                                            onChange={(val) => setClassStudentFilters((current) => ({ ...current, tahun_ajaran: val }))}
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
                                            value={classStudentFilters.status}
                                            onChange={(val) => setClassStudentFilters((current) => ({ ...current, status: val }))}
                                            options={[
                                                { value: 'all', label: 'Semua status' },
                                                { value: 'active', label: 'Aktif' },
                                                { value: 'inactive', label: 'Riwayat' },
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
                            <p className="text-[11px] sm:text-xs text-slate-500 mb-2 italic flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                Geser tabel ke kanan/kiri untuk melihat detail selengkapnya
                            </p>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                    <thead className={TABLE_HEAD_CLASS}>
                                        <tr>
                                            <th className="px-5 py-4 font-semibold">No</th>
                                            <th className="px-5 py-4 font-semibold">Siswa</th>
                                            <th className="px-5 py-4 font-semibold">Kelas</th>
                                            <th className="px-5 py-4 font-semibold">Tahun Ajaran</th>
                                            <th className="px-5 py-4 font-semibold">Status</th>
                                            <th className="px-5 py-4 font-semibold">Periode</th>
                                            <th className={TABLE_ACTION_HEAD_CLASS}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {paginatedClassStudents.map((item, index) => (
                                            <tr key={item.id_kelas_siswa} className={TABLE_BODY_ROW_CLASS}>
                                                <td className={TABLE_NUMBER_CELL_CLASS}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                <td className={TABLE_TITLE_CELL_CLASS}>{item.siswa?.nama_lengkap || '-'}</td>
                                                <td className={TABLE_CELL_CLASS}>{item.kelas?.nama_kelas || '-'}</td>
                                                <td className={TABLE_CELL_CLASS}>{item.tahun_ajaran || '-'}</td>
                                                <td className="px-5 py-4">
                                                    {item.is_aktif ? <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Aktif</span> : <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Riwayat</span>}
                                                </td>
                                                <td className={TABLE_CELL_CLASS}>
                                                    <div>{toInputDate(item.tanggal_masuk) || '-'}</div>
                                                    <div>{toInputDate(item.tanggal_keluar) || '-'}</div>
                                                </td>
                                                <td className={TABLE_ACTION_CELL_CLASS}>
                                                    <div className={TABLE_ACTION_WRAP_CLASS}>
                                                        <button type="button" onClick={() => {
                                                            setClassStudentId(item.id_kelas_siswa);
                                                            setClassStudentForm({
                                                                id_kelas: item.id_kelas || '',
                                                                id_siswa: item.id_siswa || '',
                                                                tahun_ajaran: item.tahun_ajaran || '',
                                                                is_aktif: Boolean(item.is_aktif),
                                                                tanggal_masuk: toInputDate(item.tanggal_masuk),
                                                                tanggal_keluar: toInputDate(item.tanggal_keluar),
                                                            });
                                                            setTimeout(() => {
                                                                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                            }, 50);
                                                        }} className={TABLE_ACTION_PRIMARY_CLASS}>Edit</button>
                                                        <button type="button" onClick={() => deleteMaster(`/api/admin/kelas-siswa/${item.id_kelas_siswa}`, 'Relasi siswa-kelas')} className={TABLE_ACTION_DANGER_CLASS}>Hapus</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!loading && paginatedClassStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-5 py-6 text-sm text-slate-500 text-center">Tidak ada relasi siswa-kelas yang cocok dengan filter saat ini.</td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>

                                {/* Pagination Controls */}
                                {!loading && totalItems > itemsPerPage && (
                                    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
                                        <div className="flex flex-1 items-center justify-between">
                                            <div>
                                                <p className="text-sm text-slate-700">
                                                    Menampilkan <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> dari <span className="font-medium">{totalItems}</span> hasil
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                        disabled={currentPage === 1}
                                                        className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 ${currentPage === 1 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-900'}`}
                                                    >
                                                        &laquo; Previous
                                                    </button>
                                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                        let pageNum;
                                                        if (totalPages <= 5) pageNum = i + 1;
                                                        else if (currentPage <= 3) pageNum = i + 1;
                                                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                                        else pageNum = currentPage - 2 + i;
                                                        
                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => setCurrentPage(pageNum)}
                                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${currentPage === pageNum ? 'z-10 bg-[#1e2a3a] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e2a3a]' : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'}`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    })}
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                        disabled={currentPage === totalPages}
                                                        className={`relative inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 ${currentPage === totalPages ? 'text-slate-400 cursor-not-allowed' : 'text-slate-900'}`}
                                                    >
                                                        Next &raquo;
                                                    </button>
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </DashboardLayout>
    );
}
