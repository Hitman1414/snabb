export const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/[\s_-]+/);
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
};
