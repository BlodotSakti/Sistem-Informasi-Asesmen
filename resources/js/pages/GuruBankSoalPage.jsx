import React, { useState, useMemo, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import { apiFetch } from '../lib/api';
import useGuruWorkspace from '../hooks/useGuruWorkspace';
import { guruNavigation } from './guru/guruNavigation';
import * as XLSX from 'xlsx';

const BLOOM_OPTIONS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

export default function GuruBankSoalPage({ session, onLogout }) {
    const { summary, workspace, loading, reloadWorkspace } = useGuruWorkspace(session);
    
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
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBankSoalId, setEditingBankSoalId] = useState(null);
    const [expandedBankFolders, setExpandedBankFolders] = useState({});
    
    const fileInputRef = useRef(null);
    const formRef = useRef(null);

    const showSuccessPopup = (title, message) => setSuccessPopup({ title, message });
    const closeSuccessPopup = () => setSuccessPopup(null);
    const toggleBankFolder = (id) => setExpandedBankFolders(prev => ({...prev, [id]: !prev[id]}));

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
        
        // Smooth scroll ke arah form
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
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

                const mapelLookup = {};
                (workspace?.mapel_options || []).forEach(m => {
                    const namaLengkap = m.nama_lengkap ? m.nama_lengkap.toLowerCase() : `${m.nama_mapel} (${m.tingkat})`.toLowerCase();
                    mapelLookup[namaLengkap] = m.id_mapel;
                    mapelLookup[m.nama_mapel.toLowerCase()] = m.id_mapel;
                });

                const mapelGroup = {};
                const skippedRows = [];

                data.forEach((row, idx) => {
                    let resolvedId = null;
                    if (row.nama_mapel) {
                        const key = String(row.nama_mapel).trim().toLowerCase();
                        resolvedId = mapelLookup[key] || null;
                        if (!resolvedId) {
                            skippedRows.push(`Baris ${idx + 2}: Mapel '${row.nama_mapel}' tidak ditemukan atau Anda tidak mengajar mapel ini.`);
                            return;
                        }
                    } else if (row.id_mapel) {
                        resolvedId = parseInt(row.id_mapel);
                    }

                    if (!resolvedId) {
                        skippedRows.push(`Baris ${idx + 2}: Kolom nama_mapel atau id_mapel kosong.`);
                        return;
                    }

                    if (!mapelGroup[resolvedId]) mapelGroup[resolvedId] = [];

                    let opsi = [];
                    if (row.opsi_a) opsi.push(String(row.opsi_a));
                    if (row.opsi_b) opsi.push(String(row.opsi_b));
                    if (row.opsi_c) opsi.push(String(row.opsi_c));
                    if (row.opsi_d) opsi.push(String(row.opsi_d));
                    if (row.opsi_e) opsi.push(String(row.opsi_e));

                    mapelGroup[resolvedId].push({
                        isi_soal: String(row.isi_soal || ''),
                        jenis_soal: row.jenis_soal || 'pilihan_ganda',
                        kunci_jawaban: String(row.kunci_jawaban || ''),
                        topik_materi: row.topik_materi || 'Umum',
                        level_kognitif: row.level_kognitif || 'C1',
                        opsi_jawaban: opsi
                    });
                });

                for (const [idMapel, soalArray] of Object.entries(mapelGroup)) {
                    await apiFetch('/api/guru/bank-soal/bulk', session, {
                        method: 'POST',
                        body: JSON.stringify({
                            id_mapel: parseInt(idMapel),
                            soal: soalArray
                        })
                    });
                }
                
                let msg = 'Berhasil mengimpor soal dari Excel!';
                if (skippedRows.length > 0) {
                    msg += '\n\nBaris yang dilewati:\n' + skippedRows.join('\n');
                }
                alert(msg);
                await reloadWorkspace();
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
            "nama_mapel", "isi_soal", "opsi_a", "opsi_b", "opsi_c", "opsi_d", "opsi_e", 
            "kunci_jawaban", "jenis_soal", "topik_materi", "level_kognitif"
        ];
        
        const exampleData = [
            {
                "nama_mapel": "Bahasa Indonesia (X)",
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
                "nama_mapel": "Bahasa Indonesia (X)",
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
                "nama_mapel": "Bahasa Indonesia (X)",
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

        const wscols = [
            {wch: 25}, {wch: 40}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}, 
            {wch: 20}, {wch: 15}, {wch: 20}, {wch: 15},
        ];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, "Template_Import_Soal_Guru_SMAN.xlsx");
    };

    return (
        <DashboardLayout
            navigation={guruNavigation}
            user={session?.user}
            profileHref="/guru/profil"
            onLogout={onLogout}
            title="Bank Soal"
            subtitle="Manajemen Bank Soal Ujian"
        >
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="flex flex-col gap-6">
                    <div className="rounded-2xl sm:rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary p-4 sm:p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-48 w-48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                            <div className="flex-1">
                                <p className="text-xs font-bold uppercase tracking-[0.4em] text-accent">Bank Soal & Penilaian</p>
                                <h3 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#EEDCC8]">Bank Soal</h3>
                                <p className="mt-2 max-w-xl text-base text-accent">Kelola koleksi soal untuk berbagai mata pelajaran yang Anda ampu secara terpusat.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full xl:w-[60%]">
                                <StatCard label="Total Soal" value={loading ? '...' : (workspace.bank_soal || []).length} description="Semua soal yang Anda buat" tone="blue" className="!bg-[#EEDCC8] !border-transparent h-full" />
                                <StatCard label="Mata Pelajaran" value={loading ? '...' : Object.keys(groupedBankSoal).length} description="Topik terdaftar" tone="emerald" className="!bg-[#EEDCC8] !border-transparent h-full" />
                                
                            </div>
                        </div>
                    </div>
                </section>

                <form ref={formRef} onSubmit={submitBankSoal} className="rounded-3xl border border-border bg-white p-6 shadow-sm scroll-mt-24">
                    <h3 className="text-xl font-semibold text-slate-900 border-b border-border pb-4">Input soal digital terstruktur</h3>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Mata Pelajaran</span>
                            <select required value={bankForm.id_mapel} onChange={(event) => setBankForm((current) => ({ ...current, id_mapel: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                <option value="">Pilih mapel</option>
                                {(workspace.mapel_options || []).map((item) => (
                                    <option key={item.id_mapel} value={item.id_mapel}>{item.nama_lengkap || item.nama_mapel}</option>
                                ))}
                            </select>
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Jenis Soal</span>
                            <select required value={bankForm.jenis_soal} onChange={(event) => setBankForm((current) => ({ ...current, jenis_soal: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                <option value="pilihan_ganda">Pilihan Ganda</option>
                                <option value="pilihan_ganda_kompleks">Pilihan Ganda Kompleks</option>
                                <option value="esai">Esai</option>
                            </select>
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Topik Materi</span>
                            <input required value={bankForm.topik_materi} onChange={(event) => setBankForm((current) => ({ ...current, topik_materi: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Contoh: Sistem Persamaan Linear" />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Level Kognitif Bloom</span>
                            <select required value={bankForm.level_kognitif} onChange={(event) => setBankForm((current) => ({ ...current, level_kognitif: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900">
                                <option value="">Pilih level Bloom</option>
                                {BLOOM_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                            <span>Isi Soal</span>
                            <textarea required rows="4" value={bankForm.isi_soal} onChange={(event) => setBankForm((current) => ({ ...current, isi_soal: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Tulis soal secara lengkap" />
                        </label>
                        <div className="md:col-span-2">
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                                <span>Gambar Pendukung (Opsional)</span>
                                <div className="flex flex-col gap-3">
                                    {bankForm.gambar_soal_url && !bankForm.hapus_gambar && (
                                        <div className="relative w-max">
                                            <img src={bankForm.gambar_soal_url} alt="Gambar Soal" className="max-h-40 rounded-xl border border-border object-cover shadow-sm" />
                                            <button type="button" onClick={() => setBankForm(curr => ({ ...curr, hapus_gambar: true, gambar_soal: null }))} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow" title="Hapus Gambar">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    )}
                                    <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => { if (e.target.files && e.target.files[0]) { setBankForm(curr => ({ ...curr, gambar_soal: e.target.files[0], hapus_gambar: false })); } }} className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary/5 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/10" />
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
                                                <button type="button" onClick={() => { const newOpsi = [...bankForm.opsi_jawaban]; newOpsi.splice(idx, 1); setBankForm(curr => ({ ...curr, opsi_jawaban: newOpsi })); }} className="text-rose-500 hover:text-rose-700 text-xs">Hapus</button>
                                            )}
                                        </div>
                                        <input value={opsi} onChange={(event) => { const newOpsi = [...bankForm.opsi_jawaban]; newOpsi[idx] = event.target.value; setBankForm(curr => ({ ...curr, opsi_jawaban: newOpsi })); }} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
                                    </label>
                                ))}
                                <button type="button" onClick={() => setBankForm(curr => ({ ...curr, opsi_jawaban: [...curr.opsi_jawaban, ''] }))} className="mt-2 text-sm text-primary font-semibold hover:text-primary/85">+ Tambah Opsi Jawaban</button>
                            </div>
                        ) : null}
                        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                            <span>Kunci Jawaban</span>
                            {bankForm.jenis_soal === 'pilihan_ganda_kompleks' ? (
                                <div className="flex flex-wrap gap-4 pt-2">
                                    {bankForm.opsi_jawaban.filter(Boolean).map((opsi, idx) => (
                                        <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" value={opsi} checked={bankForm.kunci_jawaban_kompleks.includes(opsi)} onChange={(e) => { const checked = e.target.checked; const val = e.target.value; setBankForm(curr => { const next = new Set(curr.kunci_jawaban_kompleks); if (checked) next.add(val); else next.delete(val); return { ...curr, kunci_jawaban_kompleks: Array.from(next) }; }); }} className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                                            <span className="text-sm font-normal text-slate-700">{opsi}</span>
                                        </label>
                                    ))}
                                    {bankForm.opsi_jawaban.filter(Boolean).length === 0 && <span className="text-xs text-slate-400">Isi opsi jawaban terlebih dahulu.</span>}
                                </div>
                            ) : (
                                <input required value={bankForm.kunci_jawaban} onChange={(event) => setBankForm((current) => ({ ...current, kunci_jawaban: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder={bankForm.jenis_soal === 'esai' ? 'Panduan jawaban esai' : 'Harus sama dengan salah satu opsi'} />
                            )}
                        </label>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/85">
                            {editingBankSoalId ? 'Simpan Perubahan' : 'Simpan Soal'}
                        </button>
                        {editingBankSoalId ? (
                            <button type="button" onClick={resetBankForm} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Batal Edit</button>
                        ) : null}
                    </div>
                </form>

                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-50/40 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-lg font-semibold text-emerald-900">Import Bank Soal</h4>
                        <p className="text-sm text-emerald-700 mt-1">Gunakan template Excel untuk mengunggah banyak soal sekaligus.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                        <button type="button" onClick={downloadTemplateExcel} className="px-4 py-2.5 bg-white border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700 rounded-xl text-sm font-semibold transition shadow-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Unduh Template
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition shadow-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            Import Excel
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-border bg-white">
                    <div className="border-b border-border px-5 py-4">
                        <h4 className="text-lg font-semibold text-slate-900">Data Bank Soal</h4>
                        <p className="text-sm text-slate-500 mt-1">Daftar soal yang telah Anda buat atau unggah. Pastikan topik dan level Bloom terisi.</p>
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
                                <input value={bankSearch} onChange={(event) => setBankSearch(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 outline-none transition focus:border-slate-900" placeholder="Topik atau isi soal" />
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
                                        <tr className="cursor-pointer bg-primary/5/50 hover:bg-primary/5 transition-colors" onClick={() => toggleBankFolder(id_mapel)}>
                                            <td colSpan="7" className="px-5 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`transform transition-transform ${expandedBankFolders[id_mapel] ? 'rotate-90' : ''}`}>▶</span>
                                                        <span className="font-bold text-slate-900">📁 {group.mapel?.nama_lengkap || group.mapel?.nama_mapel || 'Mapel Tidak Diketahui'}</span>
                                                    </div>
                                                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary/90">{group.soals.length} Soal</span>
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
                                                    {item.jenis_soal === 'pilihan_ganda_kompleks' && item.kunci_jawaban ? (() => { try { return JSON.parse(item.kunci_jawaban).join(', '); } catch { return item.kunci_jawaban; } })() : item.kunci_jawaban}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => openEditBankSoal(item)} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </button>
                                                        <button onClick={() => handleDeleteBankSoal(item.id_soal)} title="Hapus" className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
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
