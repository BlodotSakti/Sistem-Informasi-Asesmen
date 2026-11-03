import React, { useState, useEffect, useRef } from 'react';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

export default function ImageLightboxModal({ imageUrl, alt = 'Pratinjau Gambar', caption = '', onClose }) {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setIsPanning(false);
    }, [imageUrl]);

    if (!imageUrl) return null;

    const updateZoom = (nextZoom) => {
        const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextZoom.toFixed(2))));
        setZoom(clamped);
        if (clamped <= 1) {
            setPosition({ x: 0, y: 0 });
        }
    };

    const handleZoomIn = () => updateZoom(zoom + ZOOM_STEP);
    const handleZoomOut = () => updateZoom(zoom - ZOOM_STEP);
    const handleReset = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleWheel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
        updateZoom(zoom + delta);
    };

    const handlePointerDown = (e) => {
        if (zoom <= 1) return;
        e.preventDefault();
        setIsPanning(true);
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        panStartRef.current = {
            x: clientX - position.x,
            y: clientY - position.y,
        };
    };

    const handlePointerMove = (e) => {
        if (!isPanning || zoom <= 1) return;
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        setPosition({
            x: clientX - panStartRef.current.x,
            y: clientY - panStartRef.current.y,
        });
    };

    const handlePointerUp = () => {
        setIsPanning(false);
    };

    const handleDoubleClick = () => {
        if (zoom > 1) {
            handleReset();
        } else {
            updateZoom(2);
        }
    };

    return (
        <div
            onClick={onClose}
            onContextMenu={(e) => e.preventDefault()}
            className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-150 select-none"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl"
            >
                {/* Top Toolbar: Zoom Controls & Close */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-5 sm:py-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            type="button"
                            onClick={handleZoomOut}
                            disabled={zoom <= MIN_ZOOM}
                            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Perkecil (Zoom Out)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <span className="min-w-[3.5rem] text-center font-mono text-xs sm:text-sm font-bold text-slate-700">
                            {Math.round(zoom * 100)}%
                        </span>

                        <button
                            type="button"
                            onClick={handleZoomIn}
                            disabled={zoom >= MAX_ZOOM}
                            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Perbesar (Zoom In)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <button
                            type="button"
                            onClick={handleReset}
                            className="ml-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100"
                            title="Reset Ukuran Normal (100%)"
                        >
                            Reset
                        </button>
                    </div>

                    <div className="hidden md:block text-xs text-slate-400">
                        {zoom > 1 ? 'Geser (drag) gambar untuk melihat bagian lain' : 'Gunakan tombol +/- atau scroll mouse untuk zoom'}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
                        title="Tutup Pratinjau"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span>Tutup</span>
                    </button>
                </div>

                {/* Image Viewport */}
                <div
                    onWheel={handleWheel}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                    onDoubleClick={handleDoubleClick}
                    className={`relative flex h-[68vh] sm:h-[75vh] w-full items-center justify-center overflow-hidden bg-slate-900/5 p-2 sm:p-4 ${
                        zoom > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
                    }`}
                >
                    <img
                        src={imageUrl}
                        alt={alt}
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                            transformOrigin: 'center center',
                            transition: isPanning ? 'none' : 'transform 150ms ease-out',
                        }}
                        className="max-h-full max-w-full rounded-lg object-contain select-none"
                    />
                </div>

                {/* Footer Hint / Caption */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white px-4 py-2 text-xs text-slate-500">
                    <span className="truncate max-w-full font-medium text-slate-600">
                        {caption || 'Klik 2x pada gambar atau gunakan tombol + / - untuk memperbesar & memperkecil.'}
                    </span>
                    {zoom > 1 && (
                        <span className="text-[11px] font-medium text-primary md:hidden">
                            Geser gambar untuk melihat detail
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

