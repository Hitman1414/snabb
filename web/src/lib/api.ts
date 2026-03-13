export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const getFullImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
