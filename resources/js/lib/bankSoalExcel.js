import * as XLSX from 'xlsx';
import * as CFB from 'cfb';

export const BANK_SOAL_EXCEL_HEADERS = [
    'Mata Pelajaran',
    'Isi Soal',
    'Gambar Pendukung (Opsional)',
    'Opsi A',
    'Opsi B',
    'Opsi C',
    'Opsi D',
    'Opsi E',
    'Kunci Jawaban',
    'Jenis Soal',
    'Topik Materi',
    'Paket Soal (Opsional)',
    'Level Kognitif Bloom',
    'Kata Kunci Penilaian AI',
    'Bobot Aturan (Rule-Based)',
    'Bobot Makna (LSA)',
    'Ambang Minimal Kata Kunci / Tgate (%)',
    'Target Minimal Kata Kunci (Opsional)',
    'Langkah Matematis (Opsional)',
    'Bobot Matematika (SymPy)',
];

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

export function downloadBankSoalTemplateExcel(filename = 'Template_Import_Soal_SMAN.xlsx') {
    const exampleData = [
        {
            'Mata Pelajaran': 'Bahasa Indonesia (X)',
            'Isi Soal': 'Siapakah penemu bola lampu?',
            'Gambar Pendukung (Opsional)': '',
            'Opsi A': 'Albert Einstein',
            'Opsi B': 'Thomas Edison',
            'Opsi C': 'Nikola Tesla',
            'Opsi D': 'Isaac Newton',
            'Opsi E': 'Galileo Galilei',
            'Kunci Jawaban': 'Thomas Edison',
            'Jenis Soal': 'Pilihan Ganda',
            'Topik Materi': 'Sejarah Penemuan',
            'Paket Soal (Opsional)': 'Paket A',
            'Level Kognitif Bloom': 'C1',
            'Kata Kunci Penilaian AI': '',
            'Bobot Aturan (Rule-Based)': '',
            'Bobot Makna (LSA)': '',
            'Ambang Minimal Kata Kunci / Tgate (%)': '',
            'Target Minimal Kata Kunci (Opsional)': '',
            'Langkah Matematis (Opsional)': '',
            'Bobot Matematika (SymPy)': '',
        },
        {
            'Mata Pelajaran': 'Bahasa Indonesia (X)',
            'Isi Soal': 'Jelaskan apa yang dimaksud dengan majas personifikasi beserta satu contohnya!',
            'Gambar Pendukung (Opsional)': '',
            'Opsi A': '',
            'Opsi B': '',
            'Opsi C': '',
            'Opsi D': '',
            'Opsi E': '',
            'Kunci Jawaban': 'Majas personifikasi adalah gaya bahasa yang memberikan sifat-sifat manusia kepada benda mati. Contoh: Angin menari-nari di sela dedaunan.',
            'Jenis Soal': 'Esai',
            'Topik Materi': 'Gaya Bahasa',
            'Paket Soal (Opsional)': 'Paket A',
            'Level Kognitif Bloom': 'C3',
            'Kata Kunci Penilaian AI': 'majas, gaya bahasa, sifat manusia, benda mati',
            'Bobot Aturan (Rule-Based)': 0.4,
            'Bobot Makna (LSA)': 0.6,
            'Ambang Minimal Kata Kunci / Tgate (%)': 40,
            'Target Minimal Kata Kunci (Opsional)': '',
            'Langkah Matematis (Opsional)': '',
            'Bobot Matematika (SymPy)': '',
        },
        {
            'Mata Pelajaran': 'Bahasa Indonesia (X)',
            'Isi Soal': 'Manakah dari berikut ini yang merupakan bahasa pemrograman?',
            'Gambar Pendukung (Opsional)': '',
            'Opsi A': 'Python',
            'Opsi B': 'Kobra',
            'Opsi C': 'JavaScript',
            'Opsi D': 'HTML',
            'Opsi E': 'C++',
            'Kunci Jawaban': 'Python, JavaScript, C++',
            'Jenis Soal': 'Pilihan Ganda Kompleks',
            'Topik Materi': 'Informatika',
            'Paket Soal (Opsional)': 'Paket B',
            'Level Kognitif Bloom': 'C2',
            'Kata Kunci Penilaian AI': '',
            'Bobot Aturan (Rule-Based)': '',
            'Bobot Makna (LSA)': '',
            'Ambang Minimal Kata Kunci / Tgate (%)': '',
            'Target Minimal Kata Kunci (Opsional)': '',
            'Langkah Matematis (Opsional)': '',
            'Bobot Matematika (SymPy)': '',
        },
    ];

    const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: BANK_SOAL_EXCEL_HEADERS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Soal');

    worksheet['!cols'] = [
        { wch: 26 }, // Mata Pelajaran
        { wch: 45 }, // Isi Soal
        { wch: 28 }, // Gambar Pendukung (Opsional)
        { wch: 20 }, // Opsi A
        { wch: 20 }, // Opsi B
        { wch: 20 }, // Opsi C
        { wch: 20 }, // Opsi D
        { wch: 20 }, // Opsi E
        { wch: 32 }, // Kunci Jawaban
        { wch: 24 }, // Jenis Soal
        { wch: 22 }, // Topik Materi
        { wch: 24 }, // Paket Soal (Opsional)
        { wch: 22 }, // Level Kognitif Bloom
        { wch: 34 }, // Kata Kunci Penilaian AI
        { wch: 26 }, // Bobot Aturan (Rule-Based)
        { wch: 22 }, // Bobot Makna (LSA)
        { wch: 36 }, // Ambang Minimal Kata Kunci / Tgate (%)
        { wch: 34 }, // Target Minimal Kata Kunci (Opsional)
        { wch: 28 }, // Langkah Matematis (Opsional)
        { wch: 26 }, // Bobot Matematika (SymPy)
    ];

    XLSX.writeFile(workbook, filename);
}

