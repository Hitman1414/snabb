/**
 * OfflineBanner Component
 * Displays a banner when the app is offline
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../ThemeContext';
import { spacing } from '../tokens';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../../contexts/OfflineContext';

export const OfflineBanner: React.FC = () => {
    const { isOnline, queueSize } = useOffline();
    const { colors } = useTheme();

    if (isOnline) return null;

    return (
        <View style={[styles.container, { backgroundColor: colors.error }]}>
            <Ionicons name="cloud-offline" size={16} color={colors.surface} />
            <Typography variant="caption" color="inverse" style={styles.text}>
                No internet connection
                {queueSize > 0 && ` • ${queueSize} pending action${queueSize > 1 ? 's' : ''}`}
            </Typography>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[4],
        gap: spacing[2],
    },
    text: {
        textAlign: 'center',
    },
});
