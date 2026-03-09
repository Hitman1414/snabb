/**
 * EmptyState Component
 * Displays placeholder content when no data is available
 */
import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../ThemeContext';
import { spacing } from '../tokens';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps extends ViewProps {
    title: string;
    description?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon = 'file-tray-outline',
    action,
    style,
    ...props
}) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, style]} {...props}>
            <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name={icon} size={48} color={colors.textTertiary} />
            </View>

            <Typography
                variant="h5"
                weight="semibold"
                align="center"
                style={styles.title}
            >
                {title}
            </Typography>

            {description && (
                <Typography
                    variant="body"
                    color="secondary"
                    align="center"
                    style={styles.description}
                >
                    {description}
                </Typography>
            )}

            {action && (
                <View style={styles.actionContainer}>
                    {action}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[6],
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[4],
    },
    title: {
        marginBottom: spacing[2],
    },
    description: {
        maxWidth: 300,
    },
    actionContainer: {
        marginTop: spacing[6],
    },
});
