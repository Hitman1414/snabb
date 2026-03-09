/**
 * ErrorBoundary Component
 * Catches UI errors and displays a fallback screen
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Typography } from './Typography';
import { LoadingButton } from './LoadingButton';
import { useTheme } from '../ThemeContext';
import { spacing } from '../tokens';
import { Ionicons } from '@expo/vector-icons';

interface FallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.error} style={{ marginBottom: spacing[4] }} />

            <Typography variant="h4" weight="bold" align="center" style={{ marginBottom: spacing[2] }}>
                Oops! Something went wrong.
            </Typography>

            <Typography variant="body" color="secondary" align="center" style={{ marginBottom: spacing[6], maxWidth: 300 }}>
                {error.message || 'An unexpected error occurred. Please try again.'}
            </Typography>

            <LoadingButton
                title="Try Again"
                onPress={resetErrorBoundary}
                size="lg"
                style={{ minWidth: 200 }}
            />
        </View>
    );
};

export const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ReactErrorBoundary FallbackComponent={ErrorFallback}>
            {children}
        </ReactErrorBoundary>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[6],
    },
});
