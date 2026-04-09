import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useMyAsks } from '../hooks/useAsks';
import { useTheme } from '../design-system/ThemeContext';
import { Typography, Card, SkeletonGroup, Badge, EmptyState } from '../design-system/components';
import { spacing } from '../design-system/tokens';
import { Ask } from '../types';
import { CATEGORY_ICONS } from '../constants/categories';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MyAsksScreen() {
    const navigation = useNavigation<NavigationProp>();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    const {
        data: asks,
        isLoading,
        refetch,
        isRefetching
    } = useMyAsks();

    const handleAskPress = (askId: number) => {
        navigation.navigate('AskDetail', { askId });
    };

    const renderItem = useCallback(({ item }: { item: Ask }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleAskPress(item.id)}
            activeOpacity={0.7}
        >
            <View style={[styles.cardImage, { backgroundColor: colors.surfaceVariant }]}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons 
                        name={(CATEGORY_ICONS[item.category] as any)?.name || 'document-text-outline'} 
                        size={40} 
                        color={(CATEGORY_ICONS[item.category] as any)?.color || colors.primary} 
                    />
                </View>
                {/* Response count badge */}
                {(item.response_count ?? 0) > 0 && (
                    <View style={[styles.responseBadge, { backgroundColor: colors.primary }]}>
                        <Typography variant="caption" weight="bold" style={{ color: '#fff', fontSize: 10 }}>
                            {item.response_count}
                        </Typography>
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

                <Typography variant="caption" color="secondary" numberOfLines={2}>
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
                    {/* Interested / shortlisted count */}
                    {(item.interested_count ?? 0) > 0 ? (
                        <View style={styles.interestedBadge}>
                            <Typography variant="caption" style={{ fontSize: 11 }}>🔥</Typography>
                            <Typography variant="caption" weight="bold" style={{ color: '#D97706', marginLeft: 2, fontSize: 11 }}>
                                {item.interested_count} Shortlisted
                            </Typography>
                        </View>
                    ) : (
                        <View style={styles.responsesInfo}>
                            <Ionicons name="chatbubble-outline" size={11} color={colors.textTertiary} />
                            <Typography variant="caption" color="tertiary" style={{ marginLeft: 3, fontSize: 11 }}>
                                {item.response_count ?? 0} response{(item.response_count ?? 0) !== 1 ? 's' : ''}
                            </Typography>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    ), [colors, handleAskPress]);

    const renderHeader = () => (
        <View style={styles.header}>
            <Typography variant="h3" weight="bold">My Asks</Typography>
            <Typography variant="bodySmall" color="secondary">Manage the tasks you&apos;ve posted</Typography>
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <View style={{ height: 32, width: '50%', backgroundColor: colors.border, borderRadius: 4, marginBottom: 8 }} />
                    <View style={{ height: 16, width: '70%', backgroundColor: colors.border, borderRadius: 4 }} />
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
                contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing[20] }]}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                ListEmptyComponent={
                    <EmptyState
                        title="No Asks Yet"
                        description="You haven&apos;t created any asks yet. Tap the + button to create one!"
                        icon="list-outline"
                        style={{ marginTop: spacing[10] }}
                    />
                }
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={colors.primary}
                    />
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + spacing[4] }]}
                onPress={() => navigation.navigate('CreateAsk')}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>
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
    list: {
        paddingHorizontal: spacing[4],
        paddingTop: spacing[2],
    },
    card: {
        marginBottom: spacing[4],
        borderRadius: 16,
        flexDirection: 'row',
        padding: spacing[3],
        borderWidth: 1,
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
    fab: {
        position: 'absolute',
        right: spacing[6],
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    responseBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    interestedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    responsesInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
