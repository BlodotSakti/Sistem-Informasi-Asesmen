import React, { useState } from 'react';
import { apiFetch } from '../../lib/api';

const EyeIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

const EyeSlashIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
);

export default function ProfileCredentialsForm({ session }) {
    const [form, setForm] = useState({
        username: session?.user?.username || '',
        password: '',
        password_confirmation: '',
        current_password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            if (form.password && form.password !== form.password_confirmation) {
                throw new Error('Konfirmasi password tidak cocok dengan password baru.');
            }

            const payload = {
                username: form.username,
            };

            if (form.password.trim() !== '') {
                payload.password = form.password;
                payload.password_confirmation = form.password_confirmation;
                payload.current_password = form.current_password;
            }

            const response = await apiFetch('/api/auth/profile', session, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            setSuccess(response.message || 'Kredensial berhasil diperbarui.');
            setForm((current) => ({ ...current, password: '', password_confirmation: '', current_password: '' }));
        } catch (exception) {
            setError(exception.message || 'Gagal memperbarui kredensial akun.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Pengaturan Akun</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Ubah Kredensial Login</h3>

            {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            {success && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

            <div className="mt-6 space-y-4">
                <label className="block space-y-2 text-sm font-medium text-slate-700">
                    <span>Username</span>
                    <input
                        required
                        value={form.username}
                        onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                        placeholder="Masukkan username login"
                    />
                </label>

                {form.password && (
                    <div className="block space-y-2 text-sm font-medium text-slate-700">
                        <label htmlFor="current_password">Password Lama</label>
                        <div className="relative">
                            <input
                                id="current_password"
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={form.current_password}
                                onChange={(event) => setForm((current) => ({ ...current, current_password: event.target.value }))}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 outline-none transition focus:border-slate-900"
                                placeholder="Masukkan password lama Anda"
                                required={form.password.length > 0}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                aria-label={showCurrentPassword ? "Sembunyikan password lama" : "Tampilkan password lama"}
                            >
                                {showCurrentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                )}

                <div className="block space-y-2 text-sm font-medium text-slate-700">
                    <label htmlFor="new_password">Password Baru <span className="text-slate-400 font-normal">(Opsional)</span></label>
                    <div className="relative">
                        <input
                            id="new_password"
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 outline-none transition focus:border-slate-900"
                            placeholder="Kosongkan jika tidak ingin mengubah password"
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        >
                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {form.password && (
                    <div className="block space-y-2 text-sm font-medium text-slate-700">
                        <label htmlFor="confirm_password">Konfirmasi Password Baru</label>
                        <div className="relative">
                            <input
                                id="confirm_password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={form.password_confirmation}
                                onChange={(event) => setForm((current) => ({ ...current, password_confirmation: event.target.value }))}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 outline-none transition focus:border-slate-900"
                                placeholder="Ulangi password baru Anda"
                                required={form.password.length > 0}
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                            >
                                {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/85 disabled:opacity-50"
                >
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </div>
        </form>
    );
}
