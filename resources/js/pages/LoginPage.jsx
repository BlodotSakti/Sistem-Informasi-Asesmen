import { useEffect, useState } from 'react';
import BrandMark from '../components/ui/BrandMark';

const heroPoints = [
    'Login menggunakan username akun sekolah yang sudah terdaftar.',
    'Akses dibatasi untuk siswa, guru, dan operator internal.',
    'Data tersimpan aman melalui token Laravel Sanctum.',
];

export default function LoginPage({ session, onLogin }) {
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

    useEffect(() => {
        if (session?.role) {
            window.location.replace(`/${session.role}/dashboard`);
        }
    }, [session]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onLogin(form);
        } catch (exception) {
            setError(exception.message || 'Login gagal.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
                <div className="grid w-full overflow-hidden rounded-[2rem] border border-border bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="flex flex-col justify-between bg-secondary p-8 sm:p-10 text-slate-100">
                        <div>
                            <BrandMark />
                            <div className="mt-8 sm:mt-10 max-w-md space-y-4">
                                <h2 className="text-3xl sm:text-4xl font-semibold leading-tight text-accent">
                                    Sistem Informasi Asesmen yang sederhana, cepat, dan terarah.
                                </h2>
                                <p className="text-sm leading-6 text-[#EEDCC8]">
                                    Dirancang untuk membantu guru, siswa, dan operator sekolah memantau progres belajar
                                    dengan tampilan yang bersih dan mudah dipahami.
                                </p>
                            </div>
                        </div>

                        <ul className="mt-10 lg:mt-0 space-y-3 text-sm text-slate-300">
                            {heroPoints.map((point) => (
                                <li key={point} className="flex items-start gap-3">
                                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-accent" />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex items-center justify-center bg-primary px-6 py-10 sm:px-10 lg:px-12">
                        <div className="w-full max-w-md">
                            <div className="rounded-[1.75rem] border border-border bg-white p-6 sm:p-8 shadow-sm">
                                <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
                                    Halaman Autentikasi
                                </p>
                                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                                    Masuk ke akun Anda
                                </h1>
                                <p className="mt-3 text-sm leading-6 text-slate-500">
                                    Gunakan username dan password sekolah untuk mengakses dashboard sesuai role Anda.
                                </p>

                                
                                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                                    <label className="block">
                                        <span className="mb-2 block text-sm font-medium text-slate-700">Username (NISN/NIP)</span>
                                        <input
                                            type="text"
                                            value={form.username}
                                            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                                            placeholder="Masukkan username"
                                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:bg-white"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={form.password}
                                                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                                                placeholder="Masukkan password"
                                                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((current) => !current)}
                                                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                                className="absolute inset-y-0 right-3 my-auto flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                            >
                                                {showPassword ? (
                                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                        <path d="M3 3l18 18" />
                                                        <path d="M10.58 10.58a2 2 0 102.83 2.83" />
                                                        <path d="M9.88 5.09A10.42 10.42 0 0112 5c7 0 10 7 10 7a19.07 19.07 0 01-4.09 5.12" />
                                                        <path d="M6.61 6.61C3.87 8.39 2 12 2 12s3 7 10 7a10.4 10.4 0 004.4-.97" />
                                                    </svg>
                                                ) : (
                                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </label>
                                    
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setIsForgotPasswordModalOpen(true)}
                                            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                        >
                                            Lupa password?
                                        </button>
                                    </div>

                                    {error ? (
                                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                            {error}
                                        </div>
                                    ) : null}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold tracking-wide text-white transition hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {loading ? 'Memproses...' : 'Masuk'}
                                    </button>
                                </form>

                                <div className="mt-8 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                                    Akses hanya untuk siswa, guru, dan operator SMAN Sumatera Selatan.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Forgot Password Modal */}
        {isForgotPasswordModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-3xl bg-accent p-8 shadow-xl ring-1 ring-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Lupa Password</h2>
                        <button 
                            onClick={() => setIsForgotPasswordModalOpen(false)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition"
                        >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="space-y-4 text-primary text-sm leading-relaxed">
                        <p>
                            Untuk alasan keamanan, fitur penggantian password mandiri tidak tersedia pada sistem ini.
                        </p>
                        <div className="rounded-2xl bg-[#EEDCC8]/80 border border-[#EEDCC8]/20 p-4">
                            <p className="font-semibold text-secondary mb-1">Cara Reset Password:</p>
                            <ul className="list-disc list-inside space-y-1 text-slate-700">
                                <li><strong>Siswa:</strong> Silakan hubungi Wali Kelas Anda.</li>
                                <li><strong>Guru:</strong> Silakan hubungi Administrator Sekolah.</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={() => setIsForgotPasswordModalOpen(false)}
                            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/85"
                        >
                            Saya Mengerti
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
    );
}