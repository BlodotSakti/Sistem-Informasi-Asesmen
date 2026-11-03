<!DOCTYPE html>
<html lang="id">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta charset="UTF-8">
    <title>Soal {{ $mapel }} - {{ $kelas }}</title>
    <style>
        @page { margin: 28px 36px 40px 36px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.45; }
        .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 8px; margin-bottom: 12px; }
        .header h1 { font-size: 15px; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .header p { margin: 0; font-size: 11px; color: #475569; }
        .badge-kunci { display: inline-block; margin-top: 4px; padding: 2px 8px; background: #fee2e2; color: #b91c1c; font-weight: bold; font-size: 10px; border-radius: 3px; }
        table.identitas { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 11px; }
        table.identitas td { padding: 3px 4px; vertical-align: top; }
        table.identitas td.label { width: 90px; }
        .petunjuk { border: 1px solid #cbd5e1; background: #f8fafc; padding: 6px 10px; margin-bottom: 14px; font-size: 10px; }
        .petunjuk ol { margin: 2px 0 0 0; padding-left: 16px; }
        .soal { margin-bottom: 12px; page-break-inside: avoid; }
        .soal-head { width: 100%; border-collapse: collapse; }
        .soal-head td { vertical-align: top; padding: 0; }
        .soal-head td.no { width: 24px; font-weight: bold; }
        .soal-head td.bobot { width: 70px; text-align: right; font-size: 9px; color: #64748b; }
        .isi { white-space: pre-wrap; }
        .ket-jenis { font-size: 9px; font-style: italic; color: #64748b; }
        .gambar { margin: 6px 0; }
        .gambar img { max-width: 320px; max-height: 200px; }
        table.opsi { width: 100%; border-collapse: collapse; margin: 4px 0 0 0; }
        table.opsi td { padding: 1px 4px; vertical-align: top; }
        table.opsi td.huruf { width: 22px; white-space: nowrap; }
        table.opsi td.huruf-kompleks { width: 38px; white-space: nowrap; }
        .box-check { display: inline-block; width: 9px; height: 9px; border: 1px solid #475569; margin-right: 4px; vertical-align: middle; }
        .box-check.checked { background: #047857; border-color: #047857; }
        .opsi-benar { font-weight: bold; color: #047857; }
        .garis { border-bottom: 1px dotted #94a3b8; height: 20px; }
        .kunci-box {
            margin-top: 6px;
            padding: 5px 8px;
            background: #f0fdf4;
            border-left: 3px solid #10b981;
            font-size: 10px;
        }
        table.tbl-kunci {
            width: 100%;
            border-collapse: collapse;
        }
        table.tbl-kunci td {
            vertical-align: top;
            padding: 2px 0;
        }
        table.tbl-kunci td.kunci-lbl {
            width: 95px;
            font-weight: bold;
            color: #065f46;
            white-space: nowrap;
        }
        table.tbl-kunci td.kunci-val {
            color: #1e293b;
        }
        .kunci-teks-pg {
            font-weight: bold;
            color: #047857;
        }
        .kunci-teks-esai {
            color: #1e293b;
            line-height: 1.45;
            background: #ffffff;
            border: 1px solid #d1fae5;
            padding: 5px 8px;
            border-radius: 3px;
            margin-bottom: 3px;
        }
        .keyword-badge {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            border: 1px solid #bae6fd;
            padding: 1px 6px;
            border-radius: 3px;
            margin-right: 3px;
            margin-bottom: 2px;
            font-size: 9px;
            line-height: 1.3;
        }
        .bobot-ai-info {
            font-size: 9px;
            color: #64748b;
            margin-top: 2px;
        }
        .footer { position: fixed; bottom: -24px; left: 0; right: 0; text-align: center; font-size: 9px; color: #94a3b8; }
        .footer .page:after { content: counter(page); }
        .page-break { page-break-before: always; }
        .paket-banner { margin: 0 0 10px 0; padding: 6px 10px; background: #1e293b; color: #ffffff; border-radius: 4px; }
        .paket-banner table { width: 100%; border-collapse: collapse; }
        .paket-banner td { vertical-align: middle; padding: 0; color: #ffffff; }
        .paket-banner .nama { font-size: 16px; font-weight: bold; letter-spacing: 1px; }
        .paket-banner .info { text-align: right; font-size: 9.5px; color: #e2e8f0; }
        .info-sesi { border: 1px dashed #94a3b8; background: #fffbeb; padding: 6px 10px; margin-bottom: 12px; font-size: 9.5px; color: #78350f; }
        .info-sesi ul { margin: 2px 0 0 0; padding-left: 14px; }
        .tag-umum { display: inline-block; padding: 0 5px; margin-left: 4px; background: #e2e8f0; color: #334155; font-size: 8px; font-weight: bold; border-radius: 3px; vertical-align: middle; }
        .tag-paket { display: inline-block; padding: 0 5px; margin-left: 4px; background: #e0e7ff; color: #3730a3; font-size: 8px; font-weight: bold; border-radius: 3px; vertical-align: middle; }
        .ringkasan-title { font-size: 12px; font-weight: bold; margin: 4px 0 6px 0; padding-bottom: 3px; border-bottom: 1px solid #cbd5e1; }
        table.tbl-ringkas { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px; }
        table.tbl-ringkas th, table.tbl-ringkas td { border: 1px solid #cbd5e1; padding: 3px 5px; vertical-align: top; text-align: left; }
        table.tbl-ringkas th { background: #f1f5f9; font-weight: bold; }
        table.tbl-ringkas td.c { text-align: center; width: 34px; }
        table.tbl-ringkas td.r { text-align: right; width: 50px; }
    </style>
</head>
<body>
@php
    $huruf = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    $labelJenis = [
        'pilihan_ganda' => 'Pilihan Ganda',
        'pilihan_ganda_kompleks' => 'Pilihan Ganda Kompleks',
        'esai' => 'Esai',
    ];
    $jenisAsesmen = ucwords(str_replace('_', ' ', (string) $sesi->jenis_asesmen));
    $fmtBobot = fn ($v) => rtrim(rtrim(number_format((float) $v, 2, ',', ''), '0'), ',');
    $daftarPaket = $paketGroups->pluck('nama')->filter()->implode(', ');
@endphp

    <div class="footer">{{ $mapel }} &mdash; {{ $kelas }} &bull; Halaman <span class="page"></span></div>

@foreach ($paketGroups as $gIdx => $group)
    @php $soalList = $group['soal']; @endphp
    <div class="{{ $gIdx > 0 ? 'page-break' : '' }}">

    <div class="header">
        <h1>{{ $jenisAsesmen }} {{ $sesi->tipe_soal ? '- ' . $sesi->tipe_soal : '' }}</h1>
        <p>Mata Pelajaran: <strong>{{ $mapel }}</strong> &nbsp;|&nbsp; Kelas: <strong>{{ $kelas }}</strong></p>
        <p>
            {{ optional($sesi->waktu_mulai)->translatedFormat('l, d F Y') ?? '-' }}
            &nbsp;|&nbsp; Durasi: {{ $sesi->durasi_menit }} menit
            &nbsp;|&nbsp; Jumlah Soal: {{ $soalList->count() }}
        </p>
        @if ($withKunci)
            <span class="badge-kunci">VERSI GURU &mdash; DENGAN KUNCI JAWABAN</span>
        @endif
    </div>

    @if ($isMultiPaket)
        <div class="paket-banner">
            <table>
                <tr>
                    <td class="nama">{{ strtoupper($group['nama']) }}</td>
                    <td class="info">
                        Paket {{ $gIdx + 1 }} dari {{ $paketGroups->count() }}
                        &nbsp;&bull;&nbsp; {{ $soalList->count() }} soal
                        @if ($group['jumlah_umum'] > 0)
                            (termasuk {{ $group['jumlah_umum'] }} soal umum)
                        @endif
                        @if ($withKunci)
                            &nbsp;&bull;&nbsp; Total bobot: {{ $fmtBobot($group['total_bobot']) }}
                        @endif
                    </td>
                </tr>
            </table>
        </div>
    @endif

    @if ($withKunci && ($isMultiPaket || $acakSoal))
        <div class="info-sesi">
            <strong>Catatan Pengaturan Sesi:</strong>
            <ul>
                @if ($isMultiPaket)
                    <li>Sesi ini memakai <strong>Distribusi Multi-Paket</strong> ({{ $daftarPaket }}). Setiap siswa hanya mengerjakan <strong>satu paket</strong>; dokumen ini memuat paket-paket tersebut pada halaman terpisah.</li>
                    @if ($group['jumlah_umum'] > 0)
                        <li>Soal bertanda <span class="tag-umum">UMUM</span> muncul di semua paket.</li>
                    @endif
                @endif
                @if ($acakSoal)
                    <li><strong>Acak Urutan Soal aktif:</strong> urutan soal di layar CBT berbeda untuk tiap siswa. Nomor pada dokumen ini adalah <strong>nomor master</strong> (sama dengan kolom nomor soal di file Analisis Excel).</li>
                @endif
            </ul>
        </div>
    @endif

    @unless ($withKunci)
        <table class="identitas">
            <tr>
                <td class="label">Nama</td><td>: ..............................................................</td>
                <td class="label">No. Absen</td><td>: ....................</td>
            </tr>
            <tr>
                <td class="label">Kelas</td><td>: ..............................................................</td>
                <td class="label">{{ $isMultiPaket ? 'Paket / Nilai' : 'Nilai' }}</td><td>: {{ $isMultiPaket ? $group['nama'] . ' / ' : '' }}....................</td>
            </tr>
        </table>

        <div class="petunjuk">
            <strong>Petunjuk Pengerjaan:</strong>
            <ol>
                <li>Pilihan Ganda: pilih <strong>satu</strong> jawaban yang paling tepat.</li>
                <li>Pilihan Ganda Kompleks: pilih <strong>semua</strong> jawaban yang benar (jawaban dinilai benar jika sesuai seluruhnya).</li>
                <li>Esai: jawablah pada tempat yang telah disediakan.</li>
            </ol>
        </div>
    @endunless

    @foreach ($soalList as $idx => $soal)
        @php
            $kunciArr = is_array($soal['kunci_jawaban']) ? array_map('trim', $soal['kunci_jawaban']) : [trim((string) $soal['kunci_jawaban'])];
        @endphp
        <div class="soal">
            <table class="soal-head">
                <tr>
                    <td class="no">{{ $idx + 1 }}.</td>
                    <td>
                        <div class="isi">{{ $soal['isi_soal'] }}</div>
                        @if ($soal['jenis_soal'] === 'pilihan_ganda_kompleks')
                            <div class="ket-jenis">(Pilih lebih dari satu jawaban yang benar)</div>
                        @endif

                        @if ($soal['gambar'])
                            <div class="gambar"><img src="{{ $soal['gambar'] }}" alt="Gambar soal {{ $idx + 1 }}"></div>
                        @endif

                        @if (in_array($soal['jenis_soal'], ['pilihan_ganda', 'pilihan_ganda_kompleks']) && count($soal['opsi_jawaban']) > 0)
                            <table class="opsi">
                                @foreach ($soal['opsi_jawaban'] as $oIdx => $opsi)
                                    @php $benar = $withKunci && in_array(trim((string) $opsi), $kunciArr, true); @endphp
                                    <tr class="{{ $benar ? 'opsi-benar' : '' }}">
                                        <td class="huruf {{ $soal['jenis_soal'] === 'pilihan_ganda_kompleks' ? 'huruf-kompleks' : '' }}">@if ($soal['jenis_soal'] === 'pilihan_ganda_kompleks')<span class="box-check {{ $benar ? 'checked' : '' }}"></span>@endif{{ $huruf[$oIdx] ?? ($oIdx + 1) }}.</td>
                                        <td>{{ $opsi }}</td>
                                    </tr>
                                @endforeach
                            </table>
                        @elseif ($soal['jenis_soal'] === 'esai' && ! $withKunci)
                            <div style="margin-top: 4px;">
                                @for ($i = 0; $i < 5; $i++)
                                    <div class="garis"></div>
                                @endfor
                            </div>
                        @endif

                        @if ($withKunci)
                            <div class="kunci-box">
                                @if (in_array($soal['jenis_soal'], ['pilihan_ganda', 'pilihan_ganda_kompleks']))
                                    @php
                                        $labels = [];
                                        foreach ($soal['opsi_jawaban'] as $oIdx => $opsi) {
                                            if (in_array(trim((string) $opsi), $kunciArr, true)) {
                                                $labels[] = ($huruf[$oIdx] ?? ($oIdx + 1)) . '. ' . $opsi;
                                            }
                                        }
                                        if (empty($labels)) { $labels = $kunciArr; }
                                    @endphp
                                    <table class="tbl-kunci">
                                        <tr>
                                            <td class="kunci-lbl" style="width: 55px;">Kunci:</td>
                                            <td class="kunci-val"><span class="kunci-teks-pg">{{ implode(';  ', $labels) }}</span></td>
                                        </tr>
                                    </table>
                                @else
                                    <table class="tbl-kunci">
                                        <tr>
                                            <td class="kunci-lbl">Kunci Jawaban:</td>
                                            <td class="kunci-val">
                                                <div class="kunci-teks-esai">{!! nl2br(e($kunciArr[0] ?? '-')) !!}</div>
                                            </td>
                                        </tr>
                                        @if (!empty($soal['keywords']) && count($soal['keywords']) > 0)
                                            <tr>
                                                <td class="kunci-lbl">Kata Kunci (AI):</td>
                                                <td class="kunci-val">
                                                    @foreach ($soal['keywords'] as $kw)
                                                        <span class="keyword-badge">{{ $kw }}</span>
                                                    @endforeach
                                                </td>
                                            </tr>
                                        @endif
                                        @if ((isset($soal['rule_weight']) && (float) $soal['rule_weight'] > 0) || (isset($soal['lsa_weight']) && (float) $soal['lsa_weight'] > 0))
                                            <tr>
                                                <td class="kunci-lbl">Bobot Penilaian:</td>
                                                <td class="kunci-val bobot-ai-info">
                                                    Aturan (Rule): <strong>{{ number_format((float) ($soal['rule_weight'] ?? 0) * 100, 0) }}%</strong>
                                                    &nbsp;&bull;&nbsp;
                                                    Makna (LSA): <strong>{{ number_format((float) ($soal['lsa_weight'] ?? 0) * 100, 0) }}%</strong>
                                                </td>
                                            </tr>
                                        @endif
                                    </table>
                                @endif
                            </div>
                        @endif
                    </td>
                    @if ($withKunci)
                        <td class="bobot">
                            Bobot: {{ $fmtBobot($soal['bobot_nilai']) }}
                            @if ($isMultiPaket && $soal['paket_soal'] === null)
                                <br><span class="tag-umum">UMUM</span>
                            @elseif (! $isMultiPaket && $soal['paket_soal'])
                                <br><span class="tag-paket">{{ $soal['paket_soal'] }}</span>
                            @endif
                        </td>
                    @endif
                </tr>
            </table>
        </div>
    @endforeach

    @if ($withKunci && $soalList->count() > 0)
        <div style="page-break-inside: avoid; margin-top: 14px;">
            <div class="ringkasan-title">Ringkasan Kunci Jawaban @if ($isMultiPaket) &mdash; {{ $group['nama'] }} @endif</div>
            <table class="tbl-ringkas">
                <thead>
                    <tr>
                        <th style="width: 34px; text-align: center;">No</th>
                        <th style="width: 70px;">Jenis</th>
                        <th>Kunci Jawaban</th>
                        <th style="width: 50px; text-align: right;">Bobot</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($soalList as $idx => $soal)
                        @php
                            $kunciArr = is_array($soal['kunci_jawaban']) ? array_map('trim', $soal['kunci_jawaban']) : [trim((string) $soal['kunci_jawaban'])];
                            if (in_array($soal['jenis_soal'], ['pilihan_ganda', 'pilihan_ganda_kompleks'])) {
                                $labels = [];
                                foreach ($soal['opsi_jawaban'] as $oIdx => $opsi) {
                                    if (in_array(trim((string) $opsi), $kunciArr, true)) {
                                        $labels[] = $huruf[$oIdx] ?? ($oIdx + 1);
                                    }
                                }
                                $ringkas = empty($labels) ? implode(', ', $kunciArr) : implode(', ', $labels);
                            } else {
                                $ringkas = \Illuminate\Support\Str::limit($kunciArr[0] ?? '-', 90);
                            }
                            $jenisPendek = $soal['jenis_soal'] === 'esai' ? 'Esai' : ($soal['jenis_soal'] === 'pilihan_ganda_kompleks' ? 'PG Kompleks' : 'PG');
                        @endphp
                        <tr>
                            <td class="c">{{ $idx + 1 }}</td>
                            <td>{{ $jenisPendek }}@if ($isMultiPaket && $soal['paket_soal'] === null) <span class="tag-umum">UMUM</span>@endif</td>
                            <td><strong>{{ $ringkas }}</strong></td>
                            <td class="r">{{ $fmtBobot($soal['bobot_nilai']) }}</td>
                        </tr>
                    @endforeach
                    <tr>
                        <td colspan="3" style="text-align: right; font-weight: bold;">Total Bobot</td>
                        <td class="r"><strong>{{ $fmtBobot($group['total_bobot']) }}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>
    @endif

    </div>
@endforeach
</body>
</html>
