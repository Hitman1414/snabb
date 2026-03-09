/**
 * Offline Notice Component
 * Shows banner when device is offline with sync status
 */
import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../ThemeContext';
import { spacing } from '../tokens';

interface OfflineNoticeProps {
    isOnline: boolean;
    queueSize?: number;
    syncInProgress?: boolean;
}

export const OfflineNotice: React.FC<OfflineNoticeProps> = ({
    isOnline,
    queueSize = 0,
    syncInProgress = false
}) => {
    const { colors } = useTheme();

    if (isOnline && queueSize === 0) return null;

    const getMessage = () => {
        if (syncInProgress) return 'Syncing...';
        if (!isOnline) return `Offline${queueSize > 0 ? ` • ${queueSize} pending` : ''}`;
        if (queueSize > 0) return `Syncing ${queueSize} items...`;
        return '';
    };

    const backgroundColor = !isOnline ? colors.error : '#F59E0B';

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {syncInProgress && (
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.spinner} />
            )}
            <Typography variant="caption" weight="medium" style={styles.text}>
                {getMessage()}
            </Typography>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[4],
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    text: {
        color: '#FFFFFF',
    },
    spinner: {
        marginRight: spacing[2],
    },
});
