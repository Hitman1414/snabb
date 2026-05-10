/**
 * Optimized HomeScreen with Search, Filters, and Infinite Scroll
 */
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { logger } from '../services/logger';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import {
    View,
    FlatList,
    StyleSheet,
    RefreshControl,
    ListRenderItemInfo,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
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
import { CATEGORIES, CATEGORY_THEMES } from '../constants/categories';
import { getInitials } from '../utils/helpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingTour from '../components/OnboardingTour';
import { toastService } from '../services/toast.service';
import { ProCarousel, ProUser } from '../components/ProCarousel';
import apiClient from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ITEM_HEIGHT = 140;
const HOME_CATEGORIES = ['All', ...CATEGORIES];

export default function HomeScreen() {
    const navigation = useNavigation<NavigationProp>();
    const { colors, colorScheme, toggleTheme } = useTheme();
    const { user } = useAuth();

    usePerformanceMonitor('HomeScreen');
    const { unreadCount } = useNotifications();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [sortFilter, setSortFilter] = useState('latest');
    const [locationError, setLocationError] = useState<string | null>(null);

    const hasAiAccess = user?.is_ai_subscribed || user?.ai_override || user?.is_admin;

    const [addressText, setAddressText] = useState('Fetching location...');
    const [hasLocation, setHasLocation] = useState(false);
    const [showTour, setShowTour] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [isAiMode, setIsAiMode] = useState(false);
    const [topPros, setTopPros] = useState<ProUser[]>([]);
    const [aiResults, setAiResults] = useState<{user: ProUser, match_reason: string}[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Show onboarding tour on first launch
    useEffect(() => {
        AsyncStorage.getItem('hasSeenTour').then(val => {
            if (!val) setShowTour(true);
        });
    }, []);

    useEffect(() => {
        if (location) {
            Location.reverseGeocodeAsync(location.coords).then(res => {
                if (res.length > 0) {
                    setAddressText(`${res[0].city || res[0].district || res[0].name}, ${res[0].country}`);
                } else {
                    setAddressText(user?.location || 'Unknown Location');
                }
            }).catch(() => {
                setAddressText(user?.location || 'Unknown Location');
            });
        } else if (user?.location) {
            setAddressText(user.location);
        } else {
            setAddressText('Set Location');
        }
    }, [location, user]);

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setLocationError('Permission to access location was denied');
                    setAddressText(user?.location || 'Set Location');
                    return;
                }

                const loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);
                setHasLocation(true);
                // Do NOT auto-enable nearby — keep isNearbyEnabled = false so all asks show
            } catch (error) {
                logger.warn('Error fetching location:', error);
                setLocationError('Could not fetch location');
            }
        })();
    }, []);

    useEffect(() => {
        const fetchTopPros = async () => {
            try {
                const response = await apiClient.get('/users/pros?limit=10');
                setTopPros(response.data);
            } catch (err) {
                logger.error('Failed to fetch top pros:', err);
            }
        };
        fetchTopPros();
    }, []);

    // Handle AI Search
    useEffect(() => {
        const handleAiSearch = async () => {
            if (!isAiMode || searchQuery.trim().length <= 3) {
                setAiResults([]);
                return;
            }
            
            setIsAiLoading(true);
            try {
                const response = await apiClient.post('/ai/magic-search', {
                    query: searchQuery
                });
                setAiResults(response.data);
            } catch (err) {
                logger.error('AI Search Error:', err);
            } finally {
                setIsAiLoading(false);
            }
        };

        const timer = setTimeout(handleAiSearch, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, isAiMode]);

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
        'open',  // Only show open asks in the feed
        searchQuery || undefined,
        undefined,
        undefined,
        sortFilter === 'nearby' && hasLocation ? location?.coords.latitude : undefined,
        sortFilter === 'nearby' && hasLocation ? location?.coords.longitude : undefined,
        sortFilter === 'nearby' && hasLocation ? 25 : undefined, // 25km radius when nearby mode is on
        sortFilter
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

    const processedAsks = useMemo(() => {
        let rows: any[] = [];
        
        // Inject AI Match Results
        if (isAiMode && aiResults.length > 0) {
            rows.push({ id: 'ai-header', isAiHeader: true });
            aiResults.forEach((res, index) => {
                rows.push({ id: `ai-match-${index}`, isAiMatch: true, ...res });
            });
        }

        const items = asks;
        if (viewMode === 'list') {
            return [...rows, ...items.map(item => ({ ...item, isRow: false, items: [item] }))];
        } else {
            for (let i = 0; i < items.length; i += 2) {
                rows.push({
                    id: `row-${i}`,
                    isRow: true,
                    items: items.slice(i, i + 2)
                });
            }
            return rows;
        }
    }, [asks, viewMode, isAiMode, aiResults]);

    const renderAskCard = useCallback((item: Ask) => (
        <TouchableOpacity
            key={item.id}
            onPress={() => handleAskPress(item.id)}
            activeOpacity={0.8}
            style={[styles.card, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
            }, viewMode === 'grid' && {
                flex: 1,
                flexDirection: 'column',
                marginHorizontal: spacing[1],
            }]}
        >
            <View style={[styles.cardImage, { backgroundColor: colors.surfaceVariant }, viewMode === 'grid' && { width: '100%', height: 120, marginBottom: spacing[2] }]}>
                {item.images && item.images.length > 0 ? (
                    <Image
                        source={{ uri: getFullImageUrl(item.images[0]) }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={200}
                    />
                ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceVariant, overflow: 'hidden' }}>
                        {/* Essence Background Glow */}
                        <LinearGradient
                            colors={(CATEGORY_THEMES[item.category] || CATEGORY_THEMES['Other']).gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[StyleSheet.absoluteFill, { opacity: colorScheme === 'dark' ? 0.15 : 0.08 }]}
                        />
                        {/* Watermarks */}
                        <Ionicons 
                            name={(CATEGORY_THEMES[item.category] || CATEGORY_THEMES['Other']).name as any} 
                            size={100} 
                            color={colors.text} 
                            style={{ position: 'absolute', right: -20, bottom: -30, opacity: colorScheme === 'dark' ? 0.06 : 0.04, transform: [{ rotate: '15deg' }] }} 
                        />
                        <Ionicons 
                            name={(CATEGORY_THEMES[item.category] || CATEGORY_THEMES['Other']).name as any} 
                            size={80} 
                            color={colors.text} 
                            style={{ position: 'absolute', left: -15, top: -15, opacity: colorScheme === 'dark' ? 0.04 : 0.03, transform: [{ rotate: '-15deg' }] }} 
                        />
                        
                        <LinearGradient
                            colors={(CATEGORY_THEMES[item.category] || CATEGORY_THEMES['Other']).gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                width: viewMode === 'grid' ? 64 : 56,
                                height: viewMode === 'grid' ? 64 : 56,
                                borderRadius: viewMode === 'grid' ? 32 : 28,
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: (CATEGORY_THEMES[item.category] || CATEGORY_THEMES['Other']).color,
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            <Ionicons name={(CATEGORY_THEMES[item.category] || CATEGORY_THEMES['Other']).name as any} size={viewMode === 'grid' ? 32 : 28} color="#FFFFFF" />
                        </LinearGradient>
                    </View>
                )}
            </View>
            <View style={[styles.cardContent, viewMode === 'grid' && { paddingLeft: 0 }]}>
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
                            {item.budget_min === 0 && item.budget_max === 0 ? 'Flexible' : `₹${item.budget_min || 0} - ₹${item.budget_max || 0}`}
                        </Typography>
                    </View>
                    <Typography variant="caption" color="tertiary">
                        {new Date(item.created_at).toLocaleDateString()}
                    </Typography>
                </View>
            </View>
        </TouchableOpacity>
    ), [handleAskPress, colors, viewMode]);

    const renderItem = useCallback(({ item }: any) => {
        if (item.isAiHeader) {
            return (
                <View style={{ paddingHorizontal: spacing[4], paddingVertical: spacing[3], flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="sparkles" size={20} color={colors.primary} />
                    <Typography variant="h5" weight="bold">AI Recommended Matches</Typography>
                </View>
            );
        }
        if (item.isAiMatch) {
            const { user, match_reason } = item;
            return (
                <TouchableOpacity 
                    onPress={() => navigation.navigate('Profile', { userId: user.id })}
                    style={[styles.aiMatchCard, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }]}
                >
                    <View style={styles.aiMatchHeader}>
                        <View style={[styles.aiAvatar, { backgroundColor: colors.surface }]}>
                            {user.avatar_url ? (
                                <Image source={{ uri: getFullImageUrl(user.avatar_url) }} style={styles.avatarImg} />
                            ) : (
                                <Typography variant="h6" weight="bold">{user.username.charAt(0).toUpperCase()}</Typography>
                            )}
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Typography variant="body" weight="bold">{user.username}</Typography>
                                <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                            </View>
                            <Typography variant="caption" color="primary" weight="bold">{(user.pro_rating || 5.0).toFixed(1)} ★ • {user.pro_category}</Typography>
                        </View>
                        <Badge label="AI MATCH" variant="primary" size="sm" />
                    </View>
                    <View style={[styles.matchReason, { backgroundColor: colors.surface }]}>
                        <Typography variant="caption" weight="bold" color="primary" style={{ fontSize: 9 }}>WHY THIS MATCH?</Typography>
                        <Typography variant="caption" color="secondary" italic style={{ marginTop: 2 }}>
                            "{match_reason}"
                        </Typography>
                    </View>
                </TouchableOpacity>
            );
        }
        if (item.isRow) {
            return (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                    {item.items.map((ask: Ask) => renderAskCard(ask))}
                    {item.items.length === 1 && <View style={{ flex: 1, marginHorizontal: spacing[1] }} />}
                </View>
            );
        }
        return renderAskCard(item.items[0]);
    }, [renderAskCard, colors, navigation]);

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
            {/* Hub Containers - Vibrant & Aligned */}
            <View style={styles.hubContainer}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: spacing[4], paddingRight: spacing[4] }}
                >
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('NeedHelpHub' as any)}
                        style={styles.hubCardLarge}
                    >
                        <LinearGradient
                            colors={['#ef4444', '#991b1b']}
                            style={styles.hubCardGradient}
                        >
                            <View style={styles.hubIconBoxLarge}>
                                <Ionicons name="megaphone" size={32} color="#fff" />
                            </View>
                            <View style={styles.hubTextContent}>
                                <Typography variant="h3" weight="black" style={{ color: '#fff' }}>Snabb Ask</Typography>
                                <Typography variant="caption" style={{ color: '#fff', opacity: 0.9 }}>Need Help? Post help and get things done by Professionals</Typography>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#fff" style={styles.hubChevron} />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('SnabbProHub' as any)}
                        style={styles.hubCardLarge}
                    >
                        <LinearGradient
                            colors={['#10b981', '#065f46']}
                            style={styles.hubCardGradient}
                        >
                            <View style={styles.hubIconBoxLarge}>
                                <Ionicons name="trophy" size={32} color="#fff" />
                            </View>
                            <View style={styles.hubTextContent}>
                                <Typography variant="h3" weight="black" style={{ color: '#fff' }}>Snabb Pro</Typography>
                                <Typography variant="caption" style={{ color: '#fff', opacity: 0.9 }}>Find opportunities, serve customers, and grow your business</Typography>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#fff" style={styles.hubChevron} />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('AiPro' as any)}
                        style={styles.hubCardLarge}
                    >
                        <LinearGradient
                            colors={['#6366f1', '#4338ca']}
                            style={styles.hubCardGradient}
                        >
                            <View style={styles.hubIconBoxLarge}>
                                <Ionicons name="sparkles" size={32} color="#fff" />
                            </View>
                            <View style={styles.hubTextContent}>
                                <Typography variant="h3" weight="black" style={{ color: '#fff' }}>Snabb AI</Typography>
                                <Typography variant="caption" style={{ color: '#fff', opacity: 0.9 }}>Smart matchmaking to find the perfect help for your needs</Typography>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#fff" style={styles.hubChevron} />
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </View>

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
                        const iconData = CATEGORY_THEMES[cat as any] || CATEGORY_THEMES['Other'];
                        const isSelected = selectedCategory === cat;
                        return (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setSelectedCategory(cat)}
                                style={styles.categoryItem}
                            >
                                <LinearGradient
                                    colors={(iconData as any).gradient || [colors.primary, colors.primaryLight]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[
                                        styles.categoryIcon,
                                        { borderWidth: 0 },
                                        isSelected && {
                                            transform: [{ scale: 1.1 }],
                                            shadowColor: colors.primary,
                                            shadowOpacity: 0.4,
                                            shadowRadius: 8,
                                            elevation: 6,
                                            borderWidth: 2,
                                            borderColor: 'rgba(255,255,255,0.8)',
                                        }
                                    ]}
                                >
                                    <Ionicons name={(iconData as any).name} size={28} color="#FFFFFF" style={{ textShadowColor: 'rgba(0,0,0,0.1)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } }} />
                                </LinearGradient>
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


            {/* Filters Row */}
            <View style={{ paddingHorizontal: spacing[4], marginBottom: spacing[2] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
                    <Typography variant="h5" weight="bold">
                        Active Ask
                    </Typography>
                    {/* Grid / List toggle */}
                    <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceVariant, borderRadius: 10, padding: 3, gap: 2 }}>
                        <TouchableOpacity
                            onPress={() => setViewMode('list')}
                            style={{
                                padding: spacing[1] + 2,
                                borderRadius: 8,
                                backgroundColor: viewMode === 'list' ? colors.surface : 'transparent',
                            }}
                        >
                            <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? colors.primary : colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setViewMode('grid')}
                            style={{
                                padding: spacing[1] + 2,
                                borderRadius: 8,
                                backgroundColor: viewMode === 'grid' ? colors.surface : 'transparent',
                            }}
                        >
                            <Ionicons name="grid-outline" size={18} color={viewMode === 'grid' ? colors.primary : colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2] }}>
                    {[
                        { id: 'latest', label: 'Latest', icon: 'time-outline' },
                        { id: 'nearby', label: 'Nearby', icon: 'location-outline' },
                        { id: 'most_rated', label: 'Most Rated', icon: 'star-outline' },
                    ].map((filter) => {
                        const isActive = sortFilter === filter.id;
                        return (
                            <TouchableOpacity
                                key={filter.id}
                                onPress={() => {
                                    if (filter.id === 'nearby' && !hasLocation) {
                                        toastService.warning('Please allow location access to see nearby asks.');
                                        return;
                                    }
                                    setSortFilter(filter.id);
                                }}
                                style={[
                                    styles.nearbyToggle,
                                    {
                                        backgroundColor: isActive ? colors.primary : colors.surfaceVariant,
                                        borderColor: isActive ? colors.primary : colors.border,
                                        paddingHorizontal: spacing[3],
                                        paddingVertical: spacing[1] + 2,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                    }
                                ]}
                            >
                                <Ionicons
                                    name={filter.icon as any}
                                    size={14}
                                    color={isActive ? '#fff' : colors.textSecondary}
                                />
                                <Typography
                                    variant="caption"
                                    weight="bold"
                                    style={{ color: isActive ? '#fff' : colors.textSecondary, marginLeft: 4 }}
                                >
                                    {filter.label}
                                </Typography>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
    ), [colors, navigation, selectedCategory, setSelectedCategory, sortFilter, hasLocation, viewMode]);

    return (
        <View style={{ flex: 1 }}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />


            {/* Location Header - outside FlatList so it stays stable */}
            <View style={[styles.locationHeader, { backgroundColor: colors.background }]}>
                <TouchableOpacity style={styles.locationLeft} onPress={() => { }}>
                    <Image 
                        source={require('../../assets/snabb-icon.svg')} 
                        style={{ width: 36, height: 36, marginRight: 8 }} 
                        contentFit="contain" 
                    />
                    <View style={styles.locationText}>
                        <Typography variant="bodySmall" weight="bold">
                            Current Location <Ionicons name="chevron-down" size={14} color={colors.text} />
                        </Typography>
                        <Typography variant="caption" color="secondary" numberOfLines={1}>
                            {addressText}
                        </Typography>
                    </View>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                    <TouchableOpacity
                        onPress={toggleTheme}
                        style={{ position: 'relative', padding: 4 }}
                    >
                        <Ionicons name={colorScheme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={24} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('CreateAsk' as any)}
                        style={{ position: 'relative', padding: 4 }}
                    >
                        <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
                    </TouchableOpacity>

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
                </View>
            </View>

            {/* Search Bar - outside FlatList to preserve focus on every keystroke */}
            <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={isAiMode ? "What do you need help with?" : "Search for services or help..."}
                    rightElement={
                        (user?.is_ai_subscribed || user?.ai_override || user?.is_admin) ? (
                            <TouchableOpacity 
                                onPress={() => {
                                    setIsAiMode(!isAiMode);
                                    if (!isAiMode) toastService.info('AI Matchmaker Activated!');
                                }}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 10,
                                    backgroundColor: isAiMode ? colors.primary : colors.surfaceVariant,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Ionicons 
                                    name="sparkles" 
                                    size={18} 
                                    color={isAiMode ? '#fff' : colors.textSecondary} 
                                />
                            </TouchableOpacity>
                        ) : undefined
                    }
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
                    data={processedAsks}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
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
        {showTour && <OnboardingTour onDone={() => setShowTour(false)} />}
    </View>
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
    hubContainer: {
        paddingHorizontal: spacing[4],
        marginTop: spacing[4],
        marginBottom: spacing[6],
        gap: spacing[3],
    },
    hubRow: {
        flexDirection: 'row',
        gap: spacing[3],
    },
    hubCardLarge: {
        width: 280,
        height: 160,
        borderRadius: 32,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    hubCardGradient: {
        flex: 1,
        padding: spacing[6],
        justifyContent: 'center',
    },
    hubIconBoxLarge: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[4],
    },
    hubTextContent: {
        gap: 2,
    },
    hubChevron: {
        position: 'absolute',
        right: 24,
        bottom: 24,
        opacity: 0.8,
    },
    hubRow: {
        flexDirection: 'row',
        gap: spacing[3],
    },
    hubCardSmall: {
        height: 130,
        borderRadius: 24,
        padding: spacing[4],
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    hubContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[5],
    },
    hubIconBox: {
        width: 52,
        height: 52,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
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
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[2],
        borderWidth: 1,
        overflow: 'hidden',
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
    nearbyToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1] + 2,
        borderRadius: 20,
        borderWidth: 1,
    },
    aiMatchCard: {
        marginHorizontal: spacing[4],
        marginBottom: spacing[4],
        padding: spacing[4],
        borderRadius: 24,
        borderWidth: 1,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    aiMatchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[3],
    },
    aiAvatar: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
    },
    matchReason: {
        padding: spacing[3],
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    }
});
