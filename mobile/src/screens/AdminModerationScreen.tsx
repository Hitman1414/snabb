import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Typography, Card } from '../design-system/components';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/api';

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
                console.error("Failed to fetch moderation logs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const renderLog = ({ item }: { item: ModerationLog }) => (
        <Card style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.userSection}>
                    <Ionicons name="person-circle" size={24} color="#EF4444" />
                    <View style={styles.userInfo}>
                        <Typography variant="body" weight="bold">{item.username}</Typography>
                        <Typography variant="caption" style={{ color: '#6B7280' }}>{item.email}</Typography>
                    </View>
                </View>
                <View style={styles.platformBadge}>
                    <Ionicons 
                        name={item.platform === 'mobile' ? 'phone-portrait' : 'globe'} 
                        size={12} 
                        color="#EF4444" 
                    />
                    <Typography variant="caption" weight="bold" style={{ color: '#EF4444', marginLeft: 4, textTransform: 'uppercase', fontSize: 10 }}>
                        {item.platform}
                    </Typography>
                </View>
            </View>

            <View style={styles.contentSection}>
                <Typography variant="caption" weight="bold" style={{ color: '#EF4444', marginBottom: 4, textTransform: 'uppercase' }}>
                    Type: {item.content_type.replace('_', ' ')}
                </Typography>
                <Typography variant="bodySmall" style={{ fontStyle: 'italic', color: '#374151' }}>
                    &quot;{item.content_text}&quot;
                </Typography>
            </View>

            <View style={styles.reasonSection}>
                <Ionicons name="warning" size={16} color="#B91C1C" />
                <Typography variant="caption" weight="bold" style={{ color: '#B91C1C', marginLeft: 6 }}>
                    {item.flagged_reason}
                </Typography>
            </View>
        </Card>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#EF4444" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="shield-checkmark" size={32} color="#EF4444" />
                <Typography variant="h3" weight="bold" style={{ color: '#111827', marginLeft: 12 }}>
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
                        <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                        <Typography variant="body" weight="bold" style={{ marginTop: 12, color: '#6B7280' }}>
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
        backgroundColor: '#F3F4F6',
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
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    listContainer: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FCA5A5',
        backgroundColor: '#FEF2F2',
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
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    contentSection: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    reasonSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FECACA',
        padding: 8,
        borderRadius: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    }
});
