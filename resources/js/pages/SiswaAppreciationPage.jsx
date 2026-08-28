import { useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import BadgeIcon from '../components/ui/BadgeIcon';
import { formatDateLabel } from '../lib/date';
import { siswaNavigation } from './siswa/siswaNavigation';
import { useSiswaData } from './siswa/useSiswaData';

export default function SiswaAppreciationPage({ session, onLogout }) {
    const { summary, loading, error } = useSiswaData(session);
    const [noteSearch, setNoteSearch] = useState('');

    const filteredNotes = useMemo(() => {
        const search = noteSearch.trim().toLowerCase();
        const notes = summary?.highlight?.notes || [];

        return notes.filter((note) => {
            if (search === '') {
                return true;
            }

            return [note.guru?.nama_lengkap, note.isi_pesan, note.tanggal, formatDateLabel(note.tanggal)]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search));
        });
    }, [noteSearch, summary?.highlight?.notes]);

    const allBadges = useMemo(() => {
        // We get badges from the summary cards or API, if available.
        // Assuming the backend provides `all_badges` in summary (if we modify backend)
        // or we just show the highlight badge if backend is not updated to return all badges.
        // But let's assume `summary.badges` is an array if we map it, otherwise fallback to highlight badge.
        if (summary?.badges && Array.isArray(summary.badges)) {
            return summary.badges;
        }
        
        // Mocking an array based on highlight if no all_badges available yet
        if (summary?.highlight?.badge) {
            return [summary.highlight.badge];
        }
        return [];
    }, [summary]);

    return (
        <DashboardLayout title="Apresiasi" user={session?.user} navigation={siswaNavigation} onLogout={onLogout} profileHref="/siswa/profil">
            <div className="space-y-8">
                {/* Gamified Header Section */}
                <section className="relative overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-[#8A2332]/30 bg-gradient-to-br from-[#8A2332] via-primary to-secondary px-4 py-6 sm:px-6 sm:py-10 shadow-lg backdrop-blur-xl lg:px-10">
                    {/* Decorative Elements */}
                    <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md border border-[#EEDCC8]/20 mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-accent">Pencapaian & Prestasi</span>
                            </div>
                            <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-[#EEDCC8] sm:text-5xl drop-shadow-sm">Koleksi Lencana</h3>
                            <p className="mt-4 text-lg text-accent max-w-xl">
                                Kumpulkan berbagai lencana pencapaian akademik, karakter, dan sportivitas dari guru. Banggakan kemajuan belajarmu!
                            </p>
                        </div>

                        {/* Showcase latest badge */}
                        {summary?.highlight?.badge && (
                            <div className="flex shrink-0 animate-fade-in-up items-center gap-6 rounded-3xl bg-white/5 p-6 backdrop-blur-sm border border-white/10 shadow-xl">
                                <BadgeIcon name={summary.highlight.badge.jenis_badge} className="w-24 h-24" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Lencana Terbaru</p>
                                    <h4 className="mt-1 text-xl font-bold text-white">{summary.highlight.badge.jenis_badge || 'Apresiasi'}</h4>
                                    <p className="mt-1 text-sm text-slate-400">Dari: {summary.highlight.badge.guru?.nama_lengkap || '-'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                    <StatCard 
                        label="Total Lencana" 
                        value={loading ? '...' : summary?.cards?.apresiasi ?? 0} 
                        description="Badge pencapaian" 
                        tone="amber" 
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        }
                    />
                    <StatCard 
                        label="Catatan Privat" 
                        value={loading ? '...' : (summary?.highlight?.notes || []).length} 
                        description="Pesan khusus dari guru" 
                        tone="blue" 
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        }
                    />
                    <StatCard 
                        label="Skor Terbaru" 
                        value={loading ? '...' : summary?.highlight?.latest_score ?? 0} 
                        description="Dari ujian terakhir" 
                        tone="rose" 
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        }
                    />
                    <StatCard 
                        label="Status" 
                        value={loading ? '...' : (summary?.profile?.kelas_aktif ? 'Aktif' : 'Non-Aktif')} 
                        description={summary?.profile?.kelas_aktif ? "Belajar terus!" : "Histori tersimpan"} 
                        tone="slate" 
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                </div>

                {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <section className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
                    {/* Daftar Badge (Gamified Grid) */}
                    <div className="rounded-2xl sm:rounded-[2.5rem] border border-border bg-white p-4 sm:p-8 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">Etalase Pencapaian</h3>
                                <p className="mt-1 text-sm text-slate-500">Koleksi lencana yang telah kamu raih sejauh ini.</p>
                            </div>
                        </div>

                        {allBadges.length > 0 ? (
                            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
                                {allBadges.map((badge, idx) => (
                                    <div key={idx} className="group relative flex flex-col items-center justify-center rounded-3xl border-2 border-slate-100 bg-slate-50 p-6 transition-all hover:border-primary/10 hover:bg-primary/5 hover:shadow-lg">
                                        <BadgeIcon name={badge.jenis_badge} className="w-16 h-16 mb-4" />
                                        <h4 className="text-center text-sm font-bold text-slate-900">{badge.jenis_badge}</h4>
                                        <p className="mt-1 text-center text-xs text-slate-500">{formatDateLabel(badge.tanggal)}</p>
                                        
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 z-50 mb-4 w-48 -translate-x-1/2 scale-0 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                                            <div className="relative rounded-2xl bg-slate-900 p-4 text-xs text-white shadow-xl">
                                                <div className="font-bold text-amber-400 mb-1">{badge.jenis_badge}</div>
                                                <p className="mb-2">Diberikan oleh: <span className="font-semibold">{badge.guru?.nama_lengkap}</span></p>
                                                <p className="text-slate-300 italic">&quot;{badge.topik_materi}&quot;</p>
                                                {/* Tooltip Arrow */}
                                                <div className="absolute left-1/2 top-full -mt-2 h-4 w-4 -translate-x-1/2 rotate-45 bg-slate-900"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-8 flex h-48 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-slate-50 p-6 text-center">
                                <div className="mb-4 text-4xl opacity-30">🏆</div>
                                <h4 className="font-semibold text-slate-700">Belum Ada Lencana</h4>
                                <p className="mt-1 text-sm text-slate-500">Terus aktif di kelas dan kerjakan ujian dengan baik untuk mendapatkan lencana pertamamu!</p>
                            </div>
                        )}
                    </div>

                    {/* Catatan Privat */}
                    <div className="rounded-2xl sm:rounded-[2.5rem] border border-border bg-slate-50 p-4 sm:p-8 shadow-sm flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-slate-900">Pesan Khusus</h3>
                            <p className="mt-1 text-sm text-slate-500">Catatan privat dari guru untuk kemajuanmu.</p>
                        </div>

                        <div className="mb-6">
                            <input 
                                value={noteSearch} 
                                onChange={(event) => setNoteSearch(event.target.value)} 
                                className="w-full rounded-2xl border-2 border-border bg-white px-5 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" 
                                placeholder="Cari pesan atau nama guru..." 
                            />
                        </div>

                        <div className="flex-grow space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {filteredNotes.map((note) => (
                                <div key={`${note.tanggal}-${note.id_catatan}`} className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-400 to-indigo-500"></div>
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <h4 className="font-bold text-slate-900">{note.guru?.nama_lengkap || '-'}</h4>
                                        <span className="shrink-0 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{formatDateLabel(note.tanggal)}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">&quot;{note.isi_pesan}&quot;</p>
                                </div>
                            ))}
                            {filteredNotes.length === 0 ? (
                                <div className="py-10 text-center">
                                    <p className="text-sm text-slate-500">Belum ada catatan privat yang sesuai pencarian.</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </section>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out forwards;
                }
            `}</style>
        </DashboardLayout>
    );
}