import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

export function useSiswaData(session, options = {}) {
    const { includeActiveSessions = false } = options;

    const [summary, setSummary] = useState(null);
    const [activeSessions, setActiveSessions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                setLoading(true);

                const requests = [apiFetch('/api/siswa/dashboard-summary', session)];

                if (includeActiveSessions) {
                    requests.push(apiFetch('/api/siswa/sesi-asesmen/aktif', session));
                }

                const [summaryPayload, sessionsPayload] = await Promise.all(requests);

                if (mounted) {
                    setSummary(summaryPayload);

                    if (includeActiveSessions) {
                        setActiveSessions(sessionsPayload);
                    }
                }
            } catch (exception) {
                if (mounted) {
                    setError(exception.message || 'Gagal memuat data siswa.');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        if (session?.token) {
            load();
        }

        return () => {
            mounted = false;
        };
    }, [includeActiveSessions, session]);

    return {
        summary,
        activeSessions,
        loading,
        error,
        setSummary,
        setActiveSessions,
    };
}