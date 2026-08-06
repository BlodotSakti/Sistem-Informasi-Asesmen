import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';
import { formatDateTimeLabel } from '../lib/date';
import useGuruWorkspace from '../hooks/useGuruWorkspace';
import { guruNavigation } from './guru/guruNavigation';

export default function GuruJadwalCbtPage({ session, onLogout }) {
    const { summary, workspace, sesiAsesmenHistory, loading, reloadWorkspace } = useGuruWorkspace(session);
    
    const [successPopup, setSuccessPopup] = useState(null);
    const [cbtSearch, setCbtSearch] = useState('');
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

    const showSuccessPopup = (title, message) => setSuccessPopup({ title, message });
    const closeSuccessPopup = () => setSuccessPopup(null);

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
            const searchLower = cbtSearch.toLowerCase();
            const mapel = (item.mata_pelajaran?.nama_lengkap || item.mata_pelajaran?.nama_mapel || '').toLowerCase();
            const kelas = (item.kelas?.nama_kelas || '').toLowerCase();
            const tipeSoal = (item.tipe_soal || '').toLowerCase();
            const tipeAsesmen = (item.jenis_asesmen || '').toLowerCase();
            
            return mapel.includes(searchLower) || kelas.includes(searchLower) || tipeSoal.includes(searchLower) || tipeAsesmen.includes(searchLower);
        });
    }, [sesiAsesmenHistory, cbtSearch]);

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
                                <StatCard label="Total Jadwal" value={loading ? '...' : sesiAsesmenHistory.length} description="Semua sesi ujian yang pernah dibuat" tone="slate" className="!bg-[#EEDCC8] !border-transparent h-full" />
                                <StatCard label="Ujian Aktif" value={loading ? '...' : summary?.cards?.ujian_aktif ?? 0} description="Ujian yang sedang berlangsung atau akan datang" tone="amber" className="!bg-[#EEDCC8] !border-transparent h-full" />
                                
                            </div>
                        </div>
                    </div>
                </section>

                <div className="overflow-hidden rounded-3xl border border-border bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border px-5 py-4 gap-4">
                        <div>
                            <h4 className="text-lg font-semibold text-slate-900">Daftar Jadwal CBT</h4>
                            <p className="text-sm text-slate-500">Daftar sesi asesmen yang telah dibuat.</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
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
                            <button onClick={() => setIsSesiModalOpen(true)} type="button" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/85 whitespace-nowrap">
                                + Buat Jadwal CBT
                            </button>
                        </div>
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
                                {filteredSesiHistory.map((item) => {
                                    const status = getSesiStatus(item.waktu_mulai, item.waktu_selesai);
                                    const isActiveRow = status.label === 'Aktif';
                                    
                                    return (
                                        <tr key={item.id_sesi} className={`align-top transition-colors ${isActiveRow ? 'bg-blue-50/80 hover:bg-blue-50/100' : 'hover:bg-slate-50/70'}`}>
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
                                            <div className="flex items-center justify-end gap-3">
                                                <button onClick={() => fetchSesiDetail(item.id_sesi)} className="text-primary hover:text-primary/85 font-medium">Detail</button>
                                                <button onClick={() => openEditSesiAsesmen(item)} className="text-primary hover:text-primary/85 font-medium">Edit</button>
                                                <button onClick={() => handleDeleteSesiAsesmen(item.id_sesi)} className="text-rose-600 hover:text-rose-800 font-medium">Hapus</button>
                                            </div>
                                        </td>
                                        </tr>
                                    );
                                })}
                                {!loading && filteredSesiHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-5 py-8 text-center text-sm text-slate-500">
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
                        <form onSubmit={submitSesiAsesmen} className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl">
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
                                    <div className="max-h-64 overflow-y-auto overflow-x-auto border border-border rounded-xl">
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
        </DashboardLayout>
    );
}
