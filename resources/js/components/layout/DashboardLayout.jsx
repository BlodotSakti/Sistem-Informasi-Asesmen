import { useState, useEffect } from 'react';
import NotificationPanel from './NotificationPanel';

export default function DashboardLayout({ title, user, navigation, onLogout, profileHref, children }) {
    const currentPath = window.location.pathname;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [currentPath]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen]);

    const profileCard = (
        <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:bg-white/10">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/15 bg-slate-800 text-sm font-semibold uppercase text-amber-300">
                {user?.nama_lengkap ? user.nama_lengkap.slice(0, 2) : 'PR'}
            </div>
            <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Profil</p>
                <p className="mt-1 font-semibold text-white truncate">{user?.nama_lengkap || 'Pengguna Aktif'}</p>
                <p className="text-sm text-slate-400 capitalize">{user?.role || 'Akses Terbatas'}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 print:bg-white">
            <div className="flex min-h-screen flex-col lg:grid lg:h-screen lg:grid-cols-[280px_1fr] lg:overflow-hidden print:block print:h-auto">
                
                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div 
                        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-primary text-slate-100 shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:w-auto lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:overflow-y-auto print:hidden`}>
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm overflow-hidden">
                                <img src="/logo-sman.jpg" alt="Logo SMAN" className="h-full w-full object-contain" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-accent">SMAN Sumsel</p>
                                <h1 className="text-sm font-semibold text-accent">CBT Asesmen</h1>
                            </div>
                        </div>
                        {/* Close button for mobile */}
                        <button 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
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

                    <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
                        {navigation.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${currentPath === item.href ? 'bg-accent/15 text-accent ring-1 ring-accent/30 font-semibold shadow-sm' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-3">
                                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                                    <span>{item.label}</span>
                                </div>
                                <span className="text-xs text-slate-500">{item.badge}</span>
                            </a>
                        ))}
                    </nav>

                    <div className="border-t border-white/10 p-4 text-xs text-slate-500">
                        Akses internal SMAN Sumatera Selatan
                    </div>
                </aside>

                <main className="flex min-h-screen flex-col bg-slate-100 lg:h-screen lg:overflow-y-auto w-full print:bg-white print:h-auto print:block print:overflow-visible">
                    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/80 bg-secondary px-4 md:px-6 py-4 shadow-sm backdrop-blur w-full print:hidden">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="rounded-xl p-2 text-slate-600 hover:bg-slate-200 lg:hidden border border-border"
                                aria-label="Buka menu"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                            </button>
                            <div>
                                <p className="hidden md:block text-xs uppercase tracking-[0.3em] text-accent">{user?.role || 'Dashboard'}</p>
                                <h2 className="text-lg md:text-2xl font-semibold text-accent truncate max-w-[140px] sm:max-w-[200px] md:max-w-none">{title}</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {user?.role === 'siswa' && <NotificationPanel />}
                            <button
                                type="button"
                                onClick={onLogout}
                                className="rounded-full bg-primary px-4 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-semibold text-accent transition hover:bg-primary/85 whitespace-nowrap"
                            >
                                Logout
                            </button>
                        </div>
                    </header>

                    <section className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-[100vw] overflow-x-hidden">
                        {children}
                    </section>
                </main>
            </div>
        </div>
    );
}