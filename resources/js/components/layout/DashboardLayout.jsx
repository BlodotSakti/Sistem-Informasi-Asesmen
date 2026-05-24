export default function DashboardLayout({ title, user, navigation, onLogout, children }) {
    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
                <aside className="flex flex-col bg-slate-950 text-slate-100 shadow-2xl shadow-slate-950/20">
                    <div className="border-b border-white/10 p-6">
                        <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-slate-800 text-sm font-semibold uppercase text-amber-300">
                                {user?.nama_lengkap ? user.nama_lengkap.slice(0, 2) : 'PR'}
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Profil</p>
                                <p className="mt-1 font-semibold text-white">{user?.nama_lengkap || 'Pengguna Aktif'}</p>
                                <p className="text-sm text-slate-400 capitalize">{user?.role || 'Akses Terbatas'}</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-2 p-4">
                        {navigation.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
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

                <main className="flex min-h-screen flex-col bg-slate-100">
                    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
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