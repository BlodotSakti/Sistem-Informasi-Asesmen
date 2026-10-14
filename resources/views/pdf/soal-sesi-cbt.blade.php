<!DOCTYPE html>
<html lang="id">
<head>
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
        .kunci-box { margin-top: 4px; padding: 4px 8px; background: #ecfdf5; border-left: 3px solid #10b981; font-size: 10px; white-space: pre-wrap; }
        .footer { position: fixed; bottom: -24px; left: 0; right: 0; text-align: center; font-size: 9px; color: #94a3b8; }
        .footer .page:after { content: counter(page); }
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
@endphp

    <div class="footer">{{ $mapel }} &mdash; {{ $kelas }} &bull; Halaman <span class="page"></span></div>

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

    @unless ($withKunci)
        <table class="identitas">
            <tr>
                <td class="label">Nama</td><td>: ..............................................................</td>
                <td class="label">No. Absen</td><td>: ....................</td>
            </tr>
            <tr>
                <td class="label">Kelas</td><td>: ..............................................................</td>
                <td class="label">Nilai</td><td>: ....................</td>
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
                                <strong>Kunci:</strong>
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
                                    {{ implode(';  ', $labels) }}
                                @else
                                    {{ $kunciArr[0] ?? '-' }}
                                @endif
                            </div>
                        @endif
                    </td>
                    @if ($withKunci)
                        <td class="bobot">Bobot: {{ rtrim(rtrim(number_format((float) $soal['bobot_nilai'], 2, ',', ''), '0'), ',') }}</td>
                    @endif
                </tr>
            </table>
        </div>
    @endforeach
</body>
</html>
