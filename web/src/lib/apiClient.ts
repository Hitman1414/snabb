/**
 * Centralised API client for the web app.
 *
 * - Reads NEXT_PUBLIC_API_URL from env (falls back to prod URL)
 * - Relies on HttpOnly cookies for authentication
 * - Redirects to /login on 401
 * - Reports unexpected errors to Sentry
 */
import * as Sentry from '@sentry/nextjs';

export const API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'https://snabb-api.onrender.com';

export const getFullImageUrl = (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

type RequestOptions = Omit<RequestInit, 'body'> & {
    body?: unknown;
    /** Skip the Authorization header (e.g. login, register) */
    public?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, public: isPublic, ...init } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Client-Platform': 'web',
        ...(init.headers as Record<string, string> ?? {}),
    };

    if (!isPublic) {
        // Token is handled via HttpOnly cookies by the backend
    }

    const res = await fetch(`${API_URL}${path}`, { credentials: "include", 
        ...init,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && typeof window !== 'undefined') {
        window.location.href = '/login';
        return undefined as unknown as T;
    }

    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        const err = new Error(`API ${res.status}: ${text}`);
        Sentry.captureException(err, { extra: { path, status: res.status } });
        throw err;
    }

    // 204 No Content
    if (res.status === 204) return undefined as unknown as T;

    return res.json() as Promise<T>;
}

export const apiClient = {
    get: <T>(path: string, options?: RequestOptions) =>
        request<T>(path, { ...options, method: 'GET' }),

    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>(path, { ...options, method: 'POST', body }),

    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>(path, { ...options, method: 'PATCH', body }),

    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>(path, { ...options, method: 'PUT', body }),

    delete: <T>(path: string, options?: RequestOptions) =>
        request<T>(path, { ...options, method: 'DELETE' }),

    /** Multipart file upload — caller constructs the FormData */
    upload: <T>(path: string, formData: FormData, options?: RequestOptions) =>
        request<T>(path, {
            ...options,
            method: 'POST',
            headers: { 'X-Client-Platform': 'web' },  // no Content-Type so browser sets boundary
            body: formData as unknown,
        }),
};
