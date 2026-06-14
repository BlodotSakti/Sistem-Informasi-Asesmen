import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SiswaTrendPage from '../SiswaTrendPage';
import { useSiswaData } from '../siswa/useSiswaData';

// Mock dependencies
vi.mock('../siswa/useSiswaData', () => ({
    useSiswaData: vi.fn(),
}));

vi.mock('../../components/layout/DashboardLayout', () => ({
    default: ({ children, title }) => <div data-testid="layout"><h1>{title}</h1>{children}</div>,
}));

vi.mock('../../components/ui/StatCard', () => ({
    default: ({ label, value }) => <div data-testid={`stat-${label}`}>{label}: {value}</div>,
}));

// Mock recharts to avoid ResizeObserver issues in JSDOM
vi.mock('recharts', () => {
    const OriginalModule = vi.importActual('recharts');
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }) => <div data-testid="responsive-container" style={{ width: '100%', height: '300px' }}>{children}</div>,
        AreaChart: ({ children, data }) => <div data-testid="area-chart" data-count={data?.length || 0}>{children}</div>,
        Area: () => <div data-testid="area" />,
        XAxis: () => <div data-testid="x-axis" />,
        YAxis: () => <div data-testid="y-axis" />,
        CartesianGrid: () => <div data-testid="cartesian-grid" />,
        Tooltip: () => <div data-testid="tooltip" />,
    };
});

describe('SiswaTrendPage Component', () => {
    const mockSession = { user: { name: 'Siswa Test' } };
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state correctly', () => {
        useSiswaData.mockReturnValue({
            summary: null,
            loading: true,
            error: null,
        });

        render(<SiswaTrendPage session={mockSession} onLogout={mockLogout} />);
        expect(screen.getByText('Tren Nilai')).toBeInTheDocument();
        expect(screen.getByText('Tren perkembangan akademik')).toBeInTheDocument();
        expect(screen.getByTestId('stat-Rata-rata')).toHaveTextContent('Rata-rata: ...');
    });

    it('renders error message', () => {
        useSiswaData.mockReturnValue({
            summary: null,
            loading: false,
            error: 'Gagal memuat data tren.',
        });

        render(<SiswaTrendPage session={mockSession} onLogout={mockLogout} />);
        expect(screen.getByText('Gagal memuat data tren.')).toBeInTheDocument();
    });

    it('renders chart and table with data', () => {
        useSiswaData.mockReturnValue({
            summary: {
                cards: { rata_rata: 85, tugas_aktif: 2, apresiasi: 5, ujian_menunggu: 1 },
                trend: [
                    { label: 'Jan', value: 80 },
                    { label: 'Feb', value: 90 },
                ],
            },
            loading: false,
            error: null,
        });

        render(<SiswaTrendPage session={mockSession} onLogout={mockLogout} />);
        
        // Stats
        expect(screen.getByTestId('stat-Rata-rata')).toHaveTextContent('Rata-rata: 85');
        
        // Chart
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
        expect(screen.getByTestId('area-chart')).toHaveAttribute('data-count', '2');
        
        // Table
        expect(screen.getByText('Jan')).toBeInTheDocument();
        expect(screen.getByText('80')).toBeInTheDocument();
        expect(screen.getByText('Feb')).toBeInTheDocument();
        expect(screen.getByText('90')).toBeInTheDocument();
    });

    it('filters trend data via search input', () => {
        useSiswaData.mockReturnValue({
            summary: {
                trend: [
                    { label: 'Ujian Akhir', value: 95 },
                    { label: 'Kuis 1', value: 70 },
                ],
            },
            loading: false,
            error: null,
        });

        render(<SiswaTrendPage session={mockSession} onLogout={mockLogout} />);
        
        // Initially both are visible
        expect(screen.getByText('Ujian Akhir')).toBeInTheDocument();
        expect(screen.getByText('Kuis 1')).toBeInTheDocument();

        // Search for 'akhir'
        const input = screen.getByPlaceholderText('Label periode atau nilai');
        fireEvent.change(input, { target: { value: 'akhir' } });

        expect(screen.getByText('Ujian Akhir')).toBeInTheDocument();
        expect(screen.queryByText('Kuis 1')).not.toBeInTheDocument();
        
        // Chart also gets filtered
        expect(screen.getByTestId('area-chart')).toHaveAttribute('data-count', '1');
    });

    it('shows empty state when no data matches', () => {
        useSiswaData.mockReturnValue({
            summary: {
                trend: [],
            },
            loading: false,
            error: null,
        });

        render(<SiswaTrendPage session={mockSession} onLogout={mockLogout} />);
        expect(screen.getAllByText('Belum ada data tren nilai yang sesuai.')[0]).toBeInTheDocument();
    });
});
