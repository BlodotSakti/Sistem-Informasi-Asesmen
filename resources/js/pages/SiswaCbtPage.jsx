import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AnalisisDiagnostikCard from '../components/ui/AnalisisDiagnostikCard';

function apiBase(path) {
    return `${window.location.origin}${path}`;
}

const STORAGE_PREFIX = 'cbt-jawaban-';

export default function SiswaCbtPage({ session, onLogout, idSesi }) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [sesiData, setSesiData] = useState(null);
    const [soalData, setSoalData] = useState([]);
    const [jawaban, setJawaban] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [resultData, setResultData] = useState(null);
    const [showSummary, setShowSummary] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [isLockdownActive, setIsLockdownActive] = useState(false);
    const [lockdownWarning, setLockdownWarning] = useState(null);
    const [isLockedOut, setIsLockedOut] = useState(false);
    const [lockdownMessage, setLockdownMessage] = useState(null);

    const reportCheating = useCallback(async (jenis, keterangan) => {
        setIsLockdownActive(false); // Matikan event listener agar tidak trigger berulang
        setIsLockedOut(true);
        setLockdownMessage(keterangan);

        try {
            await fetch(apiBase(`/api/siswa/cbt/${idSesi}/log-pelanggaran`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${session.token}`,
                    'X-CSRF-TOKEN': window.__APP_CSRF__ || '',
                },
                body: JSON.stringify({ jenis_pelanggaran: jenis, keterangan }),
            });

            // Hapus jawaban tersimpan dari local storage karena jawaban telah direset oleh backend
            try { 
                localStorage.removeItem(`${STORAGE_PREFIX}${idSesi}`); 
                localStorage.removeItem(`${STORAGE_PREFIX}start-${idSesi}`);
            } catch { /* ignore */ }
        } catch { /* silent fail */ }
    }, [idSesi, session.token]);

    const saveTimerRef = useRef({});
    const activeSoal = soalData[currentIndex];
    const storageKey = `${STORAGE_PREFIX}${idSesi}`;

    // Browser Lockdown Event Listeners
    useEffect(() => {
        if (!isLockdownActive || resultData) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                reportCheating('tab_switch', 'Anda terdeteksi berpindah tab atau meminimalkan browser.');
            }
        };

        const handleBlur = () => {
            reportCheating('blur', 'Jendela ujian kehilangan fokus. Pastikan Anda tidak membuka aplikasi lain.');
        };

        const handleContextMenu = (e) => {
            e.preventDefault();
            reportCheating('right_click', 'Klik kanan dinonaktifkan selama ujian.');
        };

        const handleCopyPaste = (e) => {
            e.preventDefault();
            reportCheating('copy_paste', 'Tindakan menyalin (copy) atau menempel (paste) dinonaktifkan.');
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen) {
                reportCheating('fullscreen_exit', 'Anda keluar dari mode layar penuh.');
                // Opsional: paksa masuk kembali jika memungkinkan, atau berhentikan ujian
                // window.alert("Anda dilarang keluar dari mode layar penuh selama ujian!");
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopyPaste);
        document.addEventListener('paste', handleCopyPaste);
        document.addEventListener('cut', handleCopyPaste);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopyPaste);
            document.removeEventListener('paste', handleCopyPaste);
            document.removeEventListener('cut', handleCopyPaste);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, [isLockdownActive, resultData, reportCheating]);

    // Persist jawaban to localStorage whenever it changes
    useEffect(() => {
        if (Object.keys(jawaban).length > 0 && !resultData) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(jawaban));
            } catch { /* ignore quota errors */ }
        }
    }, [jawaban, storageKey, resultData]);

    // Fetch data
    useEffect(() => {
        let mounted = true;

        async function fetchData() {
            try {
                const url = new URL(apiBase(`/api/siswa/cbt/${idSesi}`));
                const searchParams = new URLSearchParams(window.location.search);
                if (searchParams.has('token')) {
                    url.searchParams.append('token', searchParams.get('token'));
                }

                const response = await fetch(url.toString(), {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${session.token}`,
                    },
                });

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({}));
                    if (response.status === 403 && errorBody.locked) {
                        setIsLockedOut(true);
                        setLockdownMessage(errorBody.message || 'Ujian Terkunci karena terdeteksi pelanggaran.');
                        setLoading(false);
                        return;
                    }
                    if (errorBody.sudah_dikerjakan) {
                        throw new Error('SUDAH_DIKERJAKAN');
                    }
                    throw new Error(errorBody.message || 'Gagal memuat data ujian');
                }

                const data = await response.json();

                if (mounted) {
                    setSesiData(data.sesi);
                    setSoalData(data.soal);

                    // Merge: server answers + localStorage (localStorage takes priority)
                    const serverAnswers = {};
                    (data.jawaban_tersimpan || []).forEach((j) => {
                        serverAnswers[j.id_detail] = j.teks_jawaban;
                    });

                    let localAnswers = {};
                    try {
                        const stored = localStorage.getItem(`${STORAGE_PREFIX}${idSesi}`);
                        if (stored) localAnswers = JSON.parse(stored);
                    } catch { /* ignore */ }

                    // Merge: localStorage overrides server
                    setJawaban({ ...serverAnswers, ...localAnswers });

                    // Initialize timer
                    const now = new Date().getTime();
                    const durationMs = data.sesi.durasi_menit * 60 * 1000;
                    
                    let studentStartTime = localStorage.getItem(`${STORAGE_PREFIX}start-${idSesi}`);
                    
                    // Reset timer jika belum ada atau jika guru telah mereset ujian (jawaban kosong) namun timer lokal sudah habis
                    if (!studentStartTime || ((data.jawaban_tersimpan || []).length === 0 && (parseInt(studentStartTime, 10) + durationMs) <= now)) {
                        studentStartTime = now;
                        localStorage.setItem(`${STORAGE_PREFIX}start-${idSesi}`, studentStartTime);
                    }
                    
                    let endTime = parseInt(studentStartTime, 10) + durationMs;

                    if (data.sesi.waktu_selesai) {
                        const absoluteEndTime = new Date(data.sesi.waktu_selesai).getTime();
                        if (absoluteEndTime < endTime) {
                            endTime = absoluteEndTime;
                        }
                    }

                    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

                    setTimeLeft(remaining);
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        }

        fetchData();
        return () => { mounted = false; };
    }, [idSesi, session.token]);

    // Auto-save a single answer to backend (debounced per id_detail)
    const autoSaveAnswer = useCallback((idDetail, teksJawaban) => {
        if (saveTimerRef.current[idDetail]) {
            clearTimeout(saveTimerRef.current[idDetail]);
        }
        saveTimerRef.current[idDetail] = setTimeout(async () => {
            try {
                await fetch(apiBase(`/api/siswa/cbt/${idSesi}/save-answer`), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${session.token}`,
                        'X-CSRF-TOKEN': window.__APP_CSRF__ || '',
                    },
                    body: JSON.stringify({ id_detail: idDetail, teks_jawaban: teksJawaban }),
                });
            } catch { /* silent fail — localStorage is the backup */ }
        }, 2000);
    }, [idSesi, session.token]);

    // Submit handler
    const handleSubmit = useCallback(async () => {
        if (submitting) return;
        setSubmitting(true);

        const payload = Object.entries(jawaban).map(([id_detail, teks_jawaban]) => ({
            id_detail: parseInt(id_detail, 10),
            teks_jawaban,
        }));

        try {
            const response = await fetch(apiBase(`/api/siswa/cbt/${idSesi}/submit`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${session.token}`,
                    'X-CSRF-TOKEN': window.__APP_CSRF__ || '',
                },
                body: JSON.stringify({ jawaban: payload }),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                if (response.status === 403 && errorBody.locked) {
                    setIsLockedOut(true);
                    setLockdownMessage(errorBody.message || 'Ujian Terkunci karena terdeteksi pelanggaran saat menyimpan.');
                    return; // Stop submission
                }
                throw new Error(errorBody.message || 'Gagal menyimpan jawaban ujian');
            }

            const result = await response.json();

            // Clear localStorage on success
            try { 
                localStorage.removeItem(storageKey); 
                localStorage.removeItem(`${STORAGE_PREFIX}start-${idSesi}`);
            } catch { /* ignore */ }

            setResultData(result);
        } catch (err) {
            alert(`Terjadi kesalahan: ${err.message}`);
            setSubmitting(false);
        }
    }, [jawaban, session.token, idSesi, submitting, storageKey]);

    // Timer
    useEffect(() => {
        if (loading || submitting || resultData || error || isLockedOut) return;

        if (timeLeft <= 0) {
            // Jika waktu sudah habis di awal, otomatis kumpulkan
            handleSubmit();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerId);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [loading, submitting, timeLeft, handleSubmit, resultData]);

    // Lockdown
    useEffect(() => {
        if (resultData) return;
        const handleContextMenu = (e) => e.preventDefault();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // Silently ignore or implement actual logging if backend supports it in the future
                // Currently removed to match the silent lock behavior of contextmenu
            }
        };
        window.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [resultData]);

    // Answer handlers
    const handleAnswerChange = (idDetail, value) => {
        setJawaban((prev) => ({ ...prev, [idDetail]: value }));
        autoSaveAnswer(idDetail, value);
    };

    const handleAnswerChangeKompleks = (idDetail, opsi, isChecked) => {
        setJawaban((prev) => {
            const currentAnsStr = prev[idDetail];
            let currentArr = [];
            try {
                if (currentAnsStr) currentArr = JSON.parse(currentAnsStr);
                if (!Array.isArray(currentArr)) currentArr = [];
            } catch { currentArr = []; }

            const nextSet = new Set(currentArr);
            if (isChecked) nextSet.add(opsi);
            else nextSet.delete(opsi);

            const nextArr = Array.from(nextSet);
            const nextValue = nextArr.length > 0 ? JSON.stringify(nextArr) : '';
            autoSaveAnswer(idDetail, nextValue);
            return { ...prev, [idDetail]: nextValue };
        });
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // --- RESULT SCREEN ---
    if (resultData) {
        const persen = resultData.total_bobot > 0 ? Number(((resultData.total_skor / resultData.total_bobot) * 100).toFixed(2)) : 0;
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans text-slate-900">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
                    {/* Score Hero */}
                    <div className="mb-8 sm:mb-10 rounded-2xl sm:rounded-3xl border border-border bg-white p-6 sm:p-10 text-center shadow-lg">
                        <div className="mx-auto mb-4 flex h-28 w-28 sm:h-40 sm:w-40 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl">
                            <span className="text-2xl sm:text-4xl font-black text-white">{persen}%</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Ujian Selesai!</h1>
                        <p className="mt-2 text-lg text-slate-500">{resultData.mata_pelajaran} — <span className="capitalize">{resultData.jenis_asesmen}</span></p>
                        <div className="mt-3 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            Tipe Soal: <span className="ml-1 uppercase text-slate-800">{resultData.tipe_soal || 'CBT'}</span>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="rounded-2xl bg-primary/5 px-4 py-5">
                                <p className="text-2xl font-bold text-primary">{Number(resultData.total_skor).toFixed(2)}</p>
                                <p className="mt-1 text-xs font-medium text-primary">Skor / {resultData.total_bobot}</p>
                            </div>
                            <div className="rounded-2xl bg-emerald-50 px-4 py-5">
                                <p className="text-2xl font-bold text-emerald-700">{resultData.jumlah_benar}</p>
                                <p className="mt-1 text-xs font-medium text-emerald-500">Benar</p>
                            </div>
                            <div className="rounded-2xl bg-rose-50 px-4 py-5">
                                <p className="text-2xl font-bold text-rose-700">{resultData.jumlah_salah}</p>
                                <p className="mt-1 text-xs font-medium text-error">Salah</p>
                            </div>
                            <div className="rounded-2xl bg-amber-50 px-4 py-5">
                                <p className="text-2xl font-bold text-amber-700">{resultData.jumlah_soal}</p>
                                <p className="mt-1 text-xs font-medium text-accent">Total Soal</p>
                            </div>
                        </div>
                    </div>

                    {/* Per-soal breakdown */}
                    <h2 className="mb-4 text-xl font-bold text-slate-800">Ringkasan Jawaban</h2>
                    <div className="space-y-4">
                        {(resultData.detail_hasil || []).map((item, idx) => (
                            <div key={item.id_detail} className={`rounded-2xl border p-5 shadow-sm ${item.skor_diperoleh == item.bobot_nilai ? 'border-emerald-200 bg-emerald-50/40' : item.skor_diperoleh > 0 ? 'border-amber-200 bg-amber-50/40' : 'border-rose-200 bg-rose-50/40'}`}>
                                <div className="flex items-start justify-between">
                                    <h3 className="font-semibold text-slate-800">Soal {idx + 1}</h3>
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.skor_diperoleh == item.bobot_nilai ? 'bg-emerald-100 text-emerald-700' : item.skor_diperoleh > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {item.skor_diperoleh == item.bobot_nilai ? '✓ Benar' : item.skor_diperoleh > 0 ? '○ Sebagian Benar' : '✗ Salah'} — {item.skor_diperoleh}/{item.bobot_nilai}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{item.isi_soal}</p>
                                {item.gambar_soal && (
                                    <div className="mt-3">
                                        <img src={`/storage/${item.gambar_soal}`} alt="Gambar Soal" className="max-h-48 rounded-lg border border-border object-contain shadow-sm" />
                                    </div>
                                )}
                                {item.opsi_jawaban && item.opsi_jawaban.length > 0 && (
                                    <div className="mt-3 grid gap-2">
                                        {item.opsi_jawaban.map((opsi, oIdx) => {
                                            let kunciArr = [item.kunci_jawaban];
                                            try { const p = JSON.parse(item.kunci_jawaban); if (Array.isArray(p)) kunciArr = p; } catch {}
                                            let jawabanArr = [item.jawaban_siswa];
                                            try { const p = JSON.parse(item.jawaban_siswa); if (Array.isArray(p)) jawabanArr = p; } catch {}

                                            const isCorrectOption = kunciArr.includes(opsi);
                                            const isChosenOption = jawabanArr.includes(opsi);

                                            let style = 'border-border bg-white text-slate-600';
                                            let label = '';
                                            let icon = '○';

                                            if (isChosenOption && isCorrectOption) {
                                                style = 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm';
                                                icon = '✓';
                                                label = resultData.sesi?.tampilkan_kunci !== false ? 'Pilihan Anda (Kunci Jawaban)' : 'Pilihan Anda (Benar)';
                                            } else if (isChosenOption && !isCorrectOption) {
                                                style = 'border-rose-300 bg-rose-50 text-rose-800 shadow-sm';
                                                icon = '✗';
                                                label = 'Pilihan Anda (Salah)';
                                            } else if (!isChosenOption && isCorrectOption) {
                                                if (resultData.sesi?.tampilkan_kunci !== false) {
                                                    style = 'border-emerald-300 bg-emerald-50/40 text-emerald-700 border-dashed';
                                                    icon = '✓';
                                                    label = 'Kunci Jawaban';
                                                } else {
                                                    style = 'border-border bg-white text-slate-600';
                                                    icon = '○';
                                                    label = '';
                                                }
                                            } else {
                                                icon = '○';
                                            }

                                            return (
                                                <div key={oIdx} className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between transition-all ${style}`}>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-lg font-bold ${icon === '○' ? 'text-slate-300' : ''}`}>{icon}</span>
                                                        <span className="font-medium">{opsi}</span>
                                                    </div>
                                                    {label && <span className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {(!item.opsi_jawaban || item.opsi_jawaban.length === 0) && (
                                    <div className={`mt-3 grid gap-2 text-sm ${resultData.sesi?.tampilkan_kunci !== false ? 'sm:grid-cols-2' : ''}`}>
                                        <div className="rounded-xl bg-white/80 px-4 py-2 border border-border">
                                            <span className="font-medium text-slate-500">Jawaban Anda:</span>
                                            <p className="mt-1 text-slate-800">{formatJawaban(item.jawaban_siswa, item.jenis_soal) || <em className="text-slate-400">Tidak dijawab</em>}</p>
                                        </div>
                                        {resultData.sesi?.tampilkan_kunci !== false && (
                                            <div className="rounded-xl bg-white/80 px-4 py-2 border border-border">
                                                <span className="font-medium text-slate-500">Kunci Jawaban:</span>
                                                <p className="mt-1 text-slate-800">{formatJawaban(item.kunci_jawaban, item.jenis_soal)}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Analisis Diagnostik AI */}
                    <AnalisisDiagnostikCard analisis={resultData.analisis_diagnostik} />

                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href="/siswa/riwayat-cbt" className="w-full sm:w-auto rounded-xl border border-border bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 text-center">
                            Lihat Riwayat CBT
                        </a>
                        <a href="/siswa/dashboard" className="w-full sm:w-auto rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/85 text-center">
                            Kembali ke Dashboard
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // --- LOADING ---
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                    <p className="mt-4 text-slate-500 font-medium">Memuat Soal Ujian...</p>
                </div>
            </div>
        );
    }

    // --- ALREADY COMPLETED (no retakes) ---
    if (error === 'SUDAH_DIKERJAKAN') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="rounded-3xl border border-emerald-200 bg-white px-8 py-8 shadow-sm max-w-md text-center space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                        <svg className="h-8 w-8 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Ujian Sudah Dikerjakan</h2>
                    <p className="text-sm text-slate-600">Anda sudah menyelesaikan ujian ini. Pengerjaan ulang tidak diperbolehkan oleh guru.</p>
                    <div className="flex flex-col gap-2 pt-2">
                        <a href="/siswa/riwayat-cbt" className="inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">Lihat Riwayat CBT</a>
                        <a href="/siswa/sesi-aktif" className="inline-block text-sm font-semibold text-slate-500 hover:text-slate-700">Kembali ke Sesi Aktif</a>
                    </div>
                </div>
            </div>
        );
    }

    // --- ERROR ---
    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-rose-700 shadow-sm max-w-md text-center">
                    <h2 className="text-lg font-bold mb-2">Terjadi Kesalahan</h2>
                    <p className="text-sm">{error}</p>
                    <a href="/siswa/dashboard" className="mt-4 inline-block text-sm font-semibold text-rose-600 hover:text-rose-800">Kembali ke Dashboard</a>
                </div>
            </div>
        );
    }

    // --- LOCKDOWN REQUIREMENT ---
    if (isLockedOut) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans text-slate-100">
                <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-pulse">
                    <div className="bg-rose-600 p-6 text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white text-rose-600 shadow-inner">
                            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-white">UJIAN TERKUNCI</h2>
                    </div>
                    <div className="p-8 text-center text-slate-700">
                        <p className="mb-4 text-base font-medium">Anda terdeteksi melakukan tindakan pelanggaran:</p>
                        <div className="mb-6 rounded-xl bg-rose-50 p-4 border border-rose-100">
                            <p className="text-sm font-semibold text-rose-700">"{lockdownMessage}"</p>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">Ujian dihentikan dan seluruh jawaban sebelumnya telah direset. Silakan lapor kepada Guru pengawas untuk meminta akses ulang ujian (Buka Kunci).</p>
                        <a href="/siswa/dashboard" className="inline-flex items-center justify-center rounded-xl bg-slate-800 px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-slate-700 w-full">
                            Kembali ke Dashboard
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    if (!isLockdownActive) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <div className="rounded-3xl border border-border bg-white px-8 py-10 shadow-lg max-w-lg text-center space-y-6">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100">
                        <svg className="h-10 w-10 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Mode Keamanan Ujian</h2>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            Ujian ini membutuhkan mode layar penuh (Fullscreen) untuk mencegah kecurangan. 
                            Anda dilarang berpindah aplikasi, membuka tab baru, menyalin/menempel jawaban, atau menekan tombol klik kanan. 
                            Segala bentuk pelanggaran akan dicatat secara otomatis.
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            try {
                                const elem = document.documentElement;
                                if (elem.requestFullscreen) {
                                    await elem.requestFullscreen();
                                } else if (elem.webkitRequestFullscreen) { /* Safari */
                                    await elem.webkitRequestFullscreen();
                                } else if (elem.msRequestFullscreen) { /* IE11 */
                                    await elem.msRequestFullscreen();
                                }
                            } catch (e) {
                                console.warn('Fullscreen API gagal atau tidak didukung:', e);
                            }
                            setIsLockdownActive(true);
                        }}
                        className="w-full rounded-2xl bg-primary px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/30"
                    >
                        Saya Mengerti, Mulai Ujian
                    </button>
                </div>
            </div>
        );
    }

    // --- EXAM SCREEN ---
    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col selection:bg-primary/10">
            {/* Lockdown Warning Modal */}
            {lockdownWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="rounded-3xl border-2 border-rose-500 bg-white p-8 max-w-sm text-center shadow-2xl animate-bounce">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Peringatan!</h3>
                        <p className="text-rose-600 font-medium">{lockdownWarning}</p>
                    </div>
                </div>
            )}
            
            {/* Header */}
            <header className="sticky top-0 z-10 flex flex-col sm:flex-row items-center justify-between border-b border-border bg-secondary px-3 py-3 sm:py-0 sm:px-6 sm:h-16 backdrop-blur-md shadow-sm gap-3 sm:gap-0">
                <div className="flex w-full sm:w-auto items-center space-x-3 justify-center sm:justify-start">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-accent font-bold">
                        CBT
                    </div>
                    <div className="min-w-0 text-center sm:text-left flex-1 sm:flex-none">
                        <h1 className="font-semibold leading-tight text-accent truncate text-sm sm:text-base">{sesiData?.mata_pelajaran || 'Ujian'}</h1>
                        <p className="text-[10px] sm:text-xs font-medium text-accent/80 uppercase tracking-widest truncate">
                            {sesiData?.tipe_soal || 'CBT'} • {sesiData?.jenis_asesmen}
                        </p>
                    </div>
                </div>

                <div className="flex w-full sm:w-auto items-center gap-2 sm:gap-6">
                    <div className="flex flex-1 sm:flex-none items-center justify-center space-x-2 sm:space-x-3 rounded-xl bg-primary px-3 py-2 sm:px-4 border border-border shadow-inner">
                        <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary/70 opacity-75"></span>
                            <span className="relative inline-flex h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-secondary"></span>
                        </span>
                        <span className={`font-mono text-sm sm:text-lg font-bold tracking-wider ${timeLeft < 300 ? 'text-rose-600' : 'text-accent'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowSummary(true)}
                        disabled={submitting}
                        className="flex-1 sm:flex-none rounded-xl bg-primary px-3 py-2 sm:px-5 text-xs sm:text-sm font-semibold text-accent shadow-sm transition hover:bg-primary/85 disabled:opacity-50 whitespace-nowrap text-center"
                    >
                        Kumpulkan Jawaban
                    </button>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row items-start gap-4 sm:gap-8 p-3 sm:p-6">
                {/* Mobile Question Palette */}
                <div className="w-full lg:hidden mb-4">
                    <div className="rounded-3xl border border-border bg-secondary p-6 shadow-sm">
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-accent">Navigasi Soal</h3>

                        <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
                            {soalData.map((soal, idx) => {
                                const hasAnswered = !!jawaban[soal.id_detail];
                                const isActive = idx === currentIndex;

                                return (
                                    <button
                                        key={soal.id_detail}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`flex h-12 w-full items-center justify-center rounded-xl font-semibold transition-all ${
                                            isActive
                                                ? 'bg-primary text-white shadow-md ring-2 ring-primary ring-offset-2'
                                                : hasAnswered
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 space-y-3 border-t border-slate-100 pt-6">
                            <div className="flex items-center text-sm">
                                <span className="mr-3 block h-4 w-4 rounded-md bg-emerald-100"></span>
                                <span className="text-accent">Sudah Dijawab</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <span className="mr-3 block h-4 w-4 rounded-md bg-slate-100"></span>
                                <span className="text-accent">Belum Dijawab</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <span className="mr-3 block h-4 w-4 rounded-md bg-primary"></span>
                                <span className="text-accent">Sedang Dibuka</span>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-accent">
                            Jawaban tersimpan otomatis
                        </div>
                    </div>
                </div>

                {/* Question Area */}
                <div className="flex-1 w-full rounded-2xl sm:rounded-3xl border border-border bg-white p-4 sm:p-8 shadow-sm">
                    {showSummary ? (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            <h2 className="mb-6 text-2xl font-bold text-slate-800 text-center">Konfirmasi Pengumpulan Jawaban</h2>
                            <p className="mb-8 text-slate-600 text-center">Pastikan semua soal telah terjawab. Anda tidak dapat mengubah jawaban setelah menekan tombol Selesai Ujian.</p>
                            
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 mb-10">
                                {soalData.map((soal, idx) => {
                                    const hasAnswered = !!jawaban[soal.id_detail];
                                    return (
                                        <div key={soal.id_detail} className={`flex items-center justify-between rounded-xl border p-4 ${hasAnswered ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                                            <span className="font-bold text-slate-700">Soal {idx + 1}</span>
                                            {hasAnswered ? (
                                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">Terjawab</span>
                                            ) : (
                                                <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-1 rounded-md">Belum</span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="flex items-center justify-center space-x-4 border-t border-slate-100 pt-8">
                                <button
                                    onClick={() => setShowSummary(false)}
                                    className="rounded-xl border border-border bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Kembali ke Soal
                                </button>
                                <button
                                    onClick={() => setShowConfirmModal(true)}
                                    disabled={submitting}
                                    className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-accent shadow-sm transition hover:bg-primary/85 disabled:opacity-50 flex items-center"
                                >
                                    {submitting ? 'Menyimpan...' : 'Selesai Ujian'}
                                </button>
                            </div>
                        </div>
                    ) : activeSoal ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-800">
                                    Soal No. {currentIndex + 1}
                                </h2>
                                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Bobot: {activeSoal.bobot_nilai}
                                </span>
                            </div>

                            <div className="prose prose-slate max-w-none text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                                {activeSoal.isi_soal}
                                {activeSoal.gambar_soal && (
                                    <div className="mt-4">
                                        <img src={`/storage/${activeSoal.gambar_soal}`} alt="Ilustrasi Soal" className="max-h-64 max-w-full rounded-xl border border-border shadow-sm" />
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 space-y-4">
                                {activeSoal.jenis_soal === 'pilihan_ganda' || activeSoal.jenis_soal === 'pilihan_ganda_kompleks' ? (
                                    <div className="grid gap-3">
                                        {(activeSoal.opsi_jawaban || []).map((opsi, idx) => {
                                            const isKompleks = activeSoal.jenis_soal === 'pilihan_ganda_kompleks';
                                            let isChecked = false;
                                            if (isKompleks) {
                                                try {
                                                    const arr = JSON.parse(jawaban[activeSoal.id_detail] || '[]');
                                                    isChecked = Array.isArray(arr) && arr.includes(opsi);
                                                } catch { isChecked = false; }
                                            } else {
                                                isChecked = jawaban[activeSoal.id_detail] === opsi;
                                            }

                                            return (
                                                <label
                                                    key={idx}
                                                    className={`group relative flex cursor-pointer items-start space-x-4 rounded-2xl border p-4 transition-all hover:bg-slate-50 ${
                                                        isChecked
                                                            ? 'border-primary bg-primary/5/50 shadow-sm'
                                                            : 'border-border hover:border-primary/30'
                                                    }`}
                                                >
                                                    <div className="flex h-6 items-center">
                                                        <input
                                                            type={isKompleks ? "checkbox" : "radio"}
                                                            name={`soal-${activeSoal.id_detail}${isKompleks ? `-${idx}` : ''}`}
                                                            value={opsi}
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                if (isKompleks) {
                                                                    handleAnswerChangeKompleks(activeSoal.id_detail, e.target.value, e.target.checked);
                                                                } else {
                                                                    handleAnswerChange(activeSoal.id_detail, e.target.value);
                                                                }
                                                            }}
                                                            className={`h-5 w-5 border-slate-300 text-primary focus:ring-primary ${isKompleks ? 'rounded' : 'rounded-full'}`}
                                                        />
                                                    </div>
                                                    <div className="flex-1 text-slate-700 font-medium">
                                                        {opsi}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <textarea
                                        value={jawaban[activeSoal.id_detail] || ''}
                                        onChange={(e) => handleAnswerChange(activeSoal.id_detail, e.target.value)}
                                        rows={6}
                                        className="w-full rounded-2xl border border-slate-300 p-4 text-slate-700 shadow-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="Ketikkan jawaban essay Anda di sini..."
                                    />
                                )}
                            </div>

                            {/* Navigation inside card */}
                            <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
                                <button
                                    onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                                    disabled={currentIndex === 0}
                                    className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                                >
                                    &larr; Sebelumnya
                                </button>
                                {currentIndex === soalData.length - 1 ? (
                                    <button
                                        onClick={() => setShowSummary(true)}
                                        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-accent shadow-sm transition hover:bg-primary/85"
                                    >
                                        Kumpulkan Jawaban
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentIndex((p) => Math.min(soalData.length - 1, p + 1))}
                                        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-accent transition hover:bg-primary/85 disabled:opacity-40"
                                    >
                                        Selanjutnya &rarr;
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 py-10">Tidak ada soal yang tersedia.</div>
                    )}
                </div>

                {/* Question Palette Sidebar - Desktop only */}
                <aside className="hidden lg:block w-80 shrink-0 space-y-6">
                    <div className="rounded-3xl border border-border bg-secondary p-6 shadow-sm sticky top-24">
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-accent">Navigasi Soal</h3>

                        <div className="grid grid-cols-5 gap-2">
                            {soalData.map((soal, idx) => {
                                const hasAnswered = !!jawaban[soal.id_detail];
                                const isActive = idx === currentIndex;

                                return (
                                    <button
                                        key={soal.id_detail}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`flex h-12 w-full items-center justify-center rounded-xl font-semibold transition-all ${
                                            isActive
                                                ? 'bg-primary text-white shadow-md ring-2 ring-primary ring-offset-2'
                                                : hasAnswered
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 space-y-3 border-t border-slate-100 pt-6">
                            <div className="flex items-center text-sm">
                                <span className="mr-3 block h-4 w-4 rounded-md bg-emerald-100"></span>
                                <span className="text-accent">Sudah Dijawab</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <span className="mr-3 block h-4 w-4 rounded-md bg-slate-100"></span>
                                <span className="text-accent">Belum Dijawab</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <span className="mr-3 block h-4 w-4 rounded-md bg-primary"></span>
                                <span className="text-accent">Sedang Dibuka</span>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-accent">
                            Jawaban tersimpan otomatis
                        </div>
                    </div>
                </aside>
            </main>

            {/* Custom Confirm Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
                        <h3 className="mb-2 text-xl font-bold text-slate-800">Akhiri Ujian?</h3>
                        <p className="mb-6 text-slate-600">
                            Anda yakin ingin mengakhiri ujian? Jawaban tidak dapat diubah lagi setelah dikumpulkan.
                        </p>
                        <div className="flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={submitting}
                                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    handleSubmit();
                                }}
                                disabled={submitting}
                                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50 flex items-center"
                            >
                                {submitting ? 'Menyimpan...' : 'Ya, Kumpulkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatJawaban(value, jenisSoal) {
    if (!value) return null;
    if (jenisSoal === 'pilihan_ganda_kompleks') {
        try {
            const arr = JSON.parse(value);
            if (Array.isArray(arr)) return arr.join(', ');
        } catch { /* fallback */ }
    }
    return value;
}
