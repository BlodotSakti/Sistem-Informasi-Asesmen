export function apiBase(path) {
    return `${window.location.origin}${path}`;
}

export async function apiFetch(path, session, options = {}) {
    const isJsonBody = options.body && typeof options.body === 'string' && (options.body.startsWith('{') || options.body.startsWith('['));

    const response = await fetch(apiBase(path), {
        ...options,
        headers: {
            ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
            Accept: 'application/json',
            ...(options.headers || {}),
            ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        },
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('sia-session');
            window.location.replace('/login');
            return;
        }
        const message = typeof payload === 'string' ? payload : payload?.message || 'Request gagal.';
        throw new Error(message);
    }

    return payload;
}