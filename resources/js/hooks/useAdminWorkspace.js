import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';

export default function useAdminWorkspace(session, options = { loadMasterData: true }) {
    const [summary, setSummary] = useState(null);
    const [masterData, setMasterData] = useState({
        tahun_ajaran: [],
        kelas: [],
        mata_pelajaran: [],
        kelas_siswa: [],
        penugasan_pembelajaran: [],
        guru_options: [],
        siswa_options: [],
    });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = useCallback(async (mounted = true) => {
        if (!session?.token) return;
        
        try {
            setLoading(true);
            setError('');

            const promises = [];
            
            promises.push(
                options.loadMasterData 
                    ? apiFetch('/api/admin/master-data', session)
                    : Promise.resolve(null)
            );

            promises.push(
                options.loadSummary 
                    ? apiFetch('/api/admin/dashboard-summary', session)
                    : Promise.resolve(null)
            );

            const [masterPayload, summaryPayload] = await Promise.all(promises);

            if (!mounted) return;

            if (masterPayload) {
                setMasterData(masterPayload);
            }
            if (summaryPayload) {
                setSummary(summaryPayload);
            }
        } catch (err) {
            if (mounted) setError(err.message || 'Gagal memuat data admin.');
        } finally {
            if (mounted) setLoading(false);
        }
    }, [session, options.loadMasterData, options.loadSummary]);

    useEffect(() => {
        let mounted = true;
        loadData(mounted);
        return () => {
            mounted = false;
        };
    }, [loadData]);

    const reloadWorkspace = async () => {
        await loadData(true);
    };

    return {
        summary,
        masterData,
        loading,
        error,
        reloadWorkspace
    };
}
