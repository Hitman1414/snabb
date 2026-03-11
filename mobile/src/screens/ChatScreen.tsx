import React, { useState, useEffect, useRef } from 'react';
import {
    View, FlatList, StyleSheet, KeyboardAvoidingView, Platform,
    TouchableOpacity, TextInput, ScrollView, Animated, Pressable
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../design-system/ThemeContext';
import { Typography, SkeletonGroup } from '../design-system/components';
import { spacing, borderRadius } from '../design-system/tokens';
import { Ionicons } from '@expo/vector-icons';
import { useConversation, useSendMessage, useMarkMessagesRead } from '../hooks/useMessages';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useChatSocket } from '../hooks/useChatSocket';
import { Message } from '../types';
import { messageSchema } from '../lib/validation';
import { z } from 'zod';
import { toastService } from '../services/toast.service';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

// ─── Emoji Data ──────────────────────────────────────────────────────────────
const EMOJI_CATEGORIES = [
    {
        label: '😀',
        name: 'Smileys',
        emojis: [
            '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃',
            '😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
            '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔',
            '🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥',
            '😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤧',
            '🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐',
            '😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦',
            '😧','😨','😰','😥','😢','😭','😱','😖','😣','😞',
            '😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿',
        ]
    },
    {
        label: '👋',
        name: 'Gestures',
        emojis: [
            '👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞',
            '🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍',
            '👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝',
            '🙏','✍️','💅','🤳','💪','🦾','🦵','🦶','👂','🦻',
            '👃','🧠','🦷','🦴','👀','👁️','👅','👄','💋','🩸',
        ]
    },
    {
        label: '❤️',
        name: 'Hearts',
        emojis: [
            '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
            '❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️',
            '✝️','☯️','🕉️','🔯','♈','♉','♊','♋','♌','♍',
            '🌈','✨','⚡','🔥','💫','⭐','🌟','💥','❄️','🌊',
        ]
    },
    {
        label: '🎉',
        name: 'Activities',
        emojis: [
            '🎉','🎊','🎈','🎂','🎁','🎀','🎗️','🎟️','🎫','🏆',
            '🥇','🥈','🥉','🏅','🎖️','🥊','🥋','⚽','🏀','🏈',
            '⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒',
            '🎯','🎮','🕹️','🎲','🧩','🎸','🎺','🎻','🥁','🎷',
        ]
    },
    {
        label: '🌍',
        name: 'Nature',
        emojis: [
            '🌍','🌎','🌏','🌐','🗺️','🏔️','⛰️','🌋','🗻','🏕️',
            '🌅','🌄','🌠','🎇','🌌','🌁','🌉','🌃','🏙️','🌆',
            '🌇','🌉','🌌','🌉','🌿','🍀','🌱','🌲','🌳','🌴',
            '🌵','🎋','🎍','🍃','🐶','🐱','🐭','🐹','🐰','🦊',
            '🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈',
        ]
    },
    {
        label: '🍕',
        name: 'Food',
        emojis: [
            '🍕','🍔','🍟','🌭','🍿','🧂','🥓','🥚','🍳','🧇',
            '🥞','🧈','🧀','🥗','🥘','🍲','🥣','🥙','🌮','🌯',
            '🫔','🍱','🍣','🍜','🍝','🍛','🍚','🍙','🍘','🍥',
            '🥮','🍢','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍩',
            '🍪','🌰','🥜','🍯','☕','🧃','🥤','🧋','🍵','🫖',
        ]
    },
    {
        label: '🚀',
        name: 'Travel',
        emojis: [
            '🚀','✈️','🚂','🚃','🚄','🚅','🚆','🚇','🚈','🚉',
            '🚊','🚝','🚞','🚋','🚌','🚍','🚎','🚐','🚑','🚒',
            '🚓','🚔','🚕','🚖','🚗','🚘','🚙','🛻','🚚','🚛',
            '🚜','🏎️','🏍️','🛵','🚲','🛴','🛹','🚏','🛣️','🛤️',
            '⛽','🚧','🚦','🚥','🛑','⚓','🚢','⛵','🛥️','🚤',
        ]
    },
    {
        label: '💼',
        name: 'Objects',
        emojis: [
            '💼','👜','👛','👓','🕶️','🥽','🌂','☂️','🧵','🧶',
            '💎','💍','👑','🔮','🪄','🔭','🔬','💊','💉','🩺',
            '📱','💻','⌨️','🖥️','🖨️','🖱️','🖲️','📷','📸','📹',
            '📺','📻','🎙️','📡','🔋','💡','🔦','🕯️','🪔','🔑',
            '🔒','🔓','🔨','⚒️','🛠️','⛏️','🪝','🔧','🔩','⚙️',
        ]
    },
];

