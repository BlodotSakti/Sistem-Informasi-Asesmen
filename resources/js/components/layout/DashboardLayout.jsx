export default function DashboardLayout({ title, user, navigation, onLogout, profileHref, children }) {
    const currentPath = window.location.pathname;
    const profileCard = (
        <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:bg-white/10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-slate-800 text-sm font-semibold uppercase text-amber-300">
                {user?.nama_lengkap ? user.nama_lengkap.slice(0, 2) : 'PR'}
            </div>
            <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Profil</p>
                <p className="mt-1 font-semibold text-white">{user?.nama_lengkap || 'Pengguna Aktif'}</p>
                <p className="text-sm text-slate-400 capitalize">{user?.role || 'Akses Terbatas'}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            <div className="grid min-h-screen grid-cols-1 lg:h-screen lg:grid-cols-[280px_1fr] lg:overflow-hidden">
                <aside className="flex flex-col bg-slate-950 text-slate-100 shadow-2xl shadow-slate-950/20 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
                    <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm overflow-hidden">
                            <img src="/logo-sman.jpg" alt="Logo SMAN" className="h-full w-full object-contain" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">SMAN Sumatera Selatan</p>
                            <h1 className="text-sm font-semibold text-slate-100">CBT Asesmen</h1>
                        </div>
                    </div>
                    <div className="border-b border-white/10 p-6">
                        {profileHref ? (
                            <a href={profileHref} aria-label="Buka halaman profil" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
                                {profileCard}
                            </a>
                        ) : (
                            profileCard
                        )}
                    </div>

                    <nav className="flex-1 space-y-2 p-4">
                        {navigation.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${currentPath === item.href ? 'bg-white/15 text-white ring-1 ring-white/10' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}
                            >
                                <span>{item.label}</span>
                                <span className="text-xs text-slate-500">{item.badge}</span>
                            </a>
                        ))}
                    </nav>

                    <div className="border-t border-white/10 p-4 text-xs text-slate-500">
                        Akses internal SMAN Sumatera Selatan
                    </div>
                </aside>

                <main className="flex min-h-screen flex-col bg-slate-100 lg:h-screen lg:overflow-y-auto">
                    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 py-4 shadow-sm backdrop-blur">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{user?.role || 'Dashboard'}</p>
                            <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
                        </div>
                        <button
                            type="button"
                            onClick={onLogout}
                            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Logout
                        </button>
                    </header>

                    <section className="flex-1 p-6 lg:p-8">
                        {children}
                    </section>
                </main>
            </div>
        </div>
    );
}