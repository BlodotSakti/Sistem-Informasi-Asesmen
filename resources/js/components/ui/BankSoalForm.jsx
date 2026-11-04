import React, { useState, useRef, useEffect } from 'react';
import ImageLightboxModal from './ImageLightboxModal';

const BLOOM_OPTIONS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10 MB

export default function BankSoalForm({
    bankForm,
    setBankForm,
    mapelOptions,
    onSubmit,
    onCancel,
    isEditing,
    formRef = null,
    onWarning = null,
}) {
    const imageInputRef = useRef(null);
    const audioInputRef = useRef(null);
    const [zoomedImageUrl, setZoomedImageUrl] = useState(null);

    const handleImageFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_IMAGE_SIZE) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            if (imageInputRef.current) imageInputRef.current.value = '';
            const msg = `Berkas gambar "${file.name}" berukuran ${sizeMb} MB. Batas maksimal ukuran gambar soal adalah 2 MB.`;
            if (onWarning) {
                onWarning('Ukuran Gambar Terlalu Besar', msg, 'error');
            } else {
                alert(msg);
            }
            return;
        }

        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
        if (!validExtensions.includes(ext) && !file.type.startsWith('image/')) {
            if (imageInputRef.current) imageInputRef.current.value = '';
            const msg = `Format gambar "${file.name}" tidak didukung. Silakan gunakan format JPG, JPEG, PNG, atau WEBP.`;
            if (onWarning) {
                onWarning('Format Gambar Tidak Didukung', msg, 'error');
            } else {
                alert(msg);
            }
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setBankForm(curr => ({
            ...curr,
            gambar_soal: file,
            gambar_soal_url: previewUrl,
            hapus_gambar: false
        }));
    };

    const handleAudioFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_AUDIO_SIZE) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            if (audioInputRef.current) audioInputRef.current.value = '';
            const msg = `Berkas audio "${file.name}" berukuran ${sizeMb} MB. Batas maksimal berkas audio listening adalah 10 MB (durasi ideal 1-3 menit).`;
            if (onWarning) {
                onWarning('Ukuran Audio Terlalu Besar', msg, 'error');
            } else {
                alert(msg);
            }
            return;
        }

        const validExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.aac'];
        const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
        if (!validExtensions.includes(ext) && !file.type.startsWith('audio/')) {
            if (audioInputRef.current) audioInputRef.current.value = '';
            const msg = `Format audio "${file.name}" tidak didukung. Silakan gunakan format MP3, WAV, M4A, OGG, atau AAC.`;
            if (onWarning) {
                onWarning('Format Audio Tidak Didukung', msg, 'error');
            } else {
                alert(msg);
            }
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setBankForm(curr => ({
            ...curr,
            audio_soal: file,
            audio_soal_url: previewUrl,
            hapus_audio: false,
            batas_putar_audio: curr.batas_putar_audio || '2'
        }));
    };

    useEffect(() => {
        if (!bankForm.gambar_soal && imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    }, [bankForm.gambar_soal]);

    useEffect(() => {
        if (!bankForm.audio_soal && audioInputRef.current) {
            audioInputRef.current.value = '';
        }
    }, [bankForm.audio_soal]);

    return (
        <>
        <form
            ref={formRef}
            id="admin-bank-soal-form"
            onSubmit={onSubmit}
            className="rounded-2xl sm:rounded-3xl border border-border bg-white p-4 sm:p-6 shadow-sm overflow-hidden scroll-mt-24 sm:scroll-mt-28"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                <div>
                    <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Bank Soal</p>
                    <h3 className="mt-1 text-xl sm:text-2xl font-semibold text-slate-900">
                        {isEditing ? 'Edit Soal Digital' : 'Input Soal Digital Terstruktur'}
                    </h3>
                </div>
                {isEditing && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
                        ✏️ Mode Edit Soal
                    </span>
                )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="min-w-0 space-y-2 text-sm font-medium text-slate-700">
                    <span>Mata Pelajaran</span>
                    <select
                        required
                        value={bankForm.id_mapel}
                        onChange={(event) => setBankForm((current) => ({ ...current, id_mapel: event.target.value }))}
                        className="w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    >
                        <option value="">Pilih mapel</option>
                        {mapelOptions.map((item) => (
                            <option key={item.id_mapel} value={item.id_mapel}>
                                {item.nama_lengkap || (item.tingkat ? `${item.nama_mapel} (Kelas ${item.tingkat})` : item.nama_mapel)}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="min-w-0 space-y-2 text-sm font-medium text-slate-700">
                    <span>Jenis Soal</span>
                    <select
                        required
                        value={bankForm.jenis_soal}
                        onChange={(event) => setBankForm((current) => ({ ...current, jenis_soal: event.target.value }))}
                        className="w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    >
                        <option value="pilihan_ganda">Pilihan Ganda</option>
                        <option value="pilihan_ganda_kompleks">Pilihan Ganda Kompleks</option>
                        <option value="esai">Esai</option>
                    </select>
                </label>

                <label className="min-w-0 space-y-2 text-sm font-medium text-slate-700">
                    <span>Topik Materi</span>
                    <input
                        required
                        value={bankForm.topik_materi}
                        onChange={(event) => setBankForm((current) => ({ ...current, topik_materi: event.target.value }))}
                        className="w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                        placeholder="Contoh: Sistem Persamaan Linear"
                    />
                </label>

                <label className="min-w-0 space-y-2 text-sm font-medium text-slate-700">
                    <span>Level Kognitif Bloom</span>
                    <select
                        required
                        value={bankForm.level_kognitif}
                        onChange={(event) => setBankForm((current) => ({ ...current, level_kognitif: event.target.value }))}
                        className="w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    >
                        <option value="">Pilih level Bloom</option>
                        {BLOOM_OPTIONS.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="min-w-0 space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <label htmlFor="admin-input-paket-soal" className="font-semibold text-slate-800">
                            Kode / Nama Paket Soal <span className="text-xs font-normal text-slate-500">(Opsional)</span>
                        </label>
                        <span className="text-xs font-normal text-slate-500">Kosongkan jika soal bersifat umum (tanpa paket)</span>
                    </div>
                    <input
                        id="admin-input-paket-soal"
                        type="text"
                        list="paket-soal-suggestions"
                        maxLength={100}
                        value={bankForm.paket_soal || ''}
                        onChange={(event) => setBankForm((current) => ({ ...current, paket_soal: event.target.value }))}
                        className="w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                        placeholder="Misal: Paket A"
                    />
                    <datalist id="paket-soal-suggestions">
                        <option value="Paket A" />
                        <option value="Paket B" />
                        <option value="Paket C" />
                        <option value="Paket D" />
                        <option value="Paket Susulan" />
                    </datalist>
                    <div className="space-y-1.5 pt-0.5">
                        <p className="text-xs font-normal leading-relaxed text-slate-500 break-words">
                            💡 <strong>Contoh penamaan:</strong> <span className="font-medium text-slate-700">Paket A</span>, <span className="font-medium text-slate-700">Paket B</span>, atau <span className="font-medium text-slate-700">UTS Ganjil - Paket A</span>.
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-medium text-slate-400">Pilihan cepat:</span>
                            {['Paket A', 'Paket B', 'Paket C'].map((pkg) => (
                                <button
                                    key={pkg}
                                    type="button"
                                    onClick={() => setBankForm((current) => ({ ...current, paket_soal: pkg }))}
                                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                                        bankForm.paket_soal === pkg
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold'
                                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {pkg}
                                </button>
                            ))}
                            {bankForm.paket_soal && (
                                <button
                                    type="button"
                                    onClick={() => setBankForm((current) => ({ ...current, paket_soal: '' }))}
                                    className="rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-100 transition"
                                >
                                    ✕ Jadikan Umum (Tanpa Paket)
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <label className="min-w-0 space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                    <span>Isi Soal</span>
                    <textarea
                        required
                        rows="4"
                        value={bankForm.isi_soal}
                        onChange={(event) => setBankForm((current) => ({ ...current, isi_soal: event.target.value }))}
                        className="w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                        placeholder="Tulis soal secara lengkap"
                    />
                </label>

                <div className="min-w-0 md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Gambar Pendukung (Opsional) */}
                    <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 sm:p-4 space-y-2.5 text-sm font-medium text-slate-700">
                        <div>
                            <span className="block font-semibold text-slate-800">Gambar Pendukung (Opsional)</span>
                            <p className="mt-0.5 text-xs font-normal text-slate-500">
                                Format berkas yang didukung: <span className="font-semibold text-slate-700">JPG, JPEG, PNG, WEBP</span> (Maks. <span className="font-semibold text-slate-700">2 MB</span>).
                            </p>
                        </div>
                        <div className="flex min-w-0 flex-col items-start gap-3">
                            {bankForm.gambar_soal_url && !bankForm.hapus_gambar && (
                                <div className="relative inline-block max-w-full rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs">
                                    <img
                                        src={bankForm.gambar_soal_url}
                                        alt="Preview Gambar Soal"
                                        onClick={() => setZoomedImageUrl(bankForm.gambar_soal_url)}
                                        title="Klik untuk memperbesar gambar"
                                        className="max-h-44 sm:max-h-52 w-auto max-w-full cursor-zoom-in rounded-xl object-contain transition hover:opacity-95"
                                    />
                                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-normal text-slate-500">
                                        {bankForm.gambar_soal?.name ? (
                                            <span className="max-w-[180px] sm:max-w-xs truncate">{bankForm.gambar_soal.name}</span>
                                        ) : (
                                            <span>Gambar tersimpan</span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setZoomedImageUrl(bankForm.gambar_soal_url)}
                                            className="text-primary hover:underline font-medium"
                                        >
                                            🔍 Klik untuk perbesar
                                        </button>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (imageInputRef.current) imageInputRef.current.value = '';
                                            setBankForm(curr => ({ ...curr, hapus_gambar: true, gambar_soal: null, gambar_soal_url: null }));
                                        }}
                                        className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow-md transition"
                                        title="Hapus Gambar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                onChange={handleImageFileChange}
                                className="block w-full min-w-0 max-w-full text-xs sm:text-sm text-slate-500 file:mr-3 sm:file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 sm:file:px-4 file:py-2 file:text-xs sm:file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/15"
                            />
                        </div>
                    </div>

                    {/* Audio / Suara Pendukung - Listening (Opsional) */}
                    <div className="min-w-0 rounded-2xl border border-indigo-200/80 bg-indigo-50/30 p-3.5 sm:p-4 space-y-2.5 text-sm font-medium text-slate-700">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-slate-800">Audio / Suara Pendukung (Opsional)</span>
                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                                    Listening CBT
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs font-normal text-slate-500">
                                Format berkas yang didukung: <span className="font-semibold text-slate-700">MP3, WAV, M4A, OGG, AAC</span> (Maks. <span className="font-semibold text-slate-700">10 MB</span>).
                            </p>
                        </div>

                        <div className="flex min-w-0 flex-col items-stretch gap-3">
                            {bankForm.audio_soal_url && !bankForm.hapus_audio && (
                                <div className="relative rounded-2xl border border-indigo-200 bg-white p-3 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between gap-2 pr-6">
                                        <span className="text-xs font-semibold text-indigo-950 truncate">
                                            🎵 {bankForm.audio_soal?.name || 'Audio soal tersimpan'}
                                        </span>
                                    </div>
                                    <audio
                                        controls
                                        controlsList="nodownload"
                                        src={bankForm.audio_soal_url}
                                        className="h-10 w-full max-w-full"
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (audioInputRef.current) audioInputRef.current.value = '';
                                            setBankForm(curr => ({
                                                ...curr,
                                                hapus_audio: true,
                                                audio_soal: null,
                                                audio_soal_url: null,
                                                batas_putar_audio: ''
                                            }));
                                        }}
                                        className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow-md transition"
                                        title="Hapus Audio"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            <input
                                ref={audioInputRef}
                                type="file"
                                accept=".mp3,.wav,.m4a,.ogg,.aac,audio/*"
                                onChange={handleAudioFileChange}
                                className="block w-full min-w-0 max-w-full text-xs sm:text-sm text-slate-500 file:mr-3 sm:file:mr-4 file:rounded-full file:border-0 file:bg-indigo-600/10 file:px-3 sm:file:px-4 file:py-2 file:text-xs sm:file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-600/15"
                            />

                            {bankForm.audio_soal_url && !bankForm.hapus_audio && (
                                <div className="pt-1">
                                    <label className="block space-y-1 text-xs font-semibold text-slate-700">
                                        <span>Batas Pemutaran Ulang Audio oleh Siswa (Standar Listening)</span>
                                        <select
                                            value={bankForm.batas_putar_audio ?? ''}
                                            onChange={(e) => setBankForm(curr => ({ ...curr, batas_putar_audio: e.target.value }))}
                                            className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-600"
                                        >
                                            <option value="">Tanpa Batas (Bebas Putar Ulang)</option>
                                            <option value="1">1 Kali Putar (Standar TOEFL Ketat)</option>
                                            <option value="2">2 Kali Putar</option>
                                            <option value="3">3 Kali Putar</option>
                                            <option value="5">5 Kali Putar</option>
                                        </select>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {bankForm.jenis_soal === 'pilihan_ganda' || bankForm.jenis_soal === 'pilihan_ganda_kompleks' ? (
                    <div className="min-w-0 md:col-span-2 space-y-3">
                        {bankForm.opsi_jawaban.map((opsi, idx) => (
                            <label key={idx} className="flex min-w-0 flex-col space-y-2 text-sm font-medium text-slate-700">
                                <div className="flex items-center justify-between">
                                    <span>Opsi {String.fromCharCode(65 + idx)}</span>
                                    {bankForm.opsi_jawaban.length > 2 && (
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const newOpsi = [...bankForm.opsi_jawaban];
                                                newOpsi.splice(idx, 1);
                                                setBankForm(curr => ({ ...curr, opsi_jawaban: newOpsi }));
                                            }}
                                            className="text-error hover:text-rose-700 text-xs"
                                        >
                                            Hapus
                                        </button>
                                    )}
                                </div>
                                <input 
                                    value={opsi} 
                                    onChange={(event) => {
                                        const newOpsi = [...bankForm.opsi_jawaban];
                                        newOpsi[idx] = event.target.value;
                                        setBankForm(curr => ({ ...curr, opsi_jawaban: newOpsi }));
                                    }} 
                                    className="w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" 
                                />
                            </label>
                        ))}
                        <button 
                            type="button" 
                            onClick={() => setBankForm(curr => ({ ...curr, opsi_jawaban: [...curr.opsi_jawaban, ''] }))}
                            className="mt-2 text-sm text-primary font-semibold hover:text-primary/85"
                        >
                            + Tambah Opsi Jawaban
                        </button>
                    </div>
                ) : null}

                <label className="min-w-0 space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                    <span>Kunci Jawaban</span>
                    {bankForm.jenis_soal === 'pilihan_ganda_kompleks' ? (
                        <div className="flex flex-wrap gap-4 pt-2">
                            {bankForm.opsi_jawaban.filter(Boolean).map((opsi, idx) => (
                                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        value={opsi}
                                        checked={bankForm.kunci_jawaban_kompleks.includes(opsi)}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            const val = e.target.value;
                                            setBankForm(curr => {
                                                const next = new Set(curr.kunci_jawaban_kompleks);
                                                if (checked) next.add(val);
                                                else next.delete(val);
                                                return { ...curr, kunci_jawaban_kompleks: Array.from(next) };
                                            });
                                        }}
                                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                    />
                                    <span className="text-sm font-normal text-slate-700 break-words">{opsi}</span>
                                </label>
                            ))}
                            {bankForm.opsi_jawaban.filter(Boolean).length === 0 && (
                                <span className="text-xs text-slate-400">Isi opsi jawaban terlebih dahulu.</span>
                            )}
                        </div>
                    ) : (
                        <input
                            required
                            value={bankForm.kunci_jawaban}
                            onChange={(event) => setBankForm((current) => ({ ...current, kunci_jawaban: event.target.value }))}
                            className="w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                            placeholder={bankForm.jenis_soal === 'esai' ? 'Panduan jawaban esai' : 'Harus sama dengan salah satu opsi'}
                        />
                    )}
                </label>

                {bankForm.jenis_soal === 'esai' && (
                    <>
                        <label className="min-w-0 space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                            <span>Kata Kunci Penilaian AI (Satu per baris)</span>
                            <p className="text-xs font-normal text-slate-500">Gunakan <code>;</code> untuk memisahkan sinonim. Gunakan <code>**</code> untuk wajib persis. <br/>Contoh: <code>**Soekarno;Bung Karno</code></p>
                            <textarea rows="3" value={bankForm.keywords} onChange={(event) => setBankForm((current) => ({ ...current, keywords: event.target.value }))} className="w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Kata kunci 1&#10;Kata kunci 2;Sinonim 2" />
                        </label>
                        <label className="min-w-0 space-y-2 text-sm font-medium text-slate-700">
                            <span>Bobot Aturan (Rule-Based)</span>
                            <input type="number" step="0.1" min="0" max="1" value={bankForm.rule_weight} onChange={(event) => setBankForm((current) => ({ ...current, rule_weight: event.target.value }))} className="w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
                        </label>
                        <label className="min-w-0 space-y-2 text-sm font-medium text-slate-700">
                            <span>Bobot Makna (LSA)</span>
                            <input type="number" step="0.1" min="0" max="1" value={bankForm.lsa_weight} onChange={(event) => setBankForm((current) => ({ ...current, lsa_weight: event.target.value }))} className="w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
                        </label>
                        <label className="min-w-0 space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                            <span>Ambang Minimal Kata Kunci / Tgate (%)</span>
                            <p className="text-xs font-normal text-slate-500">Persentase minimal kata kunci (dan langkah matematis) yang harus disebut siswa agar penilaian makna (LSA) diaktifkan. Di bawah ambang ini, nilai dipotong penalti. Isi <code>0</code> untuk menonaktifkan.</p>
                            <input type="number" step="5" min="0" max="100" value={bankForm.tgate} onChange={(event) => setBankForm((current) => ({ ...current, tgate: event.target.value }))} className="w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
                        </label>
                        <label className="min-w-0 space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                            <span>Target Minimal Kata Kunci (Opsional)</span>
                            <p className="text-xs font-normal text-slate-500">Gunakan jika soal meminta siswa menyebutkan sebagian opsi (contoh: minta 5 dari 8 opsi yang didaftarkan). Siswa yang menjawab sejumlah target ini akan mendapat nilai penuh 100%. Kosongkan jika seluruh kata kunci wajib ada.</p>
                            <input type="number" min="1" placeholder="Contoh: 5" value={bankForm.required_keywords_count ?? ''} onChange={(event) => setBankForm((current) => ({ ...current, required_keywords_count: event.target.value }))} className="w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
                        </label>

                        <div className="min-w-0 md:col-span-2 mt-4 pt-4 border-t border-slate-200">
                            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition">
                                <input type="checkbox" checked={bankForm.use_math} onChange={(e) => setBankForm(c => ({...c, use_math: e.target.checked}))} className="h-5 w-5 shrink-0 rounded border-slate-300 text-primary focus:ring-primary" />
                                <div className="min-w-0">
                                    <span className="block text-sm font-bold text-slate-800">Gunakan Penilaian Matematis (SymPy AI)</span>
                                    <span className="block text-xs font-normal text-slate-500 mt-0.5">Aktifkan untuk soal yang butuh evaluasi kebenaran rumus/persamaan secara mutlak.</span>
                                </div>
                            </label>
                        </div>

                        {bankForm.use_math && (
                            <>
                                <label className="min-w-0 space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                                    <span>Langkah Matematis (Satu persamaan per baris)</span>
                                    <p className="text-xs font-normal text-slate-500">Contoh: <code>Q = 1000 - 0.5P</code></p>
                                    <textarea rows="3" value={bankForm.math_steps} onChange={(event) => setBankForm((current) => ({ ...current, math_steps: event.target.value }))} className="w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Langkah 1&#10;Langkah 2" />
                                </label>
                                <label className="min-w-0 space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                                    <span>Bobot Matematika (SymPy)</span>
                                    <input type="number" step="0.1" min="0" max="1" value={bankForm.math_weight} onChange={(event) => setBankForm((current) => ({ ...current, math_weight: event.target.value }))} className="w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
                                </label>
                            </>
                        )}
                    </>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
                <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/85">
                    {isEditing ? 'Simpan Perubahan' : 'Simpan Soal'}
                </button>
                {isEditing && onCancel ? (
                    <button type="button" onClick={onCancel} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                        Batal Edit
                    </button>
                ) : null}
            </div>
        </form>

        <ImageLightboxModal
            imageUrl={zoomedImageUrl}
            alt="Pratinjau Gambar Diperbesar"
            caption={bankForm.gambar_soal?.name || ''}
            onClose={() => setZoomedImageUrl(null)}
        />
        </>
    );
}
