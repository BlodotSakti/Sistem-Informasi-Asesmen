import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch } from '../lib/api';
import { guruNavigation } from './guru/guruNavigation';
import { formatDateTimeLabel } from '../lib/date';
import FilterSelect from '../components/ui/FilterSelect';

export default function GuruArsipDiagnostikPage({ session, onLogout }) {
    const [diagnostics, setDiagnostics] = useState({ data: [], current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [kelasFilter, setKelasFilter] = useState('all');
    const [tipeSoalFilter, setTipeSoalFilter] = useState('all');
    const [kelasOptions, setKelasOptions] = useState([]);
    const [tipeSoalOptions, setTipeSoalOptions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;
        const loadWorkspace = async () => {
            try {
                const response = await apiFetch('/api/guru/workspace-data', session);
                if (mounted && response) {
                    if (response.kelas_options) setKelasOptions(response.kelas_options);
                    if (response.tipe_soal_options) setTipeSoalOptions(response.tipe_soal_options);
                }
            } catch (err) {
                console.error("Gagal memuat filter kelas", err);
            }
        };
        if (session?.token) loadWorkspace();
        return () => { mounted = false; };
    }, [session]);

    const fetchDiagnostics = useCallback(async (page, search, kelas, tipeSoal) => {
        try {
            setLoading(true);
            setError('');
            const params = new URLSearchParams();
            params.append('page', page);
            if (search) {
                params.append('search', search);
            }
            if (kelas && kelas !== 'all') {
                params.append('id_kelas', kelas);
            }
            if (tipeSoal && tipeSoal !== 'all') {
                params.append('tipe_soal', tipeSoal);
            }
            
            const response = await apiFetch(`/api/guru/analisis-diagnostik?${params.toString()}`, session);
            setDiagnostics(response || { data: [], current_page: 1, last_page: 1, total: 0 });
        } catch (err) {
            setError(err.message || 'Gagal memuat arsip laporan diagnostik.');
        } finally {
            setLoading(false);
        }
    }, [session]);

    // Debounce search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1);
            fetchDiagnostics(1, searchQuery, kelasFilter, tipeSoalFilter);
        }, 300); // 300ms debounce untuk rasa pencarian lebih instan

        return () => clearTimeout(timer);
    }, [searchQuery, kelasFilter, tipeSoalFilter, fetchDiagnostics]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= diagnostics.last_page) {
            setCurrentPage(newPage);
            fetchDiagnostics(newPage, searchQuery, kelasFilter, tipeSoalFilter);
        }
    };

    return (
        <DashboardLayout title="Arsip Laporan Diagnostik" user={session?.user} navigation={guruNavigation} onLogout={onLogout} profileHref="/guru/profil">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button onClick={() => window.location.href = '/guru/dashboard'} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Kembali ke Dasbor
                        </button>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Arsip Laporan Diagnostik</h2>
                        <p className="mt-1 text-slate-500">Telusuri dan kelola seluruh riwayat analisis diagnostik AI siswa.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
                        <FilterSelect
                            value={tipeSoalFilter}
                            onChange={setTipeSoalFilter}
                            options={[
                                { value: 'all', label: 'Semua Tipe Soal' },
                                ...tipeSoalOptions.map((tipe) => ({ value: tipe, label: tipe }))
                            ]}
                            placeholder="Semua Tipe Soal"
                            icon="📝"
                        />
                        <FilterSelect
                            value={kelasFilter}
                            onChange={setKelasFilter}
                            options={[
                                { value: 'all', label: 'Semua Kelas' },
                                ...kelasOptions.map((k) => ({ value: k.id_kelas, label: `${k.nama_kelas}${k.is_wali_kelas ? ' (Wali Kelas)' : ''}` }))
                            ]}
                            placeholder="Semua Kelas"
                            icon="🏫"
                            // warna untuk tombol Utama filter aktif
                            accentClass="bg-accent border-accent text-white shadow-md shadow-gold-900"

                            // warna untuk item dropdown yang dipilih
                            dropdownAccentClass="bg-accent border-accent text-white shadow-md shadow-gold-900"
                        />
                        <div className="relative w-full sm:w-80">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari nama siswa..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 bg-white text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-500 w-16 text-center">No</th>
                                    <th className="px-6 py-4 font-semibold text-slate-500">Nama Siswa</th>
                                    <th className="px-6 py-4 font-semibold text-slate-500">Kelas</th>
                                    <th className="px-6 py-4 font-semibold text-slate-500">Mata Pelajaran</th>
                                    <th className="px-6 py-4 font-semibold text-slate-500 text-center">Tipe Soal</th>
                                    <th className="px-6 py-4 font-semibold text-slate-500 text-center">Skor</th>
                                    <th className="px-6 py-4 font-semibold text-slate-500">Tanggal Generate</th>
                                    <th className="px-6 py-4 font-semibold text-slate-500 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {loading && diagnostics.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                                            <div className="flex justify-center mb-4">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                            </div>
                                            Memuat arsip laporan...
                                        </td>
                                    </tr>
                                ) : diagnostics.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                                            {searchQuery ? 'Tidak ditemukan laporan untuk nama siswa tersebut.' : 'Belum ada arsip laporan diagnostik.'}
                                        </td>
                                    </tr>
                                ) : (
                                    diagnostics.data.map((item, index) => (
                                        <tr key={item.id_analisis} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-center text-sm font-medium text-slate-500">
                                                {((diagnostics.current_page || 1) - 1) * 15 + index + 1}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                {item.siswa?.nama_lengkap || 'Tidak diketahui'}
                                                <div className="text-xs font-normal text-slate-500 mt-0.5">{item.siswa?.nisn}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">
                                                {item.sesi_asesmen?.kelas?.nama_kelas || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">
                                                {item.sesi_asesmen?.mata_pelajaran?.nama_mapel || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                                                    {item.sesi_asesmen?.tipe_soal || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-black tracking-wide ${item.skor_total >= 80 ? 'bg-emerald-100 text-emerald-700' : item.skor_total >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {item.skor_total} Pts
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">
                                                {formatDateTimeLabel(item.tanggal_generate)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => window.location.href = `/guru/laporan-diagnostik/${item.id_analisis}`}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-accent/60 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-accent"
                                                >
                                                    Lihat
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {diagnostics.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-border bg-slate-50 px-6 py-4">
                            <p className="text-sm text-slate-600">
                                Menampilkan <span className="font-semibold text-slate-900">{((diagnostics.current_page - 1) * 15) + (diagnostics.data.length > 0 ? 1 : 0)}</span> - <span className="font-semibold text-slate-900">{((diagnostics.current_page - 1) * 15) + diagnostics.data.length}</span> dari <span className="font-semibold text-slate-900">{diagnostics.total}</span> arsip
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(diagnostics.current_page - 1)}
                                    disabled={diagnostics.current_page === 1}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-border text-slate-500 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <span className="px-4 text-sm font-medium text-slate-700">
                                    Halaman {diagnostics.current_page} dari {diagnostics.last_page}
                                </span>
                                <button
                                    onClick={() => handlePageChange(diagnostics.current_page + 1)}
                                    disabled={diagnostics.current_page === diagnostics.last_page}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-border text-slate-500 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

