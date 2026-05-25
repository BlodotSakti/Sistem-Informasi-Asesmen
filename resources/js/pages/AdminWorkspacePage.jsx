import { useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';

const MENU_META = {
    dashboard: {
        title: 'Dashboard Admin',
        lead: 'Ringkasan kondisi sistem dan aktivitas terbaru.',
    },
    pengguna: {
        title: 'Akun Pengguna',
        lead: 'Kelola akun guru, siswa, dan admin, termasuk arsip akun yang sudah tidak aktif.',
    },
    'tahun-ajaran': {
        title: 'Tahun Ajaran',
        lead: 'Kelola periode akademik per semester agar data sekolah lebih terstruktur.',
    },
    kelas: {
        title: 'Kelas',
        lead: 'Kelola daftar kelas dan guru wali yang digunakan dalam sesi asesmen.',
    },
    'mata-pelajaran': {
        title: 'Mata Pelajaran',
        lead: 'Susun daftar mapel inti dengan tingkat kelas X, XI, dan XII.',
    },
    'kelas-siswa': {
        title: 'Penempatan Siswa-Kelas',
        lead: 'Kelola relasi siswa dengan kelas aktif maupun riwayat kelas secara terstruktur.',
    },
    'penugasan-pembelajaran': {
        title: 'Penugasan Guru-Mapel',
        lead: 'Kelola penugasan guru mengampu mata pelajaran pada kelas tertentu.',
    },
    'import-akun': {
        title: 'Import Akun',
        lead: 'Import akun guru dan siswa dari Excel dengan username otomatis dari NIP/NISN.',
    },
};

function toInputDate(value) {
    if (!value) {
        return '';
    }

    return String(value).split('T')[0];
}

export default function AdminWorkspacePage({ session, onLogout, mode = 'dashboard' }) {
    const [summary, setSummary] = useState(null);
    const [masterData, setMasterData] = useState({
        tahun_ajaran: [],
        kelas: [],
        mata_pelajaran: [],
        kelas_siswa: [],
        penugasan_pembelajaran: [],
        guru_options: [],
        siswa_options: [],
    });
    const [users, setUsers] = useState({ data: [] });
    const [loading, setLoading] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const [userFilters, setUserFilters] = useState({
        search: '',
        role: 'all',
        status: 'all',
    });
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

    const [classForm, setClassForm] = useState({
        id_guru_wali: '',
        nama_kelas: '',
        tahun_ajaran: '',
    });
    const [classId, setClassId] = useState(null);

    const [mapelForm, setMapelForm] = useState({
        nama_mapel: '',
        tingkat: '',
    });
    const [mapelId, setMapelId] = useState(null);

    const [classStudentFilters, setClassStudentFilters] = useState({
        search: '',
        status: 'all',
    });
    const [classStudentImport, setClassStudentImport] = useState({ file: null });

    const [classStudentForm, setClassStudentForm] = useState({
        id_kelas: '',
        id_siswa: '',
        tahun_ajaran: '',
        is_aktif: true,
        tanggal_masuk: '',
        tanggal_keluar: '',
    });
    const [classStudentId, setClassStudentId] = useState(null);

    const [teachingAssignmentFilters, setTeachingAssignmentFilters] = useState({
        search: '',
        status: 'all',
    });
    const [teachingAssignmentImport, setTeachingAssignmentImport] = useState({ file: null });

    const [teachingAssignmentForm, setTeachingAssignmentForm] = useState({
        id_kelas: '',
        id_mapel: '',
        id_guru: '',
        tahun_ajaran: '',
        is_aktif: true,
    });
    const [teachingAssignmentId, setTeachingAssignmentId] = useState(null);

    const [userTab, setUserTab] = useState(mode === 'import-akun' ? 'import' : 'manual');
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

    const [importForm, setImportForm] = useState({
        default_role: 'guru',
        file: null,
    });
    const [importResult, setImportResult] = useState(null);

    const meta = MENU_META[mode] || MENU_META.dashboard;

    const filteredClassStudents = useMemo(() => {
        const search = classStudentFilters.search.trim().toLowerCase();

        return (masterData.kelas_siswa || []).filter((item) => {
            const matchesStatus = classStudentFilters.status === 'all'
                || (classStudentFilters.status === 'active' && item.is_aktif)
                || (classStudentFilters.status === 'inactive' && !item.is_aktif);

            if (!matchesStatus) {
                return false;
            }

            if (search === '') {
                return true;
            }

            return [item.siswa?.nama_lengkap, item.siswa?.nisn, item.kelas?.nama_kelas, item.tahun_ajaran]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [classStudentFilters, masterData.kelas_siswa]);

    const filteredTeachingAssignments = useMemo(() => {
        const search = teachingAssignmentFilters.search.trim().toLowerCase();

        return (masterData.penugasan_pembelajaran || []).filter((item) => {
            const matchesStatus = teachingAssignmentFilters.status === 'all'
                || (teachingAssignmentFilters.status === 'active' && item.is_aktif)
                || (teachingAssignmentFilters.status === 'inactive' && !item.is_aktif);

            if (!matchesStatus) {
                return false;
            }

            if (search === '') {
                return true;
            }

            return [item.kelas?.nama_kelas, item.mata_pelajaran?.nama_mapel, item.guru?.nama_lengkap, item.tahun_ajaran]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [masterData.penugasan_pembelajaran, teachingAssignmentFilters]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });

        if (toastTimer.current) {
            window.clearTimeout(toastTimer.current);
        }

        toastTimer.current = window.setTimeout(() => setToast(null), 3600);
    };

    useEffect(() => () => {
        if (toastTimer.current) {
            window.clearTimeout(toastTimer.current);
        }
    }, []);

    const navigation = useMemo(() => ([
        { label: 'Dashboard', href: '/admin/dashboard', badge: 'Home' },
        { label: 'Akun Pengguna', href: '/admin/pengguna', badge: 'CRUD' },
        { label: 'Tahun Ajaran', href: '/admin/tahun-ajaran', badge: 'Master' },
        { label: 'Kelas', href: '/admin/kelas', badge: 'CRUD' },
        { label: 'Mata Pelajaran', href: '/admin/mata-pelajaran', badge: 'CRUD' },
        { label: 'Siswa-Kelas', href: '/admin/kelas-siswa', badge: 'Relasi' },
        { label: 'Guru-Mapel', href: '/admin/penugasan-pembelajaran', badge: 'Relasi' },
        { label: 'Import Akun', href: '/admin/import-akun', badge: 'Excel' },
    ]), []);

    const buildUserQuery = (filters) => {
        const params = new URLSearchParams();

        if (filters.search.trim() !== '') {
            params.set('search', filters.search.trim());
        }

        if (filters.role !== 'all') {
            params.set('role', filters.role);
        }

        if (filters.status !== 'all') {
            params.set('status', filters.status);
        }

        const query = params.toString();

        return query ? `?${query}` : '';
    };

    const loadUsers = async (filters = userFilters) => {
        setLoadingUsers(true);

        try {
            const payload = await apiFetch(`/api/admin/pengguna${buildUserQuery(filters)}`, session);
            setUsers(payload || { data: [] });
        } catch (exception) {
            setError(exception.message || 'Gagal memuat data pengguna.');
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadWorkspace = async () => {
        setError('');

        if (mode === 'dashboard') {
            setLoading(true);
            try {
                const payload = await apiFetch('/api/admin/dashboard-summary', session);
                setSummary(payload);
            } catch (exception) {
                setError(exception.message || 'Gagal memuat ringkasan admin.');
            } finally {
                setLoading(false);
            }

            return;
        }

        setLoading(true);

        try {
            const masterPayload = await apiFetch('/api/admin/master-data', session);

            setMasterData(masterPayload);

            if (mode === 'pengguna') {
                await loadUsers();
            }

            setClassForm((current) => ({
                ...current,
                id_guru_wali: current.id_guru_wali || masterPayload.guru_options?.[0]?.id_guru || '',
                tahun_ajaran: current.tahun_ajaran || masterPayload.tahun_ajaran?.[0]?.periode_label || '',
            }));

            setClassStudentForm((current) => ({
                ...current,
                id_kelas: current.id_kelas || masterPayload.kelas?.[0]?.id_kelas || '',
                id_siswa: current.id_siswa || masterPayload.siswa_options?.[0]?.id_siswa || '',
                tahun_ajaran: current.tahun_ajaran || masterPayload.kelas?.[0]?.tahun_ajaran || masterPayload.tahun_ajaran?.[0]?.periode_label || '',
            }));

            setTeachingAssignmentForm((current) => ({
                ...current,
                id_kelas: current.id_kelas || masterPayload.kelas?.[0]?.id_kelas || '',
                id_mapel: current.id_mapel || masterPayload.mata_pelajaran?.[0]?.id_mapel || '',
                id_guru: current.id_guru || masterPayload.guru_options?.[0]?.id_guru || '',
                tahun_ajaran: current.tahun_ajaran || masterPayload.kelas?.[0]?.tahun_ajaran || masterPayload.tahun_ajaran?.[0]?.periode_label || '',
            }));
        } catch (exception) {
            setError(exception.message || 'Gagal memuat data admin.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.token) {
            loadWorkspace();
        }
    }, [session, mode]);

    const refreshWorkspace = async () => {
        await loadWorkspace();
    };

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

    const resetClassForm = () => {
        setClassForm({
            id_guru_wali: masterData.guru_options?.[0]?.id_guru || '',
            nama_kelas: '',
            tahun_ajaran: masterData.tahun_ajaran?.[0]?.periode_label || '',
        });
        setClassId(null);
    };

    const resetMapelForm = () => {
        setMapelForm({ nama_mapel: '', tingkat: '' });
        setMapelId(null);
    };

    const resetClassStudentForm = () => {
        setClassStudentForm({
            id_kelas: masterData.kelas?.[0]?.id_kelas || '',
            id_siswa: masterData.siswa_options?.[0]?.id_siswa || '',
            tahun_ajaran: masterData.kelas?.[0]?.tahun_ajaran || masterData.tahun_ajaran?.[0]?.periode_label || '',
            is_aktif: true,
            tanggal_masuk: '',
            tanggal_keluar: '',
        });
        setClassStudentId(null);
    };

    const resetTeachingAssignmentForm = () => {
        setTeachingAssignmentForm({
            id_kelas: masterData.kelas?.[0]?.id_kelas || '',
            id_mapel: masterData.mata_pelajaran?.[0]?.id_mapel || '',
            id_guru: masterData.guru_options?.[0]?.id_guru || '',
            tahun_ajaran: masterData.kelas?.[0]?.tahun_ajaran || masterData.tahun_ajaran?.[0]?.periode_label || '',
            is_aktif: true,
        });
        setTeachingAssignmentId(null);
    };

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
        setUserTab(mode === 'import-akun' ? 'import' : 'manual');
    };

    const submitYear = async (event) => {
        event.preventDefault();

        const payload = {
            ...yearForm,
            is_aktif: Boolean(yearForm.is_aktif),
        };

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
        await refreshWorkspace();
    };

    const submitClass = async (event) => {
        event.preventDefault();

        if (classId) {
            await apiFetch(`/api/admin/kelas/${classId}`, session, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(classForm),
            });
            showToast('Kelas berhasil diperbarui.');
        } else {
            await apiFetch('/api/admin/kelas', session, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(classForm),
            });
            showToast('Kelas berhasil ditambahkan.');
        }

        resetClassForm();
        await refreshWorkspace();
    };

    const submitMapel = async (event) => {
        event.preventDefault();

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
        await refreshWorkspace();
    };

    const submitClassStudent = async (event) => {
        event.preventDefault();

        const payload = {
            ...classStudentForm,
            id_kelas: Number(classStudentForm.id_kelas),
            id_siswa: Number(classStudentForm.id_siswa),
            is_aktif: Boolean(classStudentForm.is_aktif),
        };

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
        await refreshWorkspace();
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
        await refreshWorkspace();
    };

    const submitClassStudentImport = async (event) => {
        event.preventDefault();

        if (!classStudentImport.file) {
            showToast('Pilih file import relasi siswa-kelas terlebih dahulu.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', classStudentImport.file);

        const payload = await apiFetch('/api/admin/kelas-siswa/bulk-import', session, {
            method: 'POST',
            body: formData,
        });

        showToast(`${payload.message || 'Import relasi siswa-kelas selesai.'} Created: ${payload.created || 0}, Updated: ${payload.updated || 0}, Skipped: ${payload.skipped || 0}.`);
        setClassStudentImport({ file: null });
        await refreshWorkspace();
    };

    const submitTeachingAssignmentImport = async (event) => {
        event.preventDefault();

        if (!teachingAssignmentImport.file) {
            showToast('Pilih file import penugasan pembelajaran terlebih dahulu.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', teachingAssignmentImport.file);

        const payload = await apiFetch('/api/admin/penugasan-pembelajaran/bulk-import', session, {
            method: 'POST',
            body: formData,
        });

        showToast(`${payload.message || 'Import penugasan pembelajaran selesai.'} Created: ${payload.created || 0}, Updated: ${payload.updated || 0}, Skipped: ${payload.skipped || 0}.`);
        setTeachingAssignmentImport({ file: null });
        await refreshWorkspace();
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

    const submitUser = async (event) => {
        event.preventDefault();

        const payload = { ...userForm };

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
        await refreshWorkspace();
    };

    const applyUserFilters = async (event) => {
        event.preventDefault();
        await loadUsers(userFilters);
    };

    const resetUserFilters = async () => {
        const nextFilters = {
            search: '',
            role: 'all',
            status: 'all',
        };

        setUserFilters(nextFilters);
        await loadUsers(nextFilters);
    };

    const archiveUser = async (idPengguna, reason = '') => {
        await apiFetch(`/api/admin/pengguna/${idPengguna}/arsip`, session, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alasan: reason }),
        });

        showToast('Akun berhasil diarsipkan.');
        await refreshWorkspace();
    };

    const restoreUser = async (idPengguna) => {
        await apiFetch(`/api/admin/pengguna/${idPengguna}/aktifkan`, session, {
            method: 'PATCH',
        });

        showToast('Akun berhasil diaktifkan kembali.');
        await refreshWorkspace();
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
            await refreshWorkspace();
        } catch (exception) {
            showToast(exception.message || 'Import akun gagal diproses.', 'error');
        }
    };

    const deleteMaster = async (path, label) => {
        if (!window.confirm(`Hapus ${label} ini?`)) {
            return;
        }

        await apiFetch(path, session, { method: 'DELETE' });
        showToast(`${label} berhasil dihapus.`);
        await refreshWorkspace();
    };

    const pageTitle = meta.title;
    const pageLead = meta.lead;

    const renderDashboard = () => (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-900 px-6 py-8 text-white shadow-2xl shadow-slate-950/20 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                    <div>
                        <p className="text-xs uppercase tracking-[0.45em] text-amber-200/80">Dashboard Admin</p>
                        <h3 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-white md:text-4xl">
                            Ringkasan kondisi sistem dan aktivitas terbaru.
                        </h3>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
                            Dashboard hanya menampilkan rangkuman. Untuk CRUD data, gunakan menu sidebar sesuai kebutuhan.
                        </p>
                    </div>

                    <div className="grid gap-3 rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                        <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                            <span className="text-sm text-slate-200">Ringkasan master data</span>
                            <span className="text-xs uppercase tracking-[0.28em] text-amber-200">Live</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm text-slate-100">
                            <div className="rounded-2xl bg-slate-950/40 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Tahun Ajaran</p>
                                <p className="mt-2 text-2xl font-semibold">{loading ? '...' : summary?.cards?.total_tahun_ajaran ?? 0}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-950/40 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Kelas</p>
                                <p className="mt-2 text-2xl font-semibold">{loading ? '...' : summary?.cards?.total_kelas ?? 0}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-950/40 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Mapel</p>
                                <p className="mt-2 text-2xl font-semibold">{loading ? '...' : summary?.cards?.total_mapel ?? 0}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-950/40 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Akun Baru</p>
                                <p className="mt-2 text-2xl font-semibold">{loading ? '...' : (summary?.recent_activities?.length ?? 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <StatCard label="Total Guru" value={loading ? '...' : summary?.cards?.total_guru ?? 0} description="Guru aktif dalam sistem" tone="blue" />
                <StatCard label="Total Siswa" value={loading ? '...' : summary?.cards?.total_siswa ?? 0} description="Data siswa terdaftar" tone="amber" />
                <StatCard label="Total Kelas" value={loading ? '...' : summary?.cards?.total_kelas ?? 0} description="Kelas berjalan semester ini" tone="slate" />
                <StatCard label="Tahun Ajaran" value={loading ? '...' : summary?.cards?.total_tahun_ajaran ?? 0} description="Riwayat periode akademik" tone="amber" />
                <StatCard label="Relasi Siswa-Kelas" value={loading ? '...' : summary?.cards?.total_kelas_siswa ?? 0} description="Penempatan aktif dan riwayat" tone="rose" />
                <StatCard label="Penugasan Mapel" value={loading ? '...' : summary?.cards?.total_penugasan_pembelajaran ?? 0} description="Guru mengampu kelas dan mapel" tone="blue" />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Distribusi Aktivitas</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Statistik penggunaan sistem</h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">7 hari terakhir</span>
                    </div>

                    <div className="mt-8 flex h-80 items-end gap-4 rounded-2xl bg-slate-50 p-4">
                        {(summary?.chart?.values || [12, 18, 14, 22, 16, 20, 24]).map((height, index) => (
                            <div key={index} className="flex flex-1 flex-col items-center gap-3">
                                <div className="w-full max-w-[42px] rounded-t-2xl bg-slate-900/80 shadow-[0_14px_40px_rgba(15,23,42,0.25)]" style={{ height: `${Math.max(10, Number(height)) * 3}%` }} />
                                <span className="text-xs text-slate-500">{summary?.chart?.labels?.[index] || `H${index + 1}`}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Riwayat Aktivitas</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Perubahan terbaru</h3>
                    <div className="mt-6 space-y-3">
                        {(summary?.recent_activities || []).map((item) => (
                            <div key={`${item.tanggal}-${item.deskripsi}`} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                                <span className="mr-2 text-slate-500">[{item.tanggal}]</span>
                                {item.deskripsi}
                            </div>
                        ))}
                        {!loading && (summary?.recent_activities || []).length === 0 ? (
                            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                                Belum ada aktivitas terbaru.
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>
        </div>
    );

    const renderYearPage = () => (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
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
                        <input type="checkbox" checked={Boolean(yearForm.is_aktif)} onChange={(event) => setYearForm((current) => ({ ...current, is_aktif: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-900" />
                        Jadikan periode aktif
                    </label>
                    <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                        <span>Keterangan</span>
                        <textarea value={yearForm.keterangan} onChange={(event) => setYearForm((current) => ({ ...current, keterangan: event.target.value }))} rows="3" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Contoh: Periode aktif semester ganjil" />
                    </label>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">{yearId ? 'Perbarui Tahun Ajaran' : 'Simpan Tahun Ajaran'}</button>
                    {yearId ? <button type="button" onClick={resetYearForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Batal Edit</button> : null}
                </div>
            </form>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h4 className="text-lg font-semibold text-slate-900">Daftar Tahun Ajaran</h4>
                    <p className="text-sm text-slate-500">Gunakan satu data aktif untuk membantu filter kelas dan laporan.</p>
                </div>
                <div className="divide-y divide-slate-100">
                    {(masterData.tahun_ajaran || []).map((item) => (
                        <div key={item.id_tahun_ajaran} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-slate-900">{item.nama_tahun_ajaran}</p>
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Semester {String(item.semester || 'ganjil').toUpperCase()}</span>
                                    {item.is_aktif ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Aktif</span> : null}
                                </div>
                                <p className="mt-1 text-sm text-slate-500">{toInputDate(item.tanggal_mulai)} sampai {toInputDate(item.tanggal_selesai)}</p>
                                {item.keterangan ? <p className="mt-1 text-sm text-slate-600">{item.keterangan}</p> : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
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
                                }} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Edit</button>
                                <button type="button" onClick={() => deleteMaster(`/api/admin/tahun-ajaran/${item.id_tahun_ajaran}`, 'Tahun ajaran')} className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50">Hapus</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderClassPage = () => (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
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
                        <select value={classForm.tahun_ajaran} onChange={(event) => setClassForm((current) => ({ ...current, tahun_ajaran: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                            <option value="">Pilih tahun ajaran</option>
                            {(masterData.tahun_ajaran || []).map((item) => <option key={item.id_tahun_ajaran} value={item.periode_label || item.nama_tahun_ajaran}>{item.periode_label || item.nama_tahun_ajaran}</option>)}
                        </select>
                    </label>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">{classId ? 'Perbarui Kelas' : 'Simpan Kelas'}</button>
                    {classId ? <button type="button" onClick={resetClassForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Batal Edit</button> : null}
                </div>
            </form>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h4 className="text-lg font-semibold text-slate-900">Daftar Kelas</h4>
                    <p className="text-sm text-slate-500">Gunakan daftar ini untuk melihat relasi guru wali dan periode kelas.</p>
                </div>
                <div className="divide-y divide-slate-100">
                    {(masterData.kelas || []).map((item) => (
                        <div key={item.id_kelas} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="font-semibold text-slate-900">{item.nama_kelas}</p>
                                <p className="mt-1 text-sm text-slate-500">{item.guru_wali?.nama_lengkap || 'Belum ditentukan'} • {item.tahun_ajaran}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => {
                                    setClassId(item.id_kelas);
                                    setClassForm({ id_guru_wali: item.id_guru_wali || '', nama_kelas: item.nama_kelas || '', tahun_ajaran: item.tahun_ajaran || '' });
                                }} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Edit</button>
                                <button type="button" onClick={() => deleteMaster(`/api/admin/kelas/${item.id_kelas}`, 'Kelas')} className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50">Hapus</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderMapelPage = () => (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={submitMapel} className="space-y-4 rounded-3xl bg-slate-50 p-5">
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
                    <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">{mapelId ? 'Perbarui Mapel' : 'Simpan Mapel'}</button>
                    {mapelId ? <button type="button" onClick={resetMapelForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Batal Edit</button> : null}
                </div>
            </form>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h4 className="text-lg font-semibold text-slate-900">Daftar Mata Pelajaran</h4>
                    <p className="text-sm text-slate-500">Data mapel dipakai untuk bank soal dan jadwal sesi asesmen.</p>
                </div>
                <div className="divide-y divide-slate-100">
                    {(masterData.mata_pelajaran || []).map((item) => (
                        <div key={item.id_mapel} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="font-semibold text-slate-900">{item.nama_mapel}</p>
                                <p className="mt-1 text-sm text-slate-500">Tingkat {item.tingkat}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => {
                                    setMapelId(item.id_mapel);
                                    setMapelForm({ nama_mapel: item.nama_mapel || '', tingkat: item.tingkat || '' });
                                }} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Edit</button>
                                <button type="button" onClick={() => deleteMaster(`/api/admin/mata-pelajaran/${item.id_mapel}`, 'Mata pelajaran')} className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50">Hapus</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderClassStudentPage = () => (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form onSubmit={submitClassStudent} className="space-y-4 rounded-3xl bg-slate-50 p-5">
                <div className="grid gap-4">
                    <label className="space-y-2 text-sm font-medium text-slate-700">
                        <span>Kelas</span>
                        <select value={classStudentForm.id_kelas} onChange={(event) => setClassStudentForm((current) => ({ ...current, id_kelas: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
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
                        <input value={classStudentForm.tahun_ajaran} onChange={(event) => setClassStudentForm((current) => ({ ...current, tahun_ajaran: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="2025/2026 - Semester Ganjil" />
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
                        <input type="checkbox" checked={Boolean(classStudentForm.is_aktif)} onChange={(event) => setClassStudentForm((current) => ({ ...current, is_aktif: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-900" />
                        Status relasi aktif
                    </label>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">{classStudentId ? 'Perbarui Relasi' : 'Simpan Relasi'}</button>
                    {classStudentId ? <button type="button" onClick={resetClassStudentForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Batal Edit</button> : null}
                </div>
            </form>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h4 className="text-lg font-semibold text-slate-900">Daftar Relasi Siswa-Kelas</h4>
                    <p className="text-sm text-slate-500">Satu siswa dapat memiliki banyak riwayat kelas, tetapi hanya satu yang aktif.</p>
                </div>
                <div className="border-b border-slate-200 px-5 py-4">
                    <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr]">
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Cari relasi</span>
                            <input
                                value={classStudentFilters.search}
                                onChange={(event) => setClassStudentFilters((current) => ({ ...current, search: event.target.value }))}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                placeholder="Nama siswa, kelas, atau tahun ajaran"
                            />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Status</span>
                            <select
                                value={classStudentFilters.status}
                                onChange={(event) => setClassStudentFilters((current) => ({ ...current, status: event.target.value }))}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                            >
                                <option value="all">Semua status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Riwayat</option>
                            </select>
                        </label>
                    </div>

                    <form onSubmit={submitClassStudentImport} className="mt-4 flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 lg:flex-row lg:items-end">
                        <label className="flex-1 space-y-2 text-sm font-medium text-slate-700">
                            <span>Bulk Import Relasi Siswa-Kelas</span>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(event) => setClassStudentImport({ file: event.target.files?.[0] || null })}
                                className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                            />
                        </label>
                        <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                            Import Relasi
                        </button>
                    </form>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => downloadImportTemplate('kelas-siswa', 'csv')} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                            Unduh Template CSV
                        </button>
                        <button type="button" onClick={() => downloadImportTemplate('kelas-siswa', 'xlsx')} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                            Unduh Template XLSX
                        </button>
                    </div>
                </div>
                <div className="divide-y divide-slate-100">
                    {filteredClassStudents.map((item) => (
                        <div key={item.id_kelas_siswa} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-slate-900">{item.siswa?.nama_lengkap || '-'}</p>
                                    {item.is_aktif ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Aktif</span> : <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Riwayat</span>}
                                </div>
                                <p className="mt-1 text-sm text-slate-500">{item.kelas?.nama_kelas || '-'} • {item.tahun_ajaran || '-'}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
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
                                }} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Edit</button>
                                <button type="button" onClick={() => deleteMaster(`/api/admin/kelas-siswa/${item.id_kelas_siswa}`, 'Relasi siswa-kelas')} className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50">Hapus</button>
                            </div>
                        </div>
                    ))}
                    {!loading && filteredClassStudents.length === 0 ? (
                        <div className="px-5 py-6 text-sm text-slate-500">Tidak ada relasi siswa-kelas yang cocok dengan filter saat ini.</div>
                    ) : null}
                </div>
            </div>
        </div>
    );

    const renderTeachingAssignmentPage = () => (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form onSubmit={submitTeachingAssignment} className="space-y-4 rounded-3xl bg-slate-50 p-5">
                <div className="grid gap-4">
                    <label className="space-y-2 text-sm font-medium text-slate-700">
                        <span>Kelas</span>
                        <select value={teachingAssignmentForm.id_kelas} onChange={(event) => setTeachingAssignmentForm((current) => ({ ...current, id_kelas: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                            <option value="">Pilih kelas</option>
                            {(masterData.kelas || []).map((kelas) => <option key={kelas.id_kelas} value={kelas.id_kelas}>{kelas.nama_kelas} • {kelas.tahun_ajaran}</option>)}
                        </select>
                    </label>
                    <label className="space-y-2 text-sm font-medium text-slate-700">
                        <span>Mata Pelajaran</span>
                        <select value={teachingAssignmentForm.id_mapel} onChange={(event) => setTeachingAssignmentForm((current) => ({ ...current, id_mapel: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                            <option value="">Pilih mata pelajaran</option>
                            {(masterData.mata_pelajaran || []).map((mapel) => <option key={mapel.id_mapel} value={mapel.id_mapel}>{mapel.nama_mapel} • Tingkat {mapel.tingkat}</option>)}
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
                        <input value={teachingAssignmentForm.tahun_ajaran} onChange={(event) => setTeachingAssignmentForm((current) => ({ ...current, tahun_ajaran: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="2025/2026 - Semester Ganjil" />
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                        <input type="checkbox" checked={Boolean(teachingAssignmentForm.is_aktif)} onChange={(event) => setTeachingAssignmentForm((current) => ({ ...current, is_aktif: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-900" />
                        Status penugasan aktif
                    </label>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">{teachingAssignmentId ? 'Perbarui Penugasan' : 'Simpan Penugasan'}</button>
                    {teachingAssignmentId ? <button type="button" onClick={resetTeachingAssignmentForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Batal Edit</button> : null}
                </div>
            </form>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h4 className="text-lg font-semibold text-slate-900">Daftar Penugasan Guru-Mapel</h4>
                    <p className="text-sm text-slate-500">Penugasan ini menjadi dasar validasi guru saat membuat bank soal dan sesi asesmen.</p>
                </div>
                <div className="border-b border-slate-200 px-5 py-4">
                    <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr]">
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Cari penugasan</span>
                            <input
                                value={teachingAssignmentFilters.search}
                                onChange={(event) => setTeachingAssignmentFilters((current) => ({ ...current, search: event.target.value }))}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                placeholder="Nama mapel, kelas, guru, atau tahun ajaran"
                            />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Status</span>
                            <select
                                value={teachingAssignmentFilters.status}
                                onChange={(event) => setTeachingAssignmentFilters((current) => ({ ...current, status: event.target.value }))}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                            >
                                <option value="all">Semua status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Nonaktif</option>
                            </select>
                        </label>
                    </div>

                    <form onSubmit={submitTeachingAssignmentImport} className="mt-4 flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 lg:flex-row lg:items-end">
                        <label className="flex-1 space-y-2 text-sm font-medium text-slate-700">
                            <span>Bulk Import Penugasan Pembelajaran</span>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(event) => setTeachingAssignmentImport({ file: event.target.files?.[0] || null })}
                                className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                            />
                        </label>
                        <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                            Import Penugasan
                        </button>
                    </form>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => downloadImportTemplate('penugasan-pembelajaran', 'csv')} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                            Unduh Template CSV
                        </button>
                        <button type="button" onClick={() => downloadImportTemplate('penugasan-pembelajaran', 'xlsx')} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                            Unduh Template XLSX
                        </button>
                    </div>
                </div>
                <div className="divide-y divide-slate-100">
                    {filteredTeachingAssignments.map((item) => (
                        <div key={item.id_penugasan_pembelajaran} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-slate-900">{item.mata_pelajaran?.nama_mapel || '-'}</p>
                                    {item.is_aktif ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Aktif</span> : <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Nonaktif</span>}
                                </div>
                                <p className="mt-1 text-sm text-slate-500">{item.kelas?.nama_kelas || '-'} • {item.guru?.nama_lengkap || '-'} • {item.tahun_ajaran || '-'}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => {
                                    setTeachingAssignmentId(item.id_penugasan_pembelajaran);
                                    setTeachingAssignmentForm({
                                        id_kelas: item.id_kelas || '',
                                        id_mapel: item.id_mapel || '',
                                        id_guru: item.id_guru || '',
                                        tahun_ajaran: item.tahun_ajaran || '',
                                        is_aktif: Boolean(item.is_aktif),
                                    });
                                }} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Edit</button>
                                <button type="button" onClick={() => deleteMaster(`/api/admin/penugasan-pembelajaran/${item.id_penugasan_pembelajaran}`, 'Penugasan pembelajaran')} className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50">Hapus</button>
                            </div>
                        </div>
                    ))}
                    {!loading && filteredTeachingAssignments.length === 0 ? (
                        <div className="px-5 py-6 text-sm text-slate-500">Tidak ada penugasan pembelajaran yang cocok dengan filter saat ini.</div>
                    ) : null}
                </div>
            </div>
        </div>
    );

    const renderUserPage = () => (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4 rounded-3xl bg-slate-50 p-5">
                <div className="flex gap-2 rounded-full bg-white p-1 text-sm font-medium text-slate-600">
                    <button type="button" onClick={() => setUserTab('manual')} className={`flex-1 rounded-full px-4 py-2 ${userTab === 'manual' ? 'bg-slate-950 text-white' : ''}`}>Manual</button>
                    <button type="button" onClick={() => setUserTab('import')} className={`flex-1 rounded-full px-4 py-2 ${userTab === 'import' ? 'bg-slate-950 text-white' : ''}`}>Import Excel</button>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
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
                                <input value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Minimal 8 karakter" type="password" />
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">{userId ? 'Perbarui Akun' : 'Simpan Akun'}</button>
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
                            <input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setImportForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
                        </label>
                        <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Import Akun</button>
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

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
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

                    <form onSubmit={applyUserFilters} className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr_auto]">
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Cari pengguna</span>
                            <input
                                value={userFilters.search}
                                onChange={(event) => setUserFilters((current) => ({ ...current, search: event.target.value }))}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                placeholder="Nama, username, NIP, atau NISN"
                            />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Role</span>
                            <select
                                value={userFilters.role}
                                onChange={(event) => setUserFilters((current) => ({ ...current, role: event.target.value }))}
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
                                onChange={(event) => setUserFilters((current) => ({ ...current, status: event.target.value }))}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                            >
                                <option value="all">Semua status</option>
                                <option value="active">Aktif</option>
                                <option value="archived">Diarsipkan</option>
                            </select>
                        </label>
                        <div className="flex items-end gap-2">
                            <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Cari</button>
                            <button type="button" onClick={resetUserFilters} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Reset</button>
                        </div>
                    </form>
                </div>

                <div className="divide-y divide-slate-100">
                    {loadingUsers ? (
                        <div className="px-5 py-6 text-sm text-slate-500">Memuat daftar pengguna...</div>
                    ) : null}
                    {(users?.data || []).map((item) => {
                        const profile = item.admin || item.guru || item.siswa;

                        return (
                            <div key={item.id_pengguna} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold text-slate-900">{profile?.nama_lengkap || item.username}</p>
                                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{item.role}</span>
                                        {item.is_aktif ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Aktif</span> : <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">Diarsipkan</span>}
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">Username: {item.username}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
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
                                    }} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Edit</button>
                                    {item.is_aktif ? (
                                        <button type="button" onClick={() => archiveUser(item.id_pengguna, 'Diarsipkan oleh admin.')} className="rounded-full border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50">Arsipkan</button>
                                    ) : (
                                        <button type="button" onClick={() => restoreUser(item.id_pengguna)} className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50">Aktifkan</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {!loadingUsers && (users?.data || []).length === 0 ? (
                        <div className="px-5 py-6 text-sm text-slate-500">Tidak ada pengguna yang cocok dengan filter saat ini.</div>
                    ) : null}
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        if (mode === 'dashboard') {
            return renderDashboard();
        }

        if (mode === 'tahun-ajaran') {
            return renderYearPage();
        }

        if (mode === 'kelas') {
            return renderClassPage();
        }

        if (mode === 'mata-pelajaran') {
            return renderMapelPage();
        }

        if (mode === 'kelas-siswa') {
            return renderClassStudentPage();
        }

        if (mode === 'penugasan-pembelajaran') {
            return renderTeachingAssignmentPage();
        }

        return renderUserPage();
    };

    return (
        <DashboardLayout title={pageTitle} user={session?.user} navigation={navigation} onLogout={onLogout}>
            <div className="space-y-8">
                <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-900 px-6 py-8 text-white shadow-2xl shadow-slate-950/20 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                        <div>
                            <p className="text-xs uppercase tracking-[0.45em] text-amber-200/80">{pageTitle}</p>
                            <h3 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-white md:text-4xl">{pageLead}</h3>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">Sidebar sekarang membuka halaman sesuai menu. Dashboard hanya menampilkan rangkuman, sedangkan menu lain menampilkan modul yang spesifik.</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Mode halaman</p>
                            <p className="mt-3 text-2xl font-semibold text-white">{pageTitle}</p>
                            <p className="mt-2 text-sm text-slate-200">Gunakan menu sidebar untuk berpindah halaman.</p>
                        </div>
                    </div>
                </section>

                {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div> : null}
                {toast ? <div className={`fixed right-6 top-6 z-50 max-w-md rounded-3xl border px-5 py-4 text-sm shadow-2xl ${toast.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}><p className="text-xs font-semibold uppercase tracking-[0.28em] opacity-80">{toast.type === 'error' ? 'Gagal' : 'Berhasil'}</p><p className="mt-2 leading-6">{toast.message}</p></div> : null}

                {renderContent()}
            </div>
        </DashboardLayout>
    );
}