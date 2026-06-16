export default function BrandMark() {
    return (
        <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white/95 px-5 py-4 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-sm overflow-hidden border border-slate-100">
                <img src="/logo-sman.jpg" alt="Logo SMAN Sumatera Selatan" className="h-full w-full object-contain p-1" />
            </div>
            <div>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-500">SMAN Sumatera Selatan</p>
                <h1 className="text-lg font-semibold text-slate-900">Sistem Informasi Asesmen</h1>
            </div>
        </div>
    );
}