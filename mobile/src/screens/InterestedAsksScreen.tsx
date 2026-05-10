import React, { useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../design-system/ThemeContext';
import { Typography, SkeletonGroup, EmptyState, Badge } from '../design-system/components';
import { spacing, elevation } from '../design-system/tokens';
import { useInterestedAsks } from '../hooks/useAsks';
import { Ask } from '../types';
import { CATEGORY_THEMES } from '../constants/categories';

type RootStackParamList = {
    AskDetail: { askId: number };
    [key: string]: any;
};

export default function InterestedAsksScreen() {
    const { colors, colorScheme } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    
    const {
        data: asks,
        isLoading,
        refetch,
        isRefetching
    } = useInterestedAsks();

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleAskPress = (ask: Ask) => {
        navigation.navigate('AskDetail', { askId: ask.id } as any);
    };

    const renderItem = ({ item }: { item: Ask }) => (
        <TouchableOpacity
            style={[
                styles.card, 
                { backgroundColor: colors.surface, borderColor: colors.border },
                viewMode === 'grid' && { flexDirection: 'column', flex: 1, marginHorizontal: spacing[1] }
            ]}
            onPress={() => handleAskPress(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.cardImage, { backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, viewMode === 'grid' && { width: '100%', height: 100, marginBottom: spacing[2] }]}>
                {/* Essence Background Glow */}
                <LinearGradient
                    colors={(CATEGORY_THEMES[item.category] as any)?.gradient || [colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { opacity: colorScheme === 'dark' ? 0.15 : 0.08 }]}
                />
                {/* Watermarks */}
                <Ionicons 
                    name={(CATEGORY_THEMES[item.category] as any)?.name || 'document-text-outline'} 
                    size={80} 
                    color={colors.text} 
                    style={{ position: 'absolute', right: -15, bottom: -20, opacity: colorScheme === 'dark' ? 0.06 : 0.04, transform: [{ rotate: '15deg' }] }} 
                />
                <Ionicons 
                    name={(CATEGORY_THEMES[item.category] as any)?.name || 'document-text-outline'} 
                    size={60} 
                    color={colors.text} 
                    style={{ position: 'absolute', left: -10, top: -10, opacity: colorScheme === 'dark' ? 0.04 : 0.03, transform: [{ rotate: '-15deg' }] }} 
                />
                <LinearGradient
                    colors={(CATEGORY_THEMES[item.category] as any)?.gradient || [colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        width: viewMode === 'grid' ? 56 : 64,
                        height: viewMode === 'grid' ? 56 : 64,
                        borderRadius: viewMode === 'grid' ? 28 : 32,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: (CATEGORY_THEMES[item.category] as any)?.color || colors.primary,
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                    }}
                >
                    <Ionicons name={(CATEGORY_THEMES[item.category] as any)?.name || 'document-text-outline'} size={viewMode === 'grid' ? 28 : 32} color="#FFFFFF" />
                </LinearGradient>
                {/* Shortlisted indicator */}
                {item.is_interested && (
                    <View style={styles.shortlistedDot}>
                        <Typography style={{ fontSize: 10 }}>★</Typography>
                    </View>
                )}
            </View>

            <View style={[styles.cardContent, viewMode === 'grid' && { paddingLeft: 0 }]}>
                <View style={[styles.cardHeader, viewMode === 'grid' && { flexDirection: 'column' }]}>
                    <Typography variant="h6" weight="bold" numberOfLines={viewMode === 'grid' ? 2 : 1} style={[styles.cardTitle, viewMode === 'grid' && { marginRight: 0, marginBottom: spacing[1], fontSize: 13, lineHeight: 16 }]}>
                        {item.title}
                    </Typography>
                    {viewMode === 'list' && (
                        <Badge
                            label={item.status.toUpperCase()}
                            variant={item.status === 'open' ? 'success' : 'outline'}
                            size="sm"
                        />
                    )}
                </View>

                {/* Shortlisted banner */}
                {item.is_interested && (
                    <View style={styles.shortlistedBanner}>
                        <Typography variant="caption" weight="bold" style={{ color: '#92400E', fontSize: 11 }}>
                            Shortlisted by the owner — you&apos;re a top pick!
                        </Typography>
                    </View>
                )}

                {viewMode === 'list' && (
                    <Typography variant="caption" color="secondary" numberOfLines={item.is_interested ? 1 : 2}>
                        {item.description}
                    </Typography>
                )}

                <View style={[styles.cardMeta, viewMode === 'grid' && { marginTop: 4 }]}>
                    <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                    <Typography variant="caption" color="tertiary" style={{ marginLeft: 2 }} numberOfLines={1}>
                        {item.location}
                    </Typography>
                </View>

                <View style={[styles.cardFooter, viewMode === 'grid' && { marginTop: 8 }]}>
                    <View style={[styles.budgetTag, viewMode === 'grid' && { paddingHorizontal: 4, paddingVertical: 2 }]}>
                        <Typography variant="caption" weight="bold" color="primary" style={[{ color: colors.primaryDark }, viewMode === 'grid' && { fontSize: 9 }]}>
                            ₹{item.budget_min || 0} - ₹{item.budget_max || 0}
                        </Typography>
                    </View>
                    <Typography variant="caption" color="tertiary" style={viewMode === 'grid' ? { fontSize: 9 } : undefined}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Typography>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Image 
                    source={require('../../assets/snabb-icon.svg')} 
                    style={{ width: 32, height: 32, marginRight: 8 }} 
                    contentFit="contain" 
                />
                <Typography variant="h3" weight="bold">Interested Asks</Typography>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Typography variant="bodySmall" color="secondary">Tasks where you&apos;ve expressed interest</Typography>
                
                {/* Grid / List View Toggle */}
                <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceVariant, borderRadius: 12, padding: 4 }}>
                    <TouchableOpacity 
                        style={{ padding: 6, borderRadius: 8, backgroundColor: viewMode === 'grid' ? colors.surface : 'transparent' }}
                        onPress={() => setViewMode('grid')}
                    >
                        <Ionicons name="grid" size={16} color={viewMode === 'grid' ? colors.primary : colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={{ padding: 6, borderRadius: 8, backgroundColor: viewMode === 'list' ? colors.surface : 'transparent' }}
                        onPress={() => setViewMode('list')}
                    >
                        <Ionicons name="list" size={16} color={viewMode === 'list' ? colors.primary : colors.textTertiary} />
                    </TouchableOpacity>
                </View>
            </View>
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
                key={viewMode}
                numColumns={viewMode === 'grid' ? 2 : 1}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing[4] }]}
                columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'space-between', paddingHorizontal: spacing[2] } : undefined}
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
