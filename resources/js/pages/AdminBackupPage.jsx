import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch } from '../lib/api';
import { adminNavigation } from './adminNavigation';
import { Database, HardDriveDownload, Trash2, Download, AlertCircle, Plus, Loader2 } from 'lucide-react';

export default function AdminBackupPage({ session, onLogout }) {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchBackups = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/api/admin/backup', session);
            setBackups(data);
            setError('');
        } catch (err) {
            setError(err.message || 'Gagal memuat daftar backup');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBackups();
    }, []);

    const handleCreateBackup = async (type = 'db') => {
        setActionLoading(true);
        setSuccess('');
        setError('');
        
        try {
            const endpoint = type === 'full' ? '/api/admin/backup/run-full' : '/api/admin/backup/run';
            const res = await apiFetch(endpoint, session, {
                method: 'POST'
            });
            setSuccess(res.message || 'Backup berhasil dibuat');
            await fetchBackups();
        } catch (err) {
            setError(err.message || 'Gagal membuat backup');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteBackup = async (fileName) => {
        if (!window.confirm(`Anda yakin ingin menghapus backup ${fileName}?`)) return;

        setActionLoading(true);
        setSuccess('');
        setError('');

        try {
            const res = await apiFetch(`/api/admin/backup/${fileName}`, session, {
                method: 'DELETE'
            });
            setSuccess(res.message || 'Backup berhasil dihapus');
            await fetchBackups();
        } catch (err) {
            setError(err.message || 'Gagal menghapus backup');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadBackup = (fileName) => {
        const url = `/api/admin/backup/download/${fileName}`;
        const token = session?.token;
        
        fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Gagal mengunduh file (Mungkin karena sesi habis)');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        })
        .catch(err => {
            setError(err.message || 'Gagal mengunduh file');
        });
    };

    return (
        <DashboardLayout user={session?.user} title="Backup & Restore Data" navigation={adminNavigation} onLogout={onLogout}>
            <div className="space-y-6">
                
                {/* Header */}
                <section className="overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary px-4 py-6 sm:px-8 sm:py-10 shadow-lg backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-8">
                    <div>
                        <p className="text-xs uppercase tracking-[0.45em] text-accent flex items-center gap-2">
                            <HardDriveDownload className="w-4 h-4" /> Data
                        </p>
                        <h3 className="mt-4 max-w-2xl text-xl sm:text-3xl font-semibold leading-tight text-[#EEDCC8] md:text-4xl">Backup & Restore</h3>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-accent md:text-base">Manajemen pencadangan data sistem dan database</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => handleCreateBackup('db')}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-[#EEDCC8] transition-all shadow-md hover:scale-105 disabled:opacity-50"
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                            Backup Database
                        </button>
                        <button
                            onClick={() => handleCreateBackup('full')}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-2 rounded-full bg-[#EEDCC8] px-6 py-3 text-sm font-semibold text-primary transition-all shadow-md hover:scale-105 hover:bg-white disabled:opacity-50"
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Backup Full (File & DB)
                        </button>
                    </div>
                </section>

                {error && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 text-rose-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3 text-emerald-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{success}</p>
                    </div>
                )}

                {/* List Backup */}
                <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">Riwayat Backup Tersedia</h3>
                        <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            Sistem melakukan backup otomatis setiap jam 02:00
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-medium w-16">No</th>
                                    <th className="px-6 py-4 font-medium">Nama File</th>
                                    <th className="px-6 py-4 font-medium">Ukuran</th>
                                    <th className="px-6 py-4 font-medium">Waktu Pembuatan</th>
                                    <th className="px-6 py-4 font-medium text-center w-32">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Memuat daftar backup...
                                        </td>
                                    </tr>
                                ) : backups.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                            Belum ada file backup yang tersedia.
                                        </td>
                                    </tr>
                                ) : (
                                    backups.map((backup, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-500">{i + 1}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                                <div className="p-2 bg-primary/5 text-primary rounded-lg">
                                                    <Database className="w-4 h-4" />
                                                </div>
                                                {backup.file_name}
                                            </td>
                                            <td className="px-6 py-4">
                                                {backup.file_size}
                                            </td>
                                            <td className="px-6 py-4">
                                                {backup.last_modified}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleDownloadBackup(backup.file_name)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                                                        title="Unduh Backup"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBackup(backup.file_name)}
                                                        className="p-2 text-slate-400 hover:text-error hover:bg-rose-50 rounded-xl transition-colors"
                                                        title="Hapus Backup"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
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
