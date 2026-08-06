import React, { useState, useMemo } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';
import { formatDateLabel } from '../lib/date';
import useGuruWorkspace from '../hooks/useGuruWorkspace';
import { guruNavigation } from './guru/guruNavigation';

const BADGE_OPTIONS = [
    { value: 'Bintang Sains', label: '🌟 Bintang Sains (Akademik)' },
    { value: 'Pemikir Kritis', label: '💡 Pemikir Kritis (Keaktifan)' },
    { value: 'Teknolog Muda', label: '🚀 Teknolog Muda (STEM)' },
    { value: 'Master Disiplin', label: '⏱️ Master Disiplin (Karakter)' },
    { value: 'Pin Literasi', label: '📖 Pin Literasi (Bahasa)' },
    { value: 'Seniman Budaya', label: '🎨 Seniman Budaya (Seni)' },
    { value: 'Hati Emas', label: '❤️ Hati Emas (Spiritual/Empati)' },
    { value: 'Atlet Tangguh', label: '👟 Atlet Tangguh (Fisik)' },
    { value: 'Pahlawan Sportivitas', label: '🏅 Pahlawan Sportivitas (Karakter)' },
    { value: 'Katalis Tim', label: '🙌 Katalis Tim (Kerja Sama)' },
];

const ATTENDANCE_OPTIONS = [
    { value: 'hadir', label: 'Hadir' },
    { value: 'izin', label: 'Izin' },
    { value: 'sakit', label: 'Sakit' },
    { value: 'alpa', label: 'Alpa' },
];

