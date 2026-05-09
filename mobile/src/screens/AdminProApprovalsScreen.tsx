import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Image, Linking } from 'react-native';
import { Typography, Card, LoadingButton } from '../design-system/components';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/api';
import { toastService } from '../services/toast.service';
import { useTheme } from '../design-system/ThemeContext';
import { spacing } from '../design-system/tokens';

interface PendingPro {
    id: number;
    username: string;
    email: string;
    pro_category: string;
    pro_bio: string;
    id_card_url: string | null;
    created_at: string;
}

export default function AdminProApprovalsScreen() {
    const { colors } = useTheme();
    const [pendingPros, setPendingPros] = useState<PendingPro[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const fetchPendingPros = async () => {
        try {
            const response = await apiClient.get('/users/pending-pros');
            setPendingPros(response.data);
        } catch (error) {
            toastService.error("Failed to fetch pending pros");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingPros();
    }, []);

    const handleAction = async (userId: number, action: 'approve' | 'reject') => {
        setActionLoading(userId);
        try {
            await apiClient.post(`/users/${userId}/${action}-pro`);
            toastService.success(`Application ${action}d successfully`);
            setPendingPros(prev => prev.filter(p => p.id !== userId));
        } catch (error) {
            toastService.error(`Failed to ${action} pro application`);
        } finally {
            setActionLoading(null);
        }
    };

    const renderItem = ({ item }: { item: PendingPro }) => (
        <Card style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.userSection}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                        <Typography variant="h5" weight="bold" style={{ color: colors.primary }}>
                            {item.username.charAt(0).toUpperCase()}
                        </Typography>
                    </View>
                    <View style={styles.userInfo}>
                        <Typography variant="body" weight="bold">{item.username}</Typography>
                        <Typography variant="caption" color="secondary">{item.email}</Typography>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
                    <Typography variant="caption" weight="bold" style={{ color: colors.warning, fontSize: 10, textTransform: 'uppercase' }}>
                        Pending
                    </Typography>
                </View>
            </View>

            <View style={[styles.infoSection, { backgroundColor: colors.surfaceVariant }]}>
                <Typography variant="caption" weight="bold" style={styles.sectionLabel}>Category</Typography>
                <Typography variant="bodySmall" weight="bold">{item.pro_category}</Typography>
            </View>

            <View style={styles.bioSection}>
                <Typography variant="caption" weight="bold" style={styles.sectionLabel}>Professional Bio</Typography>
                <Typography variant="bodySmall" style={{ fontStyle: 'italic' }} color="secondary">
                    {item.pro_bio}
                </Typography>
            </View>

            <View style={styles.idSection}>
                <Typography variant="caption" weight="bold" style={[styles.sectionLabel, { marginBottom: spacing[2] }]}>
                    <Ionicons name="id-card" size={12} style={{ marginRight: 4 }} /> ID Document
                </Typography>
                {item.id_card_url ? (
                    <LoadingButton 
                        title="View ID Document" 
                        variant="outline" 
                        onPress={() => Linking.openURL(item.id_card_url as string)} 
                    />
                ) : (
                    <Typography variant="caption" color="error">No ID uploaded</Typography>
                )}
            </View>

            <View style={styles.actionButtons}>
                <LoadingButton
                    title="Reject"
                    variant="outline"
                    loading={actionLoading === item.id}
                    onPress={() => handleAction(item.id, 'reject')}
                    style={[styles.actionBtn, { borderColor: colors.error }]}
                    textStyle={{ color: colors.error }}
                />
                <LoadingButton
                    title="Approve"
                    loading={actionLoading === item.id}
                    onPress={() => handleAction(item.id, 'approve')}
                    style={styles.actionBtn}
                />
            </View>
        </Card>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary || '#F8FAFC' }]}>
            <FlatList
                data={pendingPros}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                        <Typography variant="body" weight="bold" style={{ marginTop: 12 }} color="secondary">
                            No pending pro applications.
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
    listContainer: {
        padding: spacing[4],
        paddingBottom: spacing[10],
    },
    card: {
        marginBottom: spacing[4],
        padding: spacing[4],
        borderRadius: 20,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing[4],
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userInfo: {
        marginLeft: spacing[3],
    },
    statusBadge: {
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        borderRadius: 8,
    },
    infoSection: {
        padding: spacing[3],
        borderRadius: 12,
        marginBottom: spacing[3],
    },
    sectionLabel: {
        color: '#9CA3AF',
        textTransform: 'uppercase',
        fontSize: 10,
        marginBottom: 2,
    },
    bioSection: {
        marginBottom: spacing[4],
    },
    idSection: {
        marginBottom: spacing[5],
    },
    actionButtons: {
        flexDirection: 'row',
        gap: spacing[3],
        marginTop: spacing[2],
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: spacing[4],
    },
    actionBtn: {
        flex: 1,
        borderRadius: 12,
    }
});
