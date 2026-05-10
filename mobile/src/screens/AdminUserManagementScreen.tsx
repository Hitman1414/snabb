import React, { useEffect, useState } from 'react';
import { 
    View, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    TextInput, 
    ActivityIndicator, 
    RefreshControl 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography, Card, Badge } from '../design-system/components';
import { useTheme } from '../design-system/ThemeContext';
import { spacing, borderRadius } from '../design-system/tokens';
import apiClient from '../services/api';
import { toastService } from '../services/toast.service';

type AdminUser = {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
    is_pro: boolean;
    is_ai_subscribed: boolean;
    ai_override: boolean;
    created_at: string;
};

export default function AdminUserManagementScreen() {
    const { colors } = useTheme();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const fetchUsers = async (query = '') => {
        try {
            const response = await apiClient.get(`/admin/users?q=${encodeURIComponent(query)}`);
            setUsers(response.data.users);
        } catch (error) {
            toastService.error('Failed to fetch users');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleOverride = async (userId: number) => {
        setActionLoading(userId);
        try {
            const response = await apiClient.post(`/ai/toggle-override/${userId}`);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ai_override: response.data.ai_override } : u));
            toastService.success(response.data.ai_override ? 'AI access granted' : 'AI access revoked');
        } catch (error) {
            toastService.error('Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <Typography variant="h5" weight="black">User Management</Typography>
                <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary }]}>
                    <Ionicons name="search" size={20} color={colors.textTertiary} />
                    <TextInput
                        placeholder="Search users..."
                        placeholderTextColor={colors.textTertiary}
                        value={search}
                        onChangeText={(text) => {
                            setSearch(text);
                            fetchUsers(text);
                        }}
                        style={[styles.searchInput, { color: colors.text }]}
                    />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(search); }} />
                }
            >
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : users.length === 0 ? (
                    <View style={styles.empty}>
                        <Typography color="tertiary">No users found</Typography>
                    </View>
                ) : (
                    users.map((user) => (
                        <Card key={user.id} style={[styles.userCard, { backgroundColor: colors.surface }]}>
                            <View style={styles.userHeader}>
                                <View style={[styles.avatar, { backgroundColor: colors.primary + '10' }]}>
                                    <Typography weight="black" color="primary">{user.username.charAt(0).toUpperCase()}</Typography>
                                </View>
                                <View style={styles.userInfo}>
                                    <Typography weight="bold">{user.username}</Typography>
                                    <Typography variant="caption" color="tertiary">{user.email}</Typography>
                                </View>
                                {user.is_admin && <Badge content="Admin" variant="info" size="sm" />}
                            </View>

                            <View style={styles.statusRow}>
                                <View style={styles.statusBadge}>
                                    {user.is_ai_subscribed ? (
                                        <View style={[styles.aiPill, { backgroundColor: '#ECFDF5' }]}>
                                            <MaterialCommunityIcons name="zap" size={12} color="#10B981" />
                                            <Typography variant="caption" weight="black" style={{ color: '#10B981', marginLeft: 4, fontSize: 10 }}>SUBSCRIBED</Typography>
                                        </View>
                                    ) : user.ai_override ? (
                                        <View style={[styles.aiPill, { backgroundColor: '#FFFBEB' }]}>
                                            <Ionicons name="shield-checkmark" size={12} color="#F59E0B" />
                                            <Typography variant="caption" weight="black" style={{ color: '#F59E0B', marginLeft: 4, fontSize: 10 }}>OVERRIDE</Typography>
                                        </View>
                                    ) : (
                                        <Typography variant="caption" color="tertiary" weight="bold">FREE TIER</Typography>
                                    )}
                                </View>
                                <Typography variant="caption" color="tertiary">Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Typography>
                            </View>

                            <TouchableOpacity 
                                onPress={() => handleToggleOverride(user.id)}
                                disabled={actionLoading === user.id}
                                style={[
                                    styles.actionButton, 
                                    { backgroundColor: user.ai_override ? '#FEF2F2' : '#F0FDF4' }
                                ]}
                            >
                                {actionLoading === user.id ? (
                                    <ActivityIndicator size="small" color={user.ai_override ? '#EF4444' : '#10B981'} />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons 
                                            name={user.ai_override ? "lock-open-remove" : "lock-open-check"} 
                                            size={18} 
                                            color={user.ai_override ? '#EF4444' : '#10B981'} 
                                        />
                                        <Typography 
                                            variant="caption" 
                                            weight="black" 
                                            style={{ 
                                                color: user.ai_override ? '#EF4444' : '#10B981', 
                                                marginLeft: 8,
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {user.ai_override ? 'Revoke AI Access' : 'Grant AI Access'}
                                        </Typography>
                                    </>
                                )}
                            </TouchableOpacity>
                        </Card>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: spacing[5],
        gap: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        height: 48,
        borderRadius: 12,
        gap: spacing[3],
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: spacing[4],
        paddingBottom: spacing[10],
    },
    empty: {
        padding: 40,
        alignItems: 'center',
    },
    userCard: {
        padding: spacing[5],
        borderRadius: 24,
        marginBottom: spacing[4],
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[4],
        marginBottom: spacing[4],
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userInfo: {
        flex: 1,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[5],
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    aiPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 12,
    }
});
