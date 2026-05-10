import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Card, Badge } from '../design-system/components';
import { useTheme } from '../design-system/ThemeContext';
import { spacing, borderRadius } from '../design-system/tokens';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../services/api';
import { logger } from '../services/logger';

export default function ProDashboardScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [stats, setStats] = useState({
        total_earnings: 0,
        completed_tasks: 0,
        rating: 0,
        active_tasks: 0,
        pending_offers: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const response = await apiClient.get('/users/me/stats');
            setStats(response.data);
        } catch (err) {
            logger.error('Failed to fetch pro stats:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView 
            style={[styles.container, { backgroundColor: colors.background }]}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
        >
            <LinearGradient
                colors={['#0891b2', '#0e7490']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Typography variant="h4" weight="black" style={{ color: '#fff' }}>Pro Dashboard</Typography>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.earningsCard}>
                    <Typography variant="caption" weight="black" style={{ color: '#cffafe', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                        Total Earnings
                    </Typography>
                    <Typography variant="h1" weight="black" style={{ color: '#fff', fontSize: 42 }}>
                        ₹{stats.total_earnings.toLocaleString()}
                    </Typography>
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={16} color="#fbbf24" />
                        <Typography variant="body" weight="black" style={{ color: '#fff', marginLeft: 4 }}>
                            {stats.rating.toFixed(1)} Rating
                        </Typography>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.statsGrid}>
                    <Card style={styles.statBox}>
                        <Typography variant="h3" weight="black" color="primary">{stats.completed_tasks}</Typography>
                        <Typography variant="caption" color="secondary" weight="bold">Tasks Completed</Typography>
                    </Card>
                    <Card style={styles.statBox}>
                        <Typography variant="h3" weight="black" style={{ color: '#10b981' }}>{stats.active_tasks}</Typography>
                        <Typography variant="caption" color="secondary" weight="bold">Active Tasks</Typography>
                    </Card>
                    <Card style={styles.statBox}>
                        <Typography variant="h3" weight="black" style={{ color: '#f59e0b' }}>{stats.pending_offers}</Typography>
                        <Typography variant="caption" color="secondary" weight="bold">Pending Offers</Typography>
                    </Card>
                </View>

                <Typography variant="h5" weight="black" style={styles.sectionTitle}>Quick Actions</Typography>
                
                <TouchableOpacity 
                    style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('Main' as any, { screen: 'Interested' })}
                >
                    <View style={[styles.actionIcon, { backgroundColor: '#4f46e515' }]}>
                        <Ionicons name="briefcase" size={24} color="#4f46e5" />
                    </View>
                    <View style={styles.actionInfo}>
                        <Typography variant="body" weight="bold">Manage My Offers</Typography>
                        <Typography variant="caption" color="tertiary">Review and track your active bids</Typography>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('Main' as any, { screen: 'Home' })}
                >
                    <View style={[styles.actionIcon, { backgroundColor: '#10b98115' }]}>
                        <Ionicons name="search" size={24} color="#10b981" />
                    </View>
                    <View style={styles.actionInfo}>
                        <Typography variant="body" weight="bold">Find More Work</Typography>
                        <Typography variant="caption" color="tertiary">Explore tasks in your area</Typography>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('Profile' as any)}
                >
                    <View style={[styles.actionIcon, { backgroundColor: '#f59e0b15' }]}>
                        <Ionicons name="person" size={24} color="#f59e0b" />
                    </View>
                    <View style={styles.actionInfo}>
                        <Typography variant="body" weight="bold">Edit Pro Profile</Typography>
                        <Typography variant="caption" color="tertiary">Update your bio and services</Typography>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: spacing[6],
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[8],
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    earningsCard: {
        alignItems: 'center',
        gap: 4,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 8,
    },
    content: {
        padding: spacing[6],
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[3],
        marginTop: -spacing[10],
        marginBottom: spacing[8],
    },
    statBox: {
        flex: 1,
        minWidth: '45%',
        padding: spacing[4],
        alignItems: 'center',
        borderRadius: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    sectionTitle: {
        marginBottom: spacing[4],
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: spacing[3],
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[4],
    },
    actionInfo: {
        flex: 1,
    },
});
