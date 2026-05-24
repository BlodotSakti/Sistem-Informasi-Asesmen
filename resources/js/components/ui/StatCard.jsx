export default function StatCard({ label, value, description, tone = 'slate' }) {
    const tones = {
        slate: 'from-slate-900 to-slate-700 text-white',
        amber: 'from-amber-500 to-amber-400 text-slate-950',
        blue: 'from-blue-600 to-cyan-500 text-white',
        rose: 'from-rose-500 to-pink-400 text-white',
    };

    return (
        <div className={`rounded-2xl bg-gradient-to-br p-5 shadow-sm ring-1 ring-slate-200 ${tones[tone]}`}>
            <p className="text-sm font-medium opacity-80">{label}</p>
            <div className="mt-2 text-3xl font-semibold">{value}</div>
            {description ? <p className="mt-2 text-sm opacity-80">{description}</p> : null}
        </div>
    );
}