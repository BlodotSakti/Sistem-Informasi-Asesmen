import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch } from '../lib/api';
import { adminNavigation } from './adminNavigation';
import StudentListModal from '../components/admin/StudentListModal';
import { Network } from 'lucide-react';

export default function AdminAcademicMappingPage({ session, onLogout }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Filters
    const [selectedYear, setSelectedYear] = useState('all');
    const [selectedTingkat, setSelectedTingkat] = useState('all');

    // Modal state
    const [selectedKelas, setSelectedKelas] = useState(null);

    const navigation = adminNavigation;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await apiFetch('/api/admin/academic-mapping', session);
                setData(response.data || []);
            } catch (err) {
                setError(err.message || 'Gagal memuat data pemetaan akademik');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [session]);

    const filterOptions = useMemo(() => {
        const years = [...new Set(data.map(k => k.tahun_ajaran))].sort().reverse();
        const tingkats = [...new Set(data.map(k => k.tingkat))].sort();
        return { years, tingkats };
    }, [data]);

    const filteredData = useMemo(() => {
        return data.filter(k => {
            const matchYear = selectedYear === 'all' || k.tahun_ajaran === selectedYear;
            const matchTingkat = selectedTingkat === 'all' || k.tingkat === selectedTingkat;
            return matchYear && matchTingkat;
        });
    }, [data, selectedYear, selectedTingkat]);

    return (
        <DashboardLayout title="Pemetaan Akademik" user={session?.user} navigation={navigation} onLogout={onLogout}>
            <div className="space-y-8">
                <section className="overflow-hidden rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary px-8 py-10 shadow-lg backdrop-blur-xl">
                    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                        <div>
                            <p className="text-xs uppercase tracking-[0.45em] text-accent">Pemetaan Akademik</p>
                            <h3 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-[#EEDCC8] md:text-4xl">Sentralisasi Relasi Data</h3>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-accent md:text-base">Lihat pemetaan lengkap antara Kelas, Guru Wali, Guru Pengampu Mata Pelajaran, dan Populasi Siswa dalam satu tampilan terpadu.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 lg:justify-end">
                            <div className="rounded-[1.5rem] bg-[#EEDCC8] p-5 backdrop-blur-xl border border-white shadow-sm transition hover:shadow-md flex-1 lg:flex-none lg:min-w-40">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                                    <Network className="w-6 h-6" />
                                </div>
                                <div className="text-3xl font-extrabold text-accent">{data?.length || 0}</div>
                                <div className="text-sm font-medium text-accent mt-1">Total Kelas</div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 items-center gap-4">
                        <select 
                            value={selectedYear} 
                            onChange={e => setSelectedYear(e.target.value)}
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-900"
                        >
                            <option value="all">Semua Tahun Ajaran</option>
                            {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select 
                            value={selectedTingkat} 
                            onChange={e => setSelectedTingkat(e.target.value)}
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-900"
                        >
                            <option value="all">Semua Tingkat Kelas</option>
                            {filterOptions.tingkats.map(t => <option key={t} value={t}>Tingkat {t}</option>)}
                        </select>
                    </div>
                    <div className="text-sm font-medium text-slate-500">
                        Menampilkan {filteredData.length} kelas
                    </div>
                </div>

                {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-slate-900"></div>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {filteredData.map((kelas) => (
                            <div key={kelas.id_kelas} className="flex flex-col rounded-3xl border border-border bg-white p-6 shadow-sm">
                                <div className="border-b border-slate-100 pb-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xl font-bold text-slate-900">{kelas.nama_kelas}</h4>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                            {kelas.tahun_ajaran}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Wali Kelas: <span className="font-semibold text-slate-700">{kelas.guru_wali}</span>
                                    </p>
                                </div>

                                <div className="flex-1 py-4">
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-slate-700">Daftar Mata Pelajaran</p>
                                            <span className="text-xs text-slate-500">{kelas.mata_pelajaran.length} Mapel</span>
                                        </div>
                                        {kelas.mata_pelajaran.length > 0 ? (
                                            <ul className="mt-2 space-y-2">
                                                {kelas.mata_pelajaran.map(mp => (
                                                    <li key={mp.id_penugasan_pembelajaran} className="flex justify-between text-sm">
                                                        <span className="text-slate-600">{mp.nama_mapel}</span>
                                                        <span className="text-slate-400 text-xs text-right ml-2">{mp.guru_pengampu}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="mt-2 text-xs text-slate-400 italic">Belum ada penugasan mapel.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 text-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Populasi</p>
                                                <p className="text-sm font-bold text-slate-900">{kelas.total_siswa} Siswa</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedKelas(kelas)}
                                            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary/85"
                                        >
                                            Lihat Siswa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <StudentListModal 
                    isOpen={!!selectedKelas} 
                    onClose={() => setSelectedKelas(null)} 
                    kelas={selectedKelas} 
                />
            </div>
        </DashboardLayout>
    );
}
