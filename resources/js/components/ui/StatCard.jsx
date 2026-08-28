export default function StatCard({ label, value, description, tone = 'primary', className = '', icon }) {
    const iconTones = {
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary/10 text-secondary',
        accent: 'bg-accent/10 text-accent',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
        info: 'bg-info/10 text-info',
        slate: 'bg-slate-100 text-slate-600',
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
    };

    return (
        <div className={`card hover:scale-[1.02] transition-transform duration-300 ${className}`}>
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-secondary leading-tight line-clamp-2">{label}</p>
                    <div className="mt-2 sm:mt-3 text-2xl sm:text-4xl font-bold tracking-tight text-text-primary">{value}</div>
                </div>
                <div className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full ${iconTones[tone] || iconTones.primary}`}>
                    {icon ? icon : (
                        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    )}
                </div>
            </div>
            {description ? <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-text-secondary">{description}</p> : null}
        </div>
    );
}