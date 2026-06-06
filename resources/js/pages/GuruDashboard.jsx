import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';
import { formatDateLabel, formatDateTimeLabel } from '../lib/date';

const BLOOM_OPTIONS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
const BADGE_OPTIONS = [
    { value: 'emas', label: 'Emas' },
    { value: 'perak', label: 'Perak' },
    { value: 'perunggu', label: 'Perunggu' },
];
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
    const [successPopup, setSuccessPopup] = useState(null);

    const [bankForm, setBankForm] = useState({
        id_mapel: '',
        isi_soal: '',
        jenis_soal: 'pilihan_ganda',
        opsi_a: '',
        opsi_b: '',
        opsi_c: '',
        opsi_d: '',
        kunci_jawaban: '',
        kunci_jawaban_kompleks: [],
        topik_materi: '',
        level_kognitif: '',
    });
    const [bankSearch, setBankSearch] = useState('');
    const [bankFilterMapel, setBankFilterMapel] = useState('');
    const [bankFilterJenis, setBankFilterJenis] = useState('');
    const [bankFilterLevel, setBankFilterLevel] = useState('');
    const [editingBankSoalId, setEditingBankSoalId] = useState(null);
    const [sesiAsesmenHistory, setSesiAsesmenHistory] = useState([]);

    const [isSesiModalOpen, setIsSesiModalOpen] = useState(false);
    const [editingSesiId, setEditingSesiId] = useState(null);
    const [sesiDetailData, setSesiDetailData] = useState(null);
    const [sesiDetailLoading, setSesiDetailLoading] = useState(false);
    const [expandedSiswaId, setExpandedSiswaId] = useState(null);
    const [sesiForm, setSesiForm] = useState({
        id_kelas: '',
        id_mapel: '',
        tipe_soal: '',
        jenis_asesmen: 'ujian',
        waktu_mulai: '',
        durasi_menit: 60,
    });
    const [selectedSoalMap, setSelectedSoalMap] = useState({});

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
    const [studentNoteMap, setStudentNoteMap] = useState({});
    const [studentBadgeMap, setStudentBadgeMap] = useState({});
    const [beritaSearch, setBeritaSearch] = useState('');
    const [editingBeritaId, setEditingBeritaId] = useState(null);

    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            try {
                setLoading(true);
                setError('');

                const [summaryPayload, diagnosticsPayload, workspacePayload, sesiPayload] = await Promise.all([
                    apiFetch('/api/guru/dashboard-summary', session),
                    apiFetch('/api/guru/analisis-diagnostik', session),
                    apiFetch('/api/guru/workspace-data', session),
                    apiFetch('/api/guru/sesi-asesmen', session),
                ]);

                if (!mounted) {
                    return;
                }

                setSummary(summaryPayload);
                setDiagnostics(diagnosticsPayload);
                setWorkspace(workspacePayload);
                setSesiAsesmenHistory(sesiPayload?.data || []);

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

        setStudentNoteMap((current) => {
            const next = {};

            students.forEach((item) => {
                next[item.id_siswa] = current[item.id_siswa] || '';
            });

            return next;
        });

        setStudentBadgeMap((current) => {
            const next = {};

            students.forEach((item) => {
                next[item.id_siswa] = current[item.id_siswa] || '';
            });

            return next;
        });
    }, [beritaForm.id_kelas, workspace.students_by_class]);

    const reloadWorkspace = async () => {
        const payload = await apiFetch('/api/guru/workspace-data', session);
        setWorkspace(payload);
        const sesi = await apiFetch('/api/guru/sesi-asesmen', session);
        setSesiAsesmenHistory(sesi?.data || []);
    };

    const showToast = (message) => {
        setToast(message);
        window.setTimeout(() => setToast(''), 3200);
    };

    const showSuccessPopup = (title, message) => {
        setSuccessPopup({ title, message });
    };

    const closeSuccessPopup = () => {
        setSuccessPopup(null);
    };

    const resetBeritaForm = () => {
        setEditingBeritaId(null);
        setBeritaForm((current) => ({
            ...current,
            pertemuan_ke: 1,
            tanggal: '',
            materi_bahasan: '',
            evaluasi_kendala: '',
            catatan_kelas: '',
        }));
        setAttendanceMap({});
        setStudentNoteMap({});
        setStudentBadgeMap({});
    };

    const openEditBeritaAcara = (item) => {
        setEditingBeritaId(item.id_berita_acara);
        setBeritaForm({
            id_kelas: String(item.id_kelas || ''),
            id_mapel: String(item.id_mapel || ''),
            pertemuan_ke: item.pertemuan_ke || 1,
            tanggal: item.tanggal_raw || '',
            materi_bahasan: item.materi_bahasan || '',
            evaluasi_kendala: item.evaluasi_kendala || '',
            catatan_kelas: item.catatan_kelas || '',
        });

        const attendanceRows = item.kehadiran_siswa || [];
        const emptyStudentMap = (workspace.students_by_class?.[item.id_kelas] || []).reduce((accumulator, student) => {
            accumulator[student.id_siswa] = '';
            return accumulator;
        }, {});

        setAttendanceMap(attendanceRows.reduce((accumulator, row) => {
            accumulator[row.id_siswa] = row.status_kehadiran || 'hadir';
            return accumulator;
        }, {}));

        setStudentNoteMap(attendanceRows.reduce((accumulator, row) => {
            accumulator[row.id_siswa] = row.catatan_pribadi || '';
            return accumulator;
        }, { ...emptyStudentMap }));

        setStudentBadgeMap(attendanceRows.reduce((accumulator, row) => {
            accumulator[row.id_siswa] = row.jenis_badge || '';
            return accumulator;
        }, { ...emptyStudentMap }));

        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const bankRows = useMemo(() => {
        const search = bankSearch.trim().toLowerCase();

        return (workspace.bank_soal || []).filter((item) => {
            if (bankFilterMapel && String(item.id_mapel) !== String(bankFilterMapel)) return false;
            if (bankFilterJenis && item.jenis_soal !== bankFilterJenis) return false;
            if (bankFilterLevel && item.level_kognitif !== bankFilterLevel) return false;

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
    }, [bankSearch, bankFilterMapel, bankFilterJenis, bankFilterLevel, workspace.bank_soal]);

    const beritaRows = useMemo(() => {
        const search = beritaSearch.trim().toLowerCase();

        return (workspace.berita_acara || []).filter((item) => {
            if (!search) {
                return true;
            }

            const noteAndBadgeText = (item.kehadiran_siswa || [])
                .map((row) => [row.catatan_pribadi, row.jenis_badge].filter(Boolean).join(' '))
                .join(' ');

            return [
                item.kelas?.nama_kelas,
                item.mata_pelajaran?.nama_mapel,
                item.materi_bahasan,
                item.evaluasi_kendala,
                item.catatan_kelas,
                formatDateLabel(item.tanggal),
                noteAndBadgeText,
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

    const optionalSummary = (items) => {
        const grouped = { catatan: 0, badge: 0 };

        (items || []).forEach((row) => {
            if (String(row.catatan_pribadi || '').trim()) {
                grouped.catatan += 1;
            }

            if (String(row.jenis_badge || '').trim()) {
                grouped.badge += 1;
            }
        });

        return `Catatan:${grouped.catatan} Badge:${grouped.badge}`;
    };

    const submitSesiAsesmen = async (event) => {
        event.preventDefault();
        try {
            setError('');
            const soalArr = Object.entries(selectedSoalMap)
                .filter(([id, bobot]) => bobot > 0)
                .map(([id, bobot]) => ({ id_soal: Number(id), bobot_nilai: Number(bobot) }));

            if (soalArr.length === 0) {
                setError('Pilih minimal satu soal dan tentukan bobot nilainya.');
                return;
            }

            const isEditing = editingSesiId !== null;

            await apiFetch(isEditing ? `/api/guru/sesi-asesmen/${editingSesiId}` : '/api/guru/sesi-asesmen', session, {
                method: isEditing ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_kelas: Number(sesiForm.id_kelas),
                    id_mapel: Number(sesiForm.id_mapel),
                    tipe_soal: sesiForm.tipe_soal,
                    jenis_asesmen: sesiForm.jenis_asesmen,
                    waktu_mulai: sesiForm.waktu_mulai,
                    durasi_menit: Number(sesiForm.durasi_menit),
                    soal: soalArr,
                }),
            });

            showToast(isEditing ? 'Sesi Asesmen berhasil diperbarui.' : 'Sesi Asesmen berhasil dibuat.');
            setIsSesiModalOpen(false);
            setEditingSesiId(null);
            setSelectedSoalMap({});
            setSesiForm({
                id_kelas: '', id_mapel: '', tipe_soal: '', jenis_asesmen: 'ujian', waktu_mulai: '', durasi_menit: 60
            });
            await reloadWorkspace();
        } catch (exception) {
            setError(exception.message || 'Gagal menyimpan sesi asesmen.');
        }
    };

    const openEditSesiAsesmen = (item) => {
        setEditingSesiId(item.id_sesi);
        setSesiForm({
            id_kelas: String(item.id_kelas || ''),
            id_mapel: String(item.id_mapel || ''),
            tipe_soal: item.tipe_soal || '',
            jenis_asesmen: item.jenis_asesmen || 'ujian',
            waktu_mulai: item.waktu_mulai ? new Date(new Date(item.waktu_mulai).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
            durasi_menit: item.durasi_menit || 60,
        });

        const soalMap = {};
        (item.detail_sesi_soal || []).forEach(ds => {
            soalMap[ds.id_soal] = ds.bobot_nilai;
        });
        setSelectedSoalMap(soalMap);
        
        setIsSesiModalOpen(true);
    };

    const handleDeleteSesiAsesmen = async (id) => {
        if (!window.confirm('Yakin ingin menghapus jadwal CBT ini?')) return;
        try {
            await apiFetch(`/api/guru/sesi-asesmen/${id}`, session, { method: 'DELETE' });
            showToast('Jadwal CBT berhasil dihapus.');
            await reloadWorkspace();
        } catch (err) {
            showSuccessPopup('Gagal Menghapus', err.message || 'Jadwal tidak dapat dihapus karena siswa sudah mulai mengerjakan.');
        }
    };

    const fetchSesiDetail = async (idSesi) => {
        try {
            setSesiDetailLoading(true);
            setSesiDetailData(null);
            setExpandedSiswaId(null);
            const data = await apiFetch(`/api/guru/sesi-asesmen/${idSesi}/detail`, session);
            setSesiDetailData(data);
        } catch (err) {
            showSuccessPopup('Gagal', err.message || 'Gagal memuat detail sesi.');
        } finally {
            setSesiDetailLoading(false);
        }
    };

    const openEditBankSoal = (item) => {
        setEditingBankSoalId(item.id_soal);
        setBankForm({
            id_mapel: String(item.id_mapel || ''),
            isi_soal: item.isi_soal || '',
            jenis_soal: item.jenis_soal || 'pilihan_ganda',
            opsi_a: item.opsi_jawaban?.[0] || '',
            opsi_b: item.opsi_jawaban?.[1] || '',
            opsi_c: item.opsi_jawaban?.[2] || '',
            opsi_d: item.opsi_jawaban?.[3] || '',
            kunci_jawaban: item.jenis_soal !== 'pilihan_ganda_kompleks' ? item.kunci_jawaban : '',
            kunci_jawaban_kompleks: item.jenis_soal === 'pilihan_ganda_kompleks' ? (function() { try { return JSON.parse(item.kunci_jawaban); } catch { return []; } })() : [],
            topik_materi: item.topik_materi || '',
            level_kognitif: item.level_kognitif || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetBankForm = () => {
        setEditingBankSoalId(null);
        setBankForm((current) => ({
            ...current,
            isi_soal: '',
            opsi_a: '',
            opsi_b: '',
            opsi_c: '',
            opsi_d: '',
            kunci_jawaban: '',
            kunci_jawaban_kompleks: [],
            topik_materi: '',
            level_kognitif: '',
        }));
    };

    const handleDeleteBankSoal = async (id) => {
        if (!window.confirm('Yakin ingin menghapus soal ini?')) return;
        try {
            await apiFetch(`/api/guru/bank-soal/${id}`, session, { method: 'DELETE' });
            showToast('Soal berhasil dihapus.');
            await reloadWorkspace();
        } catch (err) {
            showSuccessPopup('Gagal Menghapus', err.message || 'Soal tidak dapat dihapus karena sudah dipakai dalam sesi ujian.');
        }
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

            const isEditing = editingBankSoalId !== null;
            await apiFetch(isEditing ? `/api/guru/bank-soal/${editingBankSoalId}` : '/api/guru/bank-soal', session, {
                method: isEditing ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_mapel: Number(bankForm.id_mapel),
                    isi_soal: bankForm.isi_soal,
                    jenis_soal: bankForm.jenis_soal,
                    opsi_jawaban: (bankForm.jenis_soal === 'pilihan_ganda' || bankForm.jenis_soal === 'pilihan_ganda_kompleks') ? opsiJawaban : [],
                    kunci_jawaban: bankForm.jenis_soal === 'pilihan_ganda_kompleks' ? bankForm.kunci_jawaban_kompleks : bankForm.kunci_jawaban,
                    topik_materi: bankForm.topik_materi,
                    level_kognitif: bankForm.level_kognitif,
                }),
            });

            showToast(isEditing ? 'Bank soal berhasil diperbarui.' : 'Bank soal berhasil disimpan.');

            resetBankForm();
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
                catatan_pribadi: studentNoteMap[item.id_siswa]?.trim() || null,
                jenis_badge: studentBadgeMap[item.id_siswa] || null,
            }));

            if (attendancePayload.length === 0) {
                setError('Kelas belum memiliki siswa aktif untuk dicatat kehadiran.');
                return;
            }

            const isEditing = editingBeritaId !== null;
            const responseMessage = isEditing ? 'Berita acara berhasil diperbarui.' : 'Berita acara berhasil disimpan.';

            await apiFetch(isEditing ? `/api/guru/berita-acara/${editingBeritaId}` : '/api/guru/berita-acara', session, {
                method: isEditing ? 'PATCH' : 'POST',
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

            showToast(responseMessage);
            showSuccessPopup(isEditing ? 'BAP berhasil diubah' : 'BAP berhasil dibuat', responseMessage);
            resetBeritaForm();

            await reloadWorkspace();
        } catch (exception) {
            setError(exception.message || 'Gagal menyimpan berita acara.');
        }
    };

    const navigation = [
        { label: 'Dashboard', href: '/guru/dashboard', badge: 'Home' },
        { label: 'Jadwal CBT', href: '/guru/jadwal-cbt', badge: 'Ujian' },
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
                        <div className="rounded-2xl bg-white/5 p-4"><p className="text-sm text-slate-300">2. Catat Berita Acara</p><p className="mt-1 text-sm text-slate-400">Presensi lengkap per kelas, evaluasi, dan penguatan siswa opsional.</p></div>
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
                            <option value="pilihan_ganda_kompleks">Pilihan Ganda Kompleks</option>
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

                    {bankForm.jenis_soal === 'pilihan_ganda' || bankForm.jenis_soal === 'pilihan_ganda_kompleks' ? (
                        <>
                            <label className="space-y-2 text-sm font-medium text-slate-700"><span>Opsi A</span><input value={bankForm.opsi_a} onChange={(event) => setBankForm((current) => ({ ...current, opsi_a: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" /></label>
                            <label className="space-y-2 text-sm font-medium text-slate-700"><span>Opsi B</span><input value={bankForm.opsi_b} onChange={(event) => setBankForm((current) => ({ ...current, opsi_b: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" /></label>
                            <label className="space-y-2 text-sm font-medium text-slate-700"><span>Opsi C</span><input value={bankForm.opsi_c} onChange={(event) => setBankForm((current) => ({ ...current, opsi_c: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" /></label>
                            <label className="space-y-2 text-sm font-medium text-slate-700"><span>Opsi D</span><input value={bankForm.opsi_d} onChange={(event) => setBankForm((current) => ({ ...current, opsi_d: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" /></label>
                        </>
                    ) : null}

                    <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                        <span>Kunci Jawaban</span>
                        {bankForm.jenis_soal === 'pilihan_ganda_kompleks' ? (
                            <div className="flex flex-wrap gap-4 pt-2">
                                {[bankForm.opsi_a, bankForm.opsi_b, bankForm.opsi_c, bankForm.opsi_d].filter(Boolean).map((opsi, idx) => (
                                    <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            value={opsi}
                                            checked={bankForm.kunci_jawaban_kompleks.includes(opsi)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                const val = e.target.value;
                                                setBankForm(curr => {
                                                    const next = new Set(curr.kunci_jawaban_kompleks);
                                                    if (checked) next.add(val);
                                                    else next.delete(val);
                                                    return { ...curr, kunci_jawaban_kompleks: Array.from(next) };
                                                });
                                            }}
                                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                        />
                                        <span className="text-sm font-normal text-slate-700">{opsi}</span>
                                    </label>
                                ))}
                                {![bankForm.opsi_a, bankForm.opsi_b, bankForm.opsi_c, bankForm.opsi_d].filter(Boolean).length && (
                                    <span className="text-xs text-slate-400">Isi opsi jawaban terlebih dahulu.</span>
                                )}
                            </div>
                        ) : (
                            <input
                                required
                                value={bankForm.kunci_jawaban}
                                onChange={(event) => setBankForm((current) => ({ ...current, kunci_jawaban: event.target.value }))}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                                placeholder={bankForm.jenis_soal === 'esai' ? 'Panduan jawaban esai' : 'Harus sama dengan salah satu opsi'}
                            />
                        )}
                    </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                    <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                        {editingBankSoalId ? 'Simpan Perubahan' : 'Simpan Soal'}
                    </button>
                    {editingBankSoalId ? (
                        <button type="button" onClick={resetBankForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            Batal Edit
                        </button>
                    ) : null}
                </div>
            </form>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 px-5 py-4 gap-4">
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900">Data Bank Soal</h4>
                        <p className="text-sm text-slate-500">Pastikan topik dan level Bloom terisi untuk semua soal.</p>
                    </div>
                </div>
                <div className="border-b border-slate-200 px-5 py-4">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 lg:items-end">
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Filter Mapel</span>
                            <select value={bankFilterMapel} onChange={e => setBankFilterMapel(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-2 outline-none transition focus:border-slate-900">
                                <option value="">Semua Mapel</option>
                                {(workspace.mapel_options || []).map(item => (
                                    <option key={item.id_mapel} value={item.id_mapel}>{item.nama_mapel}</option>
                                ))}
                            </select>
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Jenis Soal</span>
                            <select value={bankFilterJenis} onChange={e => setBankFilterJenis(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-2 outline-none transition focus:border-slate-900">
                                <option value="">Semua Jenis</option>
                                <option value="pilihan_ganda">Pilihan Ganda</option>
                                <option value="pilihan_ganda_kompleks">Pilihan Ganda Kompleks</option>
                                <option value="esai">Esai</option>
                            </select>
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Level Kognitif</span>
                            <select value={bankFilterLevel} onChange={e => setBankFilterLevel(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-2 outline-none transition focus:border-slate-900">
                                <option value="">Semua Level</option>
                                {BLOOM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Cari soal</span>
                            <input
                                value={bankSearch}
                                onChange={(event) => setBankSearch(event.target.value)}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 outline-none transition focus:border-slate-900"
                                placeholder="Topik atau isi soal"
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
                                <th className="px-5 py-4 font-semibold text-right">Aksi</th>
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
                                    <td className="px-5 py-4 text-slate-600">
                                        {item.jenis_soal === 'pilihan_ganda_kompleks' && item.kunci_jawaban 
                                            ? (() => { try { return JSON.parse(item.kunci_jawaban).join(', '); } catch { return item.kunci_jawaban; } })() 
                                            : item.kunci_jawaban}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button onClick={() => openEditBankSoal(item)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                                            <button onClick={() => handleDeleteBankSoal(item.id_soal)} className="text-rose-600 hover:text-rose-800 font-medium">Hapus</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && bankRows.length === 0 ? (
                                <tr><td colSpan="7" className="px-5 py-6 text-sm text-slate-500">Belum ada data bank soal yang cocok.</td></tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

        </section>
    );

    const renderJadwalCbt = () => (
        <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 px-5 py-4 gap-4">
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900">Riwayat Jadwal CBT</h4>
                        <p className="text-sm text-slate-500">Daftar sesi asesmen yang telah dibuat.</p>
                    </div>
                    <button onClick={() => setIsSesiModalOpen(true)} type="button" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 whitespace-nowrap">
                        + Buat Jadwal CBT
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                            <tr>
                                <th className="px-5 py-4 font-semibold">Tipe Soal</th>
                                <th className="px-5 py-4 font-semibold">Kelas</th>
                                <th className="px-5 py-4 font-semibold">Mapel</th>
                                <th className="px-5 py-4 font-semibold">Jenis</th>
                                <th className="px-5 py-4 font-semibold">Waktu Mulai</th>
                                <th className="px-5 py-4 font-semibold">Soal</th>
                                <th className="px-5 py-4 font-semibold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {sesiAsesmenHistory.map((item) => (
                                <tr key={item.id_sesi} className="align-top hover:bg-slate-50/70">
                                    <td className="px-5 py-4 font-semibold text-slate-900">{item.tipe_soal}</td>
                                    <td className="px-5 py-4 text-slate-600">{item.kelas?.nama_kelas}</td>
                                    <td className="px-5 py-4 text-slate-600">{item.mata_pelajaran?.nama_mapel}</td>
                                    <td className="px-5 py-4 text-slate-600 capitalize">{item.jenis_asesmen}</td>
                                    <td className="px-5 py-4 text-slate-600">{formatDateTimeLabel(item.waktu_mulai)}</td>
                                    <td className="px-5 py-4 text-slate-600">{item.detail_sesi_soal?.length || 0} soal</td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button onClick={() => fetchSesiDetail(item.id_sesi)} className="text-indigo-600 hover:text-indigo-800 font-medium">Detail</button>
                                            <button onClick={() => openEditSesiAsesmen(item)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                                            <button onClick={() => handleDeleteSesiAsesmen(item.id_sesi)} className="text-rose-600 hover:text-rose-800 font-medium">Hapus</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && sesiAsesmenHistory.length === 0 ? (
                                <tr><td colSpan="6" className="px-5 py-6 text-sm text-slate-500">Belum ada riwayat jadwal CBT.</td></tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {(sesiDetailData || sesiDetailLoading) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => !sesiDetailLoading && setSesiDetailData(null)}>
                    <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                        {sesiDetailLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                            </div>
                        ) : sesiDetailData ? (
                            <>
                                <div className="border-b border-slate-200 px-6 py-5 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Detail: {sesiDetailData.sesi.mata_pelajaran}</h3>
                                        <p className="text-sm text-slate-500 capitalize">{sesiDetailData.sesi.jenis_asesmen} — {sesiDetailData.sesi.kelas}</p>
                                    </div>
                                    <button onClick={() => setSesiDetailData(null)} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Statistik */}
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                                        <div className="rounded-2xl bg-blue-50 px-4 py-4 text-center">
                                            <p className="text-xl font-bold text-blue-700">{sesiDetailData.statistik.total_siswa}</p>
                                            <p className="text-xs text-blue-500">Total Siswa</p>
                                        </div>
                                        <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-center">
                                            <p className="text-xl font-bold text-emerald-700">{sesiDetailData.statistik.sudah_mengerjakan}</p>
                                            <p className="text-xs text-emerald-500">Sudah</p>
                                        </div>
                                        <div className="rounded-2xl bg-rose-50 px-4 py-4 text-center">
                                            <p className="text-xl font-bold text-rose-700">{sesiDetailData.statistik.belum_mengerjakan}</p>
                                            <p className="text-xs text-rose-500">Belum</p>
                                        </div>
                                        <div className="rounded-2xl bg-amber-50 px-4 py-4 text-center">
                                            <p className="text-xl font-bold text-amber-700">{sesiDetailData.statistik.rata_rata_skor}</p>
                                            <p className="text-xs text-amber-500">Rata-Rata</p>
                                        </div>
                                        <div className="rounded-2xl bg-indigo-50 px-4 py-4 text-center">
                                            <p className="text-xl font-bold text-indigo-700">{sesiDetailData.statistik.skor_tertinggi}</p>
                                            <p className="text-xs text-indigo-500">Tertinggi</p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-100 px-4 py-4 text-center">
                                            <p className="text-xl font-bold text-slate-700">{sesiDetailData.statistik.skor_terendah}</p>
                                            <p className="text-xs text-slate-500">Terendah</p>
                                        </div>
                                    </div>

                                    {/* Daftar Soal */}
                                    <details className="group rounded-2xl border border-slate-200">
                                        <summary className="cursor-pointer px-5 py-4 font-semibold text-slate-800 flex items-center justify-between">
                                            <span>📋 Daftar Soal ({sesiDetailData.soal.length} soal — Total Bobot: {sesiDetailData.total_bobot})</span>
                                            <span className="text-slate-400 group-open:rotate-180 transition">▼</span>
                                        </summary>
                                        <div className="border-t border-slate-200 px-5 py-4 space-y-3">
                                            {sesiDetailData.soal.map((s, idx) => (
                                                <div key={s.id_detail} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-bold text-slate-700">Soal {idx + 1} <span className="font-normal text-slate-400">({s.jenis_soal})</span></span>
                                                        <span className="text-xs font-medium text-slate-500">Bobot: {s.bobot_nilai}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600">{s.isi_soal}</p>
                                                    <p className="mt-1 text-xs text-emerald-600 font-medium">Kunci: {(() => { try { const arr = JSON.parse(s.kunci_jawaban); if (Array.isArray(arr)) return arr.join(', '); } catch {} return s.kunci_jawaban; })()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </details>

                                    {/* Daftar Siswa */}
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800 mb-3">👥 Status Siswa</h4>
                                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                                <thead className="bg-slate-50 text-xs uppercase tracking-[0.15em] text-slate-500">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold">Nama</th>
                                                        <th className="px-4 py-3 font-semibold">NISN</th>
                                                        <th className="px-4 py-3 font-semibold">Status</th>
                                                        <th className="px-4 py-3 font-semibold">Skor</th>
                                                        <th className="px-4 py-3 font-semibold">Benar</th>
                                                        <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {sesiDetailData.siswa.map((sw) => (
                                                        <React.Fragment key={sw.id_siswa}>
                                                            <tr className="hover:bg-slate-50/70">
                                                                <td className="px-4 py-3 font-semibold text-slate-900">{sw.nama_lengkap}</td>
                                                                <td className="px-4 py-3 text-slate-500">{sw.nisn}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${sw.status === 'sudah' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                                        {sw.status === 'sudah' ? '✓ Sudah' : '— Belum'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-600">{sw.status === 'sudah' ? `${sw.total_skor}/${sesiDetailData.total_bobot}` : '-'}</td>
                                                                <td className="px-4 py-3 text-slate-600">{sw.status === 'sudah' ? `${sw.jumlah_benar}/${sesiDetailData.soal.length}` : '-'}</td>
                                                                <td className="px-4 py-3 text-right">
                                                                    {sw.status === 'sudah' && (
                                                                        <button onClick={() => setExpandedSiswaId(expandedSiswaId === sw.id_siswa ? null : sw.id_siswa)} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">
                                                                            {expandedSiswaId === sw.id_siswa ? 'Tutup' : 'Lihat Jawaban'}
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                            {expandedSiswaId === sw.id_siswa && sw.detail_jawaban && (
                                                                <tr>
                                                                    <td colSpan="6" className="bg-slate-50 px-4 py-4">
                                                                        <div className="space-y-2">
                                                                            {sesiDetailData.soal.map((soal, sIdx) => {
                                                                                const dj = sw.detail_jawaban.find(d => d.id_detail === soal.id_detail);
                                                                                const jawSiswa = dj?.jawaban_siswa || '-';
                                                                                const kunci = soal.kunci_jawaban;
                                                                                const isCorrect = dj?.is_correct;
                                                                                const formatVal = (v) => { try { const a = JSON.parse(v); if (Array.isArray(a)) return a.join(', '); } catch {} return v || '-'; };
                                                                                return (
                                                                                    <div key={soal.id_detail} className={`rounded-xl border px-4 py-3 text-xs ${isCorrect ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
                                                                                        <div className="flex items-center justify-between mb-1">
                                                                                            <span className="font-bold text-slate-700">Soal {sIdx + 1}</span>
                                                                                            <span className={`font-bold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>{isCorrect ? '✓ Benar' : '✗ Salah'} ({dj?.skor_diperoleh ?? 0}/{soal.bobot_nilai})</span>
                                                                                        </div>
                                                                                        <div className="grid gap-2 sm:grid-cols-2 mt-1">
                                                                                            <div><span className="text-slate-500">Jawaban Siswa:</span> <span className="text-slate-800 font-medium">{formatVal(jawSiswa)}</span></div>
                                                                                            <div><span className="text-slate-500">Kunci:</span> <span className="text-emerald-700 font-medium">{formatVal(kunci)}</span></div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-slate-200 px-6 py-4 text-right">
                                    <button onClick={() => setSesiDetailData(null)} className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Tutup</button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}

            {isSesiModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <form onSubmit={submitSesiAsesmen} className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl">
                        <div className="border-b border-slate-200 px-6 py-5 flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-slate-900">Buat Jadwal Asesmen (CBT)</h3>
                            <button type="button" onClick={() => { setIsSesiModalOpen(false); setEditingSesiId(null); }} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Kelas</span>
                                    <select required value={sesiForm.id_kelas} onChange={e => setSesiForm(c => ({...c, id_kelas: e.target.value}))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900">
                                        <option value="">Pilih kelas</option>
                                        {(workspace.kelas_options || []).map(item => <option key={item.id_kelas} value={item.id_kelas}>{item.nama_kelas}</option>)}
                                    </select>
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Mata Pelajaran</span>
                                    <select required value={sesiForm.id_mapel} onChange={e => setSesiForm(c => ({...c, id_mapel: e.target.value}))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900">
                                        <option value="">Pilih mapel</option>
                                        {(workspace.mapel_options || []).map(item => <option key={item.id_mapel} value={item.id_mapel}>{item.nama_mapel}</option>)}
                                    </select>
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Tipe Soal (Label)</span>
                                    <input required value={sesiForm.tipe_soal} onChange={e => setSesiForm(c => ({...c, tipe_soal: e.target.value}))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Contoh: Soal UTS Genap" />
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Jenis Asesmen</span>
                                    <select required value={sesiForm.jenis_asesmen} onChange={e => setSesiForm(c => ({...c, jenis_asesmen: e.target.value}))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900">
                                        <option value="ujian">Ujian</option>
                                        <option value="pretest">Pretest</option>
                                        <option value="posttest">Posttest</option>
                                    </select>
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Waktu Mulai</span>
                                    <input required type="datetime-local" value={sesiForm.waktu_mulai} onChange={e => setSesiForm(c => ({...c, waktu_mulai: e.target.value}))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900" />
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Durasi (Menit)</span>
                                    <input required type="number" min="1" value={sesiForm.durasi_menit} onChange={e => setSesiForm(c => ({...c, durasi_menit: e.target.value}))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900" />
                                </label>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-base font-semibold text-slate-900">Pilih Soal dari Bank Soal ({Object.keys(selectedSoalMap).length} Terpilih)</h4>
                                </div>
                                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                                    <table className="min-w-full text-left text-sm divide-y divide-slate-200">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold text-slate-600">Pilih</th>
                                                <th className="px-4 py-3 font-semibold text-slate-600">Isi Soal</th>
                                                <th className="px-4 py-3 font-semibold text-slate-600">Mapel</th>
                                                <th className="px-4 py-3 font-semibold text-slate-600">Jenis</th>
                                                <th className="px-4 py-3 font-semibold text-slate-600">Bobot</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(workspace.bank_soal || []).map(item => (
                                                <tr key={item.id_soal} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!selectedSoalMap[item.id_soal]}
                                                            onChange={e => {
                                                                const checked = e.target.checked;
                                                                setSelectedSoalMap(curr => {
                                                                    const next = {...curr};
                                                                    if (checked) next[item.id_soal] = 10;
                                                                    else delete next[item.id_soal];
                                                                    return next;
                                                                });
                                                            }}
                                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 truncate max-w-xs">{item.isi_soal.substring(0, 50)}...</td>
                                                    <td className="px-4 py-3">{item.mata_pelajaran?.nama_mapel}</td>
                                                    <td className="px-4 py-3 capitalize">{item.jenis_soal.replace(/_/g, ' ')}</td>
                                                    <td className="px-4 py-3">
                                                        <input 
                                                            type="number" min="1"
                                                            value={selectedSoalMap[item.id_soal] || ''}
                                                            onChange={e => setSelectedSoalMap(curr => ({...curr, [item.id_soal]: Number(e.target.value)}))}
                                                            disabled={!selectedSoalMap[item.id_soal]}
                                                            className="w-16 rounded border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100 outline-none transition focus:border-slate-900"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                            {(workspace.bank_soal || []).length === 0 && (
                                                <tr><td colSpan="5" className="px-4 py-4 text-center text-slate-500">Bank soal kosong.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-end gap-3">
                            <button type="button" onClick={() => { setIsSesiModalOpen(false); setEditingSesiId(null); }} className="rounded-full px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200">Batal</button>
                            <button type="submit" disabled={Object.keys(selectedSoalMap).length === 0} className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                {editingSesiId ? 'Simpan Perubahan' : 'Simpan Jadwal & Aktifkan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </section>
    );

    const renderBeritaAcara = () => (
        <section className="space-y-6">
            <form onSubmit={submitBeritaAcara} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Berita Acara Digital</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{editingBeritaId ? 'Ubah presensi dan evaluasi pertemuan kelas' : 'Presensi dan evaluasi pertemuan kelas'}</h3>
                <p className="mt-2 text-sm text-slate-500">{editingBeritaId ? 'Mode edit aktif. Simpan perubahan untuk memperbarui BAP yang sudah ada.' : 'Isi data pertemuan, lalu tambahkan penguatan siswa jika diperlukan.'}</p>

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
                    <p className="mt-1 text-sm text-slate-500">Semua siswa aktif di kelas harus memiliki status kehadiran. Catatan pribadi dan lencana apresiasi bersifat opsional.</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {siswaBySelectedClass.map((item) => (
                            <div key={item.id_siswa} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700">
                                <div className="flex items-start justify-between gap-3">
                                    <span>
                                        {item.nama_lengkap} {item.nisn ? `(${item.nisn})` : ''}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        {ATTENDANCE_OPTIONS.find((option) => option.value === (attendanceMap[item.id_siswa] || 'hadir'))?.label || 'Hadir'}
                                    </span>
                                </div>
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
                                <div className="grid gap-3 md:grid-cols-2">
                                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        <span>Catatan pribadi opsional</span>
                                        <textarea
                                            rows="2"
                                            value={studentNoteMap[item.id_siswa] || ''}
                                            onChange={(event) =>
                                                setStudentNoteMap((current) => ({
                                                    ...current,
                                                    [item.id_siswa]: event.target.value,
                                                }))
                                            }
                                            className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none transition focus:border-slate-900"
                                            placeholder="Tambahkan penguatan singkat untuk siswa"
                                        />
                                    </label>
                                    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        <span>Lencana apresiasi opsional</span>
                                        <select
                                            value={studentBadgeMap[item.id_siswa] || ''}
                                            onChange={(event) =>
                                                setStudentBadgeMap((current) => ({
                                                    ...current,
                                                    [item.id_siswa]: event.target.value,
                                                }))
                                            }
                                            className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none transition focus:border-slate-900"
                                        >
                                            <option value="">Tanpa lencana</option>
                                            {BADGE_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            </div>
                        ))}
                        {siswaBySelectedClass.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 md:col-span-2">Belum ada siswa aktif pada kelas ini.</div>
                        ) : null}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                    <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                        {editingBeritaId ? 'Simpan Perubahan' : 'Simpan Berita Acara'}
                    </button>
                    {editingBeritaId ? (
                        <button type="button" onClick={resetBeritaForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            Batal Edit
                        </button>
                    ) : null}
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
                                <th className="px-5 py-4 font-semibold">Catatan / Badge</th>
                                <th className="px-5 py-4 font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {beritaRows.map((item, index) => (
                                <tr key={item.id_berita_acara} className="align-top hover:bg-slate-50/70">
                                    <td className="px-5 py-4 font-semibold text-slate-500">{index + 1}</td>
                                    <td className="px-5 py-4 text-slate-600">{formatDateLabel(item.tanggal)}</td>
                                    <td className="px-5 py-4 font-semibold text-slate-900">{item.kelas?.nama_kelas || '-'}</td>
                                    <td className="px-5 py-4 text-slate-600">{item.mata_pelajaran?.nama_mapel || '-'}</td>
                                    <td className="px-5 py-4 text-slate-600">Pertemuan ke-{item.pertemuan_ke}</td>
                                    <td className="px-5 py-4 text-slate-600">{item.materi_bahasan}</td>
                                    <td className="px-5 py-4 text-slate-600">
                                        <div className="font-medium text-slate-900">{attendanceSummary(item.kehadiran_siswa)}</div>
                                        <div className="mt-1 text-xs text-slate-500">{optionalSummary(item.kehadiran_siswa)}</div>
                                    </td>
                                    <td className="px-5 py-4 text-slate-600">
                                        {(item.kehadiran_siswa || []).some((row) => String(row.catatan_pribadi || '').trim() || String(row.jenis_badge || '').trim()) ? (
                                            <div className="space-y-2">
                                                {(item.kehadiran_siswa || []).filter((row) => String(row.catatan_pribadi || '').trim() || String(row.jenis_badge || '').trim()).map((row) => (
                                                    <div key={`${item.id_berita_acara}-${row.id_siswa}`} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                                        <p className="font-semibold text-slate-900">Siswa {row.id_siswa}</p>
                                                        {row.catatan_pribadi ? <p className="mt-1">Catatan: {row.catatan_pribadi}</p> : null}
                                                        {row.jenis_badge ? <p className="mt-1">Badge: {row.jenis_badge}</p> : null}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">Tidak ada penguatan</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-slate-600">
                                        <button
                                            type="button"
                                            onClick={() => openEditBeritaAcara(item)}
                                            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && beritaRows.length === 0 ? (
                                <tr><td colSpan="9" className="px-5 py-6 text-sm text-slate-500">Belum ada data berita acara yang cocok.</td></tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );

    const renderContent = () => {
        if (mode === 'jadwal-cbt') {
            return renderJadwalCbt();
        }

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

                {successPopup ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
                        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-800">
                                <p className="text-sm font-semibold uppercase tracking-[0.2em]">{successPopup.title}</p>
                                <p className="mt-2 text-sm">{successPopup.message}</p>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button type="button" onClick={closeSuccessPopup} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
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
