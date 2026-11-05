export function apiBase(path) {
    return `${window.location.origin}${path}`;
}

export function getMediaUrl(path) {
    if (!path) return '';
    if (typeof path !== 'string') return '';
    if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    return `/storage/${path}`;
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
        let message = 'Request gagal.';
        if (typeof payload === 'string') {
            message = payload;
        } else if (payload?.errors && typeof payload.errors === 'object') {
            const firstKey = Object.keys(payload.errors)[0];
            const errVal = payload.errors[firstKey];
            message = Array.isArray(errVal) ? errVal[0] : (payload.message || 'Validasi gagal.');
        } else if (payload?.message) {
            message = payload.message;
        } else if (payload?.error) {
            message = payload.error;
        }
        throw new Error(message);
    }

    return payload;
}
