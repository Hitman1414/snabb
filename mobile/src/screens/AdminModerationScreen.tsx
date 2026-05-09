import React, { useEffect, useState } from 'react';
import { logger } from '../services/logger';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Typography, Card } from '../design-system/components';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/api';
import { useTheme } from '../design-system/ThemeContext';

interface ModerationLog {
    id: number;
    user_id: number;
    username: string;
    email: string;
    content_type: string;
    content_text: string;
    flagged_reason: string;
    platform: string;
    created_at: string;
}

export default function AdminModerationScreen() {
    const { colors } = useTheme();
    const [logs, setLogs] = useState<ModerationLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await apiClient.get('/admin/moderation-logs');
                if (response.data?.success) {
                    setLogs(response.data.logs);
                }
            } catch (error) {
                logger.error("Failed to fetch moderation logs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const renderLog = ({ item }: { item: ModerationLog }) => (
        <Card style={[styles.card, { backgroundColor: colors.error + '05', borderColor: colors.error + '40' }]}>
            <View style={styles.headerRow}>
                <View style={styles.userSection}>
                    <Ionicons name="person-circle" size={24} color={colors.error} />
                    <View style={styles.userInfo}>
                        <Typography variant="body" weight="bold">{item.username}</Typography>
                        <Typography variant="caption" color="tertiary">{item.email}</Typography>
                    </View>
                </View>
                <View style={[styles.platformBadge, { backgroundColor: colors.error + '15' }]}>
                    <Ionicons 
                        name={item.platform === 'mobile' ? 'phone-portrait' : 'globe'} 
                        size={12} 
                        color={colors.error} 
                    />
                    <Typography variant="caption" weight="bold" style={{ color: colors.error, marginLeft: 4, textTransform: 'uppercase', fontSize: 10 }}>
                        {item.platform}
                    </Typography>
                </View>
            </View>

            <View style={[styles.contentSection, { backgroundColor: colors.surface, borderColor: colors.error + '40' }]}>
                <Typography variant="caption" weight="bold" style={{ color: colors.error, marginBottom: 4, textTransform: 'uppercase' }}>
                    Type: {item.content_type.replace('_', ' ')}
                </Typography>
                <Typography variant="bodySmall" style={{ fontStyle: 'italic' }}>
                    &quot;{item.content_text}&quot;
                </Typography>
            </View>

            <View style={[styles.reasonSection, { backgroundColor: colors.error + '20' }]}>
                <Ionicons name="warning" size={16} color={colors.error} />
                <Typography variant="caption" weight="bold" style={{ color: colors.error, marginLeft: 6 }}>
                    {item.flagged_reason}
                </Typography>
            </View>
        </Card>
    );

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.backgroundSecondary || '#F8FAFC' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary || '#F8FAFC' }]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <Ionicons name="shield-checkmark" size={32} color={colors.error} />
                <Typography variant="h3" weight="bold" style={{ marginLeft: 12 }}>
                    Flagged Content
                </Typography>
            </View>
            <FlatList
                data={logs}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderLog}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                        <Typography variant="body" weight="bold" style={{ marginTop: 12 }} color="secondary">
                            No flagged content!
                        </Typography>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        paddingTop: 60,
        borderBottomWidth: 1,
    },
    listContainer: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
        padding: 16,
        borderWidth: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userInfo: {
        marginLeft: 8,
    },
    platformBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    contentSection: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
    },
    reasonSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    }
});
