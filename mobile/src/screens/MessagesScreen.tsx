import React, { useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../design-system/ThemeContext';
import { Typography, Card, SkeletonGroup, EmptyState, Badge } from '../design-system/components';
import { spacing, borderRadius } from '../design-system/tokens';
import { useConversations } from '../hooks/useMessages';
import { Conversation } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { CATEGORY_THEMES } from '../constants/categories';

export default function MessagesScreen() {
    const { colors, colorScheme } = useTheme();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    
    const {
        data: conversations,
        isLoading,
        refetch,
        isRefetching
    } = useConversations();

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
            style={[
                styles.card, 
                { backgroundColor: colors.surface },
                viewMode === 'grid' && { flexDirection: 'column', flex: 1, marginHorizontal: spacing[1] }
            ]}
            onPress={() => handleConversationPress(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.cardImage, { backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, viewMode === 'grid' && { width: '100%', height: 100, marginBottom: spacing[2] }]}>
                {/* Essence Background Glow */}
                <LinearGradient
                    colors={(CATEGORY_THEMES[item.ask.category] as any)?.gradient || [colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { opacity: colorScheme === 'dark' ? 0.15 : 0.08 }]}
                />
                {/* Watermarks */}
                <Ionicons 
                    name={(CATEGORY_THEMES[item.ask.category] as any)?.name || 'chatbubbles-outline'} 
                    size={80} 
                    color={colors.text} 
                    style={{ position: 'absolute', right: -15, bottom: -20, opacity: colorScheme === 'dark' ? 0.06 : 0.04, transform: [{ rotate: '15deg' }] }} 
                />
                <Ionicons 
                    name={(CATEGORY_THEMES[item.ask.category] as any)?.name || 'chatbubbles-outline'} 
                    size={60} 
                    color={colors.text} 
                    style={{ position: 'absolute', left: -10, top: -10, opacity: colorScheme === 'dark' ? 0.04 : 0.03, transform: [{ rotate: '-15deg' }] }} 
                />
                <LinearGradient
                    colors={(CATEGORY_THEMES[item.ask.category] as any)?.gradient || [colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        width: viewMode === 'grid' ? 56 : 64,
                        height: viewMode === 'grid' ? 56 : 64,
                        borderRadius: viewMode === 'grid' ? 28 : 32,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: (CATEGORY_THEMES[item.ask.category] as any)?.color || colors.primary,
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                    }}
                >
                    <Ionicons name={(CATEGORY_THEMES[item.ask.category] as any)?.name || 'chatbubbles-outline'} size={viewMode === 'grid' ? 28 : 32} color="#FFFFFF" />
                </LinearGradient>
                {item.unread_count > 0 && (
                    <View style={[styles.unreadDot, { backgroundColor: colors.error }]} />
                )}
            </View>

            <View style={[styles.cardContent, viewMode === 'grid' && { paddingLeft: 0 }]}>
                <View style={[styles.cardHeader, viewMode === 'grid' && { flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <Typography variant="h6" weight="bold" numberOfLines={1} style={[styles.cardTitle, viewMode === 'grid' && { marginRight: 0, marginBottom: spacing[1], fontSize: 13, lineHeight: 16 }]}>
                        {item.other_user.username}
                    </Typography>
                    <Typography variant="caption" color="tertiary" style={viewMode === 'grid' ? { fontSize: 9 } : undefined}>
                        {new Date(item.last_message.created_at).toLocaleDateString()}
                    </Typography>
                </View>

                <View style={styles.askContext}>
                    <Typography variant="caption" color="primary" weight="bold" numberOfLines={1} style={viewMode === 'grid' ? { fontSize: 9 } : undefined}>
                        Re: {item.ask.title}
                    </Typography>
                </View>

                {viewMode === 'list' && (
                    <Typography variant="bodySmall" color="secondary" numberOfLines={1} style={styles.messagePreview}>
                        {item.last_message.sender_id === item.other_user.id ? '' : 'You: '}
                        {item.last_message.content}
                    </Typography>
                )}

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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Image 
                    source={require('../../assets/snabb-icon.svg')} 
                    style={{ width: 32, height: 32, marginRight: 8 }} 
                    contentFit="contain" 
                />
                <Typography variant="h3" weight="bold">Messages</Typography>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Typography variant="bodySmall" color="secondary">Your active conversations</Typography>
                
                {/* Grid / List View Toggle */}
                <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceVariant, borderRadius: 12, padding: 4 }}>
                    <TouchableOpacity 
                        style={{ padding: 6, borderRadius: 8, backgroundColor: viewMode === 'grid' ? colors.surface : 'transparent' }}
                        onPress={() => setViewMode('grid')}
                    >
                        <Ionicons name="grid" size={16} color={viewMode === 'grid' ? colors.primary : colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={{ padding: 6, borderRadius: 8, backgroundColor: viewMode === 'list' ? colors.surface : 'transparent' }}
                        onPress={() => setViewMode('list')}
                    >
                        <Ionicons name="list" size={16} color={viewMode === 'list' ? colors.primary : colors.textTertiary} />
                    </TouchableOpacity>
                </View>
            </View>
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
                key={viewMode}
                numColumns={viewMode === 'grid' ? 2 : 1}
                keyExtractor={(item) => `${item.other_user.id}-${item.ask.id}`}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing[4] }]}
                columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'space-between', paddingHorizontal: spacing[2] } : undefined}
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
