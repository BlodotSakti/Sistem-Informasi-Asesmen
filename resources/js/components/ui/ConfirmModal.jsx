import React from 'react';

export function ConfirmModal({
    isOpen,
    title = 'Konfirmasi Hapus',
    message = 'Apakah Anda yakin ingin menghapus data ini? Data yang dihapus tidak dapat dikembalikan.',
    confirmText = 'Ya, Hapus',
    cancelText = 'Batal',
    variant = 'danger',
    loading = false,
    onConfirm,
    onCancel,
}) {
    if (!isOpen) return null;

    const isDanger = variant === 'danger';
    const isSuccess = variant === 'success';

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 sm:p-6 backdrop-blur-sm animate-fade-in"
            onClick={loading ? undefined : onCancel}
        >
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                        isDanger
                            ? 'bg-rose-50 text-rose-600'
                            : isSuccess
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-600'
                    }`}
                >
                    {isSuccess ? (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                    ) : (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    )}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 break-words">{title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 mb-6 break-words whitespace-pre-line">{message}</p>
                <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="w-full sm:w-auto rounded-xl border border-slate-200 sm:border-transparent px-5 py-2.5 sm:py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`w-full sm:w-auto rounded-xl px-5 py-2.5 sm:py-2 text-sm font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-70 ${
                            isDanger
                                ? 'bg-rose-600 hover:bg-rose-700'
                                : isSuccess
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-amber-600 hover:bg-amber-700'
                        }`}
                    >
                        {loading ? 'Memproses...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function PopupModal({ popup, onClose }) {
    if (!popup) return null;

    const isError =
        popup.type === 'error' ||
        popup.isError ||
        /gagal|error|kesalahan|peringatan|tidak valid/i.test(String(popup.title || ''));

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 sm:p-6 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 text-center shadow-2xl border border-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className={`mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full ${
                        isError ? 'bg-rose-100' : 'bg-emerald-100'
                    }`}
                >
                    {isError ? (
                        <svg className="h-7 w-7 sm:h-8 sm:w-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                <h3 className="mb-2 text-lg sm:text-xl font-bold text-slate-900 break-words">{popup.title}</h3>
                <p className="mb-6 text-xs sm:text-sm leading-relaxed text-slate-500 break-words">{popup.message}</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-2xl bg-slate-900 py-2.5 sm:py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                    Tutup
                </button>
            </div>
        </div>
    );
}