function uint8ToUtf8(bytes) {
    if (!bytes) return '';
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (typeof TextDecoder !== 'undefined') {
        return new TextDecoder('utf-8').decode(u8);
    }
    let str = '';
    for (let i = 0; i < u8.length; i++) {
        str += String.fromCharCode(u8[i]);
    }
    return str;
}

function uint8ToBase64(bytes) {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < u8.length; i += chunkSize) {
        const chunk = u8.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
    }
    if (typeof btoa === 'function') {
        return btoa(binary);
    }
    return Buffer.from(u8).toString('base64');
}

function detectImageMime(bytes, targetPath = '') {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (u8.length >= 4 && u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47) {
        return 'image/png';
    }
    if (u8.length >= 3 && u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) {
        return 'image/jpeg';
    }
    const lower = String(targetPath).toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    return null;
}

function parseRelsXml(xmlStr) {
    const relMap = {};
    if (!xmlStr) return relMap;
    const tagRegex = /<Relationship\b[^>]*>/gi;
    let match;
    while ((match = tagRegex.exec(xmlStr)) !== null) {
        const tag = match[0];
        const idMatch = tag.match(/\bId\s*=\s*["']([^"']+)["']/i);
        const targetMatch = tag.match(/\bTarget\s*=\s*["']([^"']+)["']/i);
        if (idMatch && targetMatch) {
            relMap[idMatch[1]] = targetMatch[1];
        }
    }
    return relMap;
}

function resolveXlMediaPath(target) {
    if (!target) return null;
    const cleaned = String(target).replace(/^(\.\.\/)+/, '').replace(/^\/+/, '');
    if (cleaned.startsWith('xl/')) return `/${cleaned}`;
    return `/xl/${cleaned}`;
}

function buildImageEntryResult(cfb, targetPath) {
    const cfbPath = resolveXlMediaPath(targetPath);
    if (!cfbPath || !CFB) return null;
    const entry = CFB.find(cfb, cfbPath);
    if (!entry || !entry.content) return null;

    const u8 = entry.content instanceof Uint8Array ? entry.content : new Uint8Array(entry.content);
    const mime = detectImageMime(u8, cfbPath);
    if (!mime) {
        return { error: 'Format gambar pada Excel tidak didukung (gunakan JPG, JPEG, atau PNG).' };
    }
    if (u8.length > MAX_IMAGE_BYTES) {
        return { error: 'Ukuran gambar pada Excel melebihi batas maksimal 2 MB.' };
    }
    const base64 = uint8ToBase64(u8);
    return { dataUrl: `data:${mime};base64,${base64}` };
}

/**
 * Mengekstrak gambar yang disisipkan di dalam file .xlsx (baik melalui Insert -> Picture / Place over Cells
 * maupun Excel 365 Place in Cell) dan memetakannya ke nomor baris Excel (1-based: baris 2 = soal pertama).
 */
