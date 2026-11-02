import * as XLSX from 'xlsx';

export const BANK_SOAL_EXCEL_HEADERS = [
    'Mata Pelajaran',
    'Isi Soal',
    'Opsi A',
    'Opsi B',
    'Opsi C',
    'Opsi D',
    'Opsi E',
    'Kunci Jawaban',
    'Jenis Soal',
    'Topik Materi',
    'Level Kognitif Bloom',
    'Kata Kunci Penilaian AI',
    'Bobot Aturan (Rule-Based)',
    'Bobot Makna (LSA)',
    'Ambang Minimal Kata Kunci / Tgate (%)',
    'Target Minimal Kata Kunci (Opsional)',
    'Langkah Matematis (Opsional)',
    'Bobot Matematika (SymPy)',
];

export function downloadBankSoalTemplateExcel(filename = 'Template_Import_Soal_SMAN.xlsx') {
    const exampleData = [
        {
            'Mata Pelajaran': 'Bahasa Indonesia (X)',
            'Isi Soal': 'Siapakah penemu bola lampu?',
            'Opsi A': 'Albert Einstein',
            'Opsi B': 'Thomas Edison',
            'Opsi C': 'Nikola Tesla',
            'Opsi D': 'Isaac Newton',
            'Opsi E': 'Galileo Galilei',
            'Kunci Jawaban': 'Thomas Edison',
            'Jenis Soal': 'Pilihan Ganda',
            'Topik Materi': 'Sejarah Penemuan',
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
            'Opsi A': '',
            'Opsi B': '',
            'Opsi C': '',
            'Opsi D': '',
            'Opsi E': '',
            'Kunci Jawaban': 'Majas personifikasi adalah gaya bahasa yang memberikan sifat-sifat manusia kepada benda mati. Contoh: Angin menari-nari di sela dedaunan.',
            'Jenis Soal': 'Esai',
            'Topik Materi': 'Gaya Bahasa',
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
            'Opsi A': 'Python',
            'Opsi B': 'Kobra',
            'Opsi C': 'JavaScript',
            'Opsi D': 'HTML',
            'Opsi E': 'C++',
            'Kunci Jawaban': 'Python, JavaScript, C++',
            'Jenis Soal': 'Pilihan Ganda Kompleks',
            'Topik Materi': 'Informatika',
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
        { wch: 20 }, // Opsi A
        { wch: 20 }, // Opsi B
        { wch: 20 }, // Opsi C
        { wch: 20 }, // Opsi D
        { wch: 20 }, // Opsi E
        { wch: 32 }, // Kunci Jawaban
        { wch: 24 }, // Jenis Soal
        { wch: 22 }, // Topik Materi
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
    const { isGuru = false } = options;
    const mapelLookup = buildMapelLookup(mapelList);
    const mapelGroup = {};
    const skippedRows = [];

    dataRows.forEach((rawRow, idx) => {
        const normalizedRow = {};
        Object.entries(rawRow || {}).forEach(([k, v]) => {
            normalizedRow[String(k).toLowerCase().trim()] = v;
        });

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
                        ? `Baris ${idx + 2}: Mata Pelajaran '${rawMapel}' tidak ditemukan atau Anda tidak mengampu mata pelajaran ini.`
                        : `Baris ${idx + 2}: Mata Pelajaran '${rawMapel}' tidak ditemukan.`
                );
                return;
            }
        } else if (rawIdMapel !== undefined) {
            resolvedId = parseInt(rawIdMapel, 10);
        }

        if (!resolvedId) {
            skippedRows.push(`Baris ${idx + 2}: Kolom 'Mata Pelajaran' kosong.`);
            return;
        }

        const isiSoal = getRowField(normalizedRow, ['isi soal', 'isi_soal', 'pertanyaan', 'soal']);
        if (isiSoal === undefined || String(isiSoal).trim() === '') {
            skippedRows.push(`Baris ${idx + 2}: Kolom 'Isi Soal' kosong.`);
            return;
        }

        const kunciJawaban = getRowField(normalizedRow, ['kunci jawaban', 'kunci_jawaban', 'kunci']);
        if (kunciJawaban === undefined || String(kunciJawaban).trim() === '') {
            skippedRows.push(`Baris ${idx + 2}: Kolom 'Kunci Jawaban' kosong.`);
            return;
        }

        const rawJenis = getRowField(normalizedRow, ['jenis soal', 'jenis_soal', 'tipe soal']);
        const jenisSoal = normalizeJenisSoal(rawJenis);

        const rawTopik = getRowField(normalizedRow, ['topik materi', 'topik_materi', 'topik', 'materi']);
        const topikMateri = rawTopik !== undefined ? String(rawTopik).trim() : 'Umum';

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
            level_kognitif: levelKognitif,
            opsi_jawaban: opsi,
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

