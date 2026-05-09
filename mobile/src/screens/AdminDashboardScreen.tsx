import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Card, Typography } from '../design-system/components';
import { useTheme } from '../design-system/ThemeContext';
import { spacing } from '../design-system/tokens';
import apiClient from '../services/api';

type RecentRequest = {
    method: string;
    path: string;
    status: number;
    duration: number;
    timestamp: number;
    platform?: string;
};

type AdminStats = {
    db: {
        total_asks: number;
        total_users: number;
        total_responses: number;
        unassigned_asks: number;
    };
    monitoring: {
        total_requests: number;
        avg_latency_ms: number;
        platforms: Record<string, string | number>;
        recent_traffic: RecentRequest[];
    };
    server_time: string;
};

export default function AdminDashboardScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const response = await apiClient.get('/admin/stats');
            setStats(response.data);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading || !stats) {
        return (
            <View style={[styles.center, { backgroundColor: colors.backgroundSecondary || '#F8FAFC' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const browserCount = Number(stats.monitoring.platforms.browser || 0);
    const mobileCount = Number(stats.monitoring.platforms.mobile || 0);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.backgroundSecondary || '#F8FAFC' }]}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                        fetchStats();
                    }}
                />
            }
        >
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Image 
                        source={require('../../assets/snabb-icon.svg')} 
                        style={{ width: 32, height: 32, marginRight: 12 }} 
                        contentFit="contain" 
                    />
                    <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="speedometer-outline" size={28} color={colors.primary} />
                    </View>
                </View>
                <View>
                    <Typography variant="h3" weight="bold">Admin Control Center</Typography>
                    <Typography variant="caption" color="tertiary">Metrics, traffic, and moderation</Typography>
                </View>
            </View>

            <View style={styles.grid}>
                <MetricCard label="Users" value={stats.db.total_users} icon="people-outline" colors={colors} />
                <MetricCard label="Asks" value={stats.db.total_asks} icon="list-outline" colors={colors} />
                <MetricCard label="Responses" value={stats.db.total_responses} icon="chatbubbles-outline" colors={colors} />
                <MetricCard label="Open Asks" value={stats.db.unassigned_asks} icon="radio-button-on-outline" colors={colors} />
            </View>

            <Card style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Typography variant="h5" weight="bold">API Traffic</Typography>
                <View style={styles.trafficRow}>
                    <TrafficPill label="Total" value={stats.monitoring.total_requests} colors={colors} />
                    <TrafficPill label="Browser" value={browserCount} colors={colors} />
                    <TrafficPill label="Mobile" value={mobileCount} colors={colors} />
                </View>
                <Typography variant="caption" color="tertiary">
                    Average latency: {stats.monitoring.avg_latency_ms || 0}ms
                </Typography>
            </Card>

            <Card style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                    <Typography variant="h5" weight="bold">Recent Requests</Typography>
                    <Ionicons name="pulse-outline" size={20} color={colors.primary} />
                </View>
                {stats.monitoring.recent_traffic.length === 0 ? (
                    <Typography variant="bodySmall" color="tertiary" style={styles.emptyText}>
                        No API traffic recorded yet.
                    </Typography>
                ) : (
                    stats.monitoring.recent_traffic.slice(0, 8).map((request, index) => (
                        <View key={`${request.timestamp}-${index}`} style={styles.requestRow}>
                            <View style={styles.methodBadge}>
                                <Typography variant="caption" weight="bold" style={styles.methodText}>
                                    {request.method}
                                </Typography>
                            </View>
                            <View style={styles.requestBody}>
                                <Typography variant="bodySmall" weight="medium" numberOfLines={1}>
                                    {request.path}
                                </Typography>
                                <Typography variant="caption" color="tertiary">
                                    {request.platform || 'unknown'} • {Math.round(request.duration * 1000)}ms
                                </Typography>
                            </View>
                            <Typography
                                variant="caption"
                                weight="bold"
                                style={{ color: request.status >= 400 ? '#EF4444' : '#10B981' }}
                            >
                                {request.status}
                            </Typography>
                        </View>
                    ))
                )}
            </Card>

            <Card style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                    <View>
                        <Typography variant="h5" weight="bold">Pro Approvals</Typography>
                        <Typography variant="caption" color="tertiary">Review and approve pro applications</Typography>
                    </View>
                    <Ionicons
                        name="chevron-forward"
                        size={22}
                        color={colors.primary}
                        onPress={() => navigation.navigate('AdminProApprovals')}
                    />
                </View>
            </Card>

            <Card style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                    <View>
                        <Typography variant="h5" weight="bold">Content Moderation</Typography>
                        <Typography variant="caption" color="tertiary">Review flagged content reports</Typography>
                    </View>
                    <Ionicons
                        name="chevron-forward"
                        size={22}
                        color={colors.primary}
                        onPress={() => navigation.navigate('AdminModeration')}
                    />
                </View>
            </Card>
        </ScrollView>
    );
}

function MetricCard({ label, value, icon, colors }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap; colors: any }) {
    return (
        <Card style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name={icon} size={20} color="#F97316" />
            <Typography variant="h3" weight="bold">{value}</Typography>
            <Typography variant="caption" color="tertiary">{label}</Typography>
        </Card>
    );
}

function TrafficPill({ label, value, colors }: { label: string; value: number; colors: any }) {
    return (
        <View style={[styles.trafficPill, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Typography variant="caption" color="tertiary">{label}</Typography>
            <Typography variant="h5" weight="bold">{value}</Typography>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: spacing[5],
        paddingBottom: spacing[10],
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        marginBottom: spacing[5],
    },
    headerIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[3],
        marginBottom: spacing[4],
    },
    metricCard: {
        width: '47%',
        padding: spacing[5],
        gap: spacing[2],
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    card: {
        padding: spacing[5],
        marginBottom: spacing[4],
        borderRadius: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    trafficRow: {
        flexDirection: 'row',
        gap: spacing[3],
        marginVertical: spacing[4],
    },
    trafficPill: {
        flex: 1,
        padding: spacing[3],
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    emptyText: {
        marginTop: spacing[3],
    },
    requestRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[3],
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: spacing[3],
    },
    methodBadge: {
        width: 46,
        alignItems: 'center',
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: '#FFF7ED',
    },
    methodText: {
        color: '#F97316',
    },
    requestBody: {
        flex: 1,
    },
});
