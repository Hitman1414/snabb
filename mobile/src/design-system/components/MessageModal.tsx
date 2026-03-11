import React, { useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Typography } from './Typography';
import { LoadingButton } from './LoadingButton';
import { useTheme } from '../ThemeContext';
import { spacing, borderRadius } from '../tokens';
import { Ionicons } from '@expo/vector-icons';
import { Input } from './Input';
import { useSendMessage } from '../../hooks/useMessages';
import { messageSchema } from '../../lib/validation';
import { z } from 'zod';
import { toastService } from '../../services/toast.service';

interface MessageModalProps {
    visible: boolean;
    onClose: () => void;
    receiverId: number;
    receiverName: string;
    askId?: number;
}

export const MessageModal: React.FC<MessageModalProps> = ({
    visible,
    onClose,
    receiverId,
    receiverName,
    askId,
}) => {
    const { colors } = useTheme();
    const [message, setMessage] = useState('');
    const sendMessageMutation = useSendMessage();

    const handleSend = async () => {
        try {
            const validatedData = messageSchema.parse({
                content: message.trim(),
            });

            await sendMessageMutation.mutateAsync({
                receiver_id: receiverId,
                content: validatedData.content,
                ask_id: askId,
            });
            setMessage('');
            onClose();
            toastService.success('Message sent');
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                toastService.error(error.issues[0].message);
            } else {
                console.error('Failed to send message', error);
                toastService.error('Failed to send message');
            }
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={[styles.container, { backgroundColor: colors.surface }]}>
                    <View style={styles.header}>
                        <Typography variant="h6">Message to {receiverName}</Typography>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Input
                        placeholder="Type your message..."
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        numberOfLines={4}
                        style={{ marginBottom: spacing[4], minHeight: 100 }}
                        autoFocus
                    />

                    <LoadingButton
                        title="Send Message"
                        onPress={handleSend}
                        loading={sendMessageMutation.isPending}
                        disabled={!message.trim()}
                        fullWidth
                    />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing[4],
        paddingBottom: Platform.OS === 'ios' ? spacing[8] : spacing[4],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[4],
    },
});
