import { useEffect, useState } from 'react';
import BrandMark from '../components/ui/BrandMark';

const heroPoints = [
    'Login menggunakan username akun sekolah yang sudah terdaftar.',
    'Akses dibatasi untuk siswa, guru, dan operator internal.',
    'Data tersimpan aman melalui token Laravel Sanctum.',
];

const demoAccounts = [
    {
        role: 'Admin',
        username: 'admin',
        password: 'password',
        description: 'Untuk operator sistem dan pengaturan data.',
    },
    {
        role: 'Guru',
        username: 'guru01',
        password: 'password',
        description: 'Untuk testing dashboard dan fitur guru.',
    },
    {
        role: 'Siswa',
        username: 'siswa01',
        password: 'password',
        description: 'Untuk testing akses siswa dan halaman belajar.',
    },
];

export default function LoginPage({ session, onLogin }) {
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.95),_rgba(148,163,184,0.12)_45%,_rgba(241,245,249,1)_70%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
                <div className="grid w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="hidden flex-col justify-between bg-slate-950 p-10 text-slate-100 lg:flex">
                        <div>
                            <BrandMark />
                            <div className="mt-10 max-w-md space-y-4">
                                <h2 className="text-4xl font-semibold leading-tight text-white">
                                    Sistem Informasi Asesmen yang sederhana, cepat, dan terarah.
                                </h2>
                                <p className="text-sm leading-6 text-slate-300">
                                    Dirancang untuk membantu guru, siswa, dan operator sekolah memantau progres belajar
                                    dengan tampilan yang bersih dan mudah dipahami.
                                </p>
                            </div>
                        </div>

                        <ul className="space-y-3 text-sm text-slate-300">
                            {heroPoints.map((point) => (
                                <li key={point} className="flex items-start gap-3">
                                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex items-center justify-center bg-slate-50 px-6 py-12 sm:px-10 lg:px-12">
                        <div className="w-full max-w-md">
                            <div className="mb-8 lg:hidden">
                                <BrandMark />
                            </div>

                            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
                                <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
                                    Halaman Autentikasi
                                </p>
                                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                                    Masuk ke akun Anda
                                </h1>
                                <p className="mt-3 text-sm leading-6 text-slate-500">
                                    Gunakan username dan password sekolah untuk mengakses dashboard sesuai role Anda.
                                </p>

                                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">Akun testing</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                Klik salah satu kartu untuk mengisi form login otomatis.
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white">
                                            Demo
                                        </span>
                                    </div>

                                    <div className="mt-4 grid gap-3">
                                        {demoAccounts.map((account) => (
                                            <button
                                                key={account.role}
                                                type="button"
                                                onClick={() =>
                                                    setForm({
                                                        username: account.username,
                                                        password: account.password,
                                                    })
                                                }
                                                className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-400 hover:bg-slate-50"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{account.role}</p>
                                                        <p className="mt-1 text-xs text-slate-500">{account.description}</p>
                                                    </div>
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                                        {account.username}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

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
                                        <input
                                            type="password"
                                            value={form.password}
                                            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                                            placeholder="Masukkan password"
                                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:bg-white"
                                        />
                                    </label>

                                    {error ? (
                                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                            {error}
                                        </div>
                                    ) : null}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
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
    );
}