export function extractImagesByRowFromXlsxBinary(bstr) {
    const rowImages = {};
    if (!bstr || !CFB) return rowImages;

    try {
        const cfb = CFB.read(bstr, { type: 'binary' });
        if (!cfb) return rowImages;

        // 1. Classic / Floating Drawings (xl/drawings/drawing1.xml)
        const drawingEntry = CFB.find(cfb, '/xl/drawings/drawing1.xml');
        const drawingRelsEntry = CFB.find(cfb, '/xl/drawings/_rels/drawing1.xml.rels');

        if (drawingEntry && drawingEntry.content && drawingRelsEntry && drawingRelsEntry.content) {
            const drawingXml = uint8ToUtf8(drawingEntry.content);
            const relMap = parseRelsXml(uint8ToUtf8(drawingRelsEntry.content));

            const anchorRegex = /<(?:xdr:)?(?:twoCellAnchor|oneCellAnchor)\b[\s\S]*?<\/(?:xdr:)?(?:twoCellAnchor|oneCellAnchor)>/gi;
            let anchorMatch;
            while ((anchorMatch = anchorRegex.exec(drawingXml)) !== null) {
                const block = anchorMatch[0];
                const fromMatch = block.match(/<(?:xdr:)?from\b[\s\S]*?<\/(?:xdr:)?from>/i);
                if (!fromMatch) continue;

                const rowMatch = fromMatch[0].match(/<(?:xdr:)?row>\s*(\d+)\s*<\/(?:xdr:)?row>/i);
                const blipMatch = block.match(/<(?:a:)?blip\b[^>]*?\b(?:r:)?embed\s*=\s*["']([^"']+)["']/i);
                if (!rowMatch || !blipMatch) continue;

                const excelRow = parseInt(rowMatch[1], 10) + 1; // 0-based -> 1-based Excel row
                const rId = blipMatch[1];
                const target = relMap[rId];
                if (!target || excelRow < 2) continue;

                const imgResult = buildImageEntryResult(cfb, target);
                if (imgResult && !rowImages[excelRow]) {
                    rowImages[excelRow] = imgResult;
                }
            }
        }

        // 2. Modern Excel 365 "Place in Cell" (RichData vm="..." in xl/worksheets/sheet1.xml)
        const sheetEntry = CFB.find(cfb, '/xl/worksheets/sheet1.xml');
        const richRelEntry = CFB.find(cfb, '/xl/richData/richValueRel.xml');
        const richRelRelsEntry = CFB.find(cfb, '/xl/richData/_rels/richValueRel.xml.rels');

        if (sheetEntry && sheetEntry.content && richRelEntry && richRelEntry.content && richRelRelsEntry && richRelRelsEntry.content) {
            const sheetXml = uint8ToUtf8(sheetEntry.content);
            const richRelXml = uint8ToUtf8(richRelEntry.content);
            const richRelMap = parseRelsXml(uint8ToUtf8(richRelRelsEntry.content));

            // Ordered list of rIds in richValueRel.xml
            const orderedRIds = [];
            const relTagRegex = /<(?:[\w]+:)?rel\b[^>]*?\b(?:r:)?id\s*=\s*["']([^"']+)["'][^>]*>/gi;
            let relMatch;
            while ((relMatch = relTagRegex.exec(richRelXml)) !== null) {
                orderedRIds.push(relMatch[1]);
            }

            // Optional rdrichvalue.xml mapping (rv index -> rel index)
            const rvToRelIdx = [];
            const rdRichValEntry = CFB.find(cfb, '/xl/richData/rdrichvalue.xml');
            if (rdRichValEntry && rdRichValEntry.content) {
                const rdXml = uint8ToUtf8(rdRichValEntry.content);
                const rvRegex = /<(?:[\w]+:)?rv\b[^>]*>([\s\S]*?)<\/(?:[\w]+:)?rv>/gi;
                let rvMatch;
                while ((rvMatch = rvRegex.exec(rdXml)) !== null) {
                    const firstV = rvMatch[1].match(/<(?:[\w]+:)?v>\s*(\d+)\s*<\/(?:[\w]+:)?v>/i);
                    rvToRelIdx.push(firstV ? parseInt(firstV[1], 10) : rvToRelIdx.length);
                }
            }

            // Optional metadata.xml mapping (vm 1-based -> rv index)
            const vmToRvIdx = {};
            const metaEntry = CFB.find(cfb, '/xl/metadata.xml');
            if (metaEntry && metaEntry.content) {
                const metaXml = uint8ToUtf8(metaEntry.content);
                const rvbIndices = [];
                const rvbRegex = /<(?:[\w]+:)?rvb\b[^>]*?\bi\s*=\s*["'](\d+)["']/gi;
                let rvbMatch;
                while ((rvbMatch = rvbRegex.exec(metaXml)) !== null) {
                    rvbIndices.push(parseInt(rvbMatch[1], 10));
                }

                const valMetaMatch = metaXml.match(/<valueMetadata\b[\s\S]*?<\/valueMetadata>/i);
                if (valMetaMatch) {
                    const bkRegex = /<bk>[\s\S]*?<rc\b[^>]*?\bv\s*=\s*["'](\d+)["'][^>]*>[\s\S]*?<\/bk>/gi;
                    let bkMatch;
                    let vmIdx = 1;
                    while ((bkMatch = bkRegex.exec(valMetaMatch[0])) !== null) {
                        const vIdx = parseInt(bkMatch[1], 10);
                        vmToRvIdx[vmIdx] = rvbIndices[vIdx] !== undefined ? rvbIndices[vIdx] : vIdx;
                        vmIdx++;
                    }
                }
            }

            const cellRegex = /<c\b[^>]*?\br\s*=\s*["'][A-Z]+(\d+)["'][^>]*?\bvm\s*=\s*["'](\d+)["'][^>]*>/gi;
            let cellMatch;
            while ((cellMatch = cellRegex.exec(sheetXml)) !== null) {
                const excelRow = parseInt(cellMatch[1], 10);
                const vmOneBased = parseInt(cellMatch[2], 10);
                if (excelRow < 2 || !vmOneBased) continue;

                const rvIdx = vmToRvIdx[vmOneBased] !== undefined ? vmToRvIdx[vmOneBased] : vmOneBased - 1;
                const relIdx = rvToRelIdx[rvIdx] !== undefined ? rvToRelIdx[rvIdx] : rvIdx;
                const rId = orderedRIds[relIdx];
                const target = rId ? richRelMap[rId] : null;
                if (!target) continue;

                const imgResult = buildImageEntryResult(cfb, target);
                if (imgResult && !rowImages[excelRow]) {
                    rowImages[excelRow] = imgResult;
                }
            }
        }
    } catch (err) {
        console.warn('Gagal mengekstrak gambar dari file Excel:', err);
    }

    return rowImages;
}

function getRowField(normalizedRow, aliases) {
    for (const alias of aliases) {
        const key = alias.toLowerCase().trim();
        if (normalizedRow[key] !== undefined && normalizedRow[key] !== null && String(normalizedRow[key]).trim() !== '') {
            return normalizedRow[key];
        }
    }
    return undefined;
}

function parseDecimal(val, fallback = 0) {
    if (val === undefined || val === null || String(val).trim() === '') return fallback;
    const normalized = String(val).trim().replace(',', '.');
    const num = parseFloat(normalized);
    return Number.isFinite(num) ? num : fallback;
}

function normalizeJenisSoal(rawJenis) {
    if (!rawJenis) return 'pilihan_ganda';
    const cleaned = String(rawJenis)
        .trim()
        .toLowerCase()
        .replace(/[\s\-]+/g, '_');

    if (cleaned === 'pilihan_ganda_kompleks' || cleaned === 'pg_kompleks' || cleaned === 'pgk') {
        return 'pilihan_ganda_kompleks';
    }
    if (cleaned === 'esai' || cleaned === 'essay' || cleaned === 'uraian') {
        return 'esai';
    }
    return 'pilihan_ganda';
}

function normalizeLevelKognitif(rawLevel) {
    if (!rawLevel) return 'C1';
    const match = String(rawLevel).trim().toUpperCase().match(/C[1-6]/);
    return match ? match[0] : 'C1';
}

export function buildMapelLookup(mapelList = []) {
    const mapelLookup = {};
    mapelList.forEach((m) => {
        if (!m || !m.id_mapel) return;
        const namaMapel = String(m.nama_mapel || '').trim();
        const tingkat = String(m.tingkat || '').trim();
        const namaLengkap = String(m.nama_lengkap || (tingkat ? `${namaMapel} (${tingkat})` : namaMapel)).trim();

        if (namaLengkap) mapelLookup[namaLengkap.toLowerCase()] = m.id_mapel;
        if (namaMapel) mapelLookup[namaMapel.toLowerCase()] = m.id_mapel;
        if (namaMapel && tingkat) {
            mapelLookup[`${namaMapel} (${tingkat})`.toLowerCase()] = m.id_mapel;
            mapelLookup[`${namaMapel} (kelas ${tingkat})`.toLowerCase()] = m.id_mapel;
            mapelLookup[`${namaMapel} - tingkat ${tingkat}`.toLowerCase()] = m.id_mapel;
        }
    });
    return mapelLookup;
}

export function parseBankSoalExcelRows(dataRows, mapelList = [], options = {}) {
    const { isGuru = false, rowImages = {}, defaultPaket = '' } = options;
    const mapelLookup = buildMapelLookup(mapelList);
    const mapelGroup = {};
    const skippedRows = [];

    dataRows.forEach((rawRow, idx) => {
        const excelRow = Number.isInteger(rawRow?.__rowNum__) ? rawRow.__rowNum__ + 1 : idx + 2;
        const normalizedRow = {};
        let hasAnyText = false;

        Object.entries(rawRow || {}).forEach(([k, v]) => {
            const key = String(k).toLowerCase().trim();
            normalizedRow[key] = v;
            if (
                v !== undefined &&
                v !== null &&
                String(v).trim() !== '' &&
                !key.startsWith('gambar pendukung')
            ) {
                hasAnyText = true;
            }
        });

        const embeddedImg = rowImages[excelRow];

        // Abaikan baris yang benar-benar kosong
        if (!hasAnyText && !embeddedImg) {
            return;
        }

        if (embeddedImg?.error) {
            skippedRows.push(`Baris ${excelRow}: ${embeddedImg.error}`);
            return;
        }

        const rawMapel = getRowField(normalizedRow, [
            'mata pelajaran',
            'nama mata pelajaran',
            'nama_mapel',
            'nama mapel',
            'mapel',
        ]);
        const rawIdMapel = getRowField(normalizedRow, ['id_mapel', 'id mapel']);

        let resolvedId = null;
        if (rawMapel !== undefined) {
            const key = String(rawMapel).trim().toLowerCase();
            resolvedId = mapelLookup[key] || null;
            if (!resolvedId) {
                skippedRows.push(
                    isGuru
                        ? `Baris ${excelRow}: Mata Pelajaran '${rawMapel}' tidak ditemukan atau Anda tidak mengampu mata pelajaran ini.`
                        : `Baris ${excelRow}: Mata Pelajaran '${rawMapel}' tidak ditemukan.`
                );
                return;
            }
        } else if (rawIdMapel !== undefined) {
            resolvedId = parseInt(rawIdMapel, 10);
        }

        if (!resolvedId) {
            skippedRows.push(`Baris ${excelRow}: Kolom 'Mata Pelajaran' kosong.`);
            return;
        }

        const isiSoal = getRowField(normalizedRow, ['isi soal', 'isi_soal', 'pertanyaan', 'soal']);
        if (isiSoal === undefined || String(isiSoal).trim() === '') {
            skippedRows.push(`Baris ${excelRow}: Kolom 'Isi Soal' kosong.`);
            return;
        }

        const kunciJawaban = getRowField(normalizedRow, ['kunci jawaban', 'kunci_jawaban', 'kunci']);
        if (kunciJawaban === undefined || String(kunciJawaban).trim() === '') {
            skippedRows.push(`Baris ${excelRow}: Kolom 'Kunci Jawaban' kosong.`);
            return;
        }

        const rawJenis = getRowField(normalizedRow, ['jenis soal', 'jenis_soal', 'tipe soal']);
        const jenisSoal = normalizeJenisSoal(rawJenis);

        const rawTopik = getRowField(normalizedRow, ['topik materi', 'topik_materi', 'topik', 'materi']);
        const topikMateri = rawTopik !== undefined ? String(rawTopik).trim() : 'Umum';

        const rawPaket = getRowField(normalizedRow, [
            'paket soal (opsional)',
            'paket soal',
            'paket_soal',
            'kode paket',
            'nama paket',
            'paket',
        ]);
        const rowPaket = rawPaket !== undefined && String(rawPaket).trim() !== '' ? String(rawPaket).trim() : '';
        const fallbackPaket = defaultPaket ? String(defaultPaket).trim() : '';
        const paketSoal = rowPaket || fallbackPaket || null;

        const rawLevel = getRowField(normalizedRow, [
            'level kognitif bloom',
            'level kognitif',
            'level_kognitif',
            'level bloom',
            'bloom',
        ]);
        const levelKognitif = normalizeLevelKognitif(rawLevel);

        const opsi = [];
        const opsiA = getRowField(normalizedRow, ['opsi a', 'opsi_a', 'pilihan a']);
        const opsiB = getRowField(normalizedRow, ['opsi b', 'opsi_b', 'pilihan b']);
        const opsiC = getRowField(normalizedRow, ['opsi c', 'opsi_c', 'pilihan c']);
        const opsiD = getRowField(normalizedRow, ['opsi d', 'opsi_d', 'pilihan d']);
        const opsiE = getRowField(normalizedRow, ['opsi e', 'opsi_e', 'pilihan e']);

        if (opsiA !== undefined) opsi.push(String(opsiA).trim());
        if (opsiB !== undefined) opsi.push(String(opsiB).trim());
        if (opsiC !== undefined) opsi.push(String(opsiC).trim());
        if (opsiD !== undefined) opsi.push(String(opsiD).trim());
        if (opsiE !== undefined) opsi.push(String(opsiE).trim());

        const rawKeywords = getRowField(normalizedRow, [
            'kata kunci penilaian ai',
            'kata kunci penilaian ai (satu per baris / pisah koma)',
            'kata kunci ai',
            'kata kunci',
            'keywords',
            'keyword',
        ]);
        let keywords = [];
        if (rawKeywords !== undefined) {
            keywords = String(rawKeywords)
                .split(/[\r\n,]+/)
                .map((s) => s.trim())
                .filter(Boolean);
        }

        const rawRuleWeight = getRowField(normalizedRow, [
            'bobot aturan (rule-based)',
            'bobot aturan',
            'rule_weight',
            'rule weight',
        ]);
        const rawLsaWeight = getRowField(normalizedRow, [
            'bobot makna (lsa)',
            'bobot makna',
            'lsa_weight',
            'lsa weight',
        ]);
        const rawTgate = getRowField(normalizedRow, [
            'ambang minimal kata kunci / tgate (%)',
            'ambang minimal kata kunci (%)',
            'ambang minimal kata kunci',
            'tgate (%)',
            'tgate',
        ]);
        const rawRequiredKeywordsCount = getRowField(normalizedRow, [
            'target minimal kata kunci (opsional)',
            'target minimal kata kunci',
            'required_keywords_count',
            'required keywords count',
        ]);
        const rawMathSteps = getRowField(normalizedRow, [
            'langkah matematis (opsional)',
            'langkah matematis',
            'math_steps',
            'math steps',
        ]);
        const rawMathWeight = getRowField(normalizedRow, [
            'bobot matematika (sympy)',
            'bobot matematika / sympy (opsional)',
            'bobot matematika',
            'math_weight',
            'math weight',
        ]);

        let mathSteps = null;
        if (rawMathSteps !== undefined) {
            const parsedSteps = String(rawMathSteps)
                .split(/[\r\n]+/)
                .map((s) => s.trim())
                .filter(Boolean);
            if (parsedSteps.length > 0) {
                mathSteps = parsedSteps;
            }
        }

        const parsedRequiredCount =
            rawRequiredKeywordsCount !== undefined && String(rawRequiredKeywordsCount).trim() !== ''
                ? parseInt(String(rawRequiredKeywordsCount).trim(), 10)
                : null;

        if (!mapelGroup[resolvedId]) mapelGroup[resolvedId] = [];

        mapelGroup[resolvedId].push({
            isi_soal: String(isiSoal).trim(),
            jenis_soal: jenisSoal,
            kunci_jawaban: String(kunciJawaban).trim(),
            topik_materi: topikMateri,
            paket_soal: paketSoal,
            level_kognitif: levelKognitif,
            opsi_jawaban: opsi,
            gambar_soal_base64: embeddedImg?.dataUrl || null,
            keywords,
            rule_weight: parseDecimal(rawRuleWeight, 0),
            lsa_weight: parseDecimal(rawLsaWeight, 0),
            tgate: parseDecimal(rawTgate, 0),
            required_keywords_count: Number.isFinite(parsedRequiredCount) && parsedRequiredCount > 0 ? parsedRequiredCount : null,
            math_steps: mathSteps,
            math_weight: parseDecimal(rawMathWeight, 0),
        });
    });

    return { mapelGroup, skippedRows };
}
