import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch } from '../lib/api';
import { adminNavigation } from './adminNavigation';
import useAdminWorkspace from '../hooks/useAdminWorkspace';
import * as XLSX from 'xlsx';

const TABLE_HEAD_CLASS = 'border-b border-border bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500';
const TABLE_BODY_ROW_CLASS = 'align-top hover:bg-slate-50/70';
const TABLE_TITLE_CELL_CLASS = 'px-5 py-4 font-semibold text-slate-900';
const TABLE_CELL_CLASS = 'px-5 py-4 text-slate-600';
const TABLE_NUMBER_CELL_CLASS = 'px-5 py-4 font-semibold text-slate-500';
const TABLE_ACTION_HEAD_CLASS = 'px-5 py-4 font-semibold xl:text-right';
const TABLE_ACTION_CELL_CLASS = 'px-5 py-4 xl:text-right';
const TABLE_ACTION_WRAP_CLASS = 'flex flex-wrap gap-2 xl:justify-end';
const TABLE_ACTION_PRIMARY_CLASS = 'rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100';

export default function AdminPenggunaPage({ session, onLogout, mode = 'pengguna' }) {
    const { reloadWorkspace } = useAdminWorkspace(session, { loadMasterData: false, loadSummary: false });
    
    const [users, setUsers] = useState({ data: [], current_page: 1, last_page: 1, total: 0, links: [] });
    const [summary, setSummary] = useState({ total: 0, active: 0 });
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const formRef = useRef(null);

    const [userFilters, setUserFilters] = useState({
        search: '',
        role: 'all',
        status: 'all',
        page: 1,
    });

    const [userTab, setUserTab] = useState('manual');
    const [userForm, setUserForm] = useState({
        role: 'guru',
        nama_lengkap: '',
        username: '',
        password: '',
        nip: '',
        nisn: '',
        is_aktif: true,
    });
    const [userId, setUserId] = useState(null);
    const [showUserPassword, setShowUserPassword] = useState(false);

    const [importForm, setImportForm] = useState({
        default_role: 'guru',
        file: null,
    });
    const [importResult, setImportResult] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 3600);
    };

    useEffect(() => () => {
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
    }, []);

    const buildUserQuery = (filters) => {
        const params = new URLSearchParams();
        if (filters.search.trim() !== '') params.set('search', filters.search.trim());
        if (filters.role !== 'all') params.set('role', filters.role);
        if (filters.status !== 'all') params.set('status', filters.status);
        if (filters.page > 1) params.set('page', filters.page);
        const query = params.toString();
        return query ? `?${query}` : '';
    };

    const loadUsers = async (filters = userFilters) => {
        setLoadingUsers(true);
        try {
            const payload = await apiFetch(`/api/admin/pengguna${buildUserQuery(filters)}`, session);
            setUsers(payload.users || { data: [], links: [] });
            setSummary(payload.summary || { total: 0, active: 0 });
        } catch (exception) {
            setError(exception.message || 'Gagal memuat data pengguna.');
            showToast(exception.message || 'Gagal memuat data pengguna.', 'error');
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        if (!session?.token) return;
        
        const timer = setTimeout(() => {
            loadUsers(userFilters);
        }, 500);

        return () => clearTimeout(timer);
    }, [session, userFilters.search, userFilters.role, userFilters.status, userFilters.page]);

    const resetUserForm = () => {
        setUserForm({
            role: 'guru',
            nama_lengkap: '',
            username: '',
            password: '',
            nip: '',
            nisn: '',
            is_aktif: true,
        });
        setUserId(null);
        setUserTab('manual');
    };

    const submitUser = async (event) => {
        event.preventDefault();
        const payload = { ...userForm };
        try {
            if (userId) {
                await apiFetch(`/api/admin/pengguna/${userId}`, session, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                showToast('Akun pengguna berhasil diperbarui.');
            } else {
                await apiFetch('/api/admin/pengguna', session, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                showToast('Akun pengguna berhasil ditambahkan.');
            }
            resetUserForm();
            await loadUsers();
        } catch (exception) {
            showToast(exception.message || 'Gagal menyimpan akun pengguna.', 'error');
        }
    };

    const resetUserFilters = () => {
        setUserFilters({ search: '', role: 'all', status: 'all', page: 1 });
    };

    const archiveUser = async (idPengguna, reason = '') => {
        try {
            await apiFetch(`/api/admin/pengguna/${idPengguna}/arsip`, session, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alasan: reason }),
            });
            showToast('Akun berhasil diarsipkan.');
            await loadUsers();
        } catch (exception) {
            showToast(exception.message || 'Gagal mengarsipkan akun.', 'error');
        }
    };

    const restoreUser = async (idPengguna) => {
        try {
            await apiFetch(`/api/admin/pengguna/${idPengguna}/aktifkan`, session, { method: 'PATCH' });
            showToast('Akun berhasil diaktifkan kembali.');
            await loadUsers();
        } catch (exception) {
            showToast(exception.message || 'Gagal mengaktifkan akun.', 'error');
        }
    };

    const deleteUser = async (idPengguna) => {
        if (!window.confirm('Hapus akun ini secara permanen? Data yang terkait juga akan dihapus dan tidak bisa dikembalikan.')) return;
        try {
            await apiFetch(`/api/admin/pengguna/${idPengguna}`, session, { method: 'DELETE' });
            showToast('Akun berhasil dihapus permanen.');
            await loadUsers();
        } catch (exception) {
            showToast(exception.message || 'Gagal menghapus akun.', 'error');
        }
    };

    const submitImport = async (event) => {
        event.preventDefault();
        setImportResult(null);

        if (!importForm.file) {
            showToast('Pilih file Excel terlebih dahulu.', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', importForm.file);
            formData.append('default_role', importForm.default_role);

            const payload = await apiFetch('/api/admin/pengguna/bulk-import', session, {
                method: 'POST',
                body: formData,
            });

            setImportResult(payload);
            setImportForm((current) => ({ ...current, file: null }));
            showToast(`${payload.message || 'Import akun selesai.'} Created: ${payload.created || 0}, Skipped: ${payload.skipped || 0}.`);
            await loadUsers();
        } catch (exception) {
            showToast(exception.message || 'Import akun gagal diproses.', 'error');
        }
    };

    const downloadTemplate = () => {
        const headers = ["nama_lengkap", "nip", "nisn", "role"];
        const exampleData = [
            {
                "nama_lengkap": "Budi Santoso",
                "nip": "198001012010011001",
                "nisn": "",
                "role": "guru"
            },
            {
                "nama_lengkap": "Andi Darmawan",
                "nip": "",
                "nisn": "0012345678",
                "role": "siswa"
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template Pengguna");

        const wscols = [
            {wch: 30}, {wch: 25}, {wch: 20}, {wch: 15}
        ];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, "Template_Import_Pengguna.xlsx");
    };

    const title = 'Akun Pengguna';

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
                                    Kelola akun guru, siswa, dan admin, termasuk arsip akun yang sudah tidak aktif.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 w-full xl:w-auto xl:flex xl:flex-wrap xl:gap-4">
                                <div className="flex flex-col items-start justify-center rounded-2xl sm:rounded-[1.5rem] bg-[#EEDCC8] p-4 sm:p-6 shadow-sm border border-white/20 transition-transform hover:-translate-y-1">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e2a3a]/10 text-[#1e2a3a] mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                        </svg>
                                    </div>
                                    <div className="text-3xl font-extrabold text-[#CA8A04]">{loadingUsers ? '...' : (summary.total - summary.active)}</div>
                                    <div className="text-sm font-semibold text-[#CA8A04] mt-1">Akun Diarsipkan</div>
                                </div>
                                <div className="flex flex-col items-start justify-center rounded-2xl sm:rounded-[1.5rem] bg-[#EEDCC8] p-4 sm:p-6 shadow-sm border border-white/20 transition-transform hover:-translate-y-1">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e2a3a]/10 text-[#1e2a3a] mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="text-3xl font-extrabold text-[#CA8A04]">{loadingUsers ? '...' : summary.active}</div>
                                    <div className="text-sm font-semibold text-[#CA8A04] mt-1">Akun Aktif</div>
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
                        <div ref={formRef} className="space-y-4 rounded-3xl bg-slate-50 p-5 scroll-mt-24">
                            <div className="flex gap-2 rounded-full bg-white p-1 text-sm font-medium text-slate-600">
                                <button type="button" onClick={() => setUserTab('manual')} className={`flex-1 rounded-full px-4 py-2 ${userTab === 'manual' ? 'bg-primary text-white' : ''}`}>Manual</button>
                                <button type="button" onClick={() => setUserTab('import')} className={`flex-1 rounded-full px-4 py-2 ${userTab === 'import' ? 'bg-primary text-white' : ''}`}>Import Excel</button>
                            </div>

                            <div className="rounded-3xl border border-border bg-white p-4">
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Workflow CRUD</p>
                                <h4 className="mt-2 text-lg font-semibold text-slate-900">Tambah, ubah, arsip, dan impor akun</h4>
                                <p className="mt-2 text-sm leading-6 text-slate-500">Gunakan form manual untuk satu akun, atau pindah ke impor Excel untuk data massal.</p>
                            </div>

                            {userTab === 'manual' ? (
                                <form onSubmit={submitUser} className="space-y-4">
                                    <div className="grid gap-4">
                                        <label className="space-y-2 text-sm font-medium text-slate-700">
                                            <span>Role</span>
                                            <select value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                                <option value="admin">Admin</option>
                                                <option value="guru">Guru</option>
                                                <option value="siswa">Siswa</option>
                                            </select>
                                        </label>
                                        <label className="space-y-2 text-sm font-medium text-slate-700">
                                            <span>Nama Lengkap</span>
                                            <input value={userForm.nama_lengkap} onChange={(event) => setUserForm((current) => ({ ...current, nama_lengkap: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Nama lengkap" />
                                        </label>
                                        {userForm.role === 'admin' ? (
                                            <label className="space-y-2 text-sm font-medium text-slate-700">
                                                <span>Username</span>
                                                <input value={userForm.username} onChange={(event) => setUserForm((current) => ({ ...current, username: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="operator01" />
                                            </label>
                                        ) : null}
                                        {userForm.role === 'guru' ? (
                                            <label className="space-y-2 text-sm font-medium text-slate-700">
                                                <span>NIP</span>
                                                <input value={userForm.nip} onChange={(event) => setUserForm((current) => ({ ...current, nip: event.target.value, username: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="198801012026010001" />
                                            </label>
                                        ) : null}
                                        {userForm.role === 'siswa' ? (
                                            <label className="space-y-2 text-sm font-medium text-slate-700">
                                                <span>NISN</span>
                                                <input value={userForm.nisn} onChange={(event) => setUserForm((current) => ({ ...current, nisn: event.target.value, username: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="1234567890" />
                                            </label>
                                        ) : null}
                                        <label className="space-y-2 text-sm font-medium text-slate-700">
                                            <span>Password</span>
                                            <div className="relative">
                                                <input value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900 pr-12" placeholder="Minimal 8 karakter" type={showUserPassword ? 'text' : 'password'} />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowUserPassword(!showUserPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                                >
                                                    {showUserPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/85">{userId ? 'Perbarui Akun' : 'Simpan Akun'}</button>
                                        {userId ? <button type="button" onClick={resetUserForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Batal Edit</button> : null}
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={submitImport} className="space-y-4">
                                    <label className="space-y-2 text-sm font-medium text-slate-700">
                                        <span>Default Role</span>
                                        <select value={importForm.default_role} onChange={(event) => setImportForm((current) => ({ ...current, default_role: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                            <option value="guru">Guru</option>
                                            <option value="siswa">Siswa</option>
                                        </select>
                                    </label>
                                    <label className="space-y-2 text-sm font-medium text-slate-700">
                                        <span>File Excel</span>
                                        <input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setImportForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
                                    </label>
                                    <div className="flex flex-wrap gap-3 pt-2">
                                        <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/85">Import Akun</button>
                                        <button type="button" onClick={downloadTemplate} className="rounded-full border border-primary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            Unduh Template
                                        </button>
                                    </div>
                                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                                        Password default impor: <span className="font-semibold text-slate-900">{importResult?.default_password || 'SIA@12345'}</span>
                                    </div>
                                </form>
                            )}

                            {importResult ? (
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl bg-white px-4 py-3"><p className="text-xs uppercase tracking-[0.24em] text-slate-500">Created</p><p className="mt-2 text-2xl font-semibold text-slate-900">{importResult.created || 0}</p></div>
                                    <div className="rounded-2xl bg-white px-4 py-3"><p className="text-xs uppercase tracking-[0.24em] text-slate-500">Skipped</p><p className="mt-2 text-2xl font-semibold text-slate-900">{importResult.skipped || 0}</p></div>
                                    <div className="rounded-2xl bg-white px-4 py-3"><p className="text-xs uppercase tracking-[0.24em] text-slate-500">Updated</p><p className="mt-2 text-2xl font-semibold text-slate-900">{importResult.updated || 0}</p></div>
                                </div>
                            ) : null}
                        </div>

                        <div className="overflow-hidden rounded-3xl border border-border bg-white">
                            <div className="border-b border-border px-5 py-4">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <h4 className="text-lg font-semibold text-slate-900">Daftar Akun</h4>
                                        <p className="text-sm text-slate-500">Akun yang diarsipkan tidak bisa login ke dashboard.</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Hasil filter</p>
                                        <p className="mt-1 font-semibold text-slate-900">{loadingUsers ? 'Memuat...' : `${users?.data?.length || 0} akun`}</p>
                                    </div>
                                </div>

                                <form onSubmit={(e) => e.preventDefault()} className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr_auto]">
                                    <label className="space-y-2 text-sm font-medium text-slate-700">
                                        <span>Cari pengguna</span>
                                        <input
                                            value={userFilters.search}
                                            onChange={(event) => setUserFilters((current) => ({ ...current, search: event.target.value, page: 1 }))}
                                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                            placeholder="Nama, username, NIP, atau NISN"
                                        />
                                    </label>
                                    <label className="space-y-2 text-sm font-medium text-slate-700">
                                        <span>Role</span>
                                        <select
                                            value={userFilters.role}
                                            onChange={(event) => setUserFilters((current) => ({ ...current, role: event.target.value, page: 1 }))}
                                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                        >
                                            <option value="all">Semua role</option>
                                            <option value="admin">Admin</option>
                                            <option value="guru">Guru</option>
                                            <option value="siswa">Siswa</option>
                                        </select>
                                    </label>
                                    <label className="space-y-2 text-sm font-medium text-slate-700">
                                        <span>Status</span>
                                        <select
                                            value={userFilters.status}
                                            onChange={(event) => setUserFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}
                                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                        >
                                            <option value="all">Semua status</option>
                                            <option value="active">Aktif</option>
                                            <option value="archived">Diarsipkan</option>
                                        </select>
                                    </label>
                                    <div className="flex items-end gap-2">
                                        <button type="button" onClick={resetUserFilters} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Reset</button>
                                    </div>
                                </form>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                    <thead className={TABLE_HEAD_CLASS}>
                                        <tr>
                                            <th className="px-5 py-4 font-semibold">No</th>
                                            <th className="px-5 py-4 font-semibold">Nama</th>
                                            <th className="px-5 py-4 font-semibold">Username</th>
                                            <th className="px-5 py-4 font-semibold">Role</th>
                                            <th className="px-5 py-4 font-semibold">Status</th>
                                            <th className={TABLE_ACTION_HEAD_CLASS}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {loadingUsers ? (
                                            <tr>
                                                <td colSpan="6" className="px-5 py-6 text-sm text-slate-500">Memuat daftar pengguna...</td>
                                            </tr>
                                        ) : null}
                                        {(users?.data || []).map((item, index) => {
                                            const profile = item.admin || item.guru || item.siswa;

                                            return (
                                                <tr key={item.id_pengguna} className={TABLE_BODY_ROW_CLASS}>
                                                        <td className={TABLE_NUMBER_CELL_CLASS}>{(users?.from || 1) + index}</td>
                                                        <td className={TABLE_TITLE_CELL_CLASS}>{profile?.nama_lengkap || item.username}</td>
                                                        <td className={TABLE_CELL_CLASS}>{item.username}</td>
                                                        <td className={TABLE_CELL_CLASS}><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{item.role}</span></td>
                                                        <td className={TABLE_CELL_CLASS}>
                                                        {item.is_aktif ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Aktif</span> : <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">Diarsipkan</span>}
                                                    </td>
                                                        <td className={TABLE_ACTION_CELL_CLASS}>
                                                            <div className={TABLE_ACTION_WRAP_CLASS}>
                                                            <button type="button" onClick={() => {
                                                                setUserId(item.id_pengguna);
                                                                setUserTab('manual');
                                                                setUserForm({
                                                                    role: item.role,
                                                                    nama_lengkap: profile?.nama_lengkap || '',
                                                                    username: item.username || '',
                                                                    password: '',
                                                                    nip: item.guru?.nip || '',
                                                                    nisn: item.siswa?.nisn || '',
                                                                    is_aktif: Boolean(item.is_aktif),
                                                                });
                                                                setTimeout(() => {
                                                                    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                }, 50);
                                                                }} className={TABLE_ACTION_PRIMARY_CLASS}>Edit</button>
                                                            {item.is_aktif ? (
                                                                    <button type="button" onClick={() => archiveUser(item.id_pengguna, 'Diarsipkan oleh admin.')} className="rounded-full border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50">Arsipkan</button>
                                                            ) : (
                                                                    <button type="button" onClick={() => restoreUser(item.id_pengguna)} className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50">Aktifkan</button>
                                                            )}
                                                            {item.id_pengguna !== session?.user?.id_pengguna ? (
                                                                <button type="button" onClick={() => deleteUser(item.id_pengguna)} className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50">Hapus</button>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {!loadingUsers && (users?.data || []).length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-5 py-6 text-center text-sm text-slate-500">Tidak ada pengguna yang ditemukan.</td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>

                                {/* Pagination Controls */}
                                {!loadingUsers && users?.last_page > 1 && (
                                    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
                                        <div className="flex flex-1 items-center justify-between">
                                            <div>
                                                <p className="text-sm text-slate-700">
                                                    Menampilkan <span className="font-medium">{users.from}</span> hingga <span className="font-medium">{users.to}</span> dari <span className="font-medium">{users.total}</span> hasil
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                                    {(users.links || []).map((link, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => {
                                                                if (link.url) {
                                                                    const url = new URL(link.url);
                                                                    const page = url.searchParams.get('page');
                                                                    const nextFilters = { ...userFilters, page: parseInt(page, 10) };
                                                                    setUserFilters(nextFilters);
                                                                    loadUsers(nextFilters);
                                                                }
                                                            }}
                                                            disabled={!link.url}
                                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                                                link.active 
                                                                    ? 'z-10 bg-primary text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                                                                    : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0'
                                                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''} ${
                                                                idx === 0 ? 'rounded-l-md' : idx === (users.links.length - 1) ? 'rounded-r-md' : ''
                                                            }`}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    ))}
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
