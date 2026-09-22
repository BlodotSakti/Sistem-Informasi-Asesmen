import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';
import { formatDateTimeLabel } from '../lib/date';
import useGuruWorkspace from '../hooks/useGuruWorkspace';
import { guruNavigation } from './guru/guruNavigation';
import FilterSelect from '../components/ui/FilterSelect';

export default function GuruJadwalCbtPage({ session, onLogout }) {
    const { summary, workspace, sesiAsesmenHistory, loading, reloadWorkspace } = useGuruWorkspace(session);
    
    const [successPopup, setSuccessPopup] = useState(null);
    const [cbtSearch, setCbtSearch] = useState('');
    const [cbtFilterKelas, setCbtFilterKelas] = useState('');
    const [isSesiModalOpen, setIsSesiModalOpen] = useState(false);
    const [editingSesiId, setEditingSesiId] = useState(null);
    const [sesiDetailData, setSesiDetailData] = useState(null);
    const [sesiDetailLoading, setSesiDetailLoading] = useState(false);
    const [sesiLogs, setSesiLogs] = useState([]);
    const [detailActiveTab, setDetailActiveTab] = useState('siswa');
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
        tampilkan_kunci: true,
        token: '',
    });
    const [selectedSoalMap, setSelectedSoalMap] = useState({});
    const [sharedBankSoal, setSharedBankSoal] = useState([]);
    const [sharedBankSoalLoading, setSharedBankSoalLoading] = useState(false);

    // Filter states untuk tabel Bank Soal CBT
    const [bankSearch, setBankSearch] = useState('');
    const [bankFilterLevel, setBankFilterLevel] = useState('');
    const [bankFilterJenis, setBankFilterJenis] = useState('');

    const [editingScoreId, setEditingScoreId] = useState(null);
    const [editScoreValue, setEditScoreValue] = useState('');
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
    const [isValidasiModalOpen, setIsValidasiModalOpen] = useState(false);
    const [unlockModal, setUnlockModal] = useState({ isOpen: false, id_sesi: null, id_siswa: null, loading: false });
    const [validasiSiswaId, setValidasiSiswaId] = useState(null);
    const [validasiLoading, setValidasiLoading] = useState(false);

    // Detail Siswa Modal States
    const [detailSiswaSearch, setDetailSiswaSearch] = useState('');
    const [detailSiswaStatus, setDetailSiswaStatus] = useState('');
    const [detailSiswaSort, setDetailSiswaSort] = useState('');

    const showSuccessPopup = (title, message) => setSuccessPopup({ title, message });
    const closeSuccessPopup = () => setSuccessPopup(null);

    const requestAction = (actionFn) => {
        if (unsavedChanges) {
            setPendingAction(() => actionFn);
            setIsUnsavedModalOpen(true);
        } else {
            actionFn();
        }
    };

    const confirmPendingAction = () => {
        setIsUnsavedModalOpen(false);
        setUnsavedChanges(false);
        setEditingScoreId(null);
        setEditScoreValue('');
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    };

    const cancelPendingAction = () => {
        setIsUnsavedModalOpen(false);
        setPendingAction(null);
    };

    const handleEditScore = (id_detail, initialScore) => {
        setEditingScoreId(id_detail);
        setEditScoreValue(initialScore);
        setUnsavedChanges(true);
    };

    const handleCancelEditScore = () => {
        setEditingScoreId(null);
        setEditScoreValue('');
        setUnsavedChanges(false);
    };

    const handleSaveScore = async (id_sesi, id_detail, id_siswa) => {
        try {
            const res = await apiFetch(`/api/guru/sesi-asesmen/${id_sesi}/jawaban/${id_detail}/siswa/${id_siswa}/score`, session, {
                method: 'PUT',
                body: JSON.stringify({ skor: editScoreValue }),
            });
            setSesiDetailData(prev => {
                if (!prev) return prev;
                const newData = { ...prev };
                const siswaIndex = newData.siswa.findIndex(s => s.id_siswa === id_siswa);
                if (siswaIndex !== -1) {
                    const detailIndex = newData.siswa[siswaIndex].detail_jawaban.findIndex(d => d.id_detail === id_detail);
                    if (detailIndex !== -1) {
                        newData.siswa[siswaIndex].detail_jawaban[detailIndex].skor_diperoleh = res.skor_diperoleh;
                        newData.siswa[siswaIndex].detail_jawaban[detailIndex].is_correct = res.is_correct;
                    }
                    newData.siswa[siswaIndex].total_skor = res.total_skor_baru;
                }
                return newData;
            });
            setEditingScoreId(null);
            setEditScoreValue('');
            setUnsavedChanges(false);
            showSuccessPopup('Sukses', 'Skor berhasil diperbarui.');
        } catch (error) {
            console.error('Failed to update score:', error);
            alert('Gagal memperbarui skor.');
        }
    };

    const handleValidasiNilai = async () => {
        if (!validasiSiswaId || !sesiDetailData?.sesi?.id_sesi) return;
        setValidasiLoading(true);
        try {
            const res = await apiFetch(`/api/guru/sesi-asesmen/${sesiDetailData.sesi.id_sesi}/validasi-nilai/${validasiSiswaId}`, session, {
                method: 'POST'
            });
            setIsValidasiModalOpen(false);
            if (res?.status === 'unchanged') {
                showSuccessPopup('Info', res.message);
            } else {
                showSuccessPopup('Validasi Berhasil', res?.message || 'Nilai berhasil divalidasi dan analisis diagnostik sedang diperbarui.');
            }
        } catch (error) {
            console.error('Failed to validate:', error);
            alert('Gagal memvalidasi nilai.');
        } finally {
            setValidasiLoading(false);
        }
    };

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

    const submitSesiAsesmen = async (event) => {
        event.preventDefault();
        try {
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
                    tampilkan_kunci: sesiForm.tampilkan_kunci,
                    token: sesiForm.token,
                    soal: soalArr,
                }),
            });

            showSuccessPopup('Berhasil', isEditing ? 'Sesi Asesmen berhasil diperbarui.' : 'Sesi Asesmen berhasil dibuat.');
            setIsSesiModalOpen(false);
            setEditingSesiId(null);
            setSelectedSoalMap({});
            setSesiForm({
                id_kelas: '', id_mapel: '', tipe_soal: '', jenis_asesmen: 'ujian', waktu_mulai: '', waktu_selesai: '', durasi_menit: 60, boleh_ulang: false, tampilkan_kunci: true, token: ''
            });
            setBankSearch('');
            setBankFilterLevel('');
            setBankFilterJenis('');
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
            tampilkan_kunci: item.tampilkan_kunci !== undefined ? !!item.tampilkan_kunci : true,
            token: item.token || '',
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

    const handleUnlockSiswa = (id_sesi, id_siswa) => {
        setUnlockModal({ isOpen: true, id_sesi, id_siswa, loading: false });
    };

    const confirmUnlockSiswa = async () => {
        const { id_sesi, id_siswa } = unlockModal;
        setUnlockModal((prev) => ({ ...prev, loading: true }));
        try {
            await apiFetch(`/api/guru/sesi-asesmen/${id_sesi}/unlock/${id_siswa}`, session, { method: 'POST' });
            showSuccessPopup('Berhasil', 'Status ujian siswa berhasil dibuka kuncinya.');
            // Refresh detail modal
            fetchSesiDetail(id_sesi);
        } catch (err) {
            showSuccessPopup('Gagal Membuka Kunci', err.message || 'Terjadi kesalahan saat membuka kunci.');
        } finally {
            setUnlockModal({ isOpen: false, id_sesi: null, id_siswa: null, loading: false });
        }
    };

    const fetchSesiDetail = async (idSesi) => {
        requestAction(async () => {
            try {
                setSesiDetailLoading(true);
                setSesiDetailData(null);
                setSesiLogs([]);
                setDetailActiveTab('siswa');
                setExpandedSiswaId(null);
                
                const [data, logs] = await Promise.all([
                    apiFetch(`/api/guru/sesi-asesmen/${idSesi}/detail`, session),
                    apiFetch(`/api/guru/sesi-asesmen/${idSesi}/log-pelanggaran`, session).catch(() => [])
                ]);
                
                setSesiDetailData(data);
                setSesiLogs(logs || []);
            } catch (err) {
                console.error("Failed to fetch sesi detail", err);
                showSuccessPopup('Gagal', err.message || 'Gagal memuat detail sesi.');
            } finally {
                setSesiDetailLoading(false);
            }
        });
    };

    const getSesiStatus = (waktuMulai, waktuSelesai) => {
        const now = new Date();
        const mulai = new Date(waktuMulai);
        const selesai = waktuSelesai ? new Date(waktuSelesai) : null;
        
        if (now < mulai) {
            return { label: 'Akan Datang', color: 'bg-amber-100 text-amber-700 border-amber-200' };
        } else if (selesai && now > selesai) {
            return { label: 'Selesai', color: 'bg-slate-100 text-slate-600 border-slate-200' };
        } else {
            return { label: 'Aktif', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
        }
    };

    const filteredSesiHistory = useMemo(() => {
        return sesiAsesmenHistory.filter(item => {
            if (cbtFilterKelas && String(item.id_kelas) !== String(cbtFilterKelas)) return false;

            const searchLower = cbtSearch.toLowerCase();
            const mapel = (item.mata_pelajaran?.nama_lengkap || item.mata_pelajaran?.nama_mapel || '').toLowerCase();
            const kelas = (item.kelas?.nama_kelas || '').toLowerCase();
            const tipeSoal = (item.tipe_soal || '').toLowerCase();
            const tipeAsesmen = (item.jenis_asesmen || '').toLowerCase();
            
            return mapel.includes(searchLower) || kelas.includes(searchLower) || tipeSoal.includes(searchLower) || tipeAsesmen.includes(searchLower);
        });
    }, [sesiAsesmenHistory, cbtSearch, cbtFilterKelas]);

    const filteredDetailSiswa = useMemo(() => {
        if (!sesiDetailData?.siswa) return [];
        let list = [...sesiDetailData.siswa];
        
        if (detailSiswaSearch) {
            const q = detailSiswaSearch.toLowerCase();
            list = list.filter(sw => sw.nama_lengkap?.toLowerCase().includes(q) || sw.nisn?.toLowerCase().includes(q));
        }
        
        if (detailSiswaStatus) {
            list = list.filter(sw => sw.status === detailSiswaStatus);
        }
        
        if (detailSiswaSort) {
            list.sort((a, b) => {
                const scoreA = a.total_skor || 0;
                const scoreB = b.total_skor || 0;
                if (detailSiswaSort === 'score_desc') return scoreB - scoreA;
                if (detailSiswaSort === 'score_asc') return scoreA - scoreB;
                return 0;
            });
        }
        return list;
    }, [sesiDetailData, detailSiswaSearch, detailSiswaStatus, detailSiswaSort]);

    return (
        <DashboardLayout
            navigation={guruNavigation}
            user={session?.user}
            profileHref="/guru/profil"
            onLogout={onLogout}
            title="Jadwal CBT"
            subtitle="Manajemen Jadwal CBT"
        >
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="flex flex-col gap-6">
                    <div className="rounded-2xl sm:rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary p-4 sm:p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-48 w-48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                            <div className="flex-1">
                                <p className="text-xs font-bold uppercase tracking-[0.4em] text-accent">Manajemen Jadwal Ujian</p>
                                <h3 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#EEDCC8]">Jadwal CBT</h3>
                                <p className="mt-2 max-w-xl text-base text-accent">Buat dan kelola sesi ujian (Computer Based Test) untuk siswa-siswi Anda di sini.</p>
                                <div className="mt-8">
                                    <button onClick={() => setIsSesiModalOpen(true)} type="button" className="rounded-full border border-[#EEDCC8]/20 bg-white/10 px-6 py-3 text-sm font-semibold text-[#EEDCC8] shadow-md transition-all hover:bg-white/20 hover:scale-105 backdrop-blur-md whitespace-nowrap">
                                        + Buat Jadwal CBT
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full xl:w-[60%]">
                                <StatCard 
                                    label="Total Jadwal" 
                                    value={loading ? '...' : sesiAsesmenHistory.length} 
                                    description="Semua sesi ujian yang pernah dibuat" 
                                    tone="slate" 
                                    className="!bg-[#EEDCC8] !border-transparent h-full" 
                                    icon={<svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                                />
                                <StatCard 
                                    label="Ujian Aktif" 
                                    value={loading ? '...' : summary?.cards?.ujian_aktif ?? 0} 
                                    description="Ujian yang sedang berlangsung atau akan datang" 
                                    tone="amber" 
                                    className="!bg-[#EEDCC8] !border-transparent h-full" 
                                    icon={<svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                                />
                                
                            </div>
                        </div>
                    </div>
                </section>

                <div className="overflow-hidden rounded-3xl border border-border bg-white">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-border px-5 py-4 gap-4">
                        <div>
                            <h4 className="text-lg font-semibold text-slate-900">Daftar Jadwal CBT</h4>
                            <p className="text-sm text-slate-500">Daftar sesi asesmen yang telah dibuat.</p>
                        </div>
                        <div className="flex items-center gap-3 w-full xl:w-auto flex-wrap xl:flex-nowrap justify-start xl:justify-end">
                            <div className="relative w-full sm:w-64">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Cari kelas, mapel, tipe..." 
                                    className="w-full rounded-full border border-slate-300 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                                    value={cbtSearch}
                                    onChange={(e) => setCbtSearch(e.target.value)}
                                />
                            </div>
                            <FilterSelect
                                value={cbtFilterKelas}
                                onChange={setCbtFilterKelas}
                                options={[
                                    { value: '', label: 'Semua Kelas' },
                                    ...(workspace.kelas_options || []).map(k => ({ value: k.id_kelas, label: k.nama_kelas }))
                                ]}
                                placeholder="Semua Kelas"
                                icon="🏫"
                                // warna untuk tombol Utama filter aktif
                                accentClass="bg-accent border-accent text-white shadow-md shadow-gold-900"

                                // warna untuk item dropdown yang dipilih
                                dropdownAccentClass="bg-accent border-accent text-white shadow-md shadow-gold-900"
                            />
                            <button onClick={() => setIsSesiModalOpen(true)} type="button" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/85 whitespace-nowrap">
                                + Buat Jadwal CBT
                            </button>
                        </div>
                    </div>
                    {/* Petunjuk Geser Tabel (hanya muncul di layar kecil) */}
                    
                    <p className="text-[11px] sm:text-xs text-slate-500 mb-2 italic flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                        <span>Geser tabel ke kanan/kiri untuk melihat detail selengkapnyaa</span>
                    </p>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold text-center w-16">No</th>
                                    <th className="px-5 py-4 font-semibold">Label Ujian</th>
                                    <th className="px-5 py-4 font-semibold">Kelas</th>
                                    <th className="px-5 py-4 font-semibold">Mapel</th>
                                    <th className="px-5 py-4 font-semibold">Jenis Asesmen</th>
                                    <th className="px-5 py-4 font-semibold">Waktu Pelaksanaan</th>
                                    <th className="px-5 py-4 font-semibold">Durasi</th>
                                    <th className="px-5 py-4 font-semibold text-center">Ulang</th>
                                    <th className="px-5 py-4 font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredSesiHistory.map((item, index) => {
                                    const status = getSesiStatus(item.waktu_mulai, item.waktu_selesai);
                                    const isActiveRow = status.label === 'Aktif';
                                    
                                    return (
                                        <tr key={item.id_sesi} className={`align-top transition-colors ${isActiveRow ? 'bg-blue-50/80 hover:bg-blue-50/100' : 'hover:bg-slate-50/70'}`}>
                                            <td className="px-5 py-4 text-center text-slate-500 font-medium">{index + 1}</td>
                                            <td className="px-5 py-4 font-semibold text-slate-900">{item.tipe_soal}</td>
                                            <td className="px-5 py-4 text-slate-600">{item.kelas?.nama_kelas}</td>
                                            <td className="px-5 py-4 text-slate-600">{item.mata_pelajaran?.nama_lengkap || item.mata_pelajaran?.nama_mapel}</td>
                                            <td className="px-5 py-4 text-slate-600">{item.tipe_soal || '-'} • {item.jenis_asesmen || '-'}</td>
                                            <td className="px-5 py-4 text-slate-600">
                                                <div className="font-medium text-slate-900">{formatDateTimeLabel(item.waktu_mulai)}</div>
                                                {item.waktu_selesai ? <div className="mt-1 text-xs text-rose-600 font-medium">S/d: {formatDateTimeLabel(item.waktu_selesai)}</div> : null}
                                                <div className={`mt-2 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                                                    {status.label}
                                                </div>
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
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => fetchSesiDetail(item.id_sesi)} title="Detail" className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-primary/50 hover:text-primary transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>
                                                <button onClick={() => openEditSesiAsesmen(item)} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => handleDeleteSesiAsesmen(item.id_sesi)} title="Hapus" className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                        </tr>
                                    );
                                })}
                                {!loading && filteredSesiHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-5 py-8 text-center text-sm text-slate-500">
                                            {cbtSearch ? 'Tidak ada jadwal CBT yang cocok dengan pencarian.' : 'Belum ada riwayat jadwal CBT.'}
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail Modal */}
                {(sesiDetailData || sesiDetailLoading) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => !sesiDetailLoading && setSesiDetailData(null)}>
                        <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                            {sesiDetailLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                                </div>
                            ) : sesiDetailData ? (
                                <>
                                    <div className="border-b border-border px-6 py-5 flex justify-between items-center shrink-0">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">
                                                Detail: {sesiDetailData.sesi.tipe_soal?.toUpperCase()} - {sesiDetailData.sesi.mata_pelajaran} ({formatDateTimeLabel(sesiDetailData.sesi.waktu_mulai)})
                                            </h3>
                                            <p className="text-sm text-slate-500 capitalize">
                                                {sesiDetailData.sesi.jenis_asesmen} — {sesiDetailData.sesi.kelas}
                                                {sesiDetailData.sesi.token && (
                                                    <span className="ml-3 inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-md font-mono text-xs font-bold border border-primary/20">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                                        Token: {sesiDetailData.sesi.token}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <button onClick={() => {
                                            setSesiDetailData(null);
                                            setDetailSiswaSearch('');
                                            setDetailSiswaStatus('');
                                            setDetailSiswaSort('');
                                        }} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
                                    </div>
                                    <div className="p-6 space-y-6 overflow-y-auto">
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
                                                        <p className="mt-1 text-xs text-emerald-600 font-medium whitespace-pre-wrap">Kunci: {(() => { try { const arr = JSON.parse(s.kunci_jawaban); if (Array.isArray(arr)) return arr.join(', '); } catch {} return s.kunci_jawaban; })()}</p>
                                                        {(s.jenis_soal === 'esai' || s.jenis_soal === 'essay') && s.keywords && (
                                                            <p className="mt-1 text-xs text-indigo-600 font-medium whitespace-pre-wrap">Kata Kunci: {(() => { 
                                                                if (Array.isArray(s.keywords)) return s.keywords.join(', ');
                                                                try { const arr = JSON.parse(s.keywords); if (Array.isArray(arr)) return arr.join(', '); } catch {} 
                                                                return s.keywords; 
                                                            })()}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </details>

                                        {/* Tabs Modal */}
                                        <div className="flex border-b border-border mt-4">
                                            <button 
                                                onClick={() => setDetailActiveTab('siswa')}
                                                className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${detailActiveTab === 'siswa' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                                            >
                                                👥 Status Siswa
                                            </button>
                                            <button 
                                                onClick={() => setDetailActiveTab('log')}
                                                className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${detailActiveTab === 'log' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                                            >
                                                ⚠️ Log Pelanggaran CBT
                                                {sesiLogs.length > 0 && (
                                                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">
                                                        {sesiLogs.length}
                                                    </span>
                                                )}
                                            </button>
                                        </div>

                                        {/* Daftar Siswa Tab */}
                                        {detailActiveTab === 'siswa' && (
                                            <div>
                                            
                                            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                                <input 
                                                    type="text" 
                                                    placeholder="Cari nama atau NISN..." 
                                                    value={detailSiswaSearch}
                                                    onChange={(e) => setDetailSiswaSearch(e.target.value)}
                                                    className="flex-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                />
                                                <div className="flex gap-2">
                                                    <FilterSelect
                                                        value={detailSiswaStatus}
                                                        onChange={setDetailSiswaStatus}
                                                        placeholder="Semua Status"
                                                        options={[
                                                            { value: '', label: 'Semua Status' },
                                                            { value: 'sudah', label: 'Sudah Mengerjakan' },
                                                            { value: 'belum', label: 'Belum Mengerjakan' },
                                                        ]}
                                                        align="left"
                                                    />
                                                    <FilterSelect
                                                        value={detailSiswaSort}
                                                        onChange={setDetailSiswaSort}
                                                        placeholder="Urutkan Default"
                                                        options={[
                                                            { value: '', label: 'Urutkan Default' },
                                                            { value: 'score_desc', label: 'Skor Tertinggi' },
                                                            { value: 'score_asc', label: 'Skor Terendah' },
                                                        ]}
                                                        align="right"
                                                    />
                                                </div>
                                            </div>

                                            <p className="text-[11px] sm:text-xs text-slate-500 mb-2 italic flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                                Geser tabel ke kanan/kiri untuk melihat detail selengkapnya
                                            </p>
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
                                                        {filteredDetailSiswa.map((sw) => (
                                                            <React.Fragment key={sw.id_siswa}>
                                                                <tr className="hover:bg-slate-50/70">
                                                                    <td className="px-4 py-3 font-semibold text-slate-900">{sw.nama_lengkap}</td>
                                                                    <td className="px-4 py-3 text-slate-500">{sw.nisn}</td>
                                                                    <td className="px-4 py-3">
                                                                        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${sw.status === 'sudah' ? 'bg-emerald-100/80 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                            {sw.status === 'sudah' ? (
                                                                                <>
                                                                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                                    </svg>
                                                                                    Sudah
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                                                                                    </svg>
                                                                                    Belum
                                                                                </>
                                                                            )}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-600">{sw.status === 'sudah' ? `${sw.total_skor}/${sesiDetailData.total_bobot}` : '-'}</td>
                                                                    <td className="px-4 py-3 text-slate-600">{sw.status === 'sudah' ? `${sw.jumlah_benar}/${sesiDetailData.soal.length}` : '-'}</td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        {sw.status === 'sudah' && (
                                                                            <button onClick={() => requestAction(() => setExpandedSiswaId(expandedSiswaId === sw.id_siswa ? null : sw.id_siswa))} className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary/60 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1">
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
                                                                                    const formatVal = (v) => { 
                                                                                        if (Array.isArray(v)) return v.join(', ');
                                                                                        try { const a = JSON.parse(v); if (Array.isArray(a)) return a.join(', '); } catch {} 
                                                                                        return v || '-'; 
                                                                                    };
                                                                                    const isEsai = soal.jenis_soal === 'esai' || soal.jenis_soal === 'essay';
                                                                                    const kemiripan = (dj?.skor_diperoleh || 0) / soal.bobot_nilai;
                                                                                    return (
                                                                                        <div key={soal.id_detail} className={`rounded-xl border px-4 py-3 text-xs ${isCorrect ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
                                                                                            <div className="flex items-center justify-between mb-3 border-b border-slate-200/50 pb-2">
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="font-bold text-slate-700">Soal {sIdx + 1}</span>
                                                                                                    <span className="text-[10px] text-slate-400 mt-0.5">{soal.level_kognitif ? `Taksonomi Bloom: ${soal.level_kognitif}` : 'Level Kognitif tidak disetel'}</span>
                                                                                                </div>
                                                                                                <div className="text-right">
                                                                                                    <div className={`font-bold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                                                        {isCorrect ? '✓ Benar' : '✗ Salah'} ({dj?.skor_diperoleh ?? 0}/{soal.bobot_nilai})
                                                                                                    </div>
                                                                                                    {isEsai && (
                                                                                                        <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">Kemiripan: {(kemiripan * 100).toFixed(0)}%</div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                            
                                                                                            <div className="mb-3">
                                                                                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{soal.isi_soal}</p>
                                                                                            </div>

                                                                                            <div className="grid gap-4 sm:grid-cols-2 mt-1">
                                                                                                <div>
                                                                                                    <span className="text-slate-500 block mb-1">Jawaban Siswa:</span>
                                                                                                    <span className="text-slate-800 font-medium whitespace-pre-wrap">{formatVal(jawSiswa)}</span>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <span className="text-slate-500 block mb-1">Kunci:</span>
                                                                                                    <span className="text-emerald-700 font-medium whitespace-pre-wrap">{formatVal(kunci)}</span>
                                                                                                    {isEsai && soal.keywords && (
                                                                                                        <div className="mt-3">
                                                                                                            <span className="text-slate-500 block mb-1">Kata Kunci:</span>
                                                                                                            <span className="text-indigo-600 font-medium whitespace-pre-wrap">{formatVal(soal.keywords)}</span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>

                                                                                            {isEsai && (
                                                                                                <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-end">
                                                                                                    {editingScoreId === soal.id_detail ? (
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <input 
                                                                                                                type="number" 
                                                                                                                min="0" 
                                                                                                                max={soal.bobot_nilai} 
                                                                                                                value={editScoreValue} 
                                                                                                                onChange={(e) => setEditScoreValue(e.target.value)}
                                                                                                                className="w-20 rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-2 py-1"
                                                                                                            />
                                                                                                            <button onClick={handleCancelEditScore} className="text-xs px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium">Batal</button>
                                                                                                            <button onClick={() => handleSaveScore(sesiDetailData.sesi.id_sesi, soal.id_detail, sw.id_siswa)} className="text-xs px-3 py-1.5 bg-primary text-white hover:bg-primary/90 font-semibold rounded-lg shadow-sm transition-colors">Simpan Penilaian</button>
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <button onClick={() => requestAction(() => handleEditScore(soal.id_detail, dj?.skor_diperoleh ?? 0))} className="text-xs px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
                                                                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                                                            </svg>
                                                                                                            Edit Skor
                                                                                                        </button>
                                                                                                    )}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                            
                                                                            <div className="mt-4 flex justify-end">
                                                                                <button 
                                                                                    onClick={() => requestAction(() => { setValidasiSiswaId(sw.id_siswa); setIsValidasiModalOpen(true); })}
                                                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
                                                                                >
                                                                                    ✅ Validasi Nilai
                                                                                </button>
                                                                            </div>
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
                                                        {filteredDetailSiswa.length === 0 && (
                                                            <tr>
                                                                <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">
                                                                    Tidak ada data siswa yang cocok.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        )}

                                        {/* Tab Log Pelanggaran */}
                                        {detailActiveTab === 'log' && (
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-lg font-bold text-slate-800">⚠️ Log Aktivitas CBT Siswa</h4>
                                                    <p className="text-sm text-slate-500">Log ini mencatat aktivitas mencurigakan selama ujian.</p>
                                                </div>
                                                <div className="overflow-x-auto rounded-2xl border border-border">
                                                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.15em] text-slate-500">
                                                            <tr>
                                                                <th className="px-4 py-3 font-semibold">Waktu</th>
                                                                <th className="px-4 py-3 font-semibold">Siswa</th>
                                                                <th className="px-4 py-3 font-semibold">Jenis Pelanggaran</th>
                                                                <th className="px-4 py-3 font-semibold">Keterangan</th>
                                                                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {sesiLogs.map((log) => (
                                                                <tr key={log.id_log} className="hover:bg-slate-50/70">
                                                                    <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                                                                        {new Date(log.created_at).toLocaleString('id-ID')}
                                                                    </td>
                                                                    <td className="px-4 py-3 font-semibold text-slate-900">
                                                                        {log.siswa?.nama_lengkap} <br/>
                                                                        <span className="font-normal text-slate-500 text-xs">{log.siswa?.nisn}</span>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                                                                            {log.jenis_pelanggaran}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-600 text-xs">
                                                                        {log.keterangan || '-'}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        {!log.is_resolved && (
                                                                            <button onClick={() => handleUnlockSiswa(sesiDetailData.sesi.id_sesi, log.siswa.id_siswa)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200">
                                                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                                                                Buka Kunci
                                                                            </button>
                                                                        )}
                                                                        {!!log.is_resolved && (
                                                                            <span className="text-emerald-600 text-xs font-bold inline-flex items-center gap-1">
                                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                                Dipulihkan
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {sesiLogs.length === 0 && (
                                                                <tr>
                                                                    <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">
                                                                        Tidak ada log pelanggaran yang tercatat untuk sesi ini. (Aman)
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
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
                        <form onSubmit={submitSesiAsesmen} className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl">
                            <div className="border-b border-border px-6 py-5 flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-slate-900">Buat Jadwal Asesmen (CBT)</h3>
                                <button type="button" onClick={() => { setIsSesiModalOpen(false); setEditingSesiId(null); }} className="text-slate-400 hover:text-slate-600">&times;</button>
                            </div>
                            <style>{`
                                .datetime-left-icon {
                                    position: relative;
                                }
                                .datetime-left-icon::-webkit-calendar-picker-indicator {
                                    position: absolute;
                                    left: 16px;
                                    cursor: pointer;
                                }
                                .datetime-left-icon::-webkit-datetime-edit {
                                    padding-left: 24px;
                                }
                            `}</style>
                            <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="space-y-2 text-sm font-medium text-slate-700 block min-w-0">
                                        <span>Kelas</span>
                                        <div className="relative">
                                            <select required value={sesiForm.id_kelas} onChange={e => setSesiForm(c => ({...c, id_kelas: e.target.value}))} className="w-full appearance-none rounded-2xl border border-slate-300 bg-slate-50/50 hover:bg-slate-50 px-4 py-3 pr-10 text-slate-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 truncate">
                                                <option value="">Pilih kelas</option>
                                                {(workspace.kelas_options || []).map(item => <option key={item.id_kelas} value={item.id_kelas}>{item.nama_kelas}</option>)}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                                            </div>
                                        </div>
                                    </label>
                                    <label className="space-y-2 text-sm font-medium text-slate-700 block min-w-0">
                                        <span>Mata Pelajaran</span>
                                        <div className="relative">
                                            <select required value={sesiForm.id_mapel} onChange={e => setSesiForm(c => ({...c, id_mapel: e.target.value}))} className="w-full appearance-none rounded-2xl border border-slate-300 bg-slate-50/50 hover:bg-slate-50 px-4 py-3 pr-10 text-slate-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 truncate">
                                                <option value="">Pilih mata pelajaran</option>
                                                {(workspace.mapel_options || []).map(item => <option key={item.id_mapel} value={item.id_mapel}>{item.nama_lengkap || item.nama_mapel}</option>)}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                                            </div>
                                        </div>
                                    </label>
                                    <label className="space-y-2 text-sm font-medium text-slate-700">
                                        <span>Tipe Soal (Label)</span>
                                        <input required value={sesiForm.tipe_soal} onChange={e => setSesiForm(c => ({...c, tipe_soal: e.target.value}))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Contoh: Soal UTS Genap" />
                                    </label>
                                    <label className="space-y-2 text-sm font-medium text-slate-700 block min-w-0">
                                        <span>Jenis Asesmen</span>
                                        <div className="relative">
                                            <select required value={sesiForm.jenis_asesmen} onChange={e => setSesiForm(c => ({...c, jenis_asesmen: e.target.value}))} className="w-full appearance-none rounded-2xl border border-slate-300 bg-slate-50/50 hover:bg-slate-50 px-4 py-3 pr-10 text-slate-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 truncate">
                                                <option value="ujian">Ujian</option>
                                                <option value="pretest">Pretest</option>
                                                <option value="posttest">Posttest</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                                            </div>
                                        </div>
                                    </label>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Waktu Mulai</label>
                                        <input required type="datetime-local" value={sesiForm.waktu_mulai} onChange={e => setSesiForm(c => ({...c, waktu_mulai: e.target.value}))} className="datetime-left-icon w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Waktu Berakhir</label>
                                        <input required type="datetime-local" value={sesiForm.waktu_selesai} onChange={e => setSesiForm(c => ({...c, waktu_selesai: e.target.value}))} className="datetime-left-icon w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900" />
                                    </div>
                                    <label className="space-y-2 text-sm font-medium text-slate-700">
                                        <span>Durasi (Menit)</span>
                                        <input required type="number" min="1" value={sesiForm.durasi_menit} onChange={e => setSesiForm(c => ({...c, durasi_menit: e.target.value}))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900" />
                                    </label>
                                    <label className="space-y-2 text-sm font-medium text-slate-700">
                                        <span>Token Ujian (Opsional)</span>
                                        <div className="flex gap-2">
                                            <input type="text" maxLength="10" placeholder="Contoh: CBT123" value={sesiForm.token} onChange={e => setSesiForm(c => ({...c, token: e.target.value.toUpperCase()}))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 font-mono uppercase" />
                                            <button type="button" onClick={() => setSesiForm(c => ({...c, token: Math.random().toString(36).substring(2, 8).toUpperCase()}))} className="shrink-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-2xl transition border border-slate-200">
                                                Acak Token
                                            </button>
                                        </div>
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

                                <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-slate-50 px-5 py-4">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Tampilkan Kunci Jawaban ke Siswa</p>
                                        <p className="text-xs text-slate-500">Jika aktif, siswa dapat melihat teks kunci jawaban setelah mereka mengumpulkan ujian (di menu Riwayat).</p>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={sesiForm.tampilkan_kunci}
                                        onClick={() => setSesiForm(c => ({...c, tampilkan_kunci: !c.tampilkan_kunci}))}
                                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${sesiForm.tampilkan_kunci ? 'bg-primary' : 'bg-slate-300'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${sesiForm.tampilkan_kunci ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>

                                {(() => {
                                    const filteredBankSoal = sharedBankSoal.filter(item => {
                                        if (bankSearch && !item.isi_soal.toLowerCase().includes(bankSearch.toLowerCase())) return false;
                                        if (bankFilterLevel && item.level_kognitif !== bankFilterLevel) return false;
                                        if (bankFilterJenis && item.jenis_soal !== bankFilterJenis) return false;
                                        return true;
                                    });

                                    return (
                                        <div className="mt-6 pt-6 border-t border-border">
                                            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-4 gap-4">
                                                <h4 className="text-base font-semibold text-slate-900 whitespace-nowrap">Pilih Soal dari Bank Soal ({Object.keys(selectedSoalMap).length} Terpilih)</h4>
                                                
                                                {/* Filters */}
                                                <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 w-full xl:w-auto">
                                                    <input
                                                        type="text"
                                                        placeholder="Cari isi soal..."
                                                        value={bankSearch}
                                                        onChange={(e) => setBankSearch(e.target.value)}
                                                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-48"
                                                    />
                                                    <FilterSelect
                                                        value={bankFilterLevel}
                                                        onChange={setBankFilterLevel}
                                                        placeholder="Semua Level"
                                                        align="left"
                                                        options={[
                                                            { value: '', label: 'Semua Level' },
                                                            { value: 'C1', label: 'C1 - Mengingat' },
                                                            { value: 'C2', label: 'C2 - Memahami' },
                                                            { value: 'C3', label: 'C3 - Mengaplik.' },
                                                            { value: 'C4', label: 'C4 - Menganal.' },
                                                            { value: 'C5', label: 'C5 - Mengeval.' },
                                                            { value: 'C6', label: 'C6 - Mencipta' },
                                                        ]}
                                                    />
                                                    <FilterSelect
                                                        value={bankFilterJenis}
                                                        onChange={setBankFilterJenis}
                                                        placeholder="Semua Jenis"
                                                        align="right"
                                                        options={[
                                                            { value: '', label: 'Semua Jenis' },
                                                            { value: 'pilihan_ganda', label: 'Pilihan Ganda' },
                                                            { value: 'pilihan_ganda_kompleks', label: 'PG Kompleks' },
                                                            { value: 'esai', label: 'Esai' },
                                                        ]}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Petunjuk Geser Tabel (hanya muncul di layar kecil) */}

                                            <p className="text-[11px] sm:text-xs text-slate-500 mb-2 italic flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                                Geser tabel ke kanan/kiri untuk melihat detail selengkapnya
                                            </p>
                                            <div className="max-h-[50vh] overflow-y-auto overflow-x-auto border border-border rounded-xl shadow-sm">
                                        <table className="min-w-full text-left text-sm divide-y divide-slate-200">
                                            <thead className="bg-slate-50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3 font-semibold text-slate-600">Pilih</th>
                                                    <th className="px-4 py-3 font-semibold text-slate-600">Isi Soal</th>
                                                    <th className="px-4 py-3 font-semibold text-slate-600">Level Kognitif</th>
                                                    <th className="px-4 py-3 font-semibold text-slate-600">Tingkat</th>
                                                    <th className="px-4 py-3 font-semibold text-slate-600">Topik</th>
                                                    <th className="px-4 py-3 font-semibold text-slate-600">Jenis</th>
                                                    <th className="px-4 py-3 font-semibold text-slate-600">Bobot</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {sharedBankSoalLoading && <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">Memuat bank soal...</td></tr>}
                                                {!sharedBankSoalLoading && filteredBankSoal
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
                                                        <td className="px-4 py-3 min-w-[300px] max-w-md whitespace-pre-wrap break-words">{item.isi_soal}</td>
                                                        <td className="px-4 py-3"><span className="inline-flex px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-600">{item.level_kognitif}</span></td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col">
                                                                <span>{item.mata_pelajaran?.nama_lengkap || item.mata_pelajaran?.nama_mapel}</span>
                                                                <span className={`mt-1 inline-flex w-max px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${item.created_by === session.user.id_pengguna ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>
                                                                    {item.created_by === session.user.id_pengguna ? 'Soal Anda' : (item.pembuat?.role === 'admin' ? 'Soal Admin' : 'Soal Guru Lain')}
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
                                    );
                                })()}
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

            {isUnsavedModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Perubahan Belum Disimpan</h3>
                        <p className="text-sm text-slate-600 mb-6">Anda sedang mengubah skor tetapi belum menyimpannya. Apakah Anda ingin melanjutkan dan mengabaikan perubahan tersebut?</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={cancelPendingAction} className="rounded-xl px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Batal</button>
                            <button onClick={confirmPendingAction} className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition">Abaikan Perubahan</button>
                        </div>
                    </div>
                </div>
            )}

            {isValidasiModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Konfirmasi Validasi Nilai</h3>
                        <p className="text-sm text-slate-600 mb-6">
                            Apakah Anda yakin sudah selesai melakukan <strong>Review</strong> dan <strong>Edit Skor</strong> (jika ada) untuk siswa ini? 
                            <br/><br/>
                            Mengeklik Validasi akan memicu pembuatan ulang <strong>Analisis Diagnostik AI</strong> berdasarkan skor terbaru.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setIsValidasiModalOpen(false)} className="rounded-xl px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition" disabled={validasiLoading}>Batal</button>
                            <button onClick={handleValidasiNilai} className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition flex items-center gap-2" disabled={validasiLoading}>
                                {validasiLoading ? 'Memvalidasi...' : 'Ya, Validasi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {unlockModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Konfirmasi Buka Kunci</h3>
                        <p className="text-sm text-slate-600 mb-6">
                            Apakah Anda yakin ingin membuka kunci ujian untuk siswa ini? 
                            <br/><br/>
                            <strong>Perhatian:</strong> Riwayat jawaban sebelumnya akan <strong>dihapus</strong> dan siswa harus mengulang ujian dari awal.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setUnlockModal({ isOpen: false, id_sesi: null, id_siswa: null, loading: false })} className="rounded-xl px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition" disabled={unlockModal.loading}>Batal</button>
                            <button onClick={confirmUnlockSiswa} className="rounded-xl bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition flex items-center gap-2" disabled={unlockModal.loading}>
                                {unlockModal.loading ? 'Memproses...' : 'Ya, Buka Kunci'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
