export default function BrandMark() {
    return (
        <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white/95 px-5 py-4 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-lg font-semibold text-amber-300">
                S
            </div>
            <div>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-500">SMAN Sumatera Selatan</p>
                <h1 className="text-lg font-semibold text-slate-900">Sistem Informasi Asesmen</h1>
            </div>
        </div>
    );
}