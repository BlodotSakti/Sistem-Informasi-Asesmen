import React, { useEffect, useMemo, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';
import { formatDateLabel, formatDateTimeLabel } from '../lib/date';
import { guruNavigation } from './guru/guruNavigation';

const BLOOM_OPTIONS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
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
        opsi_jawaban: ['', '', '', ''],
        kunci_jawaban: '',
        kunci_jawaban_kompleks: [],
        topik_materi: '',
        level_kognitif: '',
        gambar_soal: null,
        gambar_soal_url: '',
        hapus_gambar: false,
    });
    const [bankSearch, setBankSearch] = useState('');
    const [bankFilterMapel, setBankFilterMapel] = useState('');
    const [bankFilterJenis, setBankFilterJenis] = useState('');
    const [bankFilterLevel, setBankFilterLevel] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importTargetMapel, setImportTargetMapel] = useState('');
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
        waktu_selesai: '',
        durasi_menit: 60,
        boleh_ulang: false,
    });
    const [selectedSoalMap, setSelectedSoalMap] = useState({});
    const [sharedBankSoal, setSharedBankSoal] = useState([]);
    const [sharedBankSoalLoading, setSharedBankSoalLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                
                if (data.length === 0) {
                    alert('File Excel kosong atau format tidak sesuai.');
                    return;
                }

                if (!importTargetMapel) {
                    alert('Silakan pilih mata pelajaran terlebih dahulu.');
                    return;
                }

                // Map data from excel using importTargetMapel
                const soalArray = data.map(row => {
                    let opsi = [];
                    const opsiKeys = Object.keys(row).filter(key => key.startsWith('opsi_')).sort();
                    opsiKeys.forEach(key => {
                        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
                            opsi.push(String(row[key]));
                        }
                    });

                    return {
                        isi_soal: String(row.isi_soal || ''),
                        jenis_soal: row.jenis_soal || 'pilihan_ganda',
                        kunci_jawaban: String(row.kunci_jawaban || ''),
                        topik_materi: row.topik_materi || 'Umum',
                        level_kognitif: row.level_kognitif || 'C1',
                        opsi_jawaban: opsi
                    };
                });

                await apiFetch('/api/guru/bank-soal/bulk', session, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_mapel: parseInt(importTargetMapel),
                        soal: soalArray
                    })
                });
                
                alert('Berhasil mengimpor soal dari Excel!');
                setIsImportModalOpen(false);
                setImportTargetMapel('');
                
                // Reload data
                const response = await apiFetch('/api/guru/workspace-data', session);
                setWorkspace(response);
            } catch (err) {
                console.error(err);
                alert('Terjadi kesalahan saat memproses file Excel: ' + (err.message || err));
            }
        };
        reader.readAsBinaryString(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const downloadTemplateExcel = () => {
        const headers = [
            "isi_soal", 
            "opsi_a", 
            "opsi_b", 
            "opsi_c", 
            "opsi_d", 
            "opsi_e", 
            "kunci_jawaban", 
            "jenis_soal", 
            "topik_materi", 
            "level_kognitif"
        ];
        
        const exampleData = [
            {
                "isi_soal": "Siapakah penemu bola lampu?",
                "opsi_a": "Albert Einstein",
                "opsi_b": "Thomas Edison",
                "opsi_c": "Nikola Tesla",
                "opsi_d": "Isaac Newton",
                "opsi_e": "Galileo Galilei",
                "kunci_jawaban": "Thomas Edison",
                "jenis_soal": "pilihan_ganda",
                "topik_materi": "Sejarah Penemuan",
                "level_kognitif": "C1"
            },
            {
                "isi_soal": "1 + 1 = ?",
                "opsi_a": "1",
                "opsi_b": "2",
                "opsi_c": "3",
                "opsi_d": "4",
                "opsi_e": "5",
                "kunci_jawaban": "2",
                "jenis_soal": "pilihan_ganda",
                "topik_materi": "Matematika Dasar",
                "level_kognitif": "C2"
            },
            {
                "isi_soal": "Manakah dari berikut ini yang merupakan bahasa pemrograman?",
                "opsi_a": "Python",
                "opsi_b": "Kobra",
                "opsi_c": "JavaScript",
                "opsi_d": "HTML",
                "opsi_e": "C++",
                "kunci_jawaban": "Python, JavaScript, C++",
                "jenis_soal": "pilihan_ganda_kompleks",
                "topik_materi": "Informatika",
                "level_kognitif": "C2"
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template Soal");

        // Set column widths for better readability
        const wscols = [
            {wch: 40}, // isi_soal
            {wch: 20}, // opsi_a
            {wch: 20}, // opsi_b
            {wch: 20}, // opsi_c
            {wch: 20}, // opsi_d
            {wch: 20}, // opsi_e
            {wch: 20}, // kunci_jawaban
            {wch: 15}, // jenis_soal
            {wch: 20}, // topik_materi
            {wch: 15}, // level_kognitif
        ];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, "Template_Import_Soal_SMAN.xlsx");
    };

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
        const fetchSharedSoal = async () => {
            if (!sesiForm.id_mapel) {
                setSharedBankSoal([]);
                return;
            }
            try {
                setSharedBankSoalLoading(true);
                const data = await apiFetch(`/api/guru/bank-soal-shared/${sesiForm.id_mapel}`, session);
                setSharedBankSoal(data || []);
            } catch (err) {
                console.error("Failed to fetch shared bank soal", err);
            } finally {
                setSharedBankSoalLoading(false);
            }
        };

        if (isSesiModalOpen) {
            fetchSharedSoal();
        }
    }, [sesiForm.id_mapel, isSesiModalOpen, session]);

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

    const groupedBankSoal = useMemo(() => {
        return bankRows.reduce((acc, soal) => {
            const id = soal.id_mapel;
            if (!acc[id]) {
                acc[id] = {
                    mapel: soal.mata_pelajaran,
                    soals: []
                };
            }
            acc[id].soals.push(soal);
            return acc;
        }, {});
    }, [bankRows]);

    const [expandedBankFolders, setExpandedBankFolders] = useState({});
    const toggleBankFolder = (id_mapel) => {
        setExpandedBankFolders(prev => ({ ...prev, [id_mapel]: !prev[id_mapel] }));
    };

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
                showSuccessPopup('Validasi Gagal', 'Pilih minimal satu soal dan tentukan bobot nilainya.');
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
                    waktu_selesai: sesiForm.waktu_selesai,
                    durasi_menit: Number(sesiForm.durasi_menit),
                    boleh_ulang: sesiForm.boleh_ulang,
                    soal: soalArr,
                }),
            });

            showSuccessPopup('Berhasil', isEditing ? 'Sesi Asesmen berhasil diperbarui.' : 'Sesi Asesmen berhasil dibuat.');
            setIsSesiModalOpen(false);
            setEditingSesiId(null);
            setSelectedSoalMap({});
            setSesiForm({
                id_kelas: '', id_mapel: '', tipe_soal: '', jenis_asesmen: 'ujian', waktu_mulai: '', waktu_selesai: '', durasi_menit: 60, boleh_ulang: false
            });
            await reloadWorkspace();
        } catch (exception) {
            showSuccessPopup('Gagal Menyimpan Jadwal', exception.message || 'Gagal menyimpan sesi asesmen.');
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
            waktu_selesai: item.waktu_selesai ? new Date(new Date(item.waktu_selesai).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
            durasi_menit: item.durasi_menit || 60,
            boleh_ulang: !!item.boleh_ulang,
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
            showSuccessPopup('Berhasil', 'Jadwal CBT berhasil dihapus.');
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
            opsi_jawaban: item.opsi_jawaban || ['', '', '', ''],
            kunci_jawaban: item.jenis_soal !== 'pilihan_ganda_kompleks' ? item.kunci_jawaban : '',
            kunci_jawaban_kompleks: item.jenis_soal === 'pilihan_ganda_kompleks' ? (function() { try { return JSON.parse(item.kunci_jawaban); } catch { return []; } })() : [],
            topik_materi: item.topik_materi || '',
            level_kognitif: item.level_kognitif || '',
            gambar_soal: null,
            gambar_soal_url: item.gambar_soal ? `/storage/${item.gambar_soal}` : '',
            hapus_gambar: false,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetBankForm = () => {
        setEditingBankSoalId(null);
        setBankForm((current) => ({
            ...current,
            isi_soal: '',
            opsi_jawaban: ['', '', '', ''],
            kunci_jawaban: '',
            kunci_jawaban_kompleks: [],
            topik_materi: '',
            level_kognitif: '',
            gambar_soal: null,
            gambar_soal_url: '',
            hapus_gambar: false,
        }));
    };

    const handleDeleteBankSoal = async (id) => {
        if (!window.confirm('Yakin ingin menghapus soal ini?')) return;
        try {
            await apiFetch(`/api/guru/bank-soal/${id}`, session, { method: 'DELETE' });
            showSuccessPopup('Berhasil', 'Soal berhasil dihapus.');
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
                showSuccessPopup('Validasi Gagal', 'Topik materi dan level kognitif Bloom wajib diisi sebelum menyimpan soal.');
                return;
            }

            const opsiJawaban = bankForm.opsi_jawaban
                .map((item) => item.trim())
                .filter(Boolean);

            const isEditing = editingBankSoalId !== null;
            
            const formData = new FormData();
            formData.append('id_mapel', Number(bankForm.id_mapel));
            formData.append('isi_soal', bankForm.isi_soal);
            formData.append('jenis_soal', bankForm.jenis_soal);
            formData.append('topik_materi', bankForm.topik_materi);
            formData.append('level_kognitif', bankForm.level_kognitif);

            if (bankForm.jenis_soal === 'pilihan_ganda' || bankForm.jenis_soal === 'pilihan_ganda_kompleks') {
                opsiJawaban.forEach(ops => {
                    formData.append('opsi_jawaban[]', ops);
                });
            }

            if (bankForm.jenis_soal === 'pilihan_ganda_kompleks') {
                bankForm.kunci_jawaban_kompleks.forEach(kunci => {
                    formData.append('kunci_jawaban[]', kunci);
                });
            } else {
                formData.append('kunci_jawaban', bankForm.kunci_jawaban);
            }

            if (bankForm.gambar_soal instanceof File) {
                formData.append('gambar_soal', bankForm.gambar_soal);
            } else if (bankForm.hapus_gambar) {
                formData.append('hapus_gambar', 'true');
            }

            if (isEditing) {
                formData.append('_method', 'PATCH');
            }

            await apiFetch(isEditing ? `/api/guru/bank-soal/${editingBankSoalId}` : '/api/guru/bank-soal', session, {
                method: 'POST',
                body: formData,
            });

            showSuccessPopup('Berhasil', isEditing ? 'Bank soal berhasil diperbarui.' : 'Bank soal berhasil disimpan.');

            resetBankForm();
            await reloadWorkspace();
        } catch (exception) {
            showSuccessPopup('Gagal Menyimpan Soal', exception.message || 'Gagal menyimpan bank soal.');
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

    const navigation = guruNavigation;

    const renderDashboard = () => (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary p-8 shadow-lg backdrop-blur-xl relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.4em] text-accent">Ringkasan Aktivitas Harian</p>
                        <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-[#EEDCC8]">Halo, {session?.user?.nama_lengkap || 'Guru'}! 👋</h3>
                        <p className="mt-2 max-w-2xl text-base text-accent">Fokus pada apa yang paling penting hari ini. Kelola penilaian, buat soal, atau persiapkan asesmen CBT selanjutnya.</p>
                    </div>
                    <div className="flex gap-3 mt-4 sm:mt-0">
                        <button onClick={() => window.location.href='/guru/bank-soal'} className="rounded-full border border-[#EEDCC8]/20 bg-white/10 px-6 py-3 text-sm font-semibold text-[#EEDCC8] shadow-md transition-all hover:bg-white/20 hover:scale-105 backdrop-blur-md">
                            + Buat Soal
                        </button>
                    </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4 relative z-10">
                    <StatCard label="Kelas Diampu" value={loading ? '...' : summary?.cards?.total_kelas ?? 0} description="Total kelas aktif" tone="slate" className="!bg-[#EEDCC8] !border-transparent" />
                    <StatCard label="Bank Soal" value={loading ? '...' : summary?.cards?.total_bank_soal ?? 0} description="Soal yang Anda buat" tone="blue" className="!bg-[#EEDCC8] !border-transparent" />
                    <StatCard label="Penugasan" value={loading ? '...' : summary?.cards?.total_penugasan ?? 0} description="Relasi mapel & kelas" tone="emerald" className="!bg-[#EEDCC8] !border-transparent" />
                    <StatCard label="Ujian Aktif" value={loading ? '...' : summary?.cards?.ujian_aktif ?? 0} description="Jadwal CBT aktif" tone="amber" className="!bg-[#EEDCC8] !border-transparent" />
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_2fr]">
                <div className="rounded-[2rem] border border-border bg-white/60 p-6 backdrop-blur-xl shadow-sm flex flex-col">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">To-Do Prioritas</p>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">Jadwal Asesmen</h3>
                    <p className="mt-1 text-sm text-slate-500">Daftar agenda CBT terdekat yang butuh perhatian.</p>
                    <div className="mt-6 flex-grow space-y-4">
                        {(summary?.upcoming_schedules || []).map((item) => (
                            <div key={item.title + item.meta} className="rounded-2xl border border-border bg-white p-5 transition-all hover:bg-slate-50 hover:shadow-md cursor-default shadow-sm group">
                                <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{item.title}</p>
                                <p className="mt-1 text-sm text-slate-500 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {item.meta}
                                </p>
                                <p className="mt-3 inline-block rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200/50">{item.note}</p>
                            </div>
                        ))}
                        {!loading && (summary?.upcoming_schedules || []).length === 0 ? (
                            <div className="flex h-32 flex-col items-center justify-center rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 text-center border border-dashed border-slate-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Tidak ada jadwal mendesak.
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="rounded-[2rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary p-8 text-white shadow-lg flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Dashboard Analitik</p>
                            <h3 className="mt-1 text-2xl font-bold text-[#EEDCC8] tracking-tight">Insight Diagnostik & Area Peningkatan</h3>
                        </div>
                        <button 
                            onClick={() => window.location.href = '/guru/arsip-diagnostik'}
                            className="flex w-fit items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-accent shadow-sm transition hover:bg-white/20 border border-white/10"
                        >
                            Lihat Semua Arsip
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                    </div>
                    <p className="relative z-10 mt-3 text-sm text-accent max-w-lg">Deteksi tren penurunan nilai maupun kelemahan spesifik secara lebih dini untuk evaluasi pembelajaran yang dipersonalisasi.</p>
                    
                    <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2 flex-grow">
                        {(diagnostics?.data || []).slice(0, 4).map((item) => (
                            <div key={item.id_analisis} className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20">
                                <div>
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-bold text-white truncate">{item.siswa?.nama_lengkap || 'Siswa'}</p>
                                        <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black tracking-wide ${item.skor_total >= 80 ? 'bg-emerald-500/20 text-emerald-300' : item.skor_total >= 60 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'}`}>{item.skor_total} Pts</span>
                                    </div>
                                    <p className="mt-1.5 text-xs font-medium text-slate-400">{item.sesi_asesmen?.mata_pelajaran?.nama_mapel || 'Mapel'} • {item.tanggal_generate}</p>
                                </div>
                                <div className="mt-5 pt-4 border-t border-white/10">
                                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Area Peningkatan:</p>
                                    <p className="mt-2 text-sm text-slate-400 line-clamp-3 leading-relaxed">
                                        {item.area_peningkatan || 'Masih membutuhkan lebih banyak latihan untuk menemukan pola kelemahan yang spesifik.'}
                                    </p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                                    <button 
                                        onClick={() => window.location.href = `/guru/laporan-diagnostik/${item.id_analisis}`}
                                        className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-slate-400 transition bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg"
                                    >
                                        Lihat Laporan Lengkap
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {!loading && (diagnostics?.data || []).length === 0 ? (
                            <div className="col-span-full flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-sm text-slate-400 backdrop-blur-sm">
                                Belum ada data analisis diagnostik yang diproses oleh AI.
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>
        </div>
    );

    const renderBankSoal = () => (
        <section className="space-y-6">
            <section className="overflow-hidden rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary p-8 shadow-lg backdrop-blur-xl relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.4em] text-accent">Bank Soal Guru</p>
                        <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-[#EEDCC8]">Manajemen Bank Soal</h3>
                        <p className="mt-2 max-w-2xl text-base text-accent">Buat, kelola, dan atur soal-soal Anda untuk persiapan asesmen siswa.</p>
                    </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3 relative z-10">
                    <StatCard label="Total Bank Soal" value={loading ? '...' : summary?.cards?.total_bank_soal ?? 0} description="Kumpulan soal Anda" tone="blue" className="!bg-[#EEDCC8] !border-transparent" />
                    <StatCard label="Total Penugasan" value={loading ? '...' : summary?.cards?.total_penugasan ?? 0} description="Relasi mapel & kelas" tone="emerald" className="!bg-[#EEDCC8] !border-transparent" />
                    <StatCard label="Ujian Aktif" value={loading ? '...' : summary?.cards?.ujian_aktif ?? 0} description="Jadwal CBT aktif" tone="amber" className="!bg-[#EEDCC8] !border-transparent" />
                </div>
            </section>

            <form onSubmit={submitBankSoal} className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900 border-b border-border pb-4">Input soal digital terstruktur</h3>

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
                                    {item.nama_lengkap || item.nama_mapel}
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

                    <div className="md:col-span-2">
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Gambar Pendukung (Opsional)</span>
                            <div className="flex flex-col gap-3">
                                {bankForm.gambar_soal_url && !bankForm.hapus_gambar && (
                                    <div className="relative w-max">
                                        <img src={bankForm.gambar_soal_url} alt="Gambar Soal" className="max-h-40 rounded-xl border border-border object-cover shadow-sm" />
                                        <button 
                                            type="button" 
                                            onClick={() => setBankForm(curr => ({ ...curr, hapus_gambar: true, gambar_soal: null }))}
                                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow"
                                            title="Hapus Gambar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setBankForm(curr => ({ ...curr, gambar_soal: e.target.files[0], hapus_gambar: false }));
                                        }
                                    }}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary/5 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/10"
                                />
                            </div>
                        </label>
                    </div>

                    {bankForm.jenis_soal === 'pilihan_ganda' || bankForm.jenis_soal === 'pilihan_ganda_kompleks' ? (
                        <div className="md:col-span-2 space-y-3">
                            {bankForm.opsi_jawaban.map((opsi, idx) => (
                                <label key={idx} className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
                                    <div className="flex items-center justify-between">
                                        <span>Opsi {String.fromCharCode(65 + idx)}</span>
                                        {bankForm.opsi_jawaban.length > 2 && (
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    const newOpsi = [...bankForm.opsi_jawaban];
                                                    newOpsi.splice(idx, 1);
                                                    setBankForm(curr => ({ ...curr, opsi_jawaban: newOpsi }));
                                                }}
                                                className="text-rose-500 hover:text-rose-700 text-xs"
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                    <input 
                                        value={opsi} 
                                        onChange={(event) => {
                                            const newOpsi = [...bankForm.opsi_jawaban];
                                            newOpsi[idx] = event.target.value;
                                            setBankForm(curr => ({ ...curr, opsi_jawaban: newOpsi }));
                                        }} 
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" 
                                    />
                                </label>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => setBankForm(curr => ({ ...curr, opsi_jawaban: [...curr.opsi_jawaban, ''] }))}
                                className="mt-2 text-sm text-primary font-semibold hover:text-primary/85"
                            >
                                + Tambah Opsi Jawaban
                            </button>
                        </div>
                    ) : null}

                    <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                        <span>Kunci Jawaban</span>
                        {bankForm.jenis_soal === 'pilihan_ganda_kompleks' ? (
                            <div className="flex flex-wrap gap-4 pt-2">
                                {bankForm.opsi_jawaban.filter(Boolean).map((opsi, idx) => (
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
                                {bankForm.opsi_jawaban.filter(Boolean).length === 0 && (
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
                    <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/85">
                        {editingBankSoalId ? 'Simpan Perubahan' : 'Simpan Soal'}
                    </button>
                    {editingBankSoalId ? (
                        <button type="button" onClick={resetBankForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            Batal Edit
                        </button>
                    ) : null}
                </div>
            </form>

            <div className="overflow-hidden rounded-3xl border border-border bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border px-5 py-4 gap-4">
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900">Data Bank Soal</h4>
                        <p className="text-sm text-slate-500">Pastikan topik dan level Bloom terisi untuk semua soal.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={downloadTemplateExcel} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition shadow-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Unduh Template
                        </button>
                        <button type="button" onClick={() => setIsImportModalOpen(true)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition shadow-sm">
                            Import Excel
                        </button>
                    </div>
                </div>
                <div className="border-b border-border px-5 py-4">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 lg:items-end">
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Filter Mapel</span>
                            <select value={bankFilterMapel} onChange={e => setBankFilterMapel(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-2 outline-none transition focus:border-slate-900">
                                <option value="">Semua Mapel</option>
                                {(workspace.mapel_options || []).map(item => (
                                    <option key={item.id_mapel} value={item.id_mapel}>{item.nama_lengkap || item.nama_mapel}</option>
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
                        <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
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
                            {Object.entries(groupedBankSoal).map(([id_mapel, group]) => (
                                <React.Fragment key={id_mapel}>
                                    <tr 
                                        className="cursor-pointer bg-primary/5/50 hover:bg-primary/5 transition-colors"
                                        onClick={() => toggleBankFolder(id_mapel)}
                                    >
                                        <td colSpan="7" className="px-5 py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className={`transform transition-transform ${expandedBankFolders[id_mapel] ? 'rotate-90' : ''}`}>
                                                        ▶
                                                    </span>
                                                    <span className="font-bold text-slate-900">
                                                        📁 {group.mapel?.nama_lengkap || group.mapel?.nama_mapel || 'Mapel Tidak Diketahui'}
                                                    </span>
                                                </div>
                                                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary/90">
                                                    {group.soals.length} Soal
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedBankFolders[id_mapel] && group.soals.map((item, index) => (
                                        <tr key={item.id_soal} className="align-top hover:bg-slate-50/70 border-l-4 border-blue-500">
                                            <td className="px-5 py-4 font-semibold text-slate-500 pl-6">{index + 1}</td>
                                            <td className="px-5 py-4 font-semibold text-slate-900">{item.mata_pelajaran?.nama_lengkap || item.mata_pelajaran?.nama_mapel || '-'}</td>
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
                                                    <button onClick={() => openEditBankSoal(item)} className="text-primary hover:text-primary/85 font-medium">Edit</button>
                                                    <button onClick={() => handleDeleteBankSoal(item.id_soal)} className="text-rose-600 hover:text-rose-800 font-medium">Hapus</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
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
            <section className="overflow-hidden rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary p-8 shadow-lg backdrop-blur-xl relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.4em] text-accent">Manajemen Jadwal Ujian</p>
                        <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-[#EEDCC8]">Jadwal CBT</h3>
                        <p className="mt-2 max-w-2xl text-base text-accent">Buat dan kelola sesi ujian (Computer Based Test) untuk siswa-siswi Anda di sini.</p>
                    </div>
                    <div className="flex gap-3 mt-4 sm:mt-0">
                        <button onClick={() => setIsSesiModalOpen(true)} type="button" className="rounded-full border border-[#EEDCC8]/20 bg-white/10 px-6 py-3 text-sm font-semibold text-[#EEDCC8] shadow-md transition-all hover:bg-white/20 hover:scale-105 backdrop-blur-md whitespace-nowrap">
                            + Buat Jadwal CBT
                        </button>
                    </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3 relative z-10">
                    <StatCard label="Total Jadwal" value={loading ? '...' : sesiAsesmenHistory.length} description="Semua sesi ujian yang pernah dibuat" tone="slate" className="!bg-[#EEDCC8] !border-transparent" />
                    <StatCard label="Ujian Aktif" value={loading ? '...' : summary?.cards?.ujian_aktif ?? 0} description="Ujian yang sedang berlangsung atau akan datang" tone="amber" className="!bg-[#EEDCC8] !border-transparent" />
                    <StatCard label="Total Penugasan" value={loading ? '...' : summary?.cards?.total_penugasan ?? 0} description="Relasi mengajar" tone="emerald" className="!bg-[#EEDCC8] !border-transparent" />
                </div>
            </section>

            <div className="overflow-hidden rounded-3xl border border-border bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border px-5 py-4 gap-4">
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900">Daftar Jadwal CBT</h4>
                        <p className="text-sm text-slate-500">Daftar sesi asesmen yang telah dibuat.</p>
                    </div>
                    <button onClick={() => setIsSesiModalOpen(true)} type="button" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/85 whitespace-nowrap">
                        + Buat Jadwal CBT
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                            <tr>
                                <th className="px-5 py-4 font-semibold">Tipe Soal</th>
                                <th className="px-5 py-4 font-semibold">Kelas</th>
                                <th className="px-5 py-4 font-semibold">Mapel</th>
                                <th className="px-5 py-4 font-semibold">Tipe</th>
                                <th className="px-5 py-4 font-semibold">Waktu Pelaksanaan</th>
                                <th className="px-5 py-4 font-semibold">Durasi</th>
                                <th className="px-5 py-4 font-semibold text-center">Ulang</th>
                                <th className="px-5 py-4 font-semibold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {sesiAsesmenHistory.map((item) => (
                                <tr key={item.id_sesi} className="align-top hover:bg-slate-50/70">
                                    <td className="px-5 py-4 font-semibold text-slate-900">{item.tipe_soal}</td>
                                    <td className="px-5 py-4 text-slate-600">{item.kelas?.nama_kelas}</td>
                                    <td className="px-5 py-4 text-slate-600">{item.mata_pelajaran?.nama_lengkap || item.mata_pelajaran?.nama_mapel}</td>
                                    <td className="px-5 py-4 text-slate-600">{item.tipe_soal || '-'} • {item.jenis_asesmen || '-'}</td>
                                    <td className="px-5 py-4 text-slate-600">
                                        <div className="font-medium text-slate-900">{formatDateTimeLabel(item.waktu_mulai)}</div>
                                        {item.waktu_selesai ? <div className="mt-1 text-xs text-rose-600 font-medium">S/d: {formatDateTimeLabel(item.waktu_selesai)}</div> : null}
                                    </td>
                                    <td className="px-5 py-4 text-slate-600">{item.durasi_menit} mnt</td>
                                    <td className="px-5 py-4 text-center">
                                        {item.boleh_ulang ? (
                                            <span className="inline-flex items-center rounded-full bg-primary/5 px-2.5 py-0.5 text-xs font-semibold text-primary">Boleh</span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">Sekali</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button onClick={() => fetchSesiDetail(item.id_sesi)} className="text-primary hover:text-primary/85 font-medium">Detail</button>
                                            <button onClick={() => openEditSesiAsesmen(item)} className="text-primary hover:text-primary/85 font-medium">Edit</button>
                                            <button onClick={() => handleDeleteSesiAsesmen(item.id_sesi)} className="text-rose-600 hover:text-rose-800 font-medium">Hapus</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && sesiAsesmenHistory.length === 0 ? (
                                <tr><td colSpan="8" className="px-5 py-6 text-sm text-slate-500">Belum ada riwayat jadwal CBT.</td></tr>
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
                                <div className="border-b border-border px-6 py-5 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Detail: {sesiDetailData.sesi.mata_pelajaran}</h3>
                                        <p className="text-sm text-slate-500 capitalize">{sesiDetailData.sesi.jenis_asesmen} — {sesiDetailData.sesi.kelas}</p>
                                    </div>
                                    <button onClick={() => setSesiDetailData(null)} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Statistik */}
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                                        <div className="rounded-2xl bg-primary/5 px-4 py-4 text-center">
                                            <p className="text-xl font-bold text-primary">{sesiDetailData.statistik.total_siswa}</p>
                                            <p className="text-xs text-primary/70">Total Siswa</p>
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
                                        <div className="rounded-2xl bg-primary/5 px-4 py-4 text-center">
                                            <p className="text-xl font-bold text-primary">{sesiDetailData.statistik.skor_tertinggi}</p>
                                            <p className="text-xs text-primary/70">Tertinggi</p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-100 px-4 py-4 text-center">
                                            <p className="text-xl font-bold text-slate-700">{sesiDetailData.statistik.skor_terendah}</p>
                                            <p className="text-xs text-slate-500">Terendah</p>
                                        </div>
                                    </div>

                                    {/* Daftar Soal */}
                                    <details className="group rounded-2xl border border-border">
                                        <summary className="cursor-pointer px-5 py-4 font-semibold text-slate-800 flex items-center justify-between">
                                            <span>📋 Daftar Soal ({sesiDetailData.soal.length} soal — Total Bobot: {sesiDetailData.total_bobot})</span>
                                            <span className="text-slate-400 group-open:rotate-180 transition">▼</span>
                                        </summary>
                                        <div className="border-t border-border px-5 py-4 space-y-3">
                                            {sesiDetailData.soal.map((s, idx) => (
                                                <div key={s.id_detail} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-bold text-slate-700">Soal {idx + 1} <span className="font-normal text-slate-400">({s.jenis_soal})</span></span>
                                                        <span className="text-xs font-medium text-slate-500">Bobot: {s.bobot_nilai}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{s.isi_soal}</p>
                                                    <p className="mt-1 text-xs text-emerald-600 font-medium">Kunci: {(() => { try { const arr = JSON.parse(s.kunci_jawaban); if (Array.isArray(arr)) return arr.join(', '); } catch {} return s.kunci_jawaban; })()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </details>

                                    {/* Daftar Siswa */}
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800 mb-3">👥 Status Siswa</h4>
                                        <div className="overflow-x-auto rounded-2xl border border-border">
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
                                                                        <button onClick={() => setExpandedSiswaId(expandedSiswaId === sw.id_siswa ? null : sw.id_siswa)} className="text-primary hover:text-primary/85 font-medium text-xs">
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

                                                                        {/* Analisis Diagnostik AI per siswa */}
                                                                        {sw.analisis_diagnostik && (
                                                                            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                                                                                <div className="flex items-center gap-2 mb-2">
                                                                                    <span className="text-sm">🤖</span>
                                                                                    <span className="text-xs font-bold text-primary">Analisis Diagnostik AI</span>
                                                                                </div>
                                                                                <div className="grid gap-3 sm:grid-cols-2">
                                                                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">💪 Kekuatan</p>
                                                                                        <p className="text-xs text-emerald-800 leading-relaxed">{sw.analisis_diagnostik.narasi_kekuatan || 'Belum tersedia'}</p>
                                                                                    </div>
                                                                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">📈 Area Peningkatan</p>
                                                                                        <p className="text-xs text-amber-800 leading-relaxed">{sw.analisis_diagnostik.narasi_kelemahan || 'Belum tersedia'}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
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
                                <div className="border-t border-border px-6 py-4 text-right">
                                    <button onClick={() => setSesiDetailData(null)} className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/85">Tutup</button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}

            {isSesiModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <form onSubmit={submitSesiAsesmen} className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl">
                        <div className="border-b border-border px-6 py-5 flex justify-between items-center">
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
                                        <option value="">Pilih mata pelajaran</option>
                                        {(workspace.mapel_options || []).map(item => <option key={item.id_mapel} value={item.id_mapel}>{item.nama_lengkap || item.nama_mapel}</option>)}
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
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Waktu Mulai</label>
                                    <input required type="datetime-local" value={sesiForm.waktu_mulai} onChange={e => setSesiForm(c => ({...c, waktu_mulai: e.target.value}))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Waktu Berakhir</label>
                                    <input required type="datetime-local" value={sesiForm.waktu_selesai} onChange={e => setSesiForm(c => ({...c, waktu_selesai: e.target.value}))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900" />
                                </div>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Durasi (Menit)</span>
                                    <input required type="number" min="1" value={sesiForm.durasi_menit} onChange={e => setSesiForm(c => ({...c, durasi_menit: e.target.value}))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900" />
                                </label>
                            </div>

                            <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-slate-50 px-5 py-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Boleh Dikerjakan Ulang</p>
                                    <p className="text-xs text-slate-500">Jika aktif, siswa dapat mengerjakan ujian ini lebih dari satu kali.</p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={sesiForm.boleh_ulang}
                                    onClick={() => setSesiForm(c => ({...c, boleh_ulang: !c.boleh_ulang}))}
                                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${sesiForm.boleh_ulang ? 'bg-primary' : 'bg-slate-300'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${sesiForm.boleh_ulang ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                            </div>

                            <div className="mt-6 pt-6 border-t border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-base font-semibold text-slate-900">Pilih Soal dari Bank Soal ({Object.keys(selectedSoalMap).length} Terpilih)</h4>
                                </div>
                                <div className="max-h-64 overflow-y-auto border border-border rounded-xl">
                                    <table className="min-w-full text-left text-sm divide-y divide-slate-200">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold text-slate-600">Pilih</th>
                                                <th className="px-4 py-3 font-semibold text-slate-600">Isi Soal</th>
                                                <th className="px-4 py-3 font-semibold text-slate-600">Kode</th>
                                                <th className="px-4 py-3 font-semibold text-slate-600">Tingkat</th>
                                                <th className="px-4 py-3 font-semibold text-slate-600">Mapel</th>
                                                <th className="px-4 py-3 font-semibold text-slate-600">Jenis</th>
                                                <th className="px-4 py-3 font-semibold text-slate-600">Bobot</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {sharedBankSoalLoading && <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">Memuat bank soal...</td></tr>}
                                            {!sharedBankSoalLoading && sharedBankSoal
                                                .map(item => (
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
                                                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 truncate max-w-xs">{item.isi_soal.substring(0, 50)}...</td>
                                                    <td className="px-4 py-3">{item.tipe_soal === 'pilihan_ganda_kompleks' ? 'PGK' : item.tipe_soal === 'esai' ? 'Esai' : 'PG'}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span>{item.mata_pelajaran?.nama_lengkap || item.mata_pelajaran?.nama_mapel}</span>
                                                            <span className={`mt-1 inline-flex w-max px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${item.created_by === session.user.id_pengguna ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>
                                                                {item.created_by === session.user.id_pengguna ? 'Soal Anda' : (item.pembuat?.peran === 'admin' ? 'Soal Admin' : 'Soal Guru Lain')}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">{item.topik_materi}</td>
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
                                            {!sesiForm.id_mapel && (
                                                <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">Silakan pilih Mata Pelajaran terlebih dahulu.</td></tr>
                                            )}
                                            {!sharedBankSoalLoading && sesiForm.id_mapel && sharedBankSoal.length === 0 && (
                                                <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">Bank soal kosong untuk mata pelajaran ini.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-border bg-slate-50 px-6 py-4 flex justify-end gap-3">
                            <button type="button" onClick={() => { setIsSesiModalOpen(false); setEditingSesiId(null); }} className="rounded-full px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200">Batal</button>
                            <button type="submit" disabled={Object.keys(selectedSoalMap).length === 0} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/85 disabled:opacity-50 disabled:cursor-not-allowed">
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
            <section className="overflow-hidden rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary p-8 shadow-lg backdrop-blur-xl relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.4em] text-accent">Berita Acara Digital</p>
                        <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-[#EEDCC8]">Presensi & Evaluasi Kelas</h3>
                        <p className="mt-2 max-w-2xl text-base text-accent">Kelola data pertemuan, kehadiran, dan berikan apresiasi kepada siswa secara langsung.</p>
                    </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3 relative z-10">
                    <StatCard label="Total Kelas" value={loading ? '...' : summary?.cards?.total_kelas ?? 0} description="Kelas yang diampu" tone="slate" className="!bg-[#EEDCC8] !border-transparent" />
                    <StatCard label="Total BAP" value={loading ? '...' : (workspace?.berita_acara || []).length} description="Semua Berita Acara" tone="blue" className="!bg-[#EEDCC8] !border-transparent" />
                    <StatCard label="Apresiasi Diberikan" value={loading ? '...' : ((workspace?.berita_acara || []).reduce((acc, curr) => acc + (curr.jumlah_apresiasi || 0), 0))} description="Lencana yang telah dikirim" tone="amber" className="!bg-[#EEDCC8] !border-transparent" />
                </div>
            </section>

            <form onSubmit={submitBeritaAcara} className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900 border-b border-border pb-4">{editingBeritaId ? 'Ubah presensi dan evaluasi pertemuan kelas' : 'Input Presensi dan Evaluasi (BAP)'}</h3>
                <p className="mt-4 text-sm text-slate-500">{editingBeritaId ? 'Mode edit aktif. Simpan perubahan untuk memperbarui BAP yang sudah ada.' : 'Isi data pertemuan, lalu tambahkan penguatan siswa jika diperlukan.'}</p>

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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 px-4">
                        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-800">
                                <p className="text-sm font-semibold uppercase tracking-[0.2em]">{successPopup.title}</p>
                                <p className="mt-2 text-sm">{successPopup.message}</p>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button type="button" onClick={closeSuccessPopup} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/85">
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {renderContent()}

                {/* Section Analisis Diagnostik dihapus dari bawah karena sudah diintegrasikan ke renderDashboard */}
            </div>
            {/* Modal Import Excel */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Import Soal Excel</h3>
                            <button onClick={() => { setIsImportModalOpen(false); setImportTargetMapel(''); }} className="text-slate-400 hover:text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Mata Pelajaran Tujuan <span className="text-rose-500">*</span></label>
                                <select 
                                    value={importTargetMapel} 
                                    onChange={(e) => setImportTargetMapel(e.target.value)}
                                    className="w-full rounded-xl border border-border px-4 py-2 text-sm focus:border-primary focus:ring-primary"
                                >
                                    <option value="">-- Pilih Mata Pelajaran --</option>
                                    {(workspace.mapel_options || []).map(m => (
                                        <option key={m.id_mapel} value={m.id_mapel}>{m.nama_lengkap || m.nama_mapel}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Soal dari Excel akan dimasukkan ke mapel ini.</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">File Excel (.xlsx)</label>
                                <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                                <div 
                                    onClick={() => {
                                        if (!importTargetMapel) {
                                            alert("Pilih mata pelajaran terlebih dahulu sebelum memilih file!");
                                            return;
                                        }
                                        fileInputRef.current?.click();
                                    }}
                                    className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition ${importTargetMapel ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100' : 'border-slate-300 bg-slate-50 opacity-60 cursor-not-allowed'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 mb-2 ${importTargetMapel ? 'text-emerald-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    <span className="text-sm font-medium text-slate-600">Klik untuk memilih file</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