export default function GuruBeritaAcaraPage({ session, onLogout }) {
    const { summary, workspace, loading, reloadWorkspace } = useGuruWorkspace(session);
    
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [successPopup, setSuccessPopup] = useState(null);

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

    const showToast = (message) => {
        setToast(message);
        window.setTimeout(() => setToast(''), 3200);
    };

    const showSuccessPopup = (title, message) => setSuccessPopup({ title, message });
    const closeSuccessPopup = () => setSuccessPopup(null);

    const studentNameMap = useMemo(() => {
        const map = {};
        if (workspace?.students_by_class) {
            Object.values(workspace.students_by_class).forEach(students => {
                students.forEach(student => {
                    map[student.id_siswa] = student.nama_lengkap;
                });
            });
        }
        return map;
    }, [workspace?.students_by_class]);

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

    return (
        <DashboardLayout
            navigation={guruNavigation}
            user={session?.user}
            profileHref="/guru/profil"
            onLogout={onLogout}
            title="Berita Acara"
            subtitle="Presensi & Evaluasi Kelas"
        >
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="flex flex-col gap-6">
                    <div className="rounded-2xl sm:rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary p-4 sm:p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-48 w-48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                            <div className="flex-1">
                                <p className="text-xs font-bold uppercase tracking-[0.4em] text-accent">Berita Acara Digital</p>
                                <h3 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#EEDCC8]">Presensi & Evaluasi Kelas</h3>
                                <p className="mt-2 max-w-xl text-base text-accent">Kelola data pertemuan, kehadiran, dan berikan apresiasi kepada siswa secara langsung.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full xl:w-[60%]">
                                <StatCard label="Total Kelas" value={loading ? '...' : (workspace?.kelas_options || []).length} description="Kelas yang diampu" tone="slate" className="!bg-[#EEDCC8] !border-transparent h-full" />
                                <StatCard label="Total BAP" value={loading ? '...' : (workspace?.berita_acara || []).length} description="Semua Berita Acara" tone="blue" className="!bg-[#EEDCC8] !border-transparent h-full" />
                               
                            </div>
                        </div>
                    </div>
                </section>

                <form onSubmit={submitBeritaAcara} className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-slate-900 border-b border-border pb-4">{editingBeritaId ? 'Ubah presensi dan evaluasi pertemuan kelas' : 'Input Presensi dan Evaluasi (BAP)'}</h3>
                    <p className="mt-4 text-sm text-slate-500">{editingBeritaId ? 'Mode edit aktif. Simpan perubahan untuk memperbarui BAP yang sudah ada.' : 'Isi data pertemuan, lalu tambahkan penguatan siswa jika diperlukan.'}</p>
                    
                    {error && (
                        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                            {error}
                        </div>
                    )}

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
                                        {item.nama_lengkap || item.nama_mapel}
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

                    <div className="mt-6 rounded-2xl border border-border bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">Presensi Siswa</p>
                        <p className="mt-1 text-sm text-slate-500">Semua siswa aktif di kelas harus memiliki status kehadiran. Catatan pribadi dan lencana apresiasi bersifat opsional.</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {siswaBySelectedClass.map((item) => (
                                <div key={item.id_siswa} className="space-y-3 rounded-2xl border border-border bg-white p-3 text-sm font-medium text-slate-700">
                                    <div className="flex items-start justify-between gap-3">
                                        <span>{item.nama_lengkap} {item.nisn ? `(${item.nisn})` : ''}</span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            {ATTENDANCE_OPTIONS.find((option) => option.value === (attendanceMap[item.id_siswa] || 'hadir'))?.label || 'Hadir'}
                                        </span>
                                    </div>
                                    <select
                                        value={attendanceMap[item.id_siswa] || 'hadir'}
                                        onChange={(event) => setAttendanceMap((current) => ({ ...current, [item.id_siswa]: event.target.value }))}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-slate-900"
                                    >
                                        {ATTENDANCE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            <span>Catatan pribadi opsional</span>
                                            <textarea
                                                rows="2"
                                                value={studentNoteMap[item.id_siswa] || ''}
                                                onChange={(event) => setStudentNoteMap((current) => ({ ...current, [item.id_siswa]: event.target.value }))}
                                                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none transition focus:border-slate-900"
                                                placeholder="Tambahkan penguatan singkat untuk siswa"
                                            />
                                        </label>
                                        <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            <span>Lencana apresiasi opsional</span>
                                            <select
                                                value={studentBadgeMap[item.id_siswa] || ''}
                                                onChange={(event) => setStudentBadgeMap((current) => ({ ...current, [item.id_siswa]: event.target.value }))}
                                                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none transition focus:border-slate-900"
                                            >
                                                <option value="">Tanpa lencana</option>
                                                {BADGE_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            ))}
                            {siswaBySelectedClass.length === 0 ? (
                                <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-slate-500 md:col-span-2">Belum ada siswa aktif pada kelas ini.</div>
                            ) : null}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                        <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/85">
                            {editingBeritaId ? 'Simpan Perubahan' : 'Simpan Berita Acara'}
                        </button>
                        {editingBeritaId ? (
                            <button type="button" onClick={resetBeritaForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                Batal Edit
                            </button>
                        ) : null}
                    </div>
                </form>

                <div className="overflow-hidden rounded-3xl border border-border bg-white">
                    <div className="border-b border-border px-5 py-4">
                        <h4 className="text-lg font-semibold text-slate-900">Data Berita Acara</h4>
                        <p className="text-sm text-slate-500">Presensi harian dan evaluasi kelas yang sudah tersimpan.</p>
                    </div>
                    <div className="border-b border-border px-5 py-4">
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
                            <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
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
                                        <td className="px-5 py-4 text-slate-600">{item.mata_pelajaran?.nama_lengkap || item.mata_pelajaran?.nama_mapel || '-'}</td>
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
                                                            <p className="font-semibold text-slate-900">{studentNameMap[row.id_siswa] || `Siswa ${row.id_siswa}`}</p>
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
            </div>

            {successPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-slate-900">{successPopup.title}</h3>
                        <p className="mb-6 text-sm text-slate-500">{successPopup.message}</p>
                        <button onClick={closeSuccessPopup} className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Tutup</button>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-4 right-4 z-[100] rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-xl">
                    {toast}
                </div>
            )}
        </DashboardLayout>
    );
}
