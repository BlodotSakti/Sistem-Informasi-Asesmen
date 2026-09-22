import React from 'react';

const BLOOM_OPTIONS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

export default function BankSoalForm({
    bankForm,
    setBankForm,
    mapelOptions,
    onSubmit,
    onCancel,
    isEditing
}) {
    return (
        <form onSubmit={onSubmit} className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Bank Soal</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Input soal digital terstruktur</h3>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                    <span>Mata Pelajaran</span>
                    <select
                        required
                        value={bankForm.id_mapel}
                        onChange={(event) => setBankForm((current) => ({ ...current, id_mapel: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    >
                        <option value="">Pilih mapel</option>
                        {mapelOptions.map((item) => (
                            <option key={item.id_mapel} value={item.id_mapel}>
                                {item.nama_lengkap || item.nama_mapel} {item.tingkat ? `(Kelas ${item.tingkat})` : ''}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                    <span>Jenis Soal</span>
                    <select
                        required
                        value={bankForm.jenis_soal}
                        onChange={(event) => setBankForm((current) => ({ ...current, jenis_soal: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    >
                        <option value="pilihan_ganda">Pilihan Ganda</option>
                        <option value="pilihan_ganda_kompleks">Pilihan Ganda Kompleks</option>
                        <option value="esai">Esai</option>
                    </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                    <span>Topik Materi</span>
                    <input
                        required
                        value={bankForm.topik_materi}
                        onChange={(event) => setBankForm((current) => ({ ...current, topik_materi: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                        placeholder="Contoh: Sistem Persamaan Linear"
                    />
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                    <span>Level Kognitif Bloom</span>
                    <select
                        required
                        value={bankForm.level_kognitif}
                        onChange={(event) => setBankForm((current) => ({ ...current, level_kognitif: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    >
                        <option value="">Pilih level Bloom</option>
                        {BLOOM_OPTIONS.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                    <span>Isi Soal</span>
                    <textarea
                        required
                        rows="4"
                        value={bankForm.isi_soal}
                        onChange={(event) => setBankForm((current) => ({ ...current, isi_soal: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                        placeholder="Tulis soal secara lengkap"
                    />
                </label>

                <div className="md:col-span-2">
                    <label className="space-y-2 text-sm font-medium text-slate-700">
                        <span>Gambar Pendukung (Opsional)</span>
                        <div className="flex flex-col gap-3">
                            {bankForm.gambar_soal_url && !bankForm.hapus_gambar && (
                                <div className="relative w-max">
                                    <img src={bankForm.gambar_soal_url} alt="Gambar Soal" className="max-h-40 rounded-xl border border-border object-cover shadow-sm" />
                                    <button 
                                        type="button" 
                                        onClick={() => setBankForm(curr => ({ ...curr, hapus_gambar: true, gambar_soal: null }))}
                                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-white hover:bg-secondary/85 shadow"
                                        title="Hapus Gambar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setBankForm(curr => ({ ...curr, gambar_soal: e.target.files[0], hapus_gambar: false }));
                                    }
                                }}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary/5 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/10"
                            />
                        </div>
                    </label>
                </div>

                {bankForm.jenis_soal === 'pilihan_ganda' || bankForm.jenis_soal === 'pilihan_ganda_kompleks' ? (
                    <div className="md:col-span-2 space-y-3">
                        {bankForm.opsi_jawaban.map((opsi, idx) => (
                            <label key={idx} className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
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
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" 
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

                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
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
                                    <span className="text-sm font-normal text-slate-700">{opsi}</span>
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
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                            placeholder={bankForm.jenis_soal === 'esai' ? 'Panduan jawaban esai' : 'Harus sama dengan salah satu opsi'}
                        />
                    )}
                </label>

                {bankForm.jenis_soal === 'esai' && (
                    <>
                        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                            <span>Kata Kunci Penilaian AI (Satu per baris)</span>
                            <p className="text-xs font-normal text-slate-500">Gunakan <code>;</code> untuk memisahkan sinonim. Gunakan <code>**</code> untuk wajib persis. <br/>Contoh: <code>**Soekarno;Bung Karno</code></p>
                            <textarea rows="3" value={bankForm.keywords} onChange={(event) => setBankForm((current) => ({ ...current, keywords: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" placeholder="Kata kunci 1&#10;Kata kunci 2;Sinonim 2" />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Bobot Aturan (Rule-Based)</span>
                            <input type="number" step="0.1" min="0" max="1" value={bankForm.rule_weight} onChange={(event) => setBankForm((current) => ({ ...current, rule_weight: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Bobot Makna (LSA)</span>
                            <input type="number" step="0.1" min="0" max="1" value={bankForm.lsa_weight} onChange={(event) => setBankForm((current) => ({ ...current, lsa_weight: event.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900" />
                        </label>
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
    );
}
