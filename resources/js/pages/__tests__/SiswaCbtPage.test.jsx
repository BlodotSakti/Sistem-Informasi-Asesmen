import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SiswaCbtPage from '../SiswaCbtPage';

const mockSession = { token: 'mock-token' };

const mockFetchData = {
    sesi: {
        id_sesi: 1,
        waktu_mulai: new Date().toISOString(),
        waktu_selesai: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        durasi_menit: 60,
        mata_pelajaran: 'Matematika',
        jenis_asesmen: 'Ujian Akhir Semester',
        tipe_soal: 'Campuran'
    },
    soal: [
        {
            id_detail: 101,
            jenis_soal: 'pilihan_ganda',
            isi_soal: 'Berapa 1 + 1?',
            opsi_jawaban: ['1', '2', '3', '4'],
            bobot_nilai: 10
        },
        {
            id_detail: 102,
            jenis_soal: 'essay',
            isi_soal: 'Jelaskan teori relativitas',
            bobot_nilai: 20
        }
    ],
    jawaban_tersimpan: []
};

const mockSubmitResponse = {
    message: 'Ujian berhasil disubmit',
    total_skor: 10,
    total_bobot: 30,
    jumlah_soal: 2,
    jumlah_benar: 1,
    jumlah_salah: 1,
    mata_pelajaran: 'Matematika',
    jenis_asesmen: 'Ujian Akhir Semester',
    detail_hasil: [
        {
            id_detail: 101,
            isi_soal: 'Berapa 1 + 1?',
            jenis_soal: 'pilihan_ganda',
            jawaban_siswa: '2',
            kunci_jawaban: '2',
            is_correct: true,
            bobot_nilai: 10,
            skor_diperoleh: 10,
        },
        {
            id_detail: 102,
            isi_soal: 'Jelaskan teori relativitas',
            jenis_soal: 'essay',
            jawaban_siswa: 'E=mc^2',
            kunci_jawaban: '',
            is_correct: false,
            bobot_nilai: 20,
            skor_diperoleh: 0,
        }
    ],
    analisis_diagnostik: {
        id_analisis: 1,
        skor_total: 10,
        narasi_kekuatan: 'Siswa menunjukkan pemahaman yang baik pada soal pilihan ganda.',
        narasi_kelemahan: 'Siswa perlu meningkatkan kemampuan di soal essay.',
        tanggal_generate: '2025-06-01T10:00:00Z',
        rekap_kognitif: {
            C1: { jumlah_soal: 1, jumlah_benar: 1, skor_diperoleh: 10, bobot_total: 10, persentase: 100 },
            C2: { jumlah_soal: 1, jumlah_benar: 0, skor_diperoleh: 0, bobot_total: 20, persentase: 0 },
            C3: { jumlah_soal: 0, jumlah_benar: 0, skor_diperoleh: 0, bobot_total: 0, persentase: 0 },
            C4: { jumlah_soal: 0, jumlah_benar: 0, skor_diperoleh: 0, bobot_total: 0, persentase: 0 },
            C5: { jumlah_soal: 0, jumlah_benar: 0, skor_diperoleh: 0, bobot_total: 0, persentase: 0 },
            C6: { jumlah_soal: 0, jumlah_benar: 0, skor_diperoleh: 0, bobot_total: 0, persentase: 0 },
        },
    },
};

