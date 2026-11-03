import React, { useEffect, useRef, useState } from 'react';

function formatAudioTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function CbtAudioPlayer({
    src,
    idSesi,
    idDetail,
    batasPutar = null,
    isReview = false,
}) {
    const audioRef = useRef(null);
    const storageKey = idSesi && idDetail ? `cbt-audio-play-${idSesi}-${idDetail}` : null;

    const maxPlays = batasPutar && Number(batasPutar) > 0 ? Number(batasPutar) : null;

    const [playsUsed, setPlaysUsed] = useState(() => {
        if (isReview || !storageKey) return 0;
        const saved = Number(localStorage.getItem(storageKey) || '0');
        return Number.isFinite(saved) && saved >= 0 ? saved : 0;
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const [inActiveCycle, setInActiveCycle] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [audioError, setAudioError] = useState(false);
    const lastValidTimeRef = useRef(0);

    // Reset state when switching questions (idDetail or src changes)
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setInActiveCycle(false);
        setCurrentTime(0);
        setDuration(0);
        setAudioError(false);
        lastValidTimeRef.current = 0;

        if (!isReview && storageKey) {
            const saved = Number(localStorage.getItem(storageKey) || '0');
            setPlaysUsed(Number.isFinite(saved) && saved >= 0 ? saved : 0);
        } else {
            setPlaysUsed(0);
        }
    }, [src, idDetail, storageKey, isReview]);

    const isLimitReached = !isReview && maxPlays !== null && playsUsed >= maxPlays && !inActiveCycle;
    const remainingPlays = maxPlays !== null ? Math.max(0, maxPlays - playsUsed) : null;

    const handleTogglePlay = async (e) => {
        e.stopPropagation();
        const audio = audioRef.current;
        if (!audio || audioError) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
            return;
        }

        if (isLimitReached) {
            return;
        }

        // If starting a fresh playback cycle in exam mode, increment play counter
        if (!isReview && !inActiveCycle) {
            const nextCount = playsUsed + 1;
            setPlaysUsed(nextCount);
            setInActiveCycle(true);
            if (storageKey) {
                localStorage.setItem(storageKey, String(nextCount));
            }
        }

        try {
            await audio.play();
            setIsPlaying(true);
        } catch (err) {
            console.error('Gagal memutar audio soal:', err);
            setIsPlaying(false);
        }
    };

    const handleTimeUpdate = () => {
        const audio = audioRef.current;
        if (!audio) return;

        // Prevent programmatic or keyboard seeking in exam mode
        if (!isReview && Math.abs(audio.currentTime - lastValidTimeRef.current) > 1.5) {
            audio.currentTime = lastValidTimeRef.current;
            return;
        }

        lastValidTimeRef.current = audio.currentTime;
        setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
        const audio = audioRef.current;
        if (!audio) return;
        setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        setAudioError(false);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setInActiveCycle(false);
        setCurrentTime(0);
        lastValidTimeRef.current = 0;
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }
    };

    const handleToggleMute = (e) => {
        e.stopPropagation();
        const audio = audioRef.current;
        if (!audio) return;
        const nextMuted = !isMuted;
        audio.muted = nextMuted;
        setIsMuted(nextMuted);
    };

    const handleVolumeChange = (e) => {
        e.stopPropagation();
        const nextVol = parseFloat(e.target.value);
        setVolume(nextVol);
        if (audioRef.current) {
            audioRef.current.volume = nextVol;
            if (nextVol > 0 && isMuted) {
                audioRef.current.muted = false;
                setIsMuted(false);
            }
        }
    };

    const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    return (
        <div
            className="mb-5 rounded-2xl border border-indigo-200/90 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-indigo-50/60 p-3.5 sm:p-4 shadow-sm select-none"
            onContextMenu={(e) => e.preventDefault()}
        >
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                controlsList="nodownload noplaybackrate"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onError={() => setAudioError(true)}
                className="hidden"
            />

            {/* Header Info & Play Limit Badge */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                            Audio Pendukung Soal (Listening)
                        </p>
                        <p className="text-[11px] text-slate-500">
                            {isReview
                                ? 'Mode ulasan — putar audio soal di bawah ini'
                                : 'Dengarkan dengan saksama (durasi audio tidak dapat digeser maju/mundur)'}
                        </p>
                    </div>
                </div>

                {!isReview && (
                    <div className="flex items-center gap-1.5">
                        {maxPlays !== null ? (
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                                    isLimitReached
                                        ? 'border-rose-200 bg-rose-100 text-rose-700'
                                        : inActiveCycle
                                        ? 'border-indigo-200 bg-indigo-100 text-indigo-700'
                                        : 'border-amber-200 bg-amber-100 text-amber-800'
                                }`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full ${isLimitReached ? 'bg-rose-500' : isPlaying ? 'bg-indigo-600 animate-ping' : 'bg-amber-500'}`} />
                                {isLimitReached
                                    ? `Batas Putar Habis (${playsUsed}/${maxPlays}x)`
                                    : inActiveCycle
                                    ? `Putaran Ke-${playsUsed} dari ${maxPlays}x (Sisa ${remainingPlays}x)`
                                    : `Sisa Putar: ${remainingPlays} dari ${maxPlays}x`}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Pemutaran: Tanpa Batas
                            </span>
                        )}
                    </div>
                )}
            </div>

            {audioError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                    Berkas audio tidak dapat dimuat. Pastikan koneksi stabil atau hubungi pengawas ujian.
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-2xs">
                    {/* Play/Pause Button & Progress Row */}
                    <div className="flex flex-1 items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={handleTogglePlay}
                            disabled={isLimitReached}
                            title={
                                isLimitReached
                                    ? 'Kesempatan memutar audio sudah habis'
                                    : isPlaying
                                    ? 'Jeda Audio'
                                    : 'Putar Audio'
                            }
                            className={`flex h-10 px-3.5 shrink-0 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                                isLimitReached
                                    ? 'cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200'
                                    : isPlaying
                                    ? 'bg-amber-500 text-white hover:bg-amber-600 cursor-pointer'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                            }`}
                        >
                            {isPlaying ? (
                                <>
                                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                                    </svg>
                                    <span>Jeda</span>
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                    <span>{isLimitReached ? 'Habis' : inActiveCycle ? 'Lanjut' : 'Putar'}</span>
                                </>
                            )}
                        </button>

                        {/* Non-seekable TOEFL Progress Bar */}
                        <div className="flex-1 min-w-0">
                            <div
                                className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200 pointer-events-none"
                                title="Durasi pemutaran audio (tidak dapat digeser)"
                            >
                                <div
                                    className={`h-full rounded-full transition-all duration-150 ${
                                        isLimitReached ? 'bg-slate-400' : 'bg-indigo-600'
                                    }`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[11px] font-mono font-semibold text-slate-500">
                                <span>{formatAudioTime(currentTime)}</span>
                                <span className="text-[10px] font-sans font-normal text-slate-400 hidden xs:inline">
                                    {isPlaying ? '● Sedang diputar' : isLimitReached ? 'Selesai diputar' : 'Mode Listening CBT'}
                                </span>
                                <span>{formatAudioTime(duration)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 sm:border-t-0 sm:border-l sm:pl-3 sm:pt-0 shrink-0">
                        <button
                            type="button"
                            onClick={handleToggleMute}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                            title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
                        >
                            {isMuted || volume === 0 ? (
                                <svg className="h-4 w-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                </svg>
                            ) : (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            )}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            onClick={(e) => e.stopPropagation()}
                            className="h-1.5 w-20 cursor-pointer accent-indigo-600"
                            aria-label="Volume Audio"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

