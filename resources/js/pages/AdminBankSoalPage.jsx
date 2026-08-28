import React, { useEffect, useState, useMemo, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch } from '../lib/api';
import { adminNavigation } from './adminNavigation';
import * as XLSX from 'xlsx';
import BankSoalForm from '../components/ui/BankSoalForm';
import FilterSelect from '../components/ui/FilterSelect';

export default function AdminBankSoalPage({ session, onLogout }) {
    const [soalList, setSoalList] = useState([]);
    const [masterMapel, setMasterMapel] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    // Filters
    const [selectedMapel, setSelectedMapel] = useState('all');

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
        level_kognitif: '',
        gambar_soal: null,
        hapus_gambar: false,
        gambar_soal_url: null,
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

    const handleDelete = async (id_soal) => {
        if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
        try {
            await apiFetch(`/api/admin/bank-soal/${id_soal}`, session, { method: 'DELETE' });
            loadData();
        } catch (err) {
            alert(err.message || 'Gagal menghapus soal.');
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
            level_kognitif: soal.level_kognitif,
            gambar_soal: null,
            hapus_gambar: false,
            gambar_soal_url: soal.gambar_soal_url || null,
        });
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            level_kognitif: '',
            gambar_soal: null,
            hapus_gambar: false,
            gambar_soal_url: null,
        });
        setEditingBankSoalId(null);
        setIsFormOpen(false);
    };

    const handleSaveBankSoal = async (e) => {
        e.preventDefault();
        try {
            if (!bankForm.id_mapel || !bankForm.isi_soal.trim() || !bankForm.topik_materi.trim() || !bankForm.level_kognitif) {
                alert('Mohon lengkapi semua kolom yang wajib diisi.');
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
            formData.append('level_kognitif', bankForm.level_kognitif);

            if (bankForm.jenis_soal === 'pilihan_ganda' || bankForm.jenis_soal === 'pilihan_ganda_kompleks') {
                if (opsiJawaban.length < 2) {
                    alert('Minimal 2 opsi jawaban diperlukan.');
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

            if (bankForm.gambar_soal instanceof File) {
                formData.append('gambar_soal', bankForm.gambar_soal);
            } else if (bankForm.hapus_gambar) {
                formData.append('hapus_gambar', 'true');
            }

            let endpoint = '/api/admin/bank-soal';
            if (editingBankSoalId) {
                endpoint += `/${editingBankSoalId}`;
                formData.append('_method', 'PUT');
            }

            await apiFetch(endpoint, session, {
                method: 'POST',
                body: formData,
            });

            alert(editingBankSoalId ? 'Soal berhasil diperbarui!' : 'Soal berhasil ditambahkan!');
            resetBankForm();
            loadData();
        } catch (error) {
            console.error('Error saving soal:', error);
            alert(error.message || 'Gagal menyimpan soal.');
        }
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

        XLSX.writeFile(workbook, "Template_Import_Soal_Admin_SMAN.xlsx");
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

                // Build a lookup map: nama_mapel (case-insensitive) -> id_mapel
                const mapelLookup = {};
                masterMapel.forEach(m => {
                    const namaLengkap = `${m.nama_mapel} (${m.tingkat})`.toLowerCase();
                    mapelLookup[namaLengkap] = m.id_mapel;
                    mapelLookup[m.nama_mapel.toLowerCase()] = m.id_mapel;
                });

                // Map data from excel — support both nama_mapel and id_mapel columns
                const mapelGroup = {};
                const skippedRows = [];

                data.forEach((row, idx) => {
                    let resolvedId = null;

                    // Prefer nama_mapel column
                    if (row.nama_mapel) {
                        const key = String(row.nama_mapel).trim().toLowerCase();
                        resolvedId = mapelLookup[key] || null;
                        if (!resolvedId) {
                            skippedRows.push(`Baris ${idx + 2}: Mapel '${row.nama_mapel}' tidak ditemukan.`);
                            return;
                        }
                    } else if (row.id_mapel) {
                        // Fallback to id_mapel for backward compatibility
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
                
                loadData();
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

    const mapelOptions = useMemo(() => {
        const mapels = new Map();
        soalList.forEach(s => {
            if (s.mata_pelajaran) {
                mapels.set(s.mata_pelajaran.id_mapel, `${s.mata_pelajaran.nama_mapel} - Tingkat ${s.mata_pelajaran.tingkat}`);
            }
        });
        return Array.from(mapels.entries());
    }, [soalList]);

    const filteredSoal = useMemo(() => {
        if (selectedMapel === 'all') return soalList;
        return soalList.filter(s => s.id_mapel.toString() === selectedMapel.toString());
    }, [soalList, selectedMapel]);

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
                            }
                            setIsFormOpen(!isFormOpen);
                        }} className="px-6 py-3 bg-accent hover:scale-105 text-[#EEDCC8] rounded-full text-sm font-semibold transition-all shadow-md">
                            {isFormOpen ? 'Tutup Form' : '+ Tambah Manual'}
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="px-6 py-3 bg-[#EEDCC8] hover:scale-105 text-primary rounded-full text-sm font-semibold transition-all shadow-md disabled:opacity-50 flex items-center gap-2">
                            {isImporting ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Mengimpor...
                                </>
                            ) : 'Import Excel'}
                        </button>
                        <button onClick={downloadTemplateExcel} className="px-6 py-3 bg-white/15 hover:bg-white/25 hover:scale-105 text-[#EEDCC8] rounded-full text-sm font-semibold transition-all shadow-md border border-white/20 backdrop-blur-sm">
                            ↓ Unduh Template
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
                        bankForm={bankForm}
                        setBankForm={setBankForm}
                        mapelOptions={masterMapel}
                        onSubmit={handleSaveBankSoal}
                        onCancel={resetBankForm}
                        isEditing={!!editingBankSoalId}
                    />
                )}

                <div className="bg-white rounded-3xl shadow-sm border border-border overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
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
                                                        <td className="px-5 py-4 text-slate-600">{soal.topik_materi}</td>
                                                        <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-[11px] font-medium text-slate-600">
                                                                {soal.jenis_soal.replace(/_/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{soal.level_kognitif}</td>
                                                        <td className="px-5 py-4 text-slate-600 truncate max-w-xs" title={soal.isi_soal}>
                                                            {soal.isi_soal}
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
        </DashboardLayout>
    );
}
