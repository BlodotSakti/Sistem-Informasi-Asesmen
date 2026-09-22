import React, { useState, useMemo, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import FilterSelect from '../components/ui/FilterSelect';
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
        keywords: '',
        rule_weight: 0.5,
        lsa_weight: 0.5,
        use_math: false,
        math_steps: '',
        math_weight: 0.0,
    });
    const [bankSearch, setBankSearch] = useState('');
    const [bankFilterMapel, setBankFilterMapel] = useState('');
    const [bankFilterJenis, setBankFilterJenis] = useState('');
    const [bankFilterLevel, setBankFilterLevel] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBankSoalId, setEditingBankSoalId] = useState(null);
    const [expandedBankFolders, setExpandedBankFolders] = useState({});
    const [pageMap, setPageMap] = useState({});
    
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

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
            keywords: item.keywords ? item.keywords.join('\n') : '',
            rule_weight: item.rule_weight || 0.5,
            lsa_weight: item.lsa_weight || 0.5,
            use_math: item.math_steps && item.math_steps.length > 0,
            math_steps: item.math_steps ? item.math_steps.join('\n') : '',
            math_weight: item.math_weight || 0.0,
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
            keywords: '',
            rule_weight: 0.5,
            lsa_weight: 0.5,
            use_math: false,
            math_steps: '',
            math_weight: 0.0,
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

            if (bankForm.jenis_soal === 'esai') {
                const keywordArray = bankForm.keywords.split('\n').map(k => k.trim()).filter(Boolean);
                keywordArray.forEach(kw => {
                    formData.append('keywords[]', kw);
                });
                formData.append('rule_weight', bankForm.rule_weight);
                formData.append('lsa_weight', bankForm.lsa_weight);

                if (bankForm.use_math) {
                    const mathStepsArray = bankForm.math_steps.split('\n').map(k => k.trim()).filter(Boolean);
                    mathStepsArray.forEach(kw => {
                        formData.append('math_steps[]', kw);
                    });
                    formData.append('math_weight', bankForm.math_weight);
                } else {
                    formData.append('math_weight', 0.0);
                }
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
                setIsImporting(true);
                setImportResult(null);

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

                    let keywords = [];
                    if (row.keywords) {
                        keywords = String(row.keywords).split(',').map(s => s.trim()).filter(Boolean);
                    }

                    mapelGroup[resolvedId].push({
                        isi_soal: String(row.isi_soal || ''),
                        jenis_soal: row.jenis_soal || 'pilihan_ganda',
                        kunci_jawaban: String(row.kunci_jawaban || ''),
                        topik_materi: row.topik_materi || 'Umum',
                        level_kognitif: row.level_kognitif || 'C1',
                        opsi_jawaban: opsi,
                        keywords: keywords,
                        rule_weight: row.rule_weight !== undefined && row.rule_weight !== '' ? parseFloat(row.rule_weight) : 0,
                        lsa_weight: row.lsa_weight !== undefined && row.lsa_weight !== '' ? parseFloat(row.lsa_weight) : 0,
                    });
                });

                let totalCreated = 0;
                for (const [idMapel, soalArray] of Object.entries(mapelGroup)) {
                    const res = await apiFetch('/api/guru/bank-soal/bulk', session, {
                        method: 'POST',
                        body: JSON.stringify({
                            id_mapel: parseInt(idMapel),
                            soal: soalArray
                        })
                    });
                    totalCreated += res.data ? res.data.length : soalArray.length;
                }
                
                setImportResult({
                    created: totalCreated,
                    updated: 0,
                    skipped: skippedRows.length,
                    skipped_rows: skippedRows.map((msg, i) => {
                        const match = msg.match(/^Baris (\d+):\s*(.+)$/);
                        if (match) return { row: match[1], reason: match[2] };
                        return { row: '?', reason: msg };
                    })
                });
                
                await reloadWorkspace();
            } catch (err) {
                console.error(err);
                alert('Terjadi kesalahan saat memproses file Excel: ' + (err.message || err));
            } finally {
                setIsImporting(false);
            }
        };
        reader.readAsBinaryString(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const downloadTemplateExcel = () => {
        const headers = [
            "nama_mapel", "isi_soal", "opsi_a", "opsi_b", "opsi_c", "opsi_d", "opsi_e", 
            "kunci_jawaban", "jenis_soal", "topik_materi", "level_kognitif",
            "keywords", "rule_weight", "lsa_weight"
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
                "level_kognitif": "C1",
                "keywords": "",
                "rule_weight": "",
                "lsa_weight": ""
            },
            {
                "nama_mapel": "Bahasa Indonesia (X)",
                "isi_soal": "Jelaskan apa yang dimaksud dengan majas personifikasi beserta satu contohnya!",
                "opsi_a": "",
                "opsi_b": "",
                "opsi_c": "",
                "opsi_d": "",
                "opsi_e": "",
                "kunci_jawaban": "Majas personifikasi adalah gaya bahasa yang memberikan sifat-sifat manusia kepada benda mati. Contoh: Angin menari-nari di sela dedaunan.",
                "jenis_soal": "esai",
                "topik_materi": "Gaya Bahasa",
                "level_kognitif": "C3",
                "keywords": "majas, gaya bahasa, sifat manusia, benda mati",
                "rule_weight": 0.4,
                "lsa_weight": 0.6
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
                "level_kognitif": "C2",
                "keywords": "",
                "rule_weight": "",
                "lsa_weight": ""
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template Soal");

        const wscols = [
            {wch: 25}, {wch: 40}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}, 
            {wch: 30}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 30}, {wch: 15}, {wch: 15}
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
                                <StatCard 
                                    label="Total Soal" 
                                    value={loading ? '...' : (workspace.bank_soal || []).length} 
                                    description="Semua soal yang Anda buat" 
                                    tone="blue" 
                                    className="!bg-[#EEDCC8] !border-transparent h-full" 
                                    icon={<svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                />
                                <StatCard 
                                    label="Mata Pelajaran" 
                                    value={loading ? '...' : Object.keys(groupedBankSoal).length} 
                                    description="Topik terdaftar" 
                                    tone="emerald" 
                                    className="!bg-[#EEDCC8] !border-transparent h-full" 
                                    icon={<svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                                />
                                
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
                        {bankForm.jenis_soal === 'esai' && (
                            <>
                                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                                    <span>Kata Kunci Penilaian AI (Satu per baris)</span>
                                    <p className="text-xs font-normal text-slate-500">Gunakan <code>;</code> untuk memisahkan sinonim. Gunakan <code>**</code> untuk wajib persis. <br/>Contoh: <code>**Soekarno;Bung Karno</code></p>
                                    <textarea rows="3" value={bankForm.keywords} onChange={(event) => setBankForm((current) => ({ ...current, keywords: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Kata kunci 1&#10;Kata kunci 2;Sinonim 2" />
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Bobot Aturan (Rule-Based)</span>
                                    <input type="number" step="0.1" min="0" max="1" value={bankForm.rule_weight} onChange={(event) => setBankForm((current) => ({ ...current, rule_weight: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    <span>Bobot Makna (LSA)</span>
                                    <input type="number" step="0.1" min="0" max="1" value={bankForm.lsa_weight} onChange={(event) => setBankForm((current) => ({ ...current, lsa_weight: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
                                </label>
                                
                                <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-200">
                                    <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition">
                                        <input type="checkbox" checked={bankForm.use_math} onChange={(e) => setBankForm(c => ({...c, use_math: e.target.checked}))} className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary" />
                                        <div>
                                            <span className="block text-sm font-bold text-slate-800">Gunakan Penilaian Matematis (SymPy AI)</span>
                                            <span className="block text-xs font-normal text-slate-500 mt-0.5">Aktifkan hanya untuk soal eksakta (Matematika/Fisika/Kimia) yang butuh evaluasi rumus secara mutlak.</span>
                                        </div>
                                    </label>
                                </div>

                                {bankForm.use_math && (
                                    <>
                                        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                                            <span>Langkah Matematis (Satu persamaan per baris)</span>
                                            <p className="text-xs font-normal text-slate-500">Contoh: <code>Q = 1000 - 0.5P</code></p>
                                            <textarea rows="3" value={bankForm.math_steps} onChange={(event) => setBankForm((current) => ({ ...current, math_steps: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Langkah 1&#10;Langkah 2" />
                                        </label>
                                        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                                            <span>Bobot Matematika (SymPy)</span>
                                            <input type="number" step="0.1" min="0" max="1" value={bankForm.math_weight} onChange={(event) => setBankForm((current) => ({ ...current, math_weight: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
                                        </label>
                                    </>
                                )}
                            </>
                        )}
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

                <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-6 sm:p-8 shadow-sm mt-6">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none hidden md:block">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-40 w-40 text-emerald-900" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2.5L17.5 9H13V4.5zM6 20V4h5v7h7v9H6z"/>
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex-1 space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Jalur Cepat
                            </div>
                            
                            <div>
                                <h4 className="text-xl font-bold text-slate-900">Import Soal Massal (Excel)</h4>
                                <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-xl">
                                    Hemat waktu Anda! Tambahkan puluhan hingga ratusan soal sekaligus menggunakan file Excel. Pastikan nama kolom dan format isian sesuai dengan template yang disediakan agar proses import berjalan lancar.
                                </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">1</div>
                                    Unduh template
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">2</div>
                                    Isi data soal
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">3</div>
                                    Upload & Selesai!
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 min-w-[200px] w-full md:w-auto">
                            <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                            <button type="button" onClick={downloadTemplateExcel} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-50 active:scale-95 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Unduh Template
                            </button>
                            <button type="button" disabled={isImporting} onClick={() => fileInputRef.current?.click()} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-500/20 disabled:opacity-70 disabled:pointer-events-none relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform group-hover:translate-y-0 duration-300 ease-in-out"></div>
                                {isImporting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span className="relative z-10">Mengimpor...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                        <span className="relative z-10">Pilih & Import Excel</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {importResult && (
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Ringkasan Import
                        </h5>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="rounded-lg bg-emerald-50 p-3 text-center border border-emerald-100">
                                <div className="text-2xl font-bold text-emerald-700">{importResult.created}</div>
                                <div className="text-xs font-medium text-emerald-600 mt-1 uppercase tracking-wide">Baru</div>
                            </div>
                            <div className="rounded-lg bg-blue-50 p-3 text-center border border-blue-100">
                                <div className="text-2xl font-bold text-blue-700">{importResult.updated}</div>
                                <div className="text-xs font-medium text-blue-600 mt-1 uppercase tracking-wide">Diperbarui</div>
                            </div>
                            <div className="rounded-lg bg-rose-50 p-3 text-center border border-rose-100">
                                <div className="text-2xl font-bold text-rose-700">{importResult.skipped}</div>
                                <div className="text-xs font-medium text-rose-600 mt-1 uppercase tracking-wide">Dilewati</div>
                            </div>
                        </div>
                        {importResult.skipped_rows && importResult.skipped_rows.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-semibold text-rose-700 mb-2 flex items-center gap-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Detail Data Dilewati (Baris Excel):
                                </p>
                                <div className="max-h-40 overflow-y-auto rounded-lg border border-rose-100 bg-rose-50/50 p-2">
                                    <ul className="space-y-1">
                                        {importResult.skipped_rows.map((skip, idx) => (
                                            <li key={idx} className="text-xs text-rose-600 flex items-start">
                                                <span className="font-mono font-medium min-w-[60px] inline-block">Baris {skip.row}:</span>
                                                <span className="flex-1">{skip.reason}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="overflow-hidden rounded-3xl border border-border bg-white">
                    <div className="border-b border-border px-5 py-4">
                        <h4 className="text-lg font-semibold text-slate-900">Data Bank Soal</h4>
                        <p className="text-sm text-slate-500 mt-1">Daftar soal yang telah Anda buat atau unggah. Pastikan topik dan level Bloom terisi.</p>
                    </div>
                    <div className="border-b border-border px-5 py-4">
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 lg:items-end">
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                                <span>Filter Mapel</span>
                                <FilterSelect
                                    value={bankFilterMapel}
                                    onChange={setBankFilterMapel}
                                    options={[
                                        { value: '', label: 'Semua Mapel' },
                                        ...(workspace.mapel_options || []).map(item => ({ value: String(item.id_mapel), label: item.nama_lengkap || item.nama_mapel }))
                                    ]}
                                    placeholder="Semua Mapel"
                                    icon="📚"
                                    align="left"
                                    className="w-full"
                                    // warna untuk tombol Utama filter aktif
                                    accentClass="bg-primary border-primary text-white shadow-md shadow-blue-900"

                                    // warna untuk item dropdown yang dipilih
                                    dropdownAccentClass="bg-primary border-primary text-white shadow-md shadow-blue-900"
                                />
                            </label>
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                                <span>Jenis Soal</span>
                                <FilterSelect
                                    value={bankFilterJenis}
                                    onChange={setBankFilterJenis}
                                    options={[
                                        { value: '', label: 'Semua Jenis' },
                                        { value: 'pilihan_ganda', label: 'Pilihan Ganda' },
                                        { value: 'pilihan_ganda_kompleks', label: 'Pilihan Ganda Kompleks' },
                                        { value: 'esai', label: 'Esai' },
                                    ]}
                                    placeholder="Semua Jenis"
                                    icon="❓"
                                    align="left"
                                    className="w-full"
                                    // warna untuk tombol Utama filter aktif
                                    accentClass="bg-accent border-accent text-white shadow-md shadow-gold-900"

                                    // warna untuk item dropdown yang dipilih
                                    dropdownAccentClass="bg-accent border-accent text-white shadow-md shadow-gold-900"
                                />
                            </label>
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                                <span>Level Kognitif</span>
                                <FilterSelect
                                    value={bankFilterLevel}
                                    onChange={setBankFilterLevel}
                                    options={[
                                        { value: '', label: 'Semua Level' },
                                        ...BLOOM_OPTIONS.map(opt => ({ value: opt, label: opt }))
                                    ]}
                                    placeholder="Semua Level"
                                    icon="🧠"
                                    align="left"
                                    className="w-full"
                                    // warna untuk tombol Utama filter aktif
                                    accentClass="bg-secondary border-secondary text-white shadow-md shadow-red-900"

                                    // warna untuk item dropdown yang dipilih
                                    dropdownAccentClass="bg-secondary border-secondary text-white shadow-md shadow-red-900"
                                />
                            </label>
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                                <span>Cari soal</span>
                                <input value={bankSearch} onChange={(event) => setBankSearch(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 outline-none transition focus:border-slate-900" placeholder="Topik atau isi soal" />
                            </label>
                        </div>
                    </div>
                    <div className="p-5 bg-slate-50/30">
                        {Object.entries(groupedBankSoal).length > 0 ? Object.entries(groupedBankSoal).map(([id_mapel, group]) => {
                            const itemsPerPage = 15;
                            const currentPage = pageMap[id_mapel] || 1;
                            const totalPages = Math.ceil(group.soals.length / itemsPerPage);
                            const currentSoals = group.soals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                            
                            return (
                            <details key={id_mapel} open className="group mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm last:mb-0">
                                <summary className="flex cursor-pointer items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4 list-none transition hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm border border-slate-200 group-open:bg-blue-600 group-open:text-white group-open:border-blue-600 transition-colors">
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                        </div>
                                        <div>
                                            <h5 className="text-base font-bold text-slate-800">{group.mapel?.nama_lengkap || group.mapel?.nama_mapel || 'Mapel Tidak Diketahui'}</h5>
                                            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-slate-200 px-1.5 text-[10px] text-slate-600">{group.soals.length}</span>
                                                Soal
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-slate-400 transition-transform group-open:-rotate-180">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </summary>
                                <p className="text-[11px] sm:text-xs text-slate-500 mb-2 italic flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                    Geser tabel ke kanan/kiri untuk melihat detail selengkapnya
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                                        <thead className="bg-white text-[11px] uppercase tracking-[0.2em] text-slate-400">
                                            <tr>
                                                <th className="px-5 py-4 font-semibold">No</th>
                                                <th className="px-5 py-4 font-semibold">Topik</th>
                                                <th className="px-5 py-4 font-semibold">Isi Soal</th>
                                                <th className="px-5 py-4 font-semibold">Bloom</th>
                                                <th className="px-5 py-4 font-semibold">Jenis</th>
                                                <th className="px-5 py-4 font-semibold">Kunci</th>
                                                <th className="px-5 py-4 font-semibold text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 bg-white">
                                            {currentSoals.map((item, index) => (
                                                <tr key={item.id_soal} className="align-top transition-colors hover:bg-slate-50/80">
                                                    <td className="px-5 py-4 font-semibold text-slate-400">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{item.topik_materi}</td>
                                                    <td className="px-5 py-4 text-slate-800 min-w-[250px]">
                                                        {item.isi_soal.length > 100 ? item.isi_soal.substring(0, 100) + '...' : item.isi_soal}
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                                                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                                                            {item.level_kognitif}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{item.jenis_soal.replace(/_/g, ' ')}</td>
                                                    <td className="px-5 py-4 text-slate-700 font-medium min-w-[200px]">
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
                                        </tbody>
                                    </table>
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                                        <span className="text-xs text-slate-500 font-medium">
                                            Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, group.soals.length)} dari {group.soals.length} soal
                                        </span>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <button
                                                disabled={currentPage === 1}
                                                onClick={() => setPageMap(prev => ({...prev, [id_mapel]: currentPage - 1}))}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => setPageMap(prev => ({...prev, [id_mapel]: page}))}
                                                    className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${
                                                        currentPage === page
                                                            ? 'border-primary bg-primary text-white shadow-sm shadow-primary/30'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                disabled={currentPage === totalPages}
                                                onClick={() => setPageMap(prev => ({...prev, [id_mapel]: currentPage + 1}))}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </details>
                        )}) : (
                            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900">Belum ada data</h4>
                                <p className="mt-1 text-sm text-slate-500">Tidak ada soal yang cocok dengan filter pencarian Anda.</p>
                            </div>
                        )}
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
