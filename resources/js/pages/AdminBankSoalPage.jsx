import React, { useEffect, useState, useMemo, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch } from '../lib/api';
import { adminNavigation } from './adminNavigation';
import * as XLSX from 'xlsx';
import BankSoalForm from '../components/ui/BankSoalForm';

export default function AdminBankSoalPage({ session, onLogout }) {
    const [soalList, setSoalList] = useState([]);
    const [masterMapel, setMasterMapel] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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

                // Map data from excel
                const mapelGroup = data.reduce((acc, row) => {
                    const idMapel = row.id_mapel;
                    if (!idMapel) return acc;
                    if (!acc[idMapel]) acc[idMapel] = [];
                    
                    let opsi = [];
                    if (row.opsi_a) opsi.push(row.opsi_a);
                    if (row.opsi_b) opsi.push(row.opsi_b);
                    if (row.opsi_c) opsi.push(row.opsi_c);
                    if (row.opsi_d) opsi.push(row.opsi_d);
                    if (row.opsi_e) opsi.push(row.opsi_e);

                    acc[idMapel].push({
                        isi_soal: row.isi_soal,
                        jenis_soal: row.jenis_soal || 'pilihan_ganda',
                        kunci_jawaban: row.kunci_jawaban,
                        topik_materi: row.topik_materi || 'Umum',
                        level_kognitif: row.level_kognitif || 'C1',
                        opsi_jawaban: opsi
                    });
                    return acc;
                }, {});

                for (const [idMapel, soalArray] of Object.entries(mapelGroup)) {
                    await apiFetch('/api/admin/bank-soal/bulk', session, {
                        method: 'POST',
                        body: JSON.stringify({
                            id_mapel: parseInt(idMapel),
                            soal: soalArray
                        })
                    });
                }
                
                alert('Berhasil mengimpor soal dari Excel!');
                loadData();
            } catch (err) {
                console.error(err);
                alert('Terjadi kesalahan saat memproses file Excel: ' + (err.message || err));
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
                <section className="overflow-hidden rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary px-8 py-10 shadow-lg backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                    <div>
                        <p className="text-xs uppercase tracking-[0.45em] text-accent">Bank Soal</p>
                        <h3 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-[#EEDCC8] md:text-4xl">Manajemen Bank Soal</h3>
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
                        <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-[#EEDCC8] hover:scale-105 text-primary rounded-full text-sm font-semibold transition-all shadow-md">
                            Import Excel
                        </button>
                    </div>
                </section>

                {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm">{error}</div>}

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
                        <select value={selectedMapel} onChange={(e) => setSelectedMapel(e.target.value)} className="bg-slate-50 border border-border text-slate-700 text-sm rounded-xl px-4 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition">
                            <option value="all">Semua Mata Pelajaran</option>
                            {mapelOptions.map(([id, label]) => (
                                <option key={id} value={id}>{label}</option>
                            ))}
                        </select>
                        <span className="text-sm text-slate-500 font-medium">Total: {filteredSoal.length} Soal</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4">No</th>
                                    <th className="px-6 py-4">Pembuat</th>
                                    <th className="px-6 py-4">Topik</th>
                                    <th className="px-6 py-4">Jenis</th>
                                    <th className="px-6 py-4">Level</th>
                                    <th className="px-6 py-4">Isi Soal</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-400">Memuat data...</td></tr>
                                ) : filteredSoal.length === 0 ? (
                                    <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-400">Belum ada soal.</td></tr>
                                ) : (
                                    Object.entries(groupedBankSoal).map(([id_mapel, group]) => (
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
                                                                📁 {group.mapel?.nama_mapel} (Kelas {group.mapel?.tingkat})
                                                            </span>
                                                            <span className="text-sm font-medium text-slate-500 bg-white px-2 py-1 rounded-md shadow-sm border border-border">
                                                                {group.soals.length} Soal
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedBankFolders[id_mapel] && group.soals.map((soal, index) => (
                                                <tr key={soal.id_soal} className="align-top hover:bg-slate-50/70 border-l-4 border-primary">
                                                    <td className="px-5 py-4 font-medium text-slate-500 pl-6">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${soal.pembuat?.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>
                                                            {soal.pembuat?.role === 'admin' 
                                                                ? (soal.pembuat?.id_pengguna === session?.user?.id_pengguna ? 'Admin (Anda)' : `Admin (${soal.pembuat?.admin?.nama_lengkap || 'Unknown'})`) 
                                                                : `Guru (${soal.pembuat?.guru?.nama_lengkap || 'Unknown'})`}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">{soal.topik_materi}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                                                            {soal.jenis_soal.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">{soal.level_kognitif}</td>
                                                    <td className="px-6 py-4 text-slate-600 truncate max-w-xs" title={soal.isi_soal}>
                                                        {soal.isi_soal}
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button onClick={() => handleEditSoal(soal)} className="text-primary hover:text-primary font-medium">Edit</button>
                                                        <button onClick={() => handleDelete(soal.id_soal)} className="text-red-500 hover:text-red-700 font-medium">Hapus</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
