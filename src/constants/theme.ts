export const COLORS = {
    // Primary Colors - Vibrant Snabb Yellow
    primary: '#F7C301', 
    primaryDark: '#D4A700',
    primaryLight: '#FFD738',

    // Secondary Colors - Sophisticated Dark
    secondary: '#1C1C1C',
    secondaryDark: '#080808',
    secondaryLight: '#2D2D2D',

    // Neutral Colors
    background: '#FFFFFF',
    surface: '#F5F7FA',
    surfaceDark: '#EAEEF2',

    // Text Colors
    text: '#121212',
    textSecondary: '#5A6066',
    textLight: '#9BA3AF',

    // Status Colors
    success: '#1AB64F',
    error: '#FF3B30',
    warning: '#FF9500',
    info: '#007AFF',

    // UI Colors
    border: '#E8EBF0',
    divider: '#EAEEF2',
    overlay: 'rgba(0, 0, 0, 0.4)',

    // Additional Accents
    accentGreen: '#34C759',
    accentPink: '#FF2D55',
    accentPurple: '#AF52DE',
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    xxxl: 48,
};

export const FONT_SIZES = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const FONT_WEIGHTS = {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
};

export const BORDER_RADIUS = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    round: 999,
};

export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 4,
    },
    lg: {
        shadowColor: '#475569',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
};

export const ANIMATION = {
    fast: 150,
    normal: 250,
    slow: 500,
};
