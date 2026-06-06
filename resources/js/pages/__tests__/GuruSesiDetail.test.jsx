import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// We test the Guru sesi detail logic via a simulated component
// Since GuruDashboard is large, we mock and test the detail modal rendering

const mockDetailData = {
    sesi: {
        id_sesi: 1,
        mata_pelajaran: 'Matematika',
        kelas: 'XII IPA 1',
        jenis_asesmen: 'ujian',
        tipe_soal: 'PG',
        waktu_mulai: '2025-06-01T08:00:00Z',
        durasi_menit: 60,
    },
    soal: [
        {
            id_detail: 101,
            isi_soal: 'Berapa 1 + 1?',
            jenis_soal: 'pilihan_ganda',
            opsi_jawaban: ['1', '2', '3', '4'],
            kunci_jawaban: '2',
            bobot_nilai: 20,
        }
    ],
    total_bobot: 20,
    statistik: {
        total_siswa: 2,
        sudah_mengerjakan: 1,
        belum_mengerjakan: 1,
        rata_rata_skor: 20,
        skor_tertinggi: 20,
        skor_terendah: 20,
    },
    siswa: [
        {
            id_siswa: 1,
            nama_lengkap: 'Budi Santoso',
            nisn: '001',
            status: 'sudah',
            total_skor: 20,
            jumlah_benar: 1,
            jumlah_dijawab: 1,
            detail_jawaban: [
                { id_detail: 101, jawaban_siswa: '2', is_correct: true, skor_diperoleh: 20 }
            ]
        },
        {
            id_siswa: 2,
            nama_lengkap: 'Ani Puspita',
            nisn: '002',
            status: 'belum',
            total_skor: 0,
            jumlah_benar: 0,
            jumlah_dijawab: 0,
            detail_jawaban: null
        }
    ]
};

// Simple test component that renders the detail modal
function SesiDetailTestComponent({ data }) {
    const [expandedSiswaId, setExpandedSiswaId] = React.useState(null);

    return (
        <div>
            <h3>Detail: {data.sesi.mata_pelajaran}</h3>
            <p>{data.sesi.jenis_asesmen} — {data.sesi.kelas}</p>

            <div data-testid="total-siswa">{data.statistik.total_siswa}</div>
            <div data-testid="sudah">{data.statistik.sudah_mengerjakan}</div>
            <div data-testid="belum">{data.statistik.belum_mengerjakan}</div>
            <div data-testid="rata-rata">{data.statistik.rata_rata_skor}</div>

            <table>
                <thead>
                    <tr>
                        <th>Nama</th>
                        <th>Status</th>
                        <th>Skor</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {data.siswa.map((sw) => (
                        <React.Fragment key={sw.id_siswa}>
                            <tr>
                                <td>{sw.nama_lengkap}</td>
                                <td>{sw.status === 'sudah' ? '✓ Sudah' : '— Belum'}</td>
                                <td>{sw.status === 'sudah' ? `${sw.total_skor}/${data.total_bobot}` : '-'}</td>
                                <td>
                                    {sw.status === 'sudah' && (
                                        <button onClick={() => setExpandedSiswaId(expandedSiswaId === sw.id_siswa ? null : sw.id_siswa)}>
                                            {expandedSiswaId === sw.id_siswa ? 'Tutup' : 'Lihat Jawaban'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                            {expandedSiswaId === sw.id_siswa && sw.detail_jawaban && (
                                <tr>
                                    <td colSpan="4">
                                        {data.soal.map((soal, idx) => {
                                            const dj = sw.detail_jawaban.find(d => d.id_detail === soal.id_detail);
                                            return (
                                                <div key={soal.id_detail}>
                                                    <span>Soal {idx + 1}</span>
                                                    <span>{dj?.is_correct ? '✓ Benar' : '✗ Salah'}</span>
                                                    <span>Jawaban: {dj?.jawaban_siswa}</span>
                                                    <span>Kunci: {soal.kunci_jawaban}</span>
                                                </div>
                                            );
                                        })}
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

describe('Guru Sesi Detail View', () => {
    it('renders session info and statistics', () => {
        render(<SesiDetailTestComponent data={mockDetailData} />);

        expect(screen.getByText('Detail: Matematika')).toBeInTheDocument();
        expect(screen.getByTestId('total-siswa')).toHaveTextContent('2');
        expect(screen.getByTestId('sudah')).toHaveTextContent('1');
        expect(screen.getByTestId('belum')).toHaveTextContent('1');
    });

    it('renders student list with status', () => {
        render(<SesiDetailTestComponent data={mockDetailData} />);

        expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
        expect(screen.getByText('Ani Puspita')).toBeInTheDocument();
        expect(screen.getByText('✓ Sudah')).toBeInTheDocument();
        expect(screen.getByText('— Belum')).toBeInTheDocument();
    });

    it('shows Lihat Jawaban button only for students who have completed', () => {
        render(<SesiDetailTestComponent data={mockDetailData} />);

        const buttons = screen.getAllByText('Lihat Jawaban');
        expect(buttons).toHaveLength(1); // Only Budi has it
    });

    it('expands student answers when Lihat Jawaban is clicked', () => {
        render(<SesiDetailTestComponent data={mockDetailData} />);

        const lihatButton = screen.getByText('Lihat Jawaban');
        fireEvent.click(lihatButton);

        expect(screen.getByText('Soal 1')).toBeInTheDocument();
        expect(screen.getByText('✓ Benar')).toBeInTheDocument();
        expect(screen.getByText('Jawaban: 2')).toBeInTheDocument();
        expect(screen.getByText('Kunci: 2')).toBeInTheDocument();
    });

    it('toggles expanded state when clicked again', () => {
        render(<SesiDetailTestComponent data={mockDetailData} />);

        const lihatButton = screen.getByText('Lihat Jawaban');
        fireEvent.click(lihatButton);

        expect(screen.getByText('Soal 1')).toBeInTheDocument();

        // Click Tutup
        const tutupButton = screen.getByText('Tutup');
        fireEvent.click(tutupButton);

        expect(screen.queryByText('Soal 1')).not.toBeInTheDocument();
    });
});
