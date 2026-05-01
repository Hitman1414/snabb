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

const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    return `${Math.floor(diffInMonths / 12)}y ago`;
};

const getCurrencySymbol = (location?: string) => {
    const loc = location?.toLowerCase() || '';
    if (loc.includes('uk') || loc.includes('london') || loc.includes('england')) return '£';
    if (loc.includes('europe') || loc.includes('france') || loc.includes('germany') || loc.includes('italy') || loc.includes('spain')) return '€';
    if (loc.includes('india') || loc.includes('delhi') || loc.includes('mumbai') || loc.includes('bangalore')) return '₹';
    if (loc.includes('japan') || loc.includes('tokyo')) return '¥';
    return '$'; // default currency
};

export const AskCard: React.FC<AskCardProps> = ({ ask, onPress }) => {
    const { colors } = useTheme();
    const formattedDate = formatRelativeTime(ask.created_at);
    const currencySymbol = getCurrencySymbol(ask.location);

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
                        <Typography variant="caption" color="tertiary" style={{ marginLeft: 2, marginRight: 8 }}>
                            {ask.location}
                        </Typography>
                        <Typography variant="caption" weight="bold" style={{ color: colors.info }}>
                            • {ask.category}
                        </Typography>
                    </View>
                    <Typography variant="caption" color="tertiary">
                        {formattedDate}
                    </Typography>
                </View>

                <View style={styles.bottomRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                            <Typography variant="caption" weight="bold" style={{ color: colors.textSecondary, fontSize: 10 }}>
                                {ask.user?.username ? ask.user.username.charAt(0).toUpperCase() : 'U'}
                            </Typography>
                        </View>
                        <Typography variant="caption" weight="bold" style={{ marginLeft: 6, marginRight: 6 }}>
                            {ask.user?.username || 'Anonymous'}
                        </Typography>
                        {ask.user?.is_pro && (
                            <View style={[styles.proBadge, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '10' }]}>
                                <Typography variant="caption" style={{ color: colors.primary, fontSize: 8, fontWeight: '900' }}>
                                    PRO
                                </Typography>
                            </View>
                        )}
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.responseBadge, { backgroundColor: colors.primary + '10', marginRight: 8 }]}>
                            <Ionicons name="chatbubble-outline" size={11} color={colors.primary} style={{ marginRight: 4 }} />
                            <Typography variant="caption" weight="bold" color="primary" style={{ fontSize: 11 }}>
                                {ask.response_count || 0}
                            </Typography>
                        </View>
                        <View style={[styles.budgetBadge, { backgroundColor: colors.primary + '15' }]}>
                            <Typography variant="caption" weight="bold" color="primary">
                                {currencySymbol}{ask.budget_min} - {currencySymbol}{ask.budget_max}
                            </Typography>
                        </View>
                    </View>
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
    avatarPlaceholder: {
        width: 22,
        height: 22,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F0F2F5',
    },
    proBadge: {
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
        borderWidth: 1,
    },
    responseBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 6,
    },
});
