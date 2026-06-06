import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GuruDashboard from '../GuruDashboard';
import { apiFetch } from '../../lib/api';

vi.mock('../../lib/api', () => ({
    apiFetch: vi.fn()
}));

// Mock window.alert
window.alert = vi.fn();

const mockSession = { token: 'mock-token', user: { role: 'guru' } };
const mockWorkspace = {
    kelas_options: [{ id_kelas: 1, nama_kelas: 'Kelas 10A' }],
    mapel_options: [{ id_mapel: 1, nama_mapel: 'Matematika' }],
    bank_soal: [
        { id_soal: 1, id_mapel: 1, isi_soal: 'Berapa 1+1?', jenis_soal: 'pilihan_ganda_kompleks', kunci_jawaban: '["2","Dua"]', opsi_jawaban: ['2','Dua','3','4'], mata_pelajaran: { nama_mapel: 'Matematika' } }
    ],
    teaching_assignments: [{ id_kelas: 1, id_mapel: 1 }]
};

describe('GuruDashboard - Sesi Asesmen CBT', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiFetch.mockImplementation(async (url) => {
            if (url.includes('dashboard-summary')) return { cards: {}, upcoming_schedules: [] };
            if (url.includes('analisis-diagnostik')) return [];
            if (url.includes('workspace-data')) return mockWorkspace;
            if (url.includes('sesi-asesmen')) return { data: [], current_page: 1, last_page: 1 };
            return {};
        });
    });

    it('renders bank soal table with correct data', async () => {
        render(<GuruDashboard session={mockSession} mode="bank-soal" />);

        // Wait for data to load - look for jenis_soal which is displayed in the table
        await waitFor(() => {
            expect(screen.getByText(/pilihan_ganda_kompleks/i)).toBeInTheDocument();
        });

        // Verify mapel name is displayed (appears in form options + table)
        expect(screen.getAllByText('Matematika').length).toBeGreaterThanOrEqual(1);
        // Verify kunci jawaban is formatted correctly for kompleks type
        expect(screen.getByText('2, Dua')).toBeInTheDocument();
    });

    it('opens jadwal CBT modal from jadwal-cbt page', async () => {
        render(<GuruDashboard session={mockSession} mode="jadwal-cbt" />);

        // Wait for page to load
        await waitFor(() => {
            expect(screen.getByText('Riwayat Jadwal CBT')).toBeInTheDocument();
        });

        // Click Buat Jadwal CBT button
        const btnModal = screen.getByRole('button', { name: /Buat Jadwal CBT/i });
        await userEvent.click(btnModal);

        // Assert modal is open
        expect(screen.getByText('Buat Jadwal Asesmen (CBT)')).toBeInTheDocument();
    });

    it('shows edit and delete buttons for bank soal items', async () => {
        render(<GuruDashboard session={mockSession} mode="bank-soal" />);

        await waitFor(() => {
            expect(screen.getByText(/pilihan_ganda_kompleks/i)).toBeInTheDocument();
        });

        // Verify Edit and Hapus buttons are visible
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Hapus')).toBeInTheDocument();
    });

    it('shows detail button for jadwal CBT items', async () => {
        // Mock with sesi data
        apiFetch.mockImplementation(async (url) => {
            if (url.includes('dashboard-summary')) return { cards: {}, upcoming_schedules: [] };
            if (url.includes('analisis-diagnostik')) return [];
            if (url.includes('workspace-data')) return mockWorkspace;
            if (url.includes('sesi-asesmen')) return {
                data: [
                    {
                        id_sesi: 1,
                        tipe_soal: 'PG',
                        kelas: { nama_kelas: 'Kelas 10A' },
                        mata_pelajaran: { nama_mapel: 'Matematika' },
                        jenis_asesmen: 'ujian',
                        waktu_mulai: '2026-06-10T08:00:00Z',
                        detail_sesi_soal: [{ id_detail: 1 }],
                    }
                ],
                current_page: 1,
                last_page: 1,
            };
            return {};
        });

        render(<GuruDashboard session={mockSession} mode="jadwal-cbt" />);

        await waitFor(() => {
            expect(screen.getByText('Detail')).toBeInTheDocument();
        });

        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Hapus')).toBeInTheDocument();
    });
});
