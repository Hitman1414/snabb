import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../design-system/ThemeContext';
import { Typography, Card, SkeletonGroup, EmptyState, Badge } from '../design-system/components';
import { spacing, borderRadius } from '../design-system/tokens';
import { useConversations } from '../hooks/useMessages';
import { Conversation } from '../types';
import { Ionicons } from '@expo/vector-icons';

import { CATEGORY_ICONS } from '../constants/categories';

export default function MessagesScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    
    const {
        data: conversations,
        isLoading,
        refetch,
        isRefetching
    } = useConversations();

    const handleConversationPress = (conversation: Conversation) => {
        navigation.navigate('Chat', {
            otherUserId: conversation.other_user.id,
            otherUserName: conversation.other_user.username,
            askId: conversation.ask.id,
            askTitle: conversation.ask.title
        });
    };

    const renderItem = ({ item }: { item: Conversation }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={() => handleConversationPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardImage}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons 
                        name={(CATEGORY_ICONS[item.ask.category] as any)?.name || 'chatbubbles-outline'} 
                        size={40} 
                        color={(CATEGORY_ICONS[item.ask.category] as any)?.color || colors.primary} 
                    />
                </View>
                {item.unread_count > 0 && (
                    <View style={[styles.unreadDot, { backgroundColor: colors.error }]} />
                )}
            </View>

            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Typography variant="h6" weight="bold" numberOfLines={1} style={styles.cardTitle}>
                        {item.other_user.username}
                    </Typography>
                    <Typography variant="caption" color="tertiary">
                        {new Date(item.last_message.created_at).toLocaleDateString()}
                    </Typography>
                </View>

                <View style={styles.askContext}>
                    <Typography variant="caption" color="primary" weight="bold" numberOfLines={1}>
                        Re: {item.ask.title}
                    </Typography>
                </View>

                <Typography variant="bodySmall" color="secondary" numberOfLines={1} style={styles.messagePreview}>
                    {item.last_message.sender_id === item.other_user.id ? '' : 'You: '}
                    {item.last_message.content}
                </Typography>

                <View style={styles.cardFooter}>
                    <View style={styles.statusRow}>
                        <Ionicons 
                            name={item.last_message.sender_id === item.other_user.id ? 'arrow-down-outline' : 'send-outline'} 
                            size={12} 
                            color={colors.textTertiary} 
                        />
                        <Typography variant="caption" color="tertiary" style={{ marginLeft: 4 }}>
                            {item.last_message.sender_id === item.other_user.id ? 'Received' : 'Sent'}
                        </Typography>
                    </View>
                    {item.unread_count > 0 && (
                        <Badge
                            label={`${item.unread_count} NEW`}
                            variant="error"
                            size="sm"
                        />
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <Typography variant="h3" weight="bold">Messages</Typography>
            <Typography variant="bodySmall" color="secondary">Your active conversations</Typography>
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <View style={{ height: 32, width: '50%', backgroundColor: colors.border, borderRadius: 4, marginBottom: 8 }} />
                    <View style={{ height: 16, width: '70%', backgroundColor: colors.border, borderRadius: 4 }} />
                </View>
                <View style={{ padding: spacing[4] }}>
                    <SkeletonGroup variant="card" count={5} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <FlatList
                data={conversations}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                keyExtractor={(item) => `${item.other_user.id}-${item.ask.id}`}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing[4] }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={isRefetching} 
                        onRefresh={refetch}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    <EmptyState
                        title="No Messages"
                        description="Your conversations will appear here."
                        icon="chatbubbles-outline"
                        style={{ marginTop: spacing[10] }}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: spacing[4],
        paddingTop: spacing[6],
        paddingBottom: spacing[4],
    },
    listContent: {
        paddingHorizontal: spacing[4],
        paddingTop: spacing[2],
    },
    card: {
        marginBottom: spacing[4],
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        padding: spacing[3],
        borderWidth: 1,
        borderColor: '#F0F2F5',
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
        backgroundColor: '#F3F4F6',
        position: 'relative',
    },
    unreadDot: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    cardContent: {
        flex: 1,
        paddingLeft: spacing[3],
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        flex: 1,
        marginRight: spacing[2],
    },
    askContext: {
        backgroundColor: '#F7C30110',
        paddingHorizontal: spacing[2],
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginVertical: 4,
        maxWidth: '100%',
    },
    messagePreview: {
        marginTop: 2,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
