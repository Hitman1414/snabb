import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Badge, EmptyState, SkeletonGroup } from '../design-system/components';
import { useTheme } from '../design-system/ThemeContext';
import { spacing } from '../design-system/tokens';
import apiClient from '../services/api';
import { logger } from '../services/logger';
import { CATEGORY_THEMES } from '../constants/categories';

const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' mins ago';
    return 'Just now';
};

type Ask = {
    id: number;
    title: string;
    description: string;
    status: string;
    created_at: string;
    category: string;
    location: string;
    budget_min?: number;
    budget_max?: number;
    response_count?: number;
};

export default function MyAsksScreen({ route }: any) {
    const { colors, colorScheme } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [asks, setAsks] = useState<Ask[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'open' | 'draft'>(route?.params?.tab || 'open');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        if (route?.params?.tab) setActiveTab(route.params.tab);
    }, [route?.params?.tab]);

    const fetchMyAsks = async () => {
        try {
            const response = await apiClient.get('/asks/my-asks');
            setAsks(response.data);
        } catch (err) {
            logger.error('Failed to fetch my asks:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchMyAsks(); }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMyAsks();
    };

    const filteredAsks = asks.filter(ask => activeTab === 'open' ? ask.status !== 'draft' : ask.status === 'draft');

    const renderAskItem = ({ item }: { item: Ask }) => {
        const theme = CATEGORY_THEMES[item.category] || CATEGORY_THEMES['Other'];

        return (
            <TouchableOpacity 
                onPress={() => navigation.navigate('AskDetail' as any, { askId: item.id })}
                activeOpacity={0.9}
                style={[
                    styles.card, 
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    viewMode === 'grid' && { flex: 1, marginHorizontal: spacing[2], marginBottom: spacing[4] }
                ]}
            >
                <View style={[styles.cardImage, { backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, viewMode === 'grid' && { height: 90, marginBottom: spacing[1] }]}>
                    {/* Essence Background Glow */}
                    <LinearGradient
                        colors={theme.gradient as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFill, { opacity: colorScheme === 'dark' ? 0.15 : 0.08 }]}
                    />
                    {/* Watermarks */}
                    <Ionicons 
                        name={theme.name as any} 
                        size={80} 
                        color={colors.text} 
                        style={{ position: 'absolute', right: -15, bottom: -20, opacity: colorScheme === 'dark' ? 0.06 : 0.04, transform: [{ rotate: '15deg' }] }} 
                    />
                    <Ionicons 
                        name={theme.name as any} 
                        size={60} 
                        color={colors.text} 
                        style={{ position: 'absolute', left: -10, top: -10, opacity: colorScheme === 'dark' ? 0.04 : 0.03, transform: [{ rotate: '-15deg' }] }} 
                    />
                    <LinearGradient
                        colors={theme.gradient as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            width: viewMode === 'grid' ? 56 : 64,
                            height: viewMode === 'grid' ? 56 : 64,
                            borderRadius: viewMode === 'grid' ? 28 : 32,
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: theme.color,
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 4,
                        }}
                    >
                        <Ionicons name={theme.name as any} size={viewMode === 'grid' ? 28 : 32} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={[styles.statusPill, { backgroundColor: item.status === 'open' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(59, 130, 246, 0.9)' }, viewMode === 'grid' && { paddingHorizontal: 6, paddingVertical: 2 }]}>
                        <Typography variant="caption" weight="black" style={{ color: '#fff', fontSize: viewMode === 'grid' ? 8 : 9 }}>
                            {item.status.toUpperCase()}
                        </Typography>
                    </View>
                </View>

                <View style={[styles.cardContent, viewMode === 'grid' && { padding: spacing[3] }]}>
                    <View style={{ alignSelf: 'flex-start', marginBottom: viewMode === 'grid' ? 6 : 8 }}>
                        <Badge label={item.category.toUpperCase()} size="sm" style={[{ backgroundColor: theme.color + '20' }, viewMode === 'grid' && { paddingHorizontal: 4, paddingVertical: 2 }]} textStyle={[{ color: theme.color }, viewMode === 'grid' && { fontSize: 8 }]} />
                    </View>
                    
                    <Typography variant="h6" weight="black" style={[styles.askTitle, viewMode === 'grid' && { fontSize: 13, lineHeight: 16 }]} numberOfLines={viewMode === 'grid' ? 2 : 1}>
                        {item.title}
                    </Typography>
                    
                    {viewMode === 'list' && (
                        <Typography variant="caption" color="secondary" numberOfLines={2} style={styles.askDescription}>
                            {item.description}
                        </Typography>
                    )}

                    <View style={[styles.metaGrid, viewMode === 'grid' && { flexDirection: 'column', gap: 4, marginBottom: 8 }]}>
                        <View style={[styles.metaItem, { backgroundColor: colors.surfaceVariant }, viewMode === 'grid' && { padding: 4 }]}>
                            <Ionicons name="location" size={viewMode === 'grid' ? 10 : 14} color={colors.primary} />
                            <Typography variant="caption" color="secondary" numberOfLines={1} style={{ flex: 1, marginLeft: 4, fontSize: viewMode === 'grid' ? 9 : 10, fontWeight: 'bold' }}>
                                {item.location}
                            </Typography>
                        </View>
                        {(item.budget_min !== undefined || item.budget_max !== undefined) && (
                            <View style={[styles.metaItem, { backgroundColor: colors.surfaceVariant }, viewMode === 'grid' && { padding: 4 }]}>
                                <Ionicons name="cash" size={viewMode === 'grid' ? 10 : 14} color="#10B981" />
                                <Typography variant="caption" weight="black" style={{ color: colors.text, marginLeft: 4, fontSize: viewMode === 'grid' ? 9 : 10 }}>
                                    {item.budget_min === 0 && item.budget_max === 0 ? 'Flexible' : `₹${item.budget_min || 0} - ₹${item.budget_max || 'Flex'}`}
                                </Typography>
                            </View>
                        )}
                    </View>

                    <View style={[styles.cardFooter, { borderTopColor: colors.border }, viewMode === 'grid' && { paddingTop: 8 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={[styles.avatar, { borderColor: colors.border, backgroundColor: colors.surfaceVariant, width: viewMode === 'grid' ? 20 : 32, height: viewMode === 'grid' ? 20 : 32, marginRight: 6 }]}>
                                <Typography variant="bodySmall" weight="black" style={{ color: colors.text, fontSize: viewMode === 'grid' ? 10 : 14 }}>Y</Typography>
                            </View>
                            <View style={{ flex: 1 }}>
                                {viewMode === 'list' && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Typography variant="caption" weight="black">You</Typography>
                                    </View>
                                )}
                                <Typography variant="caption" color="tertiary" style={{ fontSize: viewMode === 'grid' ? 8 : 9, marginTop: viewMode === 'grid' ? 0 : 2, textTransform: 'uppercase', fontWeight: 'bold' }} numberOfLines={1}>
                                    {timeAgo(item.created_at)}
                                </Typography>
                            </View>
                        </View>
                        <View style={[styles.responseCount, viewMode === 'grid' && { paddingHorizontal: 6, paddingVertical: 4 }]}>
                            <Ionicons name="chatbubble" size={viewMode === 'grid' ? 10 : 12} color={colors.primary} />
                            <Typography variant="caption" weight="black" style={{ color: colors.primary, marginLeft: 4, fontSize: viewMode === 'grid' ? 10 : 12 }}>
                                {item.response_count || 0}
                            </Typography>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Image 
                    source={require('../../assets/snabb-icon.svg')} 
                    style={{ width: 32, height: 32, marginRight: 8 }} 
                    contentFit="contain" 
                />
                <Typography variant="h3" weight="bold">My Asks</Typography>
            </View>
            <Typography variant="bodySmall" color="secondary">Manage your requests</Typography>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing[6] }}>
                <View style={[styles.pillTabsContainer, { marginTop: 0, backgroundColor: colors.surfaceVariant }]}>
                    <TouchableOpacity 
                        style={[styles.pillTab, activeTab === 'open' && { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }]}
                        onPress={() => setActiveTab('open')}
                    >
                        <Typography variant="bodySmall" weight="black" style={{ color: activeTab === 'open' ? colors.primary : colors.textTertiary }}>
                            Active Requests
                        </Typography>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.pillTab, activeTab === 'draft' && { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }]}
                        onPress={() => setActiveTab('draft')}
                    >
                        <Typography variant="bodySmall" weight="black" style={{ color: activeTab === 'draft' ? colors.primary : colors.textTertiary }}>
                            Drafts
                        </Typography>
                    </TouchableOpacity>
                </View>

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

    if (loading && !refreshing) {
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
                data={filteredAsks}
                renderItem={renderAskItem}
                ListHeaderComponent={renderHeader}
                key={viewMode}
                numColumns={viewMode === 'grid' ? 2 : 1}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing[4] }]}
                columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'space-between', paddingHorizontal: spacing[2] } : undefined}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                ListEmptyComponent={
                    <EmptyState
                        title={activeTab === 'open' ? 'No active asks' : 'No drafts found'}
                        description={activeTab === 'open' ? 'You haven\'t published any asks yet. Post one to get help!' : 'Your saved drafts will appear here.'}
                        icon="document-text-outline"
                        style={{ marginTop: spacing[10] }}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: spacing[4],
        paddingTop: spacing[6],
        paddingBottom: spacing[4],
    },
    pillTabsContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 16,
        marginTop: spacing[6],
        alignSelf: 'flex-start',
    },
    pillTab: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: 12,
    },
    listContent: {
        paddingHorizontal: spacing[4],
        paddingTop: spacing[2],
    },
    card: {
        marginBottom: spacing[6],
        borderRadius: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 4,
        overflow: 'hidden',
    },
    cardHeaderArea: {
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    watermarkIcon: {
        position: 'absolute',
        right: -10,
        bottom: -10,
        transform: [{ rotate: '15deg' }],
        opacity: 0.2,
    },
    statusPill: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    cardContent: {
        padding: spacing[4],
    },
    askTitle: {
        marginBottom: spacing[1],
        letterSpacing: -0.5,
    },
    askDescription: {
        marginBottom: spacing[4],
        lineHeight: 18,
    },
    metaGrid: {
        flexDirection: 'row',
        gap: spacing[2],
        marginBottom: spacing[4],
    },
    metaItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[2],
        borderRadius: 10,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing[3],
        borderTopWidth: 1,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        borderWidth: 1,
    },
    responseCount: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B3515',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
});