describe('SiswaCbtPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        global.fetch = vi.fn((url) => {
            if (url.includes('/save-answer')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ message: 'Jawaban tersimpan' })
                });
            }
            if (url.includes('/submit')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockSubmitResponse)
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockFetchData)
            });
        });

        global.alert = vi.fn();
        global.confirm = vi.fn(() => true);
        delete window.location;
        window.location = { replace: vi.fn() };
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('renders loading state initially', () => {
        render(<SiswaCbtPage session={mockSession} idSesi={1} onLogout={() => {}} />);
        expect(screen.getByText(/Memuat Soal Ujian.../i)).toBeInTheDocument();
    });

    it('renders questions and allows answering', async () => {
        render(<SiswaCbtPage session={mockSession} idSesi={1} onLogout={() => {}} />);

        await waitFor(() => {
            expect(screen.getByText('Berapa 1 + 1?')).toBeInTheDocument();
        });

        const option2 = screen.getByDisplayValue('2');
        fireEvent.click(option2);
        expect(option2).toBeChecked();

        const nextButton = screen.getByText(/Selanjutnya/i);
        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText('Jelaskan teori relativitas')).toBeInTheDocument();
        });

        const textarea = screen.getByPlaceholderText(/Ketikkan jawaban essay Anda di sini.../i);
        fireEvent.change(textarea, { target: { value: 'E=mc^2' } });
        expect(textarea.value).toBe('E=mc^2');
    });

    it('saves answers to localStorage when answering', async () => {
        render(<SiswaCbtPage session={mockSession} idSesi={1} onLogout={() => {}} />);

        await waitFor(() => {
            expect(screen.getByText('Berapa 1 + 1?')).toBeInTheDocument();
        });

        const option2 = screen.getByDisplayValue('2');
        fireEvent.click(option2);

        // Check localStorage was updated
        await waitFor(() => {
            const stored = JSON.parse(localStorage.getItem('cbt-jawaban-1') || '{}');
            expect(stored['101']).toBe('2');
        });
    });

    it('restores answers from localStorage on mount', async () => {
        // Pre-populate localStorage
        localStorage.setItem('cbt-jawaban-1', JSON.stringify({ '101': '3' }));

        render(<SiswaCbtPage session={mockSession} idSesi={1} onLogout={() => {}} />);

        await waitFor(() => {
            expect(screen.getByText('Berapa 1 + 1?')).toBeInTheDocument();
        });

        // Option '3' should be selected from localStorage
        const option3 = screen.getByDisplayValue('3');
        expect(option3).toBeChecked();
    });

    it('shows result screen after submit', async () => {
        render(<SiswaCbtPage session={mockSession} idSesi={1} onLogout={() => {}} />);

        await waitFor(() => {
            expect(screen.getByText('Kumpulkan Jawaban')).toBeInTheDocument();
        });

        const kumpulButton = screen.getByText('Kumpulkan Jawaban');
        fireEvent.click(kumpulButton);

        await waitFor(() => {
            expect(screen.getByText('Selesai Ujian')).toBeInTheDocument();
        });

        const finishButton = screen.getByText('Selesai Ujian');
        fireEvent.click(finishButton);

        expect(global.confirm).toHaveBeenCalled();

        await waitFor(() => {
            expect(screen.getByText('Ujian Selesai!')).toBeInTheDocument();
        });

        // Check score display
        expect(screen.getByText('33.33%')).toBeInTheDocument();
        expect(screen.getByText('10.00')).toBeInTheDocument(); // total_skor
        expect(screen.getByText('Kembali ke Dashboard')).toBeInTheDocument();
    });

    it('clears localStorage after successful submit', async () => {
        localStorage.setItem('cbt-jawaban-1', JSON.stringify({ '101': '2' }));

        render(<SiswaCbtPage session={mockSession} idSesi={1} onLogout={() => {}} />);

        await waitFor(() => {
            expect(screen.getByText('Kumpulkan Jawaban')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Kumpulkan Jawaban'));

        await waitFor(() => {
            expect(screen.getByText('Selesai Ujian')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Selesai Ujian'));

        await waitFor(() => {
            expect(screen.getByText('Ujian Selesai!')).toBeInTheDocument();
        });

        expect(localStorage.getItem('cbt-jawaban-1')).toBeNull();
    });

    it('displays AI diagnostic analysis on result screen', async () => {
        render(<SiswaCbtPage session={mockSession} idSesi={1} onLogout={() => {}} />);

        await waitFor(() => {
            expect(screen.getByText('Kumpulkan Jawaban')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Kumpulkan Jawaban'));

        await waitFor(() => {
            expect(screen.getByText('Selesai Ujian')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Selesai Ujian'));

        await waitFor(() => {
            expect(screen.getByText('Ujian Selesai!')).toBeInTheDocument();
        });

        // Check AI diagnostic card is rendered
        expect(screen.getByText('Laporan Analisis Diagnostik AI')).toBeInTheDocument();
        expect(screen.getByText('Siswa menunjukkan pemahaman yang baik pada soal pilihan ganda.')).toBeInTheDocument();
        expect(screen.getByText('Siswa perlu meningkatkan kemampuan di soal essay.')).toBeInTheDocument();
        expect(screen.getByText('Kekuatan')).toBeInTheDocument();
        expect(screen.getByText('Area Peningkatan')).toBeInTheDocument();
    });
});