const EMOJI_PER_ROW = 8;

export default function ChatScreen() {
    const { colors } = useTheme();
    const route = useRoute<ChatScreenRouteProp>();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { otherUserId, otherUserName, askId, askTitle } = route.params;
    const { user } = useAuth();

    const [message, setMessage] = useState('');
    const [showEmojis, setShowEmojis] = useState(false);
    const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
    const inputRef = useRef<TextInput>(null);
    const flatListRef = useRef<FlatList>(null);
    const emojiPanelHeight = useRef(new Animated.Value(0)).current;

    const { data: messages, isLoading } = useConversation(otherUserId, askId);
    const { isConnected } = useChatSocket(askId);
    const sendMessageMutation = useSendMessage();
    const markReadMutation = useMarkMessagesRead();

    useEffect(() => {
        if (askId) markReadMutation.mutate(askId);
    }, [askId]);

    const toggleEmojiPanel = () => {
        if (showEmojis) {
            Animated.timing(emojiPanelHeight, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }).start(() => setShowEmojis(false));
            inputRef.current?.focus();
        } else {
            inputRef.current?.blur();
            setShowEmojis(true);
            Animated.timing(emojiPanelHeight, {
                toValue: 280,
                duration: 220,
                useNativeDriver: false,
            }).start();
        }
    };

    const insertEmoji = (emoji: string) => {
        setMessage(prev => prev + emoji);
    };

    const handleSend = async () => {
        try {
            const validatedData = messageSchema.parse({
                content: message.trim(),
            });

            await sendMessageMutation.mutateAsync({
                receiver_id: otherUserId,
                content: validatedData.content,
                ask_id: askId,
            });
            setMessage('');
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                toastService.error(error.issues[0].message);
            } else {
                console.error('Failed to send message', error);
                toastService.error('Failed to send message');
            }
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.sender_id === user?.id;
        return (
            <View style={[
                styles.messageContainer,
                isMe ? styles.myMessage : styles.theirMessage,
                { backgroundColor: isMe ? colors.primary : colors.surfaceVariant }
            ]}>
                <Typography variant="body" color={isMe ? 'inverse' : 'primary'}>
                    {item.content}
                </Typography>
                <Typography
                    variant="caption"
                    color={isMe ? 'inverse' : 'secondary'}
                    style={styles.timestamp}
                >
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
            </View>
        );
    };

    const Header = (
        <View style={[styles.header, {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: insets.top + spacing[3],
        }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Typography variant="h6" weight="bold">{otherUserName}</Typography>
                    <View style={{ 
                        width: 8, height: 8, borderRadius: 4, 
                        backgroundColor: isConnected ? '#4CAF50' : '#FF9800',
                        marginLeft: spacing[2]
                    }} />
                </View>
                <Typography variant="caption" color="secondary" numberOfLines={1}>{askTitle}</Typography>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {Header}
                <View style={{ padding: spacing[4] }}>
                    <SkeletonGroup variant="list" count={5} />
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {Header}

            <FlatList
                ref={flatListRef}
                data={messages ? [...messages].reverse() : []}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                inverted
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                onScrollBeginDrag={() => {
                    if (showEmojis) toggleEmojiPanel();
                }}
            />

            {/* Input bar */}
            <View style={[styles.inputContainer, {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                paddingBottom: showEmojis ? spacing[3] : Math.max(insets.bottom, spacing[3]),
            }]}>
                {/* Emoji toggle button */}
                <TouchableOpacity onPress={toggleEmojiPanel} style={styles.emojiToggle} activeOpacity={0.7}>
                    <Ionicons
                        name={showEmojis ? 'keypad-outline' : 'happy-outline'}
                        size={24}
                        color={showEmojis ? colors.primary : colors.textTertiary}
                    />
                </TouchableOpacity>

                <TextInput
                    ref={inputRef}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.textTertiary}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    maxLength={1000}
                    style={[styles.input, {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                    }]}
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                    blurOnSubmit={false}
                    onFocus={() => {
                        if (showEmojis) {
                            Animated.timing(emojiPanelHeight, { toValue: 0, duration: 150, useNativeDriver: false }).start(() => setShowEmojis(false));
                        }
                    }}
                />

                <TouchableOpacity
                    onPress={handleSend}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    style={[
                        styles.sendButton,
                        { backgroundColor: message.trim() ? colors.primary : colors.border }
                    ]}
                    activeOpacity={0.8}
                >
                    <Ionicons name="send" size={18} color={message.trim() ? '#fff' : colors.textTertiary} />
                </TouchableOpacity>
            </View>

            {/* Emoji Panel */}
            {showEmojis && (
                <Animated.View style={[styles.emojiPanel, {
                    height: emojiPanelHeight,
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    paddingBottom: insets.bottom,
                }]}>
                    {/* Category tabs */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={[styles.categoryTabs, { borderBottomColor: colors.border }]}
                        contentContainerStyle={{ paddingHorizontal: spacing[2] }}
                    >
                        {EMOJI_CATEGORIES.map((cat, i) => (
                            <TouchableOpacity
                                key={cat.name}
                                onPress={() => setActiveEmojiCategory(i)}
                                style={[
                                    styles.categoryTab,
                                    activeEmojiCategory === i && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                                ]}
                            >
                                <Typography variant="h5">{cat.label}</Typography>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Emoji grid */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.emojiGrid}
                        keyboardShouldPersistTaps="always"
                    >
                        {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map((emoji, i) => (
                            <Pressable
                                key={`${emoji}-${i}`}
                                onPress={() => insertEmoji(emoji)}
                                style={({ pressed }) => [
                                    styles.emojiCell,
                                    pressed && { backgroundColor: colors.border, borderRadius: 8 }
                                ]}
                            >
                                <Typography variant="h4">{emoji}</Typography>
                            </Pressable>
                        ))}
                    </ScrollView>
                </Animated.View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[3],
        borderBottomWidth: 1,
    },
    backButton: { marginRight: spacing[3] },
    listContent: {
        padding: spacing[4],
        paddingBottom: spacing[2],
    },
    messageContainer: {
        maxWidth: '80%',
        padding: spacing[3],
        borderRadius: borderRadius.lg,
        marginBottom: spacing[2],
    },
    myMessage: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: borderRadius.sm,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: borderRadius.sm,
    },
    timestamp: {
        alignSelf: 'flex-end',
        marginTop: spacing[1],
        opacity: 0.8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: spacing[2],
        paddingTop: spacing[2],
        borderTopWidth: 1,
    },
    emojiToggle: {
        width: 40,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[1],
    },
    input: {
        flex: 1,
        marginRight: spacing[2],
        maxHeight: 100,
        minHeight: 44,
        borderWidth: 1,
        borderRadius: 22,
        paddingHorizontal: spacing[4],
        paddingVertical: Platform.OS === 'ios' ? spacing[3] : spacing[2],
        fontSize: 15,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Emoji panel
    emojiPanel: {
        overflow: 'hidden',
        borderTopWidth: 1,
    },
    categoryTabs: {
        flexGrow: 0,
        borderBottomWidth: 1,
    },
    categoryTab: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[2],
    },
    emojiCell: {
        width: `${100 / 8}%`,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
});
