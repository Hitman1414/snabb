import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ask } from '../types';
import { Typography, Badge } from '../design-system/components';
import { useTheme } from '../design-system/ThemeContext';
import { spacing, elevation } from '../design-system/tokens';

interface AskCardProps {
    ask: Ask;
    onPress: () => void;
}

export const AskCard: React.FC<AskCardProps> = ({ ask, onPress }) => {
    const { colors } = useTheme();
    const formattedDate = new Date(ask.created_at).toLocaleDateString();

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.background, elevation: 4 }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <Typography variant="h6" weight="bold" numberOfLines={1} style={{ flex: 1 }}>
                        {ask.title}
                    </Typography>
                    <Badge 
                        label={ask.status.toUpperCase()} 
                        variant={ask.status === 'open' ? 'success' : 'outline'} 
                        size="sm" 
                    />
                </View>

                <Typography variant="bodySmall" color="secondary" numberOfLines={2} style={styles.description}>
                    {ask.description}
                </Typography>

                <View style={styles.footer}>
                    <View style={styles.meta}>
                        <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                        <Typography variant="caption" color="tertiary" style={{ marginLeft: 2 }}>
                            {ask.location}
                        </Typography>
                    </View>
                    <Typography variant="caption" color="tertiary">
                        {formattedDate}
                    </Typography>
                </View>

                <View style={styles.bottomRow}>
                    <View style={[styles.budgetBadge, { backgroundColor: colors.primary + '15' }]}>
                        <Typography variant="caption" weight="bold" color="primary">
                            ₹{ask.budget_min} - ₹{ask.budget_max}
                        </Typography>
                    </View>
                    <Typography variant="caption" weight="bold" style={{ color: colors.info }}>
                        {ask.category}
                    </Typography>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        marginBottom: spacing[4],
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F0F2F5',
        ...elevation.base,
    },
    content: {
        padding: spacing[4],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[2],
    },
    description: {
        marginBottom: spacing[3],
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[3],
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing[3],
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
    },
    budgetBadge: {
        paddingHorizontal: spacing[3],
        paddingVertical: 4,
        borderRadius: 8,
    },
});
