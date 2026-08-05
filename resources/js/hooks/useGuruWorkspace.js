import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';

export default function useGuruWorkspace(session) {
    const [summary, setSummary] = useState(null);
    const [diagnostics, setDiagnostics] = useState(null);
    const [workspace, setWorkspace] = useState({
        teaching_assignments: [],
        kelas_options: [],
        mapel_options: [],
        students_by_class: {},
        bank_soal: [],
        berita_acara: [],
    });
    const [sesiAsesmenHistory, setSesiAsesmenHistory] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = useCallback(async (mounted = true) => {
        if (!session?.token) return;
        
        try {
            setLoading(true);
            setError('');

            const [summaryPayload, diagnosticsPayload, workspacePayload, sesiPayload] = await Promise.all([
                apiFetch('/api/guru/dashboard-summary', session),
                apiFetch('/api/guru/analisis-diagnostik', session),
                apiFetch('/api/guru/workspace-data', session),
                apiFetch('/api/guru/sesi-asesmen', session),
            ]);

            if (!mounted) return;

            setSummary(summaryPayload);
            setDiagnostics(diagnosticsPayload);
            setWorkspace(workspacePayload || {
                teaching_assignments: [],
                kelas_options: [],
                mapel_options: [],
                students_by_class: {},
                bank_soal: [],
                berita_acara: [],
            });
            setSesiAsesmenHistory(sesiPayload?.data || []);
        } catch (err) {
            if (mounted) setError(err.message || 'Gagal memuat data workspace.');
        } finally {
            if (mounted) setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        let mounted = true;
        loadData(mounted);
        return () => {
            mounted = false;
        };
    }, [loadData]);

    const reloadWorkspace = () => loadData(true);

    return {
        summary,
        diagnostics,
        workspace,
        sesiAsesmenHistory,
        loading,
        error,
        reloadWorkspace,
    };
}
