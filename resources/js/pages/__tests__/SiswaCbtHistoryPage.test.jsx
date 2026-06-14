import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SiswaCbtHistoryPage from '../SiswaCbtHistoryPage';

const mockSession = { token: 'mock-token', user: { nama_lengkap: 'Test Siswa', role: 'siswa' } };

const mockHistoryData = {
    data: [
        {
            id_sesi: 1,
            mata_pelajaran: 'Matematika',
            kelas: 'XII IPA 1',
            tipe_soal: 'PG',
            jenis_asesmen: 'ujian',
            waktu_mulai: '2025-06-01T08:00:00Z',
            durasi_menit: 60,
            jumlah_soal: 5,
            jumlah_dijawab: 5,
            jumlah_benar: 3,
            total_skor: 60,
            total_bobot: 100,
            submitted_at: '2025-06-01T09:00:00Z',
            has_analisis: true,
        },
        {
            id_sesi: 2,
            mata_pelajaran: 'Fisika',
            kelas: 'XII IPA 1',
            tipe_soal: 'Essay',
            jenis_asesmen: 'pretest',
            waktu_mulai: '2025-06-02T08:00:00Z',
            durasi_menit: 45,
            jumlah_soal: 3,
            jumlah_dijawab: 3,
            jumlah_benar: 1,
            total_skor: 30,
            total_bobot: 100,
            submitted_at: '2025-06-02T08:45:00Z',
            has_analisis: false,
        }
    ]
};

const mockReviewData = {
    sesi: {
        id_sesi: 1,
        mata_pelajaran: 'Matematika',
        kelas: 'XII IPA 1',
        jenis_asesmen: 'ujian',
        tipe_soal: 'PG',
        waktu_mulai: '2025-06-01T08:00:00Z',
        durasi_menit: 60,
    },
    total_skor: 60,
    total_bobot: 100,
    jumlah_benar: 3,
    jumlah_soal: 5,
    soal: [
        {
            id_detail: 101,
            isi_soal: 'Berapa 1 + 1?',
            jenis_soal: 'pilihan_ganda',
            opsi_jawaban: ['1', '2', '3', '4'],
            kunci_jawaban: '2',
            bobot_nilai: 20,
            jawaban_siswa: '2',
            is_correct: true,
            skor_diperoleh: 20,
        },
    ],
    analisis_diagnostik: {
        id_analisis: 1,
        skor_total: 60,
        narasi_kekuatan: 'Pemahaman dasar aritmatika siswa sangat baik.',
        narasi_kelemahan: 'Perlu latihan soal cerita yang lebih kompleks.',
        tanggal_generate: '2025-06-01T09:05:00Z',
        rekap_kognitif: {
            C1: { jumlah_soal: 1, jumlah_benar: 1, skor_diperoleh: 20, bobot_total: 20, persentase: 100 },
        },
    },
};

// Mock apiFetch
vi.mock('../../lib/api', () => ({
    apiFetch: vi.fn((url) => {
        if (url.includes('/review')) {
            return Promise.resolve(mockReviewData);
        }
        return Promise.resolve(mockHistoryData);
    }),
}));

// Mock DashboardLayout
vi.mock('../../components/layout/DashboardLayout', () => ({
    default: ({ children, title }) => <div data-testid="layout"><h1>{title}</h1>{children}</div>,
}));

// Mock StatCard
vi.mock('../../components/ui/StatCard', () => ({
    default: ({ label, value }) => <div data-testid={`stat-${label}`}>{label}: {value}</div>,
}));

describe('SiswaCbtHistoryPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.alert = vi.fn();
    });

    it('renders history page with title', async () => {
        render(<SiswaCbtHistoryPage session={mockSession} onLogout={() => {}} />);

        await waitFor(() => {
            expect(screen.getByText('Riwayat CBT')).toBeInTheDocument();
        });
    });

    it('displays CBT history items', async () => {
        render(<SiswaCbtHistoryPage session={mockSession} onLogout={() => {}} />);

        await waitFor(() => {
            expect(screen.getByText('Matematika')).toBeInTheDocument();
            expect(screen.getByText('Fisika')).toBeInTheDocument();
        });
    });

    it('shows score with percentage badges', async () => {
        render(<SiswaCbtHistoryPage session={mockSession} onLogout={() => {}} />);

        await waitFor(() => {
            expect(screen.getByText('60.00/100 (60%)')).toBeInTheDocument();
            expect(screen.getByText('30.00/100 (30%)')).toBeInTheDocument();
        });
    });

    it('opens review modal when Review button is clicked', async () => {
        render(<SiswaCbtHistoryPage session={mockSession} onLogout={() => {}} />);

        await waitFor(() => {
            expect(screen.getAllByText('Review').length).toBeGreaterThan(0);
        });

        const reviewButtons = screen.getAllByText('Review');
        fireEvent.click(reviewButtons[0]);

        await waitFor(() => {
            expect(screen.getByText(/Review: Matematika/i)).toBeInTheDocument();
        });

        // Check soal is shown
        expect(screen.getByText('Berapa 1 + 1?')).toBeInTheDocument();
        expect(screen.getByText(/✓ Benar/)).toBeInTheDocument();
    });

    it('filters history by search term', async () => {
        render(<SiswaCbtHistoryPage session={mockSession} onLogout={() => {}} />);

        await waitFor(() => {
            expect(screen.getByText('Matematika')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/Mapel, kelas, jenis.../i);
        fireEvent.change(searchInput, { target: { value: 'Fisika' } });

        expect(screen.queryByText('Matematika')).not.toBeInTheDocument();
        expect(screen.getByText('Fisika')).toBeInTheDocument();
    });

    it('shows AI badge on history items with analisis and renders AI card in review', async () => {
        render(<SiswaCbtHistoryPage session={mockSession} onLogout={() => {}} />);

        await waitFor(() => {
            expect(screen.getByText('Matematika')).toBeInTheDocument();
        });

        // Check AI badge exists for Matematika (has_analisis: true)
        expect(screen.getByText('🤖 AI')).toBeInTheDocument();

        // Open review
        const reviewButtons = screen.getAllByText('Review');
        fireEvent.click(reviewButtons[0]);

        await waitFor(() => {
            expect(screen.getByText(/Review: Matematika/i)).toBeInTheDocument();
        });

        // Check AI diagnostik card is rendered in review
        expect(screen.getByText('Laporan Analisis Diagnostik AI')).toBeInTheDocument();
        expect(screen.getByText('Pemahaman dasar aritmatika siswa sangat baik.')).toBeInTheDocument();
        expect(screen.getByText('Perlu latihan soal cerita yang lebih kompleks.')).toBeInTheDocument();
    });
});
