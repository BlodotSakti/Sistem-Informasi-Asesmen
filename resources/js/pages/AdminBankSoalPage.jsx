import React, { useEffect, useState, useMemo, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch, getMediaUrl } from '../lib/api';
import { adminNavigation } from './adminNavigation';
import * as XLSX from 'xlsx';
import BankSoalForm from '../components/ui/BankSoalForm';
import FilterSelect from '../components/ui/FilterSelect';
import { ConfirmModal, PopupModal } from '../components/ui/ConfirmModal';
import { downloadBankSoalTemplateExcel, parseBankSoalExcelRows, extractImagesByRowFromXlsxBinary } from '../lib/bankSoalExcel';

export default function AdminBankSoalPage({ session, onLogout }) {
    const [soalList, setSoalList] = useState([]);
    const [masterMapel, setMasterMapel] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [pendingImportFile, setPendingImportFile] = useState(null);
    const [popup, setPopup] = useState(null);
    const [confirmDeleteSoal, setConfirmDeleteSoal] = useState({ isOpen: false, id_soal: null, loading: false });
    const fileInputRef = useRef(null);
    const formRef = useRef(null);

    const scrollToForm = () => {
        setTimeout(() => {
            if (formRef.current) {
                formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                const el = document.getElementById('admin-bank-soal-form');
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 80);
    };

    const showPopup = (title, message, type = null) => {
        const isError = type === 'error' || /gagal|error|kesalahan|peringatan|tidak valid/i.test(String(title || ''));
        setPopup({ title, message, isError });
    };

    // Filters
    const [selectedMapel, setSelectedMapel] = useState('all');
    const [selectedPaket, setSelectedPaket] = useState('all');
    const [importPaketName, setImportPaketName] = useState('');

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBankSoalId, setEditingBankSoalId] = useState(null);
    const [bankForm, setBankForm] = useState({
        id_mapel: '',
        isi_soal: '',
        jenis_soal: 'pilihan_ganda',
        opsi_jawaban: ['', '', '', ''],
        kunci_jawaban: '',
        kunci_jawaban_kompleks: [],
        topik_materi: '',
        paket_soal: '',
        level_kognitif: '',
        gambar_soal: null,
        hapus_gambar: false,
        gambar_soal_url: null,
        audio_soal: null,
        hapus_audio: false,
        audio_soal_url: null,
        batas_putar_audio: '',
        keywords: '',
        rule_weight: 0.4,
        lsa_weight: 0.6,
        use_math: false,
        math_steps: '',
        math_weight: 0,
        tgate: 0,
        required_keywords_count: '',
    });

    const navigation = adminNavigation;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [soalRes, masterRes] = await Promise.all([
                apiFetch('/api/admin/bank-soal', session),
                apiFetch('/api/admin/master-data', session)
            ]);
            setSoalList(soalRes || []);
            setMasterMapel(masterRes?.mata_pelajaran || []);
        } catch (err) {
            setError(err.message || 'Gagal memuat bank soal.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id_soal) => {
        setConfirmDeleteSoal({ isOpen: true, id_soal, loading: false });
    };

    const confirmDeleteSoalAction = async () => {
        const { id_soal } = confirmDeleteSoal;
        if (!id_soal) return;
        setConfirmDeleteSoal((prev) => ({ ...prev, loading: true }));
        try {
            await apiFetch(`/api/admin/bank-soal/${id_soal}`, session, { method: 'DELETE' });
            setConfirmDeleteSoal({ isOpen: false, id_soal: null, loading: false });
            showPopup('Berhasil', 'Soal berhasil dihapus.');
            loadData();
        } catch (err) {
            setConfirmDeleteSoal({ isOpen: false, id_soal: null, loading: false });
            showPopup('Gagal Menghapus', err.message || 'Gagal menghapus soal.', 'error');
        }
    };

    const handleEditSoal = (soal) => {
        setIsFormOpen(true);
        setEditingBankSoalId(soal.id_soal);
        
        let parsedKompleks = [];
        if (soal.jenis_soal === 'pilihan_ganda_kompleks') {
            try {
                parsedKompleks = JSON.parse(soal.kunci_jawaban);
            } catch(e) {
                parsedKompleks = [];
            }
        }

        setBankForm({
            id_mapel: soal.id_mapel,
            isi_soal: soal.isi_soal,
            jenis_soal: soal.jenis_soal,
            opsi_jawaban: soal.opsi_jawaban || ['', '', '', ''],
            kunci_jawaban: soal.jenis_soal === 'pilihan_ganda_kompleks' ? '' : soal.kunci_jawaban,
            kunci_jawaban_kompleks: parsedKompleks,
            topik_materi: soal.topik_materi,
            paket_soal: soal.paket_soal || '',
            level_kognitif: soal.level_kognitif,
            gambar_soal: null,
            hapus_gambar: false,
            gambar_soal_url: getMediaUrl(soal.gambar_soal_url || soal.gambar_soal) || null,
            audio_soal: null,
            hapus_audio: false,
            audio_soal_url: getMediaUrl(soal.audio_soal_url || soal.audio_soal) || null,
            batas_putar_audio: soal.batas_putar_audio ? String(soal.batas_putar_audio) : '',
            keywords: soal.jenis_soal === 'esai' && Array.isArray(soal.keywords) ? soal.keywords.join('\n') : '',
            rule_weight: soal.rule_weight ?? 0.5,
            lsa_weight: soal.lsa_weight ?? 0.5,
            use_math: Boolean(Array.isArray(soal.math_steps) && soal.math_steps.length > 0),
            math_steps: Array.isArray(soal.math_steps) ? soal.math_steps.join('\n') : (soal.math_steps || ''),
            math_weight: soal.math_weight || 0,
            tgate: soal.tgate ?? 0,
            required_keywords_count: soal.required_keywords_count ?? '',
        });
        
        scrollToForm();
    };

    const resetBankForm = () => {
        setBankForm({
            id_mapel: masterMapel[0]?.id_mapel || '',
            isi_soal: '',
            jenis_soal: 'pilihan_ganda',
            opsi_jawaban: ['', '', '', ''],
            kunci_jawaban: '',
            kunci_jawaban_kompleks: [],
            topik_materi: '',
            paket_soal: '',
            level_kognitif: '',
            gambar_soal: null,
            hapus_gambar: false,
            gambar_soal_url: null,
            audio_soal: null,
            hapus_audio: false,
            audio_soal_url: null,
            batas_putar_audio: '',
            keywords: '',
            rule_weight: 0.4,
            lsa_weight: 0.6,
            use_math: false,
            math_steps: '',
            math_weight: 0,
            tgate: 0,
            required_keywords_count: '',
        });
        setEditingBankSoalId(null);
        setIsFormOpen(false);
    };

    const handleSaveBankSoal = async (e) => {
        e.preventDefault();
        try {
            if (!bankForm.id_mapel || !bankForm.isi_soal.trim() || !bankForm.topik_materi.trim() || !bankForm.level_kognitif) {
                showPopup('Validasi Gagal', 'Mohon lengkapi semua kolom yang wajib diisi.', 'error');
                return;
            }

            const opsiJawaban = bankForm.opsi_jawaban
                .map(item => String(item).trim())
                .filter(Boolean);

            const formData = new FormData();
            formData.append('id_mapel', Number(bankForm.id_mapel));
            formData.append('isi_soal', bankForm.isi_soal);
            formData.append('jenis_soal', bankForm.jenis_soal);
            formData.append('topik_materi', bankForm.topik_materi);
            formData.append('paket_soal', (bankForm.paket_soal || '').trim());
            formData.append('level_kognitif', bankForm.level_kognitif);

            if (bankForm.jenis_soal === 'pilihan_ganda' || bankForm.jenis_soal === 'pilihan_ganda_kompleks') {
                if (opsiJawaban.length < 2) {
                    showPopup('Validasi Gagal', 'Minimal 2 opsi jawaban diperlukan.', 'error');
                    return;
                }
                opsiJawaban.forEach((opsi, index) => {
                    formData.append(`opsi_jawaban[${index}]`, opsi);
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
                formData.append('tgate', bankForm.tgate === '' ? 0 : bankForm.tgate);
                if (bankForm.required_keywords_count !== '' && bankForm.required_keywords_count !== null) {
                    formData.append('required_keywords_count', bankForm.required_keywords_count);
                }
                
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
                if (bankForm.gambar_soal.size > 2 * 1024 * 1024) {
                    showPopup('Validasi Gagal', `Ukuran berkas gambar (${(bankForm.gambar_soal.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal 2 MB.`, 'error');
                    return;
                }
                formData.append('gambar_soal', bankForm.gambar_soal);
            } else if (bankForm.hapus_gambar) {
                formData.append('hapus_gambar', 'true');
            }

            if (bankForm.audio_soal instanceof File) {
                if (bankForm.audio_soal.size > 10 * 1024 * 1024) {
                    showPopup('Validasi Gagal', `Ukuran berkas audio (${(bankForm.audio_soal.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal 10 MB.`, 'error');
                    return;
                }
                formData.append('audio_soal', bankForm.audio_soal);
            } else if (bankForm.hapus_audio) {
                formData.append('hapus_audio', 'true');
            }
            if ((bankForm.audio_soal instanceof File || bankForm.audio_soal_url) && !bankForm.hapus_audio) {
                formData.append('batas_putar_audio', bankForm.batas_putar_audio ? Number(bankForm.batas_putar_audio) : 0);
            }

            let endpoint = '/api/admin/bank-soal';
            if (editingBankSoalId) {
                endpoint += `/${editingBankSoalId}`;
                formData.append('_method', 'PATCH');
            }

            await apiFetch(endpoint, session, {
                method: 'POST',
                body: formData,
            });

            showPopup('Berhasil', editingBankSoalId ? 'Soal berhasil diperbarui!' : 'Soal berhasil ditambahkan!');
            resetBankForm();
            loadData();
        } catch (error) {
            console.error('Error saving soal:', error);
            showPopup('Gagal Menyimpan Soal', error.message || 'Gagal menyimpan soal.', 'error');
        }
    };

    const downloadTemplateExcel = () => {
        downloadBankSoalTemplateExcel("Template_Import_Soal_Admin_SMAN.xlsx");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingImportFile(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const confirmImportExcelAction = () => {
        if (!pendingImportFile) return;
        const file = pendingImportFile;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                setIsImporting(true);
                setImportResult(null);

                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
                
                if (data.length === 0) {
                    setPendingImportFile(null);
                    showPopup('Format File Tidak Valid', 'File Excel kosong atau format tidak sesuai.', 'error');
                    return;
                }

                const rowImages = extractImagesByRowFromXlsxBinary(bstr);
                const { mapelGroup, skippedRows } = parseBankSoalExcelRows(data, masterMapel, {
                    isGuru: false,
                    rowImages,
                    defaultPaket: importPaketName,
                });

                let totalCreated = 0;
                for (const [idMapel, soalArray] of Object.entries(mapelGroup)) {
                    const res = await apiFetch('/api/admin/bank-soal/bulk', session, {
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
                
                setPendingImportFile(null);
                loadData();
            } catch (err) {
                console.error(err);
                setPendingImportFile(null);
                showPopup('Gagal Import Excel', 'Terjadi kesalahan saat memproses file Excel: ' + (err.message || err), 'error');
            } finally {
                setIsImporting(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const mapelOptions = useMemo(() => {
        const mapels = new Map();
        soalList.forEach(s => {
            if (s.mata_pelajaran) {
                mapels.set(s.mata_pelajaran.id_mapel, `${s.mata_pelajaran.nama_mapel} - Tingkat ${s.mata_pelajaran.tingkat}`);
            }
        });
        return Array.from(mapels.entries());
    }, [soalList]);

    const paketOptions = useMemo(() => {
        const set = new Set();
        soalList.forEach(s => {
            if (selectedMapel !== 'all' && s.id_mapel.toString() !== selectedMapel.toString()) return;
            const p = (s.paket_soal || '').trim();
            if (p) set.add(p);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    }, [soalList, selectedMapel]);

    const filteredSoal = useMemo(() => {
        return soalList.filter(s => {
            if (selectedMapel !== 'all' && s.id_mapel.toString() !== selectedMapel.toString()) return false;
            if (selectedPaket === '__TANPA_PAKET__') {
                return !(s.paket_soal || '').trim();
            }
            if (selectedPaket !== 'all') {
                return (s.paket_soal || '').trim() === selectedPaket;
            }
            return true;
        });
    }, [soalList, selectedMapel, selectedPaket]);

    const [expandedBankFolders, setExpandedBankFolders] = useState({});
    const toggleBankFolder = (id_mapel) => {
        setExpandedBankFolders(prev => ({ ...prev, [id_mapel]: !prev[id_mapel] }));
    };

    const groupedBankSoal = useMemo(() => {
        return filteredSoal.reduce((acc, soal) => {
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
    }, [filteredSoal]);

    return (
        <DashboardLayout user={session?.user} title="Bank Soal (Shared Pool)" navigation={navigation} onLogout={onLogout}>
            <div className="space-y-6">
                <section className="overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary px-4 py-6 sm:px-8 sm:py-10 shadow-lg backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-8">
                    <div>
                        <p className="text-xs uppercase tracking-[0.45em] text-accent">Bank Soal</p>
                        <h3 className="mt-4 max-w-2xl text-xl sm:text-3xl font-semibold leading-tight text-[#EEDCC8] md:text-4xl">Manajemen Bank Soal</h3>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-accent md:text-base">Kolam soal bersama antar Admin dan Guru</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                        <button onClick={() => {
                            if (!isFormOpen) {
                                setBankForm(curr => ({ ...curr, id_mapel: masterMapel[0]?.id_mapel || '' }));
                                scrollToForm();
                            }
                            setIsFormOpen(!isFormOpen);
                        }} className="px-6 py-3 bg-accent hover:scale-105 text-[#EEDCC8] rounded-full text-sm font-semibold transition-all shadow-md">
                            {isFormOpen ? 'Tutup Form' : '+ Tambah Manual'}
                        </button>
                    </div>
                </section>

                {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm">{error}</div>}

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

                {isFormOpen && (
                    <BankSoalForm 
                        formRef={formRef}
                        bankForm={bankForm}
                        setBankForm={setBankForm}
                        mapelOptions={masterMapel}
                        onSubmit={handleSaveBankSoal}
                        onCancel={resetBankForm}
                        isEditing={!!editingBankSoalId}
                        onWarning={(title, msg) => showPopup(title, msg, 'error')}
                    />
                )}

                <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-6 sm:p-8 shadow-sm">
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6 sm:gap-8">
                        <div className="flex-1 space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Jalur Cepat
                            </div>
                            
                            <div>
                                <h4 className="text-xl font-bold text-slate-900">Import Soal Massal (Excel)</h4>
                                <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-2xl">
                                    Hemat waktu Anda! Tambahkan puluhan hingga ratusan soal sekaligus menggunakan file Excel (<code>.xlsx</code>). Anda juga dapat menyisipkan <strong>Gambar Pendukung</strong> langsung di dalam baris soal pada file Excel.
                                </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-5 pt-1">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">1</div>
                                    Unduh template Excel (<code>.xlsx</code>)
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">2</div>
                                    Isi data soal & sisipkan gambar (jika ada)
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">3</div>
                                    Klik Pilih & Import Excel
                                </div>
                            </div>

                            <div className="mt-3 rounded-2xl border border-emerald-200/80 bg-white/90 p-4 text-xs text-slate-600 space-y-2 shadow-sm">
                                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    Panduan & Persyaratan Import Soal Excel:
                                </p>
                                <ul className="list-disc pl-5 space-y-1 leading-relaxed text-slate-600">
                                    <li><strong>Format File:</strong> Gunakan file berformat <code>.xlsx</code> (disarankan menggunakan template resmi dari tombol <strong>Unduh Template</strong>).</li>
                                    <li><strong>Kolom Wajib:</strong> <code>Mata Pelajaran</code> (harus sesuai dengan nama mata pelajaran di sistem, misal: <em>Bahasa Indonesia (X)</em>), <code>Isi Soal</code>, <code>Jenis Soal</code> (<em>Pilihan Ganda</em>, <em>Pilihan Ganda Kompleks</em>, atau <em>Esai</em>), <code>Kunci Jawaban</code>, dan <code>Level Kognitif Bloom</code> (<em>C1–C6</em>).</li>
                                    <li><strong>Paket Soal (Opsional):</strong> Anda dapat mengisi kolom <code>Paket Soal (Opsional)</code> di Excel (misal: <em>Paket A</em>, <em>Paket B</em>) atau menetapkan nama paket secara langsung pada kolom input di samping sebelum mengklik <strong>Pilih &amp; Import Excel</strong>.</li>
                                    <li><strong>Aturan Opsi & Kunci:</strong> Untuk <em>Pilihan Ganda</em> & <em>Pilihan Ganda Kompleks</em>, isi minimal 2 opsi (<code>Opsi A</code> s/d <code>Opsi E</code>) dan pastikan teks <code>Kunci Jawaban</code> sama persis dengan salah satu opsi (pisahkan dengan koma <code>,</code> jika jawaban benar lebih dari satu pada Pilihan Ganda Kompleks).</li>
                                    <li><strong>Cara Menyisipkan Gambar Pendukung (Opsional):</strong> Pada kolom <code>Gambar Pendukung (Opsional)</code> di baris soal yang diinginkan, klik menu <strong>Insert &rarr; Pictures</strong> di Excel (bisa menggunakan <em>Place in Cell</em> maupun <em>Place over Cells</em> pada baris tersebut). Format gambar yang didukung: <strong>JPG, JPEG, PNG</strong> (maksimal <strong>2 MB</strong> per gambar).</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 min-w-[240px] w-full lg:w-72 lg:pt-2">
                            <div className="rounded-xl border border-emerald-200/90 bg-white/95 p-3 shadow-xs space-y-1.5">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                                    📦 Nama Paket Soal File Ini (Opsional)
                                </label>
                                <input
                                    type="text"
                                    list="admin-import-paket-list"
                                    value={importPaketName}
                                    onChange={(e) => setImportPaketName(e.target.value)}
                                    placeholder="Misal: Paket A"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                                />
                                <datalist id="admin-import-paket-list">
                                    <option value="Paket A" />
                                    <option value="Paket B" />
                                    <option value="Paket C" />
                                    <option value="Paket D" />
                                </datalist>
                                <p className="text-[10px] leading-snug text-slate-500">
                                    Jika diisi, baris di Excel yang kolom Paket-nya kosong otomatis masuk ke paket ini.
                                </p>
                            </div>
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

                <div className="bg-white rounded-3xl shadow-sm border border-border overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <FilterSelect
                                value={selectedMapel}
                                onChange={setSelectedMapel}
                                options={[
                                    { value: 'all', label: 'Semua Mata Pelajaran' },
                                    ...mapelOptions.map(([id, label]) => ({ value: id, label }))
                                ]}
                                placeholder="Semua Mata Pelajaran"
                                icon="📚"
                                align="left"
                            />
                            <FilterSelect
                                value={selectedPaket}
                                onChange={setSelectedPaket}
                                options={[
                                    { value: 'all', label: 'Semua Paket Soal' },
                                    { value: '__TANPA_PAKET__', label: 'Tanpa Paket (Umum)' },
                                    ...paketOptions.map((p) => ({ value: p, label: `📦 ${p}` })),
                                ]}
                                placeholder="Semua Paket Soal"
                                icon="📦"
                                align="left"
                            />
                        </div>
                        <span className="text-sm text-slate-500 font-medium">Total: {filteredSoal.length} Soal</span>
                    </div>

                    <div className="p-5 bg-slate-50/30">
                        {loading ? (
                            <div className="flex h-32 items-center justify-center text-slate-400">Memuat data...</div>
                        ) : filteredSoal.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900">Belum ada data</h4>
                                <p className="mt-1 text-sm text-slate-500">Tidak ada soal yang cocok dengan pencarian Anda.</p>
                            </div>
                        ) : (
                            Object.entries(groupedBankSoal).map(([id_mapel, group]) => (
                                <details key={id_mapel} open className="group mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm last:mb-0">
                                    <summary className="flex cursor-pointer items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4 list-none transition hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm border border-slate-200 group-open:bg-blue-600 group-open:text-white group-open:border-blue-600 transition-colors">
                                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                            </div>
                                            <div>
                                                <h5 className="text-base font-bold text-slate-800">{group.mapel?.nama_mapel} {group.mapel?.tingkat ? `(Kelas ${group.mapel.tingkat})` : ''}</h5>
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
                                                    <th className="px-5 py-4 font-semibold">Pembuat</th>
                                                    <th className="px-5 py-4 font-semibold">Topik</th>
                                                    <th className="px-5 py-4 font-semibold">Jenis</th>
                                                    <th className="px-5 py-4 font-semibold">Level</th>
                                                    <th className="px-5 py-4 font-semibold">Isi Soal</th>
                                                    <th className="px-5 py-4 font-semibold text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 bg-white">
                                                {group.soals.map((soal, index) => (
                                                    <tr key={soal.id_soal} className="align-top transition-colors hover:bg-slate-50/80">
                                                        <td className="px-5 py-4 font-semibold text-slate-400">{index + 1}</td>
                                                        <td className="px-5 py-4">
                                                            <span className={`inline-flex px-2 py-1 rounded-md text-[11px] font-semibold ${soal.pembuat?.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>
                                                                {soal.pembuat?.role === 'admin' 
                                                                    ? (soal.pembuat?.id_pengguna === session?.user?.id_pengguna ? 'Admin (Anda)' : `Admin (${soal.pembuat?.admin?.nama_lengkap || 'Unknown'})`) 
                                                                    : `Guru (${soal.pembuat?.guru?.nama_lengkap || 'Unknown'})`}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-slate-600">
                                                            <div>{soal.topik_materi}</div>
                                                            {soal.paket_soal && (
                                                                <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-violet-50 border border-violet-200 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                                                                    📦 {soal.paket_soal}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-[11px] font-medium text-slate-600">
                                                                {soal.jenis_soal.replace(/_/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{soal.level_kognitif}</td>
                                                        <td className="px-5 py-4 text-slate-600 max-w-xs" title={soal.isi_soal}>
                                                            <p className="truncate">{soal.isi_soal}</p>
                                                            {(soal.gambar_soal || soal.audio_soal) && (
                                                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                                    {soal.gambar_soal && (
                                                                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                                                            🖼️ Gambar
                                                                        </span>
                                                                    )}
                                                                    {soal.audio_soal && (
                                                                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                                                                            🎵 Audio {soal.batas_putar_audio ? `(${soal.batas_putar_audio}x)` : '(∞)'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button onClick={() => handleEditSoal(soal)} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                                </button>
                                                                <button onClick={() => handleDelete(soal.id_soal)} title="Hapus" className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700 transition-colors">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </details>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmDeleteSoal.isOpen}
                title="Hapus Soal?"
                message="Apakah Anda yakin ingin menghapus soal ini dari Bank Soal? Soal yang dihapus tidak dapat dikembalikan."
                loading={confirmDeleteSoal.loading}
                onConfirm={confirmDeleteSoalAction}
                onCancel={() => setConfirmDeleteSoal({ isOpen: false, id_soal: null, loading: false })}
            />
            <ConfirmModal
                isOpen={!!pendingImportFile}
                title="Konfirmasi Import Soal Excel"
                message={`Apakah Anda yakin ingin mengimpor soal dari berkas "${pendingImportFile?.name || ''}"?\n\nPastikan nama kolom dan format isian sudah sesuai dengan template.`}
                confirmText="Ya, Import Sekarang"
                cancelText="Batal"
                variant="success"
                loading={isImporting}
                onConfirm={confirmImportExcelAction}
                onCancel={() => {
                    if (!isImporting) setPendingImportFile(null);
                }}
            />
            <PopupModal popup={popup} onClose={() => setPopup(null)} />
        </DashboardLayout>
    );
}
