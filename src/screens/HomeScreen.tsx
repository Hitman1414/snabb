/**
 * Optimized HomeScreen with Search, Filters, and Infinite Scroll
 */
import React, { useCallback, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import {
    View,
    FlatList,
    StyleSheet,
    RefreshControl,
    ListRenderItemInfo,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useInfiniteAsks } from '../hooks/useAsks';
import { useAuth } from '../hooks/useAuth';
import { getApiUrl, getFullImageUrl } from '../constants/config';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { useNotifications } from '../hooks/useNotifications';
import { Ask } from '../types';
import { useTheme } from '../design-system/ThemeContext';
import { Typography, Card, SkeletonGroup, Badge, SearchBar, FilterChip, EmptyState } from '../design-system/components';
import { spacing, elevation } from '../design-system/tokens';
import { CATEGORIES, CATEGORY_ICONS } from '../constants/categories';
import { getInitials } from '../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ITEM_HEIGHT = 140;
const HOME_CATEGORIES = ['All', ...CATEGORIES];

export default function HomeScreen() {
    const navigation = useNavigation<NavigationProp>();
    const { colors, colorScheme } = useTheme();
    const { user } = useAuth();

    usePerformanceMonitor('HomeScreen');
    const { unreadCount } = useNotifications();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [isNearbyEnabled, setIsNearbyEnabled] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setLocationError('Permission to access location was denied');
                    return;
                }

                let loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);
                setIsNearbyEnabled(true); // Default to nearby if location is found
            } catch (error) {
                console.warn('Error fetching location:', error);
                setLocationError('Could not fetch location');
            }
        })();
    }, []);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isRefetching,
        refetch,
    } = useInfiniteAsks(
        selectedCategory === 'All' ? undefined : selectedCategory,
        undefined,
        searchQuery || undefined,
        undefined,
        undefined,
        isNearbyEnabled ? location?.coords.latitude : undefined,
        isNearbyEnabled ? location?.coords.longitude : undefined,
        isNearbyEnabled ? 10 : undefined // 10km radius
    );

    const asks = data?.pages.flatMap((page) => page.items) ?? [];

    const handleAskPress = useCallback((askId: number) => {
        navigation.navigate('AskDetail', { askId });
    }, [navigation]);

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const renderItem = useCallback(({ item }: ListRenderItemInfo<Ask>) => (
        <TouchableOpacity
            onPress={() => handleAskPress(item.id)}
            activeOpacity={0.8}
            style={[styles.card, { 
                backgroundColor: colors.surface,
                borderColor: colors.border,
            }]}
        >
            <View style={[styles.cardImage, { backgroundColor: colors.surfaceVariant }]}>
                {/* Simulated category icon as placeholder for image */}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons 
                        name={(CATEGORY_ICONS[item.category] as any)?.name || 'document-text-outline'} 
                        size={40} 
                        color={(CATEGORY_ICONS[item.category] as any)?.color || colors.primary} 
                    />
                </View>
            </View>
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Typography variant="h6" weight="bold" numberOfLines={1} style={{ flex: 1 }}>
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
                    <Typography variant="caption" color="tertiary">
                        {new Date(item.created_at).toLocaleDateString()}
                    </Typography>
                </View>
            </View>
        </TouchableOpacity>
    ), [handleAskPress, colors]);

    const renderFooter = useCallback(() => {
        if (!isFetchingNextPage) return null;
        return (
            <View style={styles.footer}>
                <SkeletonGroup variant="card" />
            </View>
        );
    }, [isFetchingNextPage]);

    const ListHeader = useCallback(() => (
        <View style={{ backgroundColor: colors.background }}>

            {/* Promo Carousel */}
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.carouselContainer}
                snapToInterval={315}
                decelerationRate="fast"
            >
                <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('CreateAsk')}
                >
                    <View style={[styles.promoCard, { backgroundColor: '#FEE2E2' }]}>
                        <View style={styles.promoContent}>
                            <Typography variant="h4" weight="bold" color="primary" style={{ color: '#991B1B' }}>Need help?</Typography>
                            <Typography variant="bodySmall" style={{ color: '#991B1B', marginTop: 4 }}>
                                Post an ask and get help instantly from people nearby!
                            </Typography>
                            <View style={[styles.promoBadge, { backgroundColor: '#991B1B' }]}>
                                <Typography variant="caption" weight="bold" style={{ color: '#fff' }}>Post Now</Typography>
                            </View>
                        </View>
                        <Ionicons name="megaphone" size={80} color="#991B1B20" style={styles.promoIcon} />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('ProLanding')}
                >
                    <View style={[styles.promoCard, { backgroundColor: '#ECFDF5' }]}>
                        <View style={styles.promoContent}>
                            <Typography variant="h4" weight="bold" style={{ color: '#065F46' }}>Snabb Pro</Typography>
                            <Typography variant="bodySmall" style={{ color: '#065F46', marginTop: 4 }}>
                                Join our pro network and start helping others to earn.
                            </Typography>
                            <View style={[styles.promoBadge, { backgroundColor: '#065F46' }]}>
                                <Typography variant="caption" weight="bold" style={{ color: '#fff' }}>Join Pro</Typography>
                            </View>
                        </View>
                        <Ionicons name="sparkles" size={80} color="#065F4620" style={styles.promoIcon} />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => {}}
                >
                    <View style={[styles.promoCard, { backgroundColor: '#F5F3FF' }]}>
                        <View style={styles.promoContent}>
                            <Typography variant="h4" weight="bold" style={{ color: '#5B21B6' }}>Snabb AI</Typography>
                            <Typography variant="bodySmall" style={{ color: '#5B21B6', marginTop: 4 }}>
                                Need quick data or file help? Our AI agents are ready!
                            </Typography>
                            <View style={[styles.promoBadge, { backgroundColor: '#5B21B6' }]}>
                                <Typography variant="caption" weight="bold" style={{ color: '#fff' }}>Try AI</Typography>
                            </View>
                        </View>
                        <Ionicons name="hardware-chip" size={80} color="#5B21B620" style={styles.promoIcon} />
                    </View>
                </TouchableOpacity>
            </ScrollView>

            {/* Categories */}
            <View style={styles.categorySection}>
                <View style={styles.sectionTitle}>
                    <Typography variant="h5" weight="bold">What are you looking for?</Typography>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: spacing[2] }}
                >
                    {HOME_CATEGORIES.map((cat) => {
                        const iconData = CATEGORY_ICONS[cat as any] || CATEGORY_ICONS['Other'];
                        const isSelected = selectedCategory === cat;
                        return (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setSelectedCategory(cat)}
                                style={styles.categoryItem}
                            >
                                <View key={`${cat}-${colorScheme}`} style={[
                                    styles.categoryIcon, 
                                    { 
                                        backgroundColor: colors.surfaceVariant,
                                        borderColor: colors.border,
                                    },
                                    isSelected && { borderColor: colors.primary, backgroundColor: colors.primaryLight + '20' }
                                ]}>
                                    <Ionicons name={(iconData as any).name} size={28} color={isSelected ? colors.primaryDark : iconData.color} />
                                </View>
                                <Typography 
                                    variant="caption" 
                                    weight={isSelected ? "bold" : "medium"} 
                                    numberOfLines={2} 
                                    align="center"
                                >
                                    {cat}
                                </Typography>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <View style={styles.listTitle}>
                <Typography variant="h5" weight="bold">Nearby Asks</Typography>
            </View>
        </View>
    ), [colors, navigation, selectedCategory, setSelectedCategory]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Location Header - outside FlatList so it stays stable */}
            <View style={[styles.locationHeader, { backgroundColor: colors.background }]}>
                <TouchableOpacity style={styles.locationLeft} onPress={() => {}}>
                    <Ionicons name="location" size={24} color={colors.primary} />
                    <View style={styles.locationText}>
                        <Typography variant="bodySmall" weight="bold">
                            Current Location <Ionicons name="chevron-down" size={14} color={colors.text} />
                        </Typography>
                        <Typography variant="caption" color="secondary" numberOfLines={1}>
                            Sector 43, Gurugram, India
                        </Typography>
                    </View>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('Notifications')}
                        style={{ position: 'relative', padding: 4 }}
                    >
                        <Ionicons name="notifications-outline" size={26} color={colors.text} />
                        {unreadCount > 0 && (
                            <View style={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                backgroundColor: colors.error,
                                borderRadius: 10,
                                minWidth: 18,
                                height: 18,
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingHorizontal: 4,
                                borderWidth: 2,
                                borderColor: colors.surface
                            }}>
                                <Typography variant="caption" color="inverse" weight="bold" style={{ fontSize: 9 }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </Typography>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => navigation.navigate('Main', { screen: 'Profile' } as any)}
                        activeOpacity={0.8}
                    >
                        {user?.avatar_url ? (
                            <Image
                                source={{ uri: getFullImageUrl(user.avatar_url) as string }}
                                style={{ width: 36, height: 36, borderRadius: 18 }}
                            />
                        ) : (
                            <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
                                <Typography variant="caption" color="inverse" weight="bold">
                                    {getInitials(user?.username || '?')}
                                </Typography>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar - outside FlatList to preserve focus on every keystroke */}
            <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search for services or help..."
                />
            </View>

            {isLoading ? (
                <View style={{ padding: spacing[4] }}>
                    <SkeletonGroup variant="card" />
                    <SkeletonGroup variant="card" />
                    <SkeletonGroup variant="card" />
                </View>
            ) : (
                <FlatList
                    data={asks}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    ListHeaderComponent={ListHeader}
                    contentContainerStyle={styles.list}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    extraData={colorScheme}
                    ListEmptyComponent={searchQuery ? (
                        <EmptyState
                            title="No Results"
                            description={`We couldn't find anything for "${searchQuery}"`}
                            icon="search-outline"
                        />
                    ) : null}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            tintColor={colors.primary}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        justifyContent: 'space-between',
    },
    locationLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        flexDirection: 'column',
        marginLeft: spacing[2],
    },
    profileIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainer: {
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[3],
    },
    carouselContainer: {
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[4],
    },
    promoCard: {
        width: 300,
        height: 140,
        borderRadius: 20,
        marginRight: spacing[3],
        overflow: 'hidden',
        position: 'relative',
    },
    promoImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    promoContent: {
        padding: spacing[4],
        justifyContent: 'center',
        flex: 1,
        paddingRight: spacing[12], // Make room for icon
    },
    promoBadge: {
        marginTop: spacing[3],
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    promoIcon: {
        position: 'absolute',
        right: -10,
        bottom: -10,
    },
    categorySection: {
        paddingHorizontal: spacing[2],
        marginBottom: spacing[4],
    },
    sectionTitle: {
        paddingHorizontal: spacing[2],
        marginBottom: spacing[3],
    },
    categoryItem: {
        alignItems: 'center',
        padding: spacing[2],
        width: 85,
    },
    categoryIcon: {
        width: 60,
        height: 60,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[2],
        borderWidth: 1,
    },
    listTitle: {
        paddingHorizontal: spacing[4],
        marginBottom: spacing[2],
    },
    list: {
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[4],
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
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing[1],
    },
    budgetTag: {
        backgroundColor: '#F7C30115',
        paddingHorizontal: spacing[2],
        paddingVertical: 2,
        borderRadius: 6,
    },
    footer: {
        paddingVertical: spacing[4],
    },
});
