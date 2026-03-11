/**
 * Theme Context and Hook
 * Provides theme switching and current theme access
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { colors, ColorScheme } from './tokens';

interface ThemeContextType {
    colorScheme: ColorScheme;
    colors: typeof colors.light;
    toggleTheme: () => void;
    setTheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [colorScheme, setColorScheme] = useState<ColorScheme>(
        systemColorScheme === 'dark' ? 'dark' : 'light'
    );

    // Update theme when system theme changes
    useEffect(() => {
        if (systemColorScheme) {
            setColorScheme(systemColorScheme);
        }
    }, [systemColorScheme]);

    const toggleTheme = () => {
        setColorScheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const setTheme = (scheme: ColorScheme) => {
        setColorScheme(scheme);
    };

    const value: ThemeContextType = {
        colorScheme,
        colors: colors[colorScheme],
        toggleTheme,
        setTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
