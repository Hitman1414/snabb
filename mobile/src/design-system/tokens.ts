/**
 * Design System Tokens
 * Comprehensive design tokens for colors, spacing, typography, and more
 * Supports light and dark themes
 */

export const colors = {
    light: {
        // Primary - Vibrant Orange (Matches Dark Mode's Coral/Orange aesthetic)
        primary: '#F97316',
        primaryDark: '#EA580C',
        primaryLight: '#FFEDD5',

        // Secondary - Sophisticated Blue (Matches Dark Mode's Blue accent)
        secondary: '#3B82F6',
        secondaryDark: '#2563EB',
        secondaryLight: '#DBEAFE',

        // Background - Clean and Airy
        background: '#FFFFFF',
        backgroundSecondary: '#F8FAFC', // Slate 50
        surface: '#FFFFFF',
        surfaceElevated: '#FFFFFF',
        surfaceVariant: '#F1F5F9', // Slate 100

        // Text - High Legibility
        text: '#0F172A', // Slate 900
        textSecondary: '#475569', // Slate 600
        textTertiary: '#94A3B8', // Slate 400
        textInverse: '#FFFFFF',

        // Status - Vibrant
        success: '#1AB64F',
        successLight: '#E8F8EE',
        error: '#FF3B30',
        errorLight: '#FFF0F0',
        warning: '#FF9500',
        warningLight: '#FFF7E6',
        info: '#007AFF',
        infoLight: '#E5F1FF',

        // UI Elements
        border: '#E8EBF0',
        borderLight: '#F3F5F7',
        divider: '#EAEEF2',
        overlay: 'rgba(0, 0, 0, 0.4)',
        shadow: 'rgba(0, 0, 0, 0.06)',

        // Interactive
        link: '#007AFF',
        linkHover: '#0056B3',

        // Premium Details
        accentGreen: '#34C759',
        accentPink: '#FF2D55',
        accentPurple: '#AF52DE',
    },

    dark: {
        // Primary
        primary: '#FF8A5C',
        primaryDark: '#FF6B35',
        primaryLight: '#FFA07A',

        // Secondary
        secondary: '#1A6BA8',
        secondaryDark: '#004E89',
        secondaryLight: '#3B8DC9',

        // Background
        background: '#0F172A',
        backgroundSecondary: '#1E293B',
        surface: '#1E293B',
        surfaceElevated: '#334155',
        surfaceVariant: '#334155',

        // Text
        text: '#F1F5F9',
        textSecondary: '#94A3B8',
        textTertiary: '#64748B',
        textInverse: '#0F172A',

        // Status
        success: '#34D399',
        successLight: '#064E3B',
        error: '#F87171',
        errorLight: '#7F1D1D',
        warning: '#FBBF24',
        warningLight: '#78350F',
        info: '#60A5FA',
        infoLight: '#1E3A8A',

        // UI Elements
        border: '#334155',
        borderLight: '#475569',
        divider: '#334155',
        overlay: 'rgba(0, 0, 0, 0.7)',
        shadow: 'rgba(0, 0, 0, 0.3)',

        // Interactive
        link: '#60A5FA',
        linkHover: '#93C5FD',

        // Food-specific
        foodRating: '#FBBF24',
        discount: '#EF4444',
        delivery: '#10B981',
    },
};

// Spacing scale (4px base)
export const spacing = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
};

// Typography
export const typography = {
    fontFamily: {
        regular: 'Inter-Regular',
        medium: 'Inter-Medium',
        semibold: 'Inter-SemiBold',
        bold: 'Inter-Bold',
    },
    fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
    },
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
        extrabold: '800' as const,
    },
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
};

// Border radius - More rounded for a modern feel
export const borderRadius = {
    none: 0,
    sm: 6,
    base: 12,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    full: 9999,
};

// Elevation (shadows) - Much softer and multi-layered for "premium" look
export const elevation = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 2,
    },
    base: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 4,
    },
    md: {
        shadowColor: '#475569',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 8,
    },
    lg: {
        shadowColor: '#475569',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 12,
    },
    xl: {
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.12,
        shadowRadius: 30,
        elevation: 16,
    },
};

// Animation durations
export const animation = {
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
};

// Z-index scale
export const zIndex = {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
};

// Breakpoints (for responsive design)
export const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
};

// Export fontSize for convenience
export const fontSize = typography.fontSize;

export type ColorScheme = 'light' | 'dark';

