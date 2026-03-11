import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../design-system/ThemeContext';
import { Typography, SkeletonGroup, EmptyState, Badge } from '../design-system/components';
import { spacing, elevation } from '../design-system/tokens';
import { useInterestedAsks } from '../hooks/useAsks';
import { Ask } from '../types';
import { CATEGORY_ICONS } from '../constants/categories';

export default function InterestedAsksScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    
    const {
        data: asks,
        isLoading,
        refetch,
        isRefetching
    } = useInterestedAsks();

    const handleAskPress = (ask: Ask) => {
        navigation.navigate('AskDetail', { askId: ask.id } as any);
    };

    const renderItem = ({ item }: { item: Ask }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={() => handleAskPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardImage}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons 
                        name={(CATEGORY_ICONS[item.category] as any)?.name || 'document-text-outline'} 
                        size={40} 
                        color={(CATEGORY_ICONS[item.category] as any)?.color || colors.primary} 
                    />
                </View>
                {/* Shortlisted indicator */}
                {item.is_interested && (
                    <View style={styles.shortlistedDot}>
                        <Typography style={{ fontSize: 10 }}>⭐</Typography>
                    </View>
                )}
            </View>

            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Typography variant="h6" weight="bold" numberOfLines={1} style={styles.cardTitle}>
                        {item.title}
                    </Typography>
                    <Badge
                        label={item.status.toUpperCase()}
                        variant={item.status === 'open' ? 'success' : 'outline'}
                        size="sm"
                    />
                </View>

                {/* Shortlisted banner */}
                {item.is_interested && (
                    <View style={styles.shortlistedBanner}>
                        <Typography variant="caption" weight="bold" style={{ color: '#92400E', fontSize: 11 }}>
                            ⭐ Shortlisted by the owner — you're a top pick!
                        </Typography>
                    </View>
                )}

                <Typography variant="caption" color="secondary" numberOfLines={item.is_interested ? 1 : 2}>
                    {item.description}
                </Typography>

                <View style={styles.cardMeta}>
                    <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                    <Typography variant="caption" color="tertiary" style={{ marginLeft: 2 }}>
                        {item.location}
                    </Typography>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.budgetTag}>
                        <Typography variant="caption" weight="bold" color="primary" style={{ color: colors.primaryDark }}>
                            ₹{item.budget_min || 0} - ₹{item.budget_max || 0}
                        </Typography>
                    </View>
                    <Typography variant="caption" color="tertiary">
                        {new Date(item.created_at).toLocaleDateString()}
                    </Typography>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <Typography variant="h3" weight="bold">Interested Asks</Typography>
            <Typography variant="bodySmall" color="secondary">Tasks where you've expressed interest</Typography>
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <View style={{ height: 32, width: '60%', backgroundColor: colors.border, borderRadius: 4, marginBottom: 8 }} />
                    <View style={{ height: 16, width: '80%', backgroundColor: colors.border, borderRadius: 4 }} />
                </View>
                <View style={{ padding: spacing[4] }}>
                    <SkeletonGroup variant="card" count={3} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <FlatList
                data={asks}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing[4] }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={isRefetching} 
                        onRefresh={refetch}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    <EmptyState
                        title="No Interested Asks"
                        description="Asks you mark as 'Interested' will appear here."
                        icon="heart-outline"
                        style={{ marginTop: spacing[10] }}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: spacing[4],
        paddingTop: spacing[6],
        paddingBottom: spacing[4],
    },
    listContent: {
        paddingHorizontal: spacing[4],
        paddingTop: spacing[2],
    },
    card: {
        marginBottom: spacing[4],
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        padding: spacing[3],
        borderWidth: 1,
        borderColor: '#F0F2F5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 4,
    },
    cardImage: {
        width: 90,
        height: 90,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    cardContent: {
        flex: 1,
        paddingLeft: spacing[3],
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitle: {
        flex: 1,
        marginRight: spacing[2],
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing[1],
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    budgetTag: {
        backgroundColor: '#F7C30115',
        paddingHorizontal: spacing[2],
        paddingVertical: 2,
        borderRadius: 6,
    },
    shortlistedBanner: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: spacing[2],
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: spacing[1],
        borderLeftWidth: 3,
        borderLeftColor: '#F59E0B',
    },
    shortlistedDot: {
        position: 'absolute',
        top: -5,
        right: -5,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
});
