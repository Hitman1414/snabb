import React from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../design-system/ThemeContext';
import { Typography, Card, Badge } from '../design-system/components';
import { spacing, borderRadius } from '../design-system/tokens';
import { useNotifications } from '../hooks/useNotifications';
import { Notification } from '../types';

export default function NotificationsScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation<any>();
    const {
        notifications,
        isLoading,
        refetch,
        markAsRead,
        markAllAsRead,
    } = useNotifications();

    const handleNotificationPress = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        // Navigation logic based on type
        if (notification.type === 'NEW_MESSAGE' && notification.data?.ask_id) {
            navigation.navigate('Chat', {
                askId: notification.data.ask_id,
                otherUserId: notification.data.sender_id,
            });
        } else if (notification.data?.ask_id) {
            navigation.navigate('AskDetail', { askId: notification.data.ask_id });
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'NEW_BID':
                return { name: 'cash-outline', color: '#1AB64F' };
            case 'BID_ACCEPTED':
                return { name: 'checkmark-circle-outline', color: '#1AB64F' };
            case 'SHORTLISTED':
                return { name: 'star-outline', color: '#FFD700' };
            case 'NEW_MESSAGE':
                return { name: 'chatbubble-outline', color: colors.primary };
            default:
                return { name: 'notifications-outline', color: colors.textSecondary };
        }
    };

    const renderItem = ({ item }: { item: Notification }) => {
        const icon = getIcon(item.type);
        
        return (
            <TouchableOpacity 
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
            >
                <Card 
                    style={[
                        styles.notificationCard, 
                        !item.is_read && { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }
                    ]}
                    variant={item.is_read ? 'outlined' : 'elevated'}
                >
                    <View style={styles.cardContent}>
                        <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
                            <Ionicons name={icon.name as any} size={24} color={icon.color} />
                        </View>
                        
                        <View style={styles.textContainer}>
                            <View style={styles.headerRow}>
                                <Typography variant="body" weight="bold" style={styles.title}>
                                    {item.title}
                                </Typography>
                                {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                            </View>
                            
                            <Typography variant="bodySmall" color="secondary" numberOfLines={2}>
                                {item.body}
                            </Typography>
                            
                            <Typography variant="caption" color="tertiary" style={styles.time}>
                                {new Date(item.created_at).toLocaleString()}
                            </Typography>
                        </View>
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    if (isLoading && notifications.length === 0) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Typography variant="h2">Notifications</Typography>
                {notifications.some(n => !n.is_read) && (
                    <TouchableOpacity onPress={() => markAllAsRead()}>
                        <Typography variant="bodySmall" color="primary" weight="medium">
                            Mark all as read
                        </Typography>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={64} color={colors.textTertiary} />
                        <Typography variant="h3" color="secondary" style={styles.emptyTitle}>
                            No notifications yet
                        </Typography>
                        <Typography variant="body" color="tertiary" style={styles.emptyText}>
                            We'll notify you when something important happens!
                        </Typography>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
    },
    listContent: {
        padding: spacing[4],
        paddingBottom: spacing[10],
    },
    notificationCard: {
        marginBottom: spacing[3],
        padding: spacing[3],
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing[3],
    },
    textContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[1],
    },
    title: {
        flex: 1,
        marginRight: spacing[2],
    },
    unreadDot: {
        width: 8,
        height: 8,
        minWidth: 8,
        borderRadius: 4,
        padding: 0,
    },
    time: {
        marginTop: spacing[1],
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing[10] * 2,
    },
    emptyTitle: {
        marginTop: spacing[4],
    },
    emptyText: {
        textAlign: 'center',
        marginTop: spacing[2],
        paddingHorizontal: spacing[10],
    },
});
