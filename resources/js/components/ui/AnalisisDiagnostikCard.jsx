/**
 * AnalisisDiagnostikCard — Reusable component to display Gemini AI diagnostic analysis.
 * Shows narasi_kekuatan, narasi_kelemahan, and cognitive level breakdown (C1-C6).
 */
export default function AnalisisDiagnostikCard({ analisis, loading = false }) {
    if (loading) {
        return (
            <div className="mt-8 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100">
                        <span className="text-lg">🤖</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Laporan Analisis Diagnostik AI</h3>
                        <p className="text-xs text-slate-500">Powered by Gemini AI</p>
                    </div>
                </div>
                <div className="flex items-center justify-center py-10">
                    <div className="text-center">
                        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
                        <p className="mt-3 text-sm text-slate-500">Menganalisis jawaban Anda dengan AI...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!analisis) return null;

    const levelKognitifLabels = {
        C1: 'Mengingat',
        C2: 'Memahami',
        C3: 'Mengaplikasikan',
        C4: 'Menganalisis',
        C5: 'Mengevaluasi',
        C6: 'Mencipta',
    };

    const rekapKognitif = analisis.rekap_kognitif || {};

    return (
        <div className="mt-8 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100">
                    <span className="text-lg">🤖</span>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Laporan Analisis Diagnostik AI</h3>
                    <p className="text-xs text-slate-500">Powered by Gemini AI — {analisis.tanggal_generate ? new Date(analisis.tanggal_generate).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                </div>
            </div>

            {/* Narasi Kekuatan & Kelemahan */}
            <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm">💪</span>
                        <h4 className="font-bold text-emerald-800">Kekuatan</h4>
                    </div>
                    <p className="text-sm leading-relaxed text-emerald-900/80">
                        {analisis.narasi_kekuatan || <em className="text-slate-500">Tetap semangat belajar dengan rajin! Pertahankan semangatmu untuk terus menggali potensi terbaik yang kamu miliki.</em>}
                    </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-sm">📈</span>
                        <h4 className="font-bold text-amber-800">Area Peningkatan</h4>
                    </div>
                    <p className="text-sm leading-relaxed text-amber-900/80">
                        {analisis.narasi_kelemahan || <em className="text-slate-500">Jadikan setiap tantangan sebagai batu loncatan. Teruslah berlatih, karena setiap usaha pasti akan membuahkan hasil yang manis.</em>}
                    </p>
                </div>
            </div>

            {/* Rekap Kognitif C1-C6 */}
            {Object.keys(rekapKognitif).length > 0 && (
                <div>
                    <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Capaian per Level Kognitif (Taksonomi Bloom)</h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(rekapKognitif).map(([level, data]) => {
                            const persen = data?.persentase ?? 0;
                            const barColor = persen >= 70 ? 'bg-emerald-500' : persen >= 40 ? 'bg-amber-500' : 'bg-rose-500';
                            const badgeColor = persen >= 70 ? 'text-emerald-700 bg-emerald-100' : persen >= 40 ? 'text-amber-700 bg-amber-100' : 'text-rose-700 bg-rose-100';

                            return (
                                <div key={level} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <span className="text-sm font-bold text-slate-800">{level}</span>
                                            <span className="ml-1.5 text-xs text-slate-500">{levelKognitifLabels[level] || ''}</span>
                                        </div>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badgeColor}`}>
                                            {persen}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${persen}%` }}></div>
                                    </div>
                                    <p className="mt-1.5 text-xs text-slate-400">
                                        {data?.jumlah_benar ?? 0}/{data?.jumlah_soal ?? 0} benar • {Number(data?.skor_diperoleh ?? 0).toFixed(1)}/{Number(data?.bobot_total ?? 0).toFixed(1)} poin
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
