import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';

const BLOOM_OPTIONS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
const ATTENDANCE_OPTIONS = [
    { value: 'hadir', label: 'Hadir' },
    { value: 'izin', label: 'Izin' },
    { value: 'sakit', label: 'Sakit' },
    { value: 'alpa', label: 'Alpa' },
];

export default function GuruDashboard({ session, onLogout, mode = 'dashboard' }) {
    const [summary, setSummary] = useState(null);
    const [diagnostics, setDiagnostics] = useState(null);
    const [workspace, setWorkspace] = useState({
        teaching_assignments: [],
        kelas_options: [],
        mapel_options: [],
        students_by_class: {},
        bank_soal: [],
        berita_acara: [],
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');

    const [bankForm, setBankForm] = useState({
        id_mapel: '',
        isi_soal: '',
        jenis_soal: 'pilihan_ganda',
        opsi_a: '',
        opsi_b: '',
        opsi_c: '',
        opsi_d: '',
        kunci_jawaban: '',
        topik_materi: '',
        level_kognitif: '',
    });
    const [bankSearch, setBankSearch] = useState('');

    const [beritaForm, setBeritaForm] = useState({
        id_kelas: '',
        id_mapel: '',
        pertemuan_ke: 1,
        tanggal: '',
        materi_bahasan: '',
        evaluasi_kendala: '',
        catatan_kelas: '',
    });
    const [attendanceMap, setAttendanceMap] = useState({});
    const [beritaSearch, setBeritaSearch] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            try {
                setLoading(true);
                setError('');

                const [summaryPayload, diagnosticsPayload, workspacePayload] = await Promise.all([
                    apiFetch('/api/guru/dashboard-summary', session),
                    apiFetch('/api/guru/analisis-diagnostik', session),
                    apiFetch('/api/guru/workspace-data', session),
                ]);

                if (!mounted) {
                    return;
                }

                setSummary(summaryPayload);
                setDiagnostics(diagnosticsPayload);
                setWorkspace(workspacePayload);

                setBankForm((current) => ({
                    ...current,
                    id_mapel: current.id_mapel || workspacePayload.mapel_options?.[0]?.id_mapel || '',
                }));

                const defaultKelas = workspacePayload.kelas_options?.[0]?.id_kelas || '';
                const assignmentForClass = (workspacePayload.teaching_assignments || []).find(
                    (item) => Number(item.id_kelas) === Number(defaultKelas),
                );

                setBeritaForm((current) => ({
                    ...current,
                    id_kelas: current.id_kelas || defaultKelas,
                    id_mapel: current.id_mapel || assignmentForClass?.id_mapel || '',
                }));
            } catch (exception) {
                if (mounted) {
                    setError(exception.message || 'Gagal memuat data guru.');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        if (session?.token) {
            loadData();
        }

        return () => {
            mounted = false;
        };
    }, [session]);

    useEffect(() => {
        const students = workspace.students_by_class?.[beritaForm.id_kelas] || [];

        setAttendanceMap((current) => {
            const next = {};
            students.forEach((item) => {
                next[item.id_siswa] = current[item.id_siswa] || 'hadir';
            });
            return next;
        });
    }, [beritaForm.id_kelas, workspace.students_by_class]);

    const reloadWorkspace = async () => {
        const payload = await apiFetch('/api/guru/workspace-data', session);
        setWorkspace(payload);
    };

    const showToast = (message) => {
        setToast(message);
        window.setTimeout(() => setToast(''), 3200);
    };

    const bankRows = useMemo(() => {
        const search = bankSearch.trim().toLowerCase();

        return (workspace.bank_soal || []).filter((item) => {
            if (!search) {
                return true;
            }

            return [
                item.mata_pelajaran?.nama_mapel,
                item.topik_materi,
                item.level_kognitif,
                item.jenis_soal,
                item.isi_soal,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [bankSearch, workspace.bank_soal]);

    const beritaRows = useMemo(() => {
        const search = beritaSearch.trim().toLowerCase();

        return (workspace.berita_acara || []).filter((item) => {
            if (!search) {
                return true;
            }

            return [
                item.kelas?.nama_kelas,
                item.mata_pelajaran?.nama_mapel,
                item.materi_bahasan,
                item.evaluasi_kendala,
                item.tanggal,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [beritaSearch, workspace.berita_acara]);

    const mapelBySelectedClass = useMemo(
        () =>
            (workspace.teaching_assignments || [])
                .filter((item) => Number(item.id_kelas) === Number(beritaForm.id_kelas))
                .map((item) => ({
                    id_mapel: item.id_mapel,
                    nama_mapel: item.mata_pelajaran?.nama_mapel || item.nama_mapel,
                })),
        [beritaForm.id_kelas, workspace.teaching_assignments],
    );

    const siswaBySelectedClass = workspace.students_by_class?.[beritaForm.id_kelas] || [];

    const attendanceSummary = (items) => {
        const grouped = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };

        (items || []).forEach((row) => {
            if (grouped[row.status_kehadiran] !== undefined) {
                grouped[row.status_kehadiran] += 1;
            }
        });

        return `H:${grouped.hadir} I:${grouped.izin} S:${grouped.sakit} A:${grouped.alpa}`;
    };

    const submitBankSoal = async (event) => {
        event.preventDefault();

        try {
            setError('');

            if (!bankForm.topik_materi.trim() || !bankForm.level_kognitif) {
                setError('Topik materi dan level kognitif Bloom wajib diisi sebelum menyimpan soal.');
                return;
            }

            const opsiJawaban = [bankForm.opsi_a, bankForm.opsi_b, bankForm.opsi_c, bankForm.opsi_d]
                .map((item) => item.trim())
                .filter(Boolean);

            await apiFetch('/api/guru/bank-soal', session, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_mapel: Number(bankForm.id_mapel),
                    isi_soal: bankForm.isi_soal,
                    jenis_soal: bankForm.jenis_soal,
                    opsi_jawaban: bankForm.jenis_soal === 'pilihan_ganda' ? opsiJawaban : [],
                    kunci_jawaban: bankForm.kunci_jawaban,
                    topik_materi: bankForm.topik_materi,
                    level_kognitif: bankForm.level_kognitif,
                }),
            });

            showToast('Bank soal berhasil disimpan.');

            setBankForm((current) => ({
                ...current,
                isi_soal: '',
                opsi_a: '',
                opsi_b: '',
                opsi_c: '',
                opsi_d: '',
                kunci_jawaban: '',
                topik_materi: '',
                level_kognitif: '',
            }));

            await reloadWorkspace();
        } catch (exception) {
            setError(exception.message || 'Gagal menyimpan bank soal.');
        }
    };

    const submitBeritaAcara = async (event) => {
        event.preventDefault();

        try {
            setError('');

            const attendancePayload = siswaBySelectedClass.map((item) => ({
                id_siswa: item.id_siswa,
                status_kehadiran: attendanceMap[item.id_siswa] || 'hadir',
            }));

            if (attendancePayload.length === 0) {
                setError('Kelas belum memiliki siswa aktif untuk dicatat kehadiran.');
                return;
            }

            await apiFetch('/api/guru/berita-acara', session, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_kelas: Number(beritaForm.id_kelas),
                    id_mapel: Number(beritaForm.id_mapel),
                    pertemuan_ke: Number(beritaForm.pertemuan_ke),
                    tanggal: beritaForm.tanggal,
                    materi_bahasan: beritaForm.materi_bahasan,
                    evaluasi_kendala: beritaForm.evaluasi_kendala,
                    catatan_kelas: beritaForm.catatan_kelas,
                    kehadiran_siswa: attendancePayload,
                }),
            });

            showToast('Berita acara berhasil disimpan.');

            setBeritaForm((current) => ({
                ...current,
                pertemuan_ke: 1,
                tanggal: '',
                materi_bahasan: '',
                evaluasi_kendala: '',
                catatan_kelas: '',
            }));

            await reloadWorkspace();
        } catch (exception) {
            setError(exception.message || 'Gagal menyimpan berita acara.');
        }
    };

    const navigation = [
        { label: 'Dashboard', href: '/guru/dashboard', badge: 'Home' },
        { label: 'Bank Soal', href: '/guru/bank-soal', badge: 'Soal' },
        { label: 'Berita Acara', href: '/guru/berita-acara', badge: 'Presensi' },
    ];

    const renderDashboard = () => (
        <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Ringkasan Kegiatan</p>
                        <h3 className="mt-2 text-2xl font-semibold text-slate-900">Data saat ini dari aktivitas Anda</h3>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Aktif</span>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <StatCard label="Total Kelas" value={loading ? '...' : summary?.cards?.total_kelas ?? 0} description="Kelas yang diampu" tone="slate" />
                    <StatCard label="Penugasan Aktif" value={loading ? '...' : summary?.cards?.total_penugasan ?? 0} description="Relasi mapel dan kelas" tone="rose" />
                    <StatCard label="Total Bank Soal" value={loading ? '...' : summary?.cards?.total_bank_soal ?? 0} description="Soal terinput" tone="blue" />
                    <StatCard label="Ujian Aktif" value={loading ? '...' : summary?.cards?.ujian_aktif ?? 0} description="Jadwal CBT" tone="amber" />
                    <StatCard label="Total Berita Acara" value={loading ? '...' : summary?.cards?.total_berita_acara ?? 0} description="Dokumentasi pertemuan" tone="rose" />
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                    <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Panduan Awal</p>
                    <h3 className="mt-3 text-2xl font-semibold">Alur kerja guru</h3>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white/5 p-4"><p className="text-sm text-slate-300">1. Buat Bank Soal</p><p className="mt-1 text-sm text-slate-400">Isi topik materi dan Bloom C1-C6.</p></div>
                        <div className="rounded-2xl bg-white/5 p-4"><p className="text-sm text-slate-300">2. Catat Berita Acara</p><p className="mt-1 text-sm text-slate-400">Presensi lengkap per kelas dan evaluasi.</p></div>
                        <div className="rounded-2xl bg-white/5 p-4"><p className="text-sm text-slate-300">3. Sinkron dengan Admin</p><p className="mt-1 text-sm text-slate-400">Data kelas/mapel mengikuti penugasan aktif.</p></div>
                        <div className="rounded-2xl bg-white/5 p-4"><p className="text-sm text-slate-300">4. Dampak ke Siswa</p><p className="mt-1 text-sm text-slate-400">Instrumen dan pembelajaran terdokumentasi rapi.</p></div>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Jadwal Asesmen (CBT) Mendatang</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Jadwal terdekat</h3>
                    <div className="mt-6 space-y-4">
                        {(summary?.upcoming_schedules || []).map((item) => (
                            <div key={item.title + item.meta} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="font-semibold text-slate-900">{item.title}</p>
                                <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
                                <p className="mt-2 text-sm font-medium text-slate-700">{item.note}</p>
                            </div>
                        ))}
                        {!loading && (summary?.upcoming_schedules || []).length === 0 ? (
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Belum ada jadwal mendatang.</div>
                        ) : null}
                    </div>
                </div>
            </section>
        </>
    );

    const renderBankSoal = () => (
        <section className="space-y-6">
            <form onSubmit={submitBankSoal} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Bank Soal Guru</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">Input soal digital terstruktur</h3>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium text-slate-700">
                        <span>Mata Pelajaran</span>
                        <select
                            required
                            value={bankForm.id_mapel}
                            onChange={(event) => setBankForm((current) => ({ ...current, id_mapel: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                        >
                            <option value="">Pilih mapel</option>
                            {(workspace.mapel_options || []).map((item) => (
                                <option key={item.id_mapel} value={item.id_mapel}>
                                    {item.nama_mapel} {item.tingkat ? `(${item.tingkat})` : ''}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-2 text-sm font-medium text-slate-700">
                        <span>Jenis Soal</span>
                        <select
                            required
                            value={bankForm.jenis_soal}
                            onChange={(event) => setBankForm((current) => ({ ...current, jenis_soal: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                        >
                            <option value="pilihan_ganda">Pilihan Ganda</option>
                            <option value="esai">Esai</option>
                        </select>
                    </label>

                    <label className="space-y-2 text-sm font-medium text-slate-700">
                        <span>Topik Materi</span>
                        <input
                            required
                            value={bankForm.topik_materi}
                            onChange={(event) => setBankForm((current) => ({ ...current, topik_materi: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                            placeholder="Contoh: Sistem Persamaan Linear"
                        />
                    </label>

                    <label className="space-y-2 text-sm font-medium text-slate-700">
                        <span>Level Kognitif Bloom</span>
                        <select
                            required
                            value={bankForm.level_kognitif}
                            onChange={(event) => setBankForm((current) => ({ ...current, level_kognitif: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                        >
                            <option value="">Pilih level Bloom</option>
                            {BLOOM_OPTIONS.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                        <span>Isi Soal</span>
                        <textarea
                            required
                            rows="4"
                            value={bankForm.isi_soal}
                            onChange={(event) => setBankForm((current) => ({ ...current, isi_soal: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                            placeholder="Tulis soal secara lengkap"
                        />
                    </label>

                    {bankForm.jenis_soal === 'pilihan_ganda' ? (
                        <>
                            <label className="space-y-2 text-sm font-medium text-slate-700"><span>Opsi A</span><input value={bankForm.opsi_a} onChange={(event) => setBankForm((current) => ({ ...current, opsi_a: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" /></label>
                            <label className="space-y-2 text-sm font-medium text-slate-700"><span>Opsi B</span><input value={bankForm.opsi_b} onChange={(event) => setBankForm((current) => ({ ...current, opsi_b: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" /></label>
                            <label className="space-y-2 text-sm font-medium text-slate-700"><span>Opsi C</span><input value={bankForm.opsi_c} onChange={(event) => setBankForm((current) => ({ ...current, opsi_c: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" /></label>
                            <label className="space-y-2 text-sm font-medium text-slate-700"><span>Opsi D</span><input value={bankForm.opsi_d} onChange={(event) => setBankForm((current) => ({ ...current, opsi_d: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" /></label>
                        </>
                    ) : null}

                    <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                        <span>Kunci Jawaban</span>
                        <input
                            required
                            value={bankForm.kunci_jawaban}
                            onChange={(event) => setBankForm((current) => ({ ...current, kunci_jawaban: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                            placeholder={bankForm.jenis_soal === 'esai' ? 'Panduan jawaban esai' : 'Harus sama dengan salah satu opsi'}
                        />
                    </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                    <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                        Simpan Soal
                    </button>
                </div>
            </form>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h4 className="text-lg font-semibold text-slate-900">Data Bank Soal</h4>
                    <p className="text-sm text-slate-500">Pastikan topik dan level Bloom terisi untuk semua soal.</p>
                </div>
                <div className="border-b border-slate-200 px-5 py-4">
                    <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Data</p>
                            <p className="mt-1 font-semibold text-slate-900">{loading ? 'Memuat...' : `${bankRows.length} data`}</p>
                        </div>
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Cari soal</span>
                            <input
                                value={bankSearch}
                                onChange={(event) => setBankSearch(event.target.value)}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                placeholder="Mapel, topik, level Bloom, atau isi soal"
                            />
                        </label>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                            <tr>
                                <th className="px-5 py-4 font-semibold">No</th>
                                <th className="px-5 py-4 font-semibold">Mapel</th>
                                <th className="px-5 py-4 font-semibold">Topik</th>
                                <th className="px-5 py-4 font-semibold">Bloom</th>
                                <th className="px-5 py-4 font-semibold">Jenis</th>
                                <th className="px-5 py-4 font-semibold">Kunci</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {bankRows.map((item, index) => (
                                <tr key={item.id_soal} className="align-top hover:bg-slate-50/70">
                                    <td className="px-5 py-4 font-semibold text-slate-500">{index + 1}</td>
                                    <td className="px-5 py-4 font-semibold text-slate-900">{item.mata_pelajaran?.nama_mapel || '-'}</td>
                                    <td className="px-5 py-4 text-slate-600">{item.topik_materi}</td>
                                    <td className="px-5 py-4 text-slate-600">{item.level_kognitif}</td>
                                    <td className="px-5 py-4 text-slate-600">{item.jenis_soal}</td>
                                    <td className="px-5 py-4 text-slate-600">{item.kunci_jawaban}</td>
                                </tr>
                            ))}
                            {!loading && bankRows.length === 0 ? (
                                <tr><td colSpan="6" className="px-5 py-6 text-sm text-slate-500">Belum ada data bank soal yang cocok.</td></tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );

    const renderBeritaAcara = () => (
        <section className="space-y-6">
            <form onSubmit={submitBeritaAcara} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Berita Acara Digital</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">Presensi dan evaluasi pertemuan kelas</h3>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium text-slate-700">
                        <span>Kelas</span>
                        <select
                            required
                            value={beritaForm.id_kelas}
                            onChange={(event) => {
                                const classId = event.target.value;
                                const firstMapel = (workspace.teaching_assignments || []).find((item) => Number(item.id_kelas) === Number(classId));
                                setBeritaForm((current) => ({
                                    ...current,
                                    id_kelas: classId,
                                    id_mapel: firstMapel?.id_mapel || '',
                                }));
                            }}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                        >
                            <option value="">Pilih kelas</option>
                            {(workspace.kelas_options || []).map((item) => (
                                <option key={item.id_kelas} value={item.id_kelas}>
                                    {item.nama_kelas} {item.tahun_ajaran ? `(${item.tahun_ajaran})` : ''}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-2 text-sm font-medium text-slate-700">
                        <span>Mata Pelajaran</span>
                        <select
                            required
                            value={beritaForm.id_mapel}
                            onChange={(event) => setBeritaForm((current) => ({ ...current, id_mapel: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                        >
                            <option value="">Pilih mapel</option>
                            {mapelBySelectedClass.map((item) => (
                                <option key={item.id_mapel} value={item.id_mapel}>
                                    {item.nama_mapel}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-2 text-sm font-medium text-slate-700">
                        <span>Pertemuan Ke</span>
                        <input
                            required
                            type="number"
                            min="1"
                            value={beritaForm.pertemuan_ke}
                            onChange={(event) => setBeritaForm((current) => ({ ...current, pertemuan_ke: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                        />
                    </label>

                    <label className="space-y-2 text-sm font-medium text-slate-700">
                        <span>Tanggal</span>
                        <input
                            required
                            type="date"
                            value={beritaForm.tanggal}
                            onChange={(event) => setBeritaForm((current) => ({ ...current, tanggal: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                        />
                    </label>

                    <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                        <span>Topik/Materi yang Dibahas</span>
                        <input
                            required
                            value={beritaForm.materi_bahasan}
                            onChange={(event) => setBeritaForm((current) => ({ ...current, materi_bahasan: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                            placeholder="Contoh: Latihan HOTS Aljabar"
                        />
                    </label>

                    <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                        <span>Evaluasi/Kendala Pertemuan</span>
                        <textarea
                            required
                            rows="3"
                            value={beritaForm.evaluasi_kendala}
                            onChange={(event) => setBeritaForm((current) => ({ ...current, evaluasi_kendala: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                            placeholder="Tulis evaluasi pembelajaran atau kendala yang ditemui"
                        />
                    </label>

                    <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                        <span>Catatan Kelas</span>
                        <textarea
                            required
                            rows="3"
                            value={beritaForm.catatan_kelas}
                            onChange={(event) => setBeritaForm((current) => ({ ...current, catatan_kelas: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                            placeholder="Catatan tambahan untuk pertemuan ini"
                        />
                    </label>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Presensi Siswa</p>
                    <p className="mt-1 text-sm text-slate-500">Semua siswa aktif di kelas harus memiliki status kehadiran.</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {siswaBySelectedClass.map((item) => (
                            <label key={item.id_siswa} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700">
                                <span>
                                    {item.nama_lengkap} {item.nisn ? `(${item.nisn})` : ''}
                                </span>
                                <select
                                    value={attendanceMap[item.id_siswa] || 'hadir'}
                                    onChange={(event) =>
                                        setAttendanceMap((current) => ({
                                            ...current,
                                            [item.id_siswa]: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-slate-900"
                                >
                                    {ATTENDANCE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ))}
                        {siswaBySelectedClass.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 md:col-span-2">Belum ada siswa aktif pada kelas ini.</div>
                        ) : null}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                    <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                        Simpan Berita Acara
                    </button>
                </div>
            </form>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h4 className="text-lg font-semibold text-slate-900">Data Berita Acara</h4>
                    <p className="text-sm text-slate-500">Presensi harian dan evaluasi kelas yang sudah tersimpan.</p>
                </div>
                <div className="border-b border-slate-200 px-5 py-4">
                    <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Data</p>
                            <p className="mt-1 font-semibold text-slate-900">{loading ? 'Memuat...' : `${beritaRows.length} data`}</p>
                        </div>
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Cari berita acara</span>
                            <input
                                value={beritaSearch}
                                onChange={(event) => setBeritaSearch(event.target.value)}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                placeholder="Kelas, mapel, topik, evaluasi, atau tanggal"
                            />
                        </label>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                            <tr>
                                <th className="px-5 py-4 font-semibold">No</th>
                                <th className="px-5 py-4 font-semibold">Tanggal</th>
                                <th className="px-5 py-4 font-semibold">Kelas</th>
                                <th className="px-5 py-4 font-semibold">Mapel</th>
                                <th className="px-5 py-4 font-semibold">Pertemuan</th>
                                <th className="px-5 py-4 font-semibold">Topik</th>
                                <th className="px-5 py-4 font-semibold">Rekap Presensi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {beritaRows.map((item, index) => (
                                <tr key={item.id_berita_acara} className="align-top hover:bg-slate-50/70">
                                    <td className="px-5 py-4 font-semibold text-slate-500">{index + 1}</td>
                                    <td className="px-5 py-4 text-slate-600">{item.tanggal}</td>
                                    <td className="px-5 py-4 font-semibold text-slate-900">{item.kelas?.nama_kelas || '-'}</td>
                                    <td className="px-5 py-4 text-slate-600">{item.mata_pelajaran?.nama_mapel || '-'}</td>
                                    <td className="px-5 py-4 text-slate-600">Ke-{item.pertemuan_ke}</td>
                                    <td className="px-5 py-4 text-slate-600">{item.materi_bahasan}</td>
                                    <td className="px-5 py-4 text-slate-600">{attendanceSummary(item.kehadiran_siswa)}</td>
                                </tr>
                            ))}
                            {!loading && beritaRows.length === 0 ? (
                                <tr><td colSpan="7" className="px-5 py-6 text-sm text-slate-500">Belum ada data berita acara yang cocok.</td></tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );

    const renderContent = () => {
        if (mode === 'bank-soal') {
            return renderBankSoal();
        }

        if (mode === 'berita-acara') {
            return renderBeritaAcara();
        }

        return renderDashboard();
    };

    return (
        <DashboardLayout title="Dashboard Guru" user={session?.user} navigation={navigation} onLogout={onLogout}>
            <div className="space-y-6">
                {error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
                ) : null}
                {toast ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{toast}</div>
                ) : null}

                {renderContent()}

                {mode === 'dashboard' ? (
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Analisis Diagnostik Terbaru</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Pantau siswa yang butuh perhatian</h3>
                        <div className="mt-6 space-y-3">
                            {(diagnostics?.data || []).slice(0, 4).map((item) => (
                                <div key={item.id_analisis} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-slate-900">{item.siswa?.nama_lengkap || 'Siswa'}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {item.sesi_asesmen?.jenis_asesmen || item.sesiAsesmen?.jenis_asesmen || 'asesmen'} • {item.tanggal_generate}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{item.skor_total}</span>
                                    </div>
                                </div>
                            ))}
                            {!loading && (diagnostics?.data || []).length === 0 ? (
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Belum ada analisis diagnostik yang tersedia.</div>
                            ) : null}
                        </div>
                    </section>
                ) : null}
            </div>
        </DashboardLayout>
    );
}
