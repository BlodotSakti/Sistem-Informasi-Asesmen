import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GuruSiswaPage from '../GuruSiswaPage';

// Mock matchMedia for Tailwind/UI components
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

const mockSession = {
    token: 'test-token',
    role: 'guru',
    user: { nama_lengkap: 'Budi Guru' }
};

const mockWorkspaceData = {
    teaching_assignments: [
        { id_kelas: 1, mata_pelajaran: { nama_mapel: 'Matematika' } },
        { id_kelas: 1, mata_pelajaran: { nama_mapel: 'Fisika' } },
        { id_kelas: 2, mata_pelajaran: { nama_mapel: 'Biologi' } }
    ],
    kelas_options: [
        { id_kelas: 1, nama_kelas: 'X IPA 1', tahun_ajaran: '2023/2024' },
        { id_kelas: 2, nama_kelas: 'X IPA 2', tahun_ajaran: '2023/2024' }
    ],
    students_by_class: {
        1: [
            { id_siswa: 101, nama_lengkap: 'Andi Santoso', nisn: '1234567890' },
            { id_siswa: 102, nama_lengkap: 'Budi Raharjo', nisn: '0987654321' }
        ],
        2: []
    }
};

describe('GuruSiswaPage', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        global.fetch = vi.fn();
    });

    it('shows loading state initially', () => {
        global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
        render(<GuruSiswaPage session={mockSession} onLogout={vi.fn()} />);
        expect(screen.getByText(/Memuat data kelas/i)).toBeInTheDocument();
    });

    it('shows error state if API fails', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
        });

        render(<GuruSiswaPage session={mockSession} onLogout={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText(/Terjadi Kesalahan/i)).toBeInTheDocument();
        });
    });

    it('renders workspace data correctly for the active class', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => mockWorkspaceData
        });

        render(<GuruSiswaPage session={mockSession} onLogout={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getAllByText('X IPA 1').length).toBeGreaterThan(0);
        });

        // Check if teacher name is rendered
        expect(screen.getByText('Budi Guru')).toBeInTheDocument();

        // Check mapels for class 1
        expect(screen.getByText('Matematika')).toBeInTheDocument();
        expect(screen.getByText('Fisika')).toBeInTheDocument();

        // Check students for class 1
        expect(screen.getByText('Andi Santoso')).toBeInTheDocument();
        expect(screen.getByText('1234567890')).toBeInTheDocument();
        expect(screen.getByText('Budi Raharjo')).toBeInTheDocument();
        expect(screen.getByText('0987654321')).toBeInTheDocument();
    });

    it('handles empty class gracefully', async () => {
        const emptyData = {
            ...mockWorkspaceData,
            kelas_options: [],
            students_by_class: {},
            teaching_assignments: []
        };

        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => emptyData
        });

        render(<GuruSiswaPage session={mockSession} onLogout={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText(/Tidak Ada Kelas Aktif/i)).toBeInTheDocument();
        });
    });
});
