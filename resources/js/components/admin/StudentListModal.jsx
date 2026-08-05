import React from 'react';

export default function StudentListModal({ isOpen, onClose, kelas }) {
    if (!isOpen || !kelas) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Daftar Siswa</h3>
                        <p className="text-sm text-slate-500">Kelas {kelas.nama_kelas} • Total: {kelas.total_siswa} Siswa</p>
                    </div>
                    <button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto py-4">
                    {kelas.siswa && kelas.siswa.length > 0 ? (
                        <div className="overflow-hidden rounded-2xl border border-border">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">No</th>
                                        <th className="px-4 py-3 font-semibold">NISN</th>
                                        <th className="px-4 py-3 font-semibold">Nama Lengkap</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {kelas.siswa.map((student, index) => (
                                        <tr key={student.id_siswa} className="hover:bg-slate-50/70">
                                            <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900">{student.nisn || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600">{student.nama_lengkap}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-12 text-center">
                            <p className="text-slate-500">Belum ada data siswa di kelas ini.</p>
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-end">
                    <button onClick={onClose} className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/85">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
