import { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';

export default function AdminDashboard({ session, onLogout, activePage = 'dashboard' }) {
    const [summary, setSummary] = useState(null);
    const [masterData, setMasterData] = useState({ tahun_ajaran: [], kelas: [], mata_pelajaran: [], guru_options: [] });
    const [loading, setLoading] = useState(true);
    const [loadingMaster, setLoadingMaster] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    const pageTitleMap = {
        dashboard: 'Dashboard Admin',
        'tahun-ajaran': 'Tahun Ajaran',
        kelas: 'Kelas',
        'mata-pelajaran': 'Mata Pelajaran',
        'import-akun': 'Import Akun',
    };

    const pageLeadMap = {
        dashboard: 'Ringkasan kondisi sistem dan aktivitas terbaru.',
        'tahun-ajaran': 'Kelola periode akademik per semester agar filter kelas dan laporan lebih rapi.',
        kelas: 'Kelola wali kelas dan periode aktif yang dipakai pada sesi asesmen.',
        'mata-pelajaran': 'Susun daftar mapel inti dengan tingkat kelas yang terstandar.',
        'import-akun': 'Impor akun guru dan siswa dari Excel dengan username otomatis dari NIP/NISN.',
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });

        if (toastTimer.current) {
            window.clearTimeout(toastTimer.current);
        }

        toastTimer.current = window.setTimeout(() => {
            setToast(null);
        }, 3600);
    };

    useEffect(() => () => {
        if (toastTimer.current) {
            window.clearTimeout(toastTimer.current);
        }
    }, []);

    const [tahunAjaranForm, setTahunAjaranForm] = useState({
        nama_tahun_ajaran: '',
        semester: 'ganjil',
        tanggal_mulai: '',
        tanggal_selesai: '',
        is_aktif: true,
        keterangan: '',
    });
    const [tahunAjaranId, setTahunAjaranId] = useState(null);

    const [kelasForm, setKelasForm] = useState({
        id_guru_wali: '',
        nama_kelas: '',
        tahun_ajaran: '',
    });
    const [kelasId, setKelasId] = useState(null);

    const [mapelForm, setMapelForm] = useState({
        nama_mapel: '',
        tingkat: '',
    });
    const [mapelId, setMapelId] = useState(null);

    const [importForm, setImportForm] = useState({
        default_role: 'guru',
        file: null,
    });
    const [importResult, setImportResult] = useState(null);

    const loadSummary = async () => {
        const payload = await apiFetch('/api/admin/dashboard-summary', session);
        setSummary(payload);
    };

    const loadMasterData = async () => {
        const payload = await apiFetch('/api/admin/master-data', session);
        setMasterData(payload);
        setKelasForm((current) => ({
            ...current,
            tahun_ajaran: current.tahun_ajaran || payload.tahun_ajaran?.[0]?.periode_label || '',
        }));
    };

    const refreshData = async () => {
        setError('');
        setLoading(true);
        setLoadingMaster(true);

        try {
            await Promise.all([loadSummary(), loadMasterData()]);
        } catch (exception) {
            setError(exception.message || 'Gagal memuat data admin.');
        } finally {
            setLoading(false);
            setLoadingMaster(false);
        }
    };

    useEffect(() => {
        let mounted = true;

        if (session?.token) {
            refreshData().finally(() => {
                if (!mounted) {
                    return;
                }
            });
        }

        return () => {
            mounted = false;
        };
    }, [session]);

    const resetTahunAjaranForm = () => {
        setTahunAjaranForm({
            nama_tahun_ajaran: '',
            semester: 'ganjil',
            tanggal_mulai: '',
            tanggal_selesai: '',
            is_aktif: true,
            keterangan: '',
        });
        setTahunAjaranId(null);
    };

    const resetKelasForm = () => {
        setKelasForm({
            id_guru_wali: masterData.guru_options?.[0]?.id_guru || '',
            nama_kelas: '',
            tahun_ajaran: masterData.tahun_ajaran?.[0]?.periode_label || '',
        });
        setKelasId(null);
    };

    const resetMapelForm = () => {
        setMapelForm({ nama_mapel: '', tingkat: '' });
        setMapelId(null);
    };

    const submitTahunAjaran = async (event) => {
        event.preventDefault();

        const payload = {
            ...tahunAjaranForm,
            is_aktif: Boolean(tahunAjaranForm.is_aktif),
        };

        if (tahunAjaranId) {
            await apiFetch(`/api/admin/tahun-ajaran/${tahunAjaranId}`, session, {
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

        resetTahunAjaranForm();
        await refreshData();
    };

    const submitKelas = async (event) => {
        event.preventDefault();

        if (kelasId) {
            await apiFetch(`/api/admin/kelas/${kelasId}`, session, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kelasForm),
            });
            showToast('Kelas berhasil diperbarui.');
        } else {
            await apiFetch('/api/admin/kelas', session, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kelasForm),
            });
            showToast('Kelas berhasil ditambahkan.');
        }

        resetKelasForm();
        await refreshData();
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
        await refreshData();
    };

    const deleteRecord = async (path, label) => {
        if (!window.confirm(`Hapus ${label} ini?`)) {
            return;
        }

        await apiFetch(path, session, { method: 'DELETE' });
        showToast(`${label} berhasil dihapus.`);
        await refreshData();
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
            showToast(`${payload.message || 'Import akun selesai diproses.'} Created: ${payload.created || 0}, Updated: ${payload.updated || 0}, Skipped: ${payload.skipped || 0}.`, 'success');
            await refreshData();
        } catch (exception) {
            showToast(exception.message || 'Import akun gagal diproses.', 'error');
        }
    };

    const navigation = [
        { label: 'Dashboard', href: '/admin/dashboard', badge: 'Home' },
        { label: 'Tahun Ajaran', href: '/admin/tahun-ajaran', badge: 'Master' },
        { label: 'Manajemen Kelas', href: '/admin/kelas', badge: 'CRUD' },
        { label: 'Mata Pelajaran', href: '/admin/mata-pelajaran', badge: 'CRUD' },
        { label: 'Import Akun', href: '/admin/import-akun', badge: 'Excel' },
    ];

    const pageTitle = pageTitleMap[activePage] || 'Dashboard Admin';
    const pageLead = pageLeadMap[activePage] || pageLeadMap.dashboard;

    return (
        <DashboardLayout
            title={pageTitle}
            user={session?.user}
            navigation={navigation}
            onLogout={onLogout}
        >
            <div className="space-y-8">
                <section id="overview" className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-900 px-6 py-8 text-white shadow-2xl shadow-slate-950/20 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                        <div>
                            <p className="text-xs uppercase tracking-[0.45em] text-amber-200/80">{pageTitle}</p>
                            <h3 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-white md:text-4xl">
                                {pageLead}
                            </h3>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
                                Panel operator sekolah dirancang agar alur kerja terasa jelas: pilih menu di sidebar, isi data master, lalu kelola akun dan sesi dari halaman yang sesuai.
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

                {error ? (
                    <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                        {error}
                    </div>
                ) : null}

                {toast ? (
                    <div className={`fixed right-6 top-6 z-50 max-w-md rounded-3xl border px-5 py-4 text-sm shadow-2xl ${toast.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] opacity-80">{toast.type === 'error' ? 'Gagal' : 'Berhasil'}</p>
                        <p className="mt-2 leading-6">{toast.message}</p>
                    </div>
                ) : null}

                <section className="grid gap-4 md:grid-cols-4">
                    <StatCard
                        label="Total Guru"
                        value={loading ? '...' : summary?.cards?.total_guru ?? 0}
                        description="Guru aktif dalam sistem"
                        tone="blue"
                    />
                    <StatCard
                        label="Total Siswa"
                        value={loading ? '...' : summary?.cards?.total_siswa ?? 0}
                        description="Data siswa terdaftar"
                        tone="amber"
                    />
                    <StatCard
                        label="Total Kelas"
                        value={loading ? '...' : summary?.cards?.total_kelas ?? 0}
                        description="Kelas berjalan semester ini"
                        tone="slate"
                    />
                    <StatCard
                        label="Tahun Ajaran"
                        value={loading ? '...' : summary?.cards?.total_tahun_ajaran ?? 0}
                        description="Riwayat periode akademik"
                        tone="amber"
                    />
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
                                    <div
                                        className="w-full max-w-[42px] rounded-t-2xl bg-slate-900/80 shadow-[0_14px_40px_rgba(15,23,42,0.25)]"
                                        style={{ height: `${Math.max(10, Number(height)) * 3}%` }}
                                    />
                                    <span className="text-xs text-slate-500">{summary?.chart?.labels?.[index] || `H${index + 1}`}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Detail Sekolah</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Ringkasan kondisi data sekolah</h3>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Mata Pelajaran</p>
                                <p className="mt-2 text-2xl font-semibold text-slate-900">{loading ? '...' : summary?.cards?.total_mapel ?? 0}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Aktivitas Hari Ini</p>
                                <p className="mt-2 text-2xl font-semibold text-slate-900">{loading ? '...' : (summary?.recent_activities?.length ?? 0)}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 sm:col-span-2">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Aksi cepat operator</p>
                                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                    <li>• Tambahkan data kelas dan wali kelas baru sebelum tahun ajaran dimulai.</li>
                                    <li>• Pastikan mapel terdaftar agar sesi CBT tidak kosong.</li>
                                    <li>• Gunakan import akun untuk menghemat input manual.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="tahun-ajaran" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Tahun Ajaran</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Master periode akademik</h3>
                        </div>
                        <span className="text-sm text-slate-500">Aktifkan satu periode utama</span>
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                        <form onSubmit={submitTahunAjaran} className="space-y-4 rounded-3xl bg-slate-50 p-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                                    <span>Nama Tahun Ajaran</span>
                                    <input
                                        value={tahunAjaranForm.nama_tahun_ajaran}
                                        onChange={(event) => setTahunAjaranForm((current) => ({ ...current, nama_tahun_ajaran: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                        placeholder="2025/2026"
                                    />
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                                    <span>Semester</span>
                                    <select
                                        value={tahunAjaranForm.semester}
                                        onChange={(event) => setTahunAjaranForm((current) => ({ ...current, semester: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                    >
                                        <option value="ganjil">Ganjil</option>
                                        <option value="genap">Genap</option>
                                    </select>
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Tanggal Mulai</span>
                                    <input
                                        type="date"
                                        value={tahunAjaranForm.tanggal_mulai}
                                        onChange={(event) => setTahunAjaranForm((current) => ({ ...current, tanggal_mulai: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                    />
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Tanggal Selesai</span>
                                    <input
                                        type="date"
                                        value={tahunAjaranForm.tanggal_selesai}
                                        onChange={(event) => setTahunAjaranForm((current) => ({ ...current, tanggal_selesai: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                    />
                                </label>
                                <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 md:col-span-2">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(tahunAjaranForm.is_aktif)}
                                        onChange={(event) => setTahunAjaranForm((current) => ({ ...current, is_aktif: event.target.checked }))}
                                        className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-900"
                                    />
                                    Jadikan periode aktif
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                                    <span>Keterangan</span>
                                    <textarea
                                        value={tahunAjaranForm.keterangan}
                                        onChange={(event) => setTahunAjaranForm((current) => ({ ...current, keterangan: event.target.value }))}
                                        rows="3"
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                        placeholder="Contoh: Periode aktif semester ganjil"
                                    />
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                                    {tahunAjaranId ? 'Perbarui Tahun Ajaran' : 'Simpan Tahun Ajaran'}
                                </button>
                                {tahunAjaranId ? (
                                    <button type="button" onClick={resetTahunAjaranForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                                        Batal Edit
                                    </button>
                                ) : null}
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
                                                {item.is_aktif ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Aktif</span> : null}
                                                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                                    Semester {String(item.semester || 'ganjil').toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {item.tanggal_mulai || '-'} sampai {item.tanggal_selesai || '-'}
                                            </p>
                                            {item.keterangan ? <p className="mt-1 text-sm text-slate-600">{item.keterangan}</p> : null}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTahunAjaranId(item.id_tahun_ajaran);
                                                    setTahunAjaranForm({
                                                        nama_tahun_ajaran: item.nama_tahun_ajaran || '',
                                                        semester: item.semester || 'ganjil',
                                                        tanggal_mulai: item.tanggal_mulai || '',
                                                        tanggal_selesai: item.tanggal_selesai || '',
                                                        is_aktif: Boolean(item.is_aktif),
                                                        keterangan: item.keterangan || '',
                                                    });
                                                }}
                                                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteRecord(`/api/admin/tahun-ajaran/${item.id_tahun_ajaran}`, 'Tahun ajaran')}
                                                className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {!loadingMaster && (masterData.tahun_ajaran || []).length === 0 ? (
                                    <div className="px-5 py-6 text-sm text-slate-500">
                                        Belum ada tahun ajaran. Tambahkan periode pertama dari form di sebelah kiri.
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="kelas" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Kelas</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Kelola wali kelas dan periode aktif</h3>
                        </div>
                        <span className="text-sm text-slate-500">Pastikan guru wali sudah tersedia</span>
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                        <form onSubmit={submitKelas} className="space-y-4 rounded-3xl bg-slate-50 p-5">
                            <div className="grid gap-4">
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Nama Kelas</span>
                                    <input
                                        value={kelasForm.nama_kelas}
                                        onChange={(event) => setKelasForm((current) => ({ ...current, nama_kelas: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                        placeholder="XI IPA 1"
                                    />
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Guru Wali</span>
                                    <select
                                        value={kelasForm.id_guru_wali}
                                        onChange={(event) => setKelasForm((current) => ({ ...current, id_guru_wali: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                    >
                                        <option value="">Pilih guru wali</option>
                                        {(masterData.guru_options || []).map((guru) => (
                                            <option key={guru.id_guru} value={guru.id_guru}>
                                                {guru.nama_lengkap} {guru.nip ? `(${guru.nip})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Tahun Ajaran</span>
                                    {masterData.tahun_ajaran?.length ? (
                                        <select
                                            value={kelasForm.tahun_ajaran}
                                            onChange={(event) => setKelasForm((current) => ({ ...current, tahun_ajaran: event.target.value }))}
                                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                        >
                                            <option value="">Pilih tahun ajaran</option>
                                            {(masterData.tahun_ajaran || []).map((item) => (
                                                <option key={item.id_tahun_ajaran} value={item.periode_label || item.nama_tahun_ajaran}>
                                                    {item.periode_label || item.nama_tahun_ajaran}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            value={kelasForm.tahun_ajaran}
                                            onChange={(event) => setKelasForm((current) => ({ ...current, tahun_ajaran: event.target.value }))}
                                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                            placeholder="2025/2026"
                                        />
                                    )}
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                                    {kelasId ? 'Perbarui Kelas' : 'Simpan Kelas'}
                                </button>
                                {kelasId ? (
                                    <button type="button" onClick={resetKelasForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                                        Batal Edit
                                    </button>
                                ) : null}
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
                                            <p className="mt-1 text-sm text-slate-500">
                                                {item.guru_wali?.nama_lengkap || 'Belum ditentukan'} • {item.tahun_ajaran}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setKelasId(item.id_kelas);
                                                    setKelasForm({
                                                        id_guru_wali: item.id_guru_wali || '',
                                                        nama_kelas: item.nama_kelas || '',
                                                        tahun_ajaran: item.tahun_ajaran || '',
                                                    });
                                                }}
                                                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteRecord(`/api/admin/kelas/${item.id_kelas}`, 'Kelas')}
                                                className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {!loadingMaster && (masterData.kelas || []).length === 0 ? (
                                    <div className="px-5 py-6 text-sm text-slate-500">
                                        Belum ada kelas yang didaftarkan.
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="mapel" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Mata Pelajaran</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Kelola daftar mapel inti</h3>
                        </div>
                        <span className="text-sm text-slate-500">Gunakan kode tingkat untuk filter sesi</span>
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                        <form onSubmit={submitMapel} className="space-y-4 rounded-3xl bg-slate-50 p-5">
                            <div className="grid gap-4">
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Nama Mata Pelajaran</span>
                                    <input
                                        value={mapelForm.nama_mapel}
                                        onChange={(event) => setMapelForm((current) => ({ ...current, nama_mapel: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                        placeholder="Matematika"
                                    />
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Tingkat</span>
                                    <select
                                        value={mapelForm.tingkat}
                                        onChange={(event) => setMapelForm((current) => ({ ...current, tingkat: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                    >
                                        <option value="">Pilih tingkat kelas</option>
                                        <option value="X">X</option>
                                        <option value="XI">XI</option>
                                        <option value="XII">XII</option>
                                    </select>
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                                    {mapelId ? 'Perbarui Mapel' : 'Simpan Mapel'}
                                </button>
                                {mapelId ? (
                                    <button type="button" onClick={resetMapelForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                                        Batal Edit
                                    </button>
                                ) : null}
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
                                            <p className="font-semibold text-slate-900">{item.nama_lengkap || item.nama_mapel}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMapelId(item.id_mapel);
                                                    setMapelForm({
                                                        nama_mapel: item.nama_mapel || '',
                                                        tingkat: item.tingkat || '',
                                                    });
                                                }}
                                                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteRecord(`/api/admin/mata-pelajaran/${item.id_mapel}`, 'Mata pelajaran')}
                                                className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {!loadingMaster && (masterData.mata_pelajaran || []).length === 0 ? (
                                    <div className="px-5 py-6 text-sm text-slate-500">
                                        Belum ada mata pelajaran yang didaftarkan.
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="import" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Import Akun</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Bulk import guru dan siswa dari Excel</h3>
                        </div>
                        <span className="text-sm text-slate-500">Username otomatis dari NIP / NISN</span>
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                        <form onSubmit={submitImport} className="space-y-4 rounded-3xl bg-slate-50 p-5">
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                                <span>Default Role</span>
                                <select
                                    value={importForm.default_role}
                                    onChange={(event) => setImportForm((current) => ({ ...current, default_role: event.target.value }))}
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                >
                                    <option value="guru">Guru</option>
                                    <option value="siswa">Siswa</option>
                                </select>
                            </label>
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                                <span>File Excel</span>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(event) => setImportForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
                                    className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-slate-400"
                                />
                            </label>
                            <div className="flex flex-wrap gap-3">
                                <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                                    Import Akun
                                </button>
                            </div>
                        </form>

                        <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                            <div>
                                <h4 className="text-lg font-semibold text-slate-900">Panduan file</h4>
                                <p className="mt-1 text-sm text-slate-600">
                                    Gunakan kolom <span className="font-semibold text-slate-900">role</span>, <span className="font-semibold text-slate-900">nama_lengkap</span>, dan salah satu kolom identitas <span className="font-semibold text-slate-900">nip</span> atau <span className="font-semibold text-slate-900">nisn</span>.
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                                <p className="font-semibold text-slate-900">Default password akun:</p>
                                <p className="mt-1">{importResult?.default_password || 'SIA@12345'}</p>
                                <p className="mt-2 text-xs text-slate-500">Password ini berlaku untuk semua akun hasil impor dan bisa langsung diubah setelah login pertama.</p>
                            </div>
                            {importResult ? (
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl bg-white px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Created</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900">{importResult.created || 0}</p>
                                    </div>
                                    <div className="rounded-2xl bg-white px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Updated</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900">{importResult.updated || 0}</p>
                                    </div>
                                    <div className="rounded-2xl bg-white px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Skipped</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900">{importResult.skipped || 0}</p>
                                    </div>
                                </div>
                            ) : null}
                            {importResult?.skipped_rows?.length ? (
                                <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                                    <p className="font-semibold text-slate-900">Baris yang dilewati</p>
                                    <ul className="mt-2 space-y-2">
                                        {importResult.skipped_rows.map((item) => (
                                            <li key={`${item.row}-${item.reason}`} className="rounded-xl bg-slate-50 px-3 py-2">
                                                Baris {item.row}: {item.reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                                <p className="font-semibold text-slate-900">Saran tampilan yang perlu ada</p>
                                <ul className="mt-2 space-y-2">
                                    <li>• Ringkasan jumlah master data di bagian atas.</li>
                                    <li>• Form input di sisi kiri dan daftar data di sisi kanan.</li>
                                    <li>• Notifikasi sukses/gagal yang terlihat jelas setelah simpan, ubah, atau hapus.</li>
                                    <li>• Import Excel dengan penjelasan kolom agar operator tidak bingung.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Log Aktivitas Terakhir</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">Riwayat perubahan terbaru</h3>
                        </div>
                        <span className="text-sm text-slate-500">Terbaru diperbarui otomatis</span>
                    </div>

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
                </section>
            </div>
        </DashboardLayout>
    );
}