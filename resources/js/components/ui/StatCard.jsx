export default function StatCard({ label, value, description, tone = 'slate' }) {
    const tones = {
        slate: 'bg-slate-50 text-slate-800 border-slate-200',
        amber: 'bg-amber-50 text-amber-900 border-amber-200',
        blue: 'bg-blue-50 text-blue-900 border-blue-200',
        rose: 'bg-rose-50 text-rose-900 border-rose-200',
        emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        cyan: 'bg-cyan-50 text-cyan-900 border-cyan-200',
        indigo: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    };

    const iconTones = {
        slate: 'bg-slate-200 text-slate-600',
        amber: 'bg-amber-200 text-amber-600',
        blue: 'bg-blue-200 text-blue-600',
        rose: 'bg-rose-200 text-rose-600',
        emerald: 'bg-emerald-200 text-emerald-600',
        cyan: 'bg-cyan-200 text-cyan-600',
        indigo: 'bg-indigo-200 text-indigo-600',
    };

    return (
        <div className={`relative overflow-hidden rounded-[2rem] border p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] ${tones[tone]} bg-white/70 shadow-sm`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wider opacity-70">{label}</p>
                    <div className="mt-3 text-4xl font-bold tracking-tight">{value}</div>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconTones[tone]}`}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
            </div>
            {description ? <p className="mt-4 text-sm font-medium opacity-75">{description}</p> : null}
        </div>
    );
}