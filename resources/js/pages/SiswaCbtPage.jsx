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

    const saveTimerRef = useRef({});
    const activeSoal = soalData[currentIndex];
    const storageKey = `${STORAGE_PREFIX}${idSesi}`;

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
                const response = await fetch(apiBase(`/api/siswa/cbt/${idSesi}`), {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${session.token}`,
                    },
                });

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({}));
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
                    const startTime = new Date(data.sesi.waktu_mulai).getTime();
                    const durationMs = data.sesi.durasi_menit * 60 * 1000;
                    let endTime = startTime + durationMs;

                    if (data.sesi.waktu_selesai) {
                        const absoluteEndTime = new Date(data.sesi.waktu_selesai).getTime();
                        if (absoluteEndTime < endTime) {
                            endTime = absoluteEndTime;
                        }
                    }

                    const now = new Date().getTime();
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
                throw new Error('Gagal menyimpan jawaban ujian');
            }

            const result = await response.json();

            // Clear localStorage on success
            try { localStorage.removeItem(storageKey); } catch { /* ignore */ }

            setResultData(result);
        } catch (err) {
            alert(`Terjadi kesalahan: ${err.message}`);
            setSubmitting(false);
        }
    }, [jawaban, session.token, idSesi, submitting, storageKey]);

    // Timer
    useEffect(() => {
        if (loading || submitting || timeLeft <= 0 || resultData) return;

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
                alert('Peringatan: Terdeteksi perpindahan tab atau jendela. Aktivitas ini dicatat oleh sistem.');
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
                <div className="mx-auto max-w-4xl px-6 py-12">
                    {/* Score Hero */}
                    <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg">
                        <div className="mx-auto mb-4 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl">
                            <span className="text-4xl font-black text-white">{persen}%</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">Ujian Selesai!</h1>
                        <p className="mt-2 text-lg text-slate-500">{resultData.mata_pelajaran} — <span className="capitalize">{resultData.jenis_asesmen}</span></p>

                        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="rounded-2xl bg-blue-50 px-4 py-5">
                                <p className="text-2xl font-bold text-blue-700">{Number(resultData.total_skor).toFixed(2)}</p>
                                <p className="mt-1 text-xs font-medium text-blue-500">Skor / {resultData.total_bobot}</p>
                            </div>
                            <div className="rounded-2xl bg-emerald-50 px-4 py-5">
                                <p className="text-2xl font-bold text-emerald-700">{resultData.jumlah_benar}</p>
                                <p className="mt-1 text-xs font-medium text-emerald-500">Benar</p>
                            </div>
                            <div className="rounded-2xl bg-rose-50 px-4 py-5">
                                <p className="text-2xl font-bold text-rose-700">{resultData.jumlah_salah}</p>
                                <p className="mt-1 text-xs font-medium text-rose-500">Salah</p>
                            </div>
                            <div className="rounded-2xl bg-amber-50 px-4 py-5">
                                <p className="text-2xl font-bold text-amber-700">{resultData.jumlah_soal}</p>
                                <p className="mt-1 text-xs font-medium text-amber-500">Total Soal</p>
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
                                <p className="mt-2 text-sm text-slate-600">{item.isi_soal}</p>
                                {item.opsi_jawaban && item.opsi_jawaban.length > 0 && (
                                    <div className="mt-3 grid gap-2">
                                        {item.opsi_jawaban.map((opsi, oIdx) => {
                                            let kunciArr = [item.kunci_jawaban];
                                            try { const p = JSON.parse(item.kunci_jawaban); if (Array.isArray(p)) kunciArr = p; } catch {}
                                            let jawabanArr = [item.jawaban_siswa];
                                            try { const p = JSON.parse(item.jawaban_siswa); if (Array.isArray(p)) jawabanArr = p; } catch {}

                                            const isCorrectOption = kunciArr.includes(opsi);
                                            const isChosenOption = jawabanArr.includes(opsi);

                                            let style = 'border-slate-200 bg-white text-slate-600';
                                            let label = '';
                                            let icon = '○';

                                            if (isChosenOption && isCorrectOption) {
                                                style = 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm';
                                                icon = '✓';
                                                label = 'Pilihan Anda (Benar)';
                                            } else if (isChosenOption && !isCorrectOption) {
                                                style = 'border-rose-300 bg-rose-50 text-rose-800 shadow-sm';
                                                icon = '✗';
                                                label = 'Pilihan Anda (Salah)';
                                            } else if (!isChosenOption && isCorrectOption) {
                                                style = 'border-emerald-300 bg-emerald-50/40 text-emerald-700 border-dashed';
                                                icon = '✓';
                                                label = 'Kunci Jawaban';
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
                                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                                        <div className="rounded-xl bg-white/80 px-4 py-2 border border-slate-200">
                                            <span className="font-medium text-slate-500">Jawaban Anda:</span>
                                            <p className="mt-1 text-slate-800">{formatJawaban(item.jawaban_siswa, item.jenis_soal) || <em className="text-slate-400">Tidak dijawab</em>}</p>
                                        </div>
                                        <div className="rounded-xl bg-white/80 px-4 py-2 border border-slate-200">
                                            <span className="font-medium text-slate-500">Kunci Jawaban:</span>
                                            <p className="mt-1 text-slate-800">{formatJawaban(item.kunci_jawaban, item.jenis_soal)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Analisis Diagnostik AI */}
                    <AnalisisDiagnostikCard analisis={resultData.analisis_diagnostik} />

                    <div className="mt-10 text-center">
                        <a href="/siswa/riwayat-cbt" className="mr-4 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                            Lihat Riwayat CBT
                        </a>
                        <a href="/siswa/dashboard" className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
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
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
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

    // --- EXAM SCREEN ---
    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col selection:bg-blue-100">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md shadow-sm">
                <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                        CBT
                    </div>
                    <div>
                        <h1 className="font-semibold leading-tight text-slate-800">{sesiData?.mata_pelajaran || 'Ujian'}</h1>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{sesiData?.jenis_asesmen}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3 rounded-xl bg-slate-50 px-4 py-2 border border-slate-200 shadow-inner">
                        <span className="relative flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500"></span>
                        </span>
                        <span className={`font-mono text-lg font-bold tracking-wider ${timeLeft < 300 ? 'text-rose-600' : 'text-slate-700'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowSummary(true)}
                        disabled={submitting}
                        className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                    >
                        Kumpulkan Jawaban
                    </button>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-7xl flex-1 items-start gap-8 p-6">
                {/* Question Area */}
                <div className="flex-1 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
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
                                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Kembali ke Soal
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Anda yakin ingin mengakhiri ujian? Jawaban tidak dapat diubah lagi setelah dikumpulkan.')) {
                                            handleSubmit();
                                        }
                                    }}
                                    disabled={submitting}
                                    className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 flex items-center"
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

                            <div className="prose prose-slate max-w-none text-lg leading-relaxed text-slate-700">
                                {activeSoal.isi_soal}
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
                                                            ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                                                            : 'border-slate-200 hover:border-blue-300'
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
                                                            className={`h-5 w-5 border-slate-300 text-blue-600 focus:ring-blue-600 ${isKompleks ? 'rounded' : 'rounded-full'}`}
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
                                        className="w-full rounded-2xl border border-slate-300 p-4 text-slate-700 shadow-sm outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                        placeholder="Ketikkan jawaban essay Anda di sini..."
                                    />
                                )}
                            </div>

                            {/* Navigation inside card */}
                            <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
                                <button
                                    onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                                    disabled={currentIndex === 0}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                                >
                                    &larr; Sebelumnya
                                </button>
                                {currentIndex === soalData.length - 1 ? (
                                    <button
                                        onClick={() => setShowSummary(true)}
                                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                    >
                                        Kumpulkan Jawaban
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentIndex((p) => Math.min(soalData.length - 1, p + 1))}
                                        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40"
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

                {/* Question Palette Sidebar */}
                <aside className="w-80 shrink-0 space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Navigasi Soal</h3>

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
                                                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2'
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
                                <span className="text-slate-600">Sudah Dijawab</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <span className="mr-3 block h-4 w-4 rounded-md bg-slate-100"></span>
                                <span className="text-slate-600">Belum Dijawab</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <span className="mr-3 block h-4 w-4 rounded-md bg-blue-600"></span>
                                <span className="text-slate-600">Sedang Dibuka</span>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
                            Jawaban tersimpan otomatis
                        </div>
                    </div>
                </aside>
            </main>
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
