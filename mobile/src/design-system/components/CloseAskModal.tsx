import React, { useState } from 'react';
import { logger } from '../../services/logger';
import { View, Modal, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Typography } from './Typography';
import { LoadingButton } from './LoadingButton';
import { Card } from './Card';
import { useTheme } from '../ThemeContext';
import { spacing, borderRadius } from '../tokens';
import { Ionicons } from '@expo/vector-icons';
import { useCloseAsk } from '../../hooks/useAsks';
import { Response } from '../../types';

interface CloseAskModalProps {
    visible: boolean;
    onClose: () => void;
    askId: number;
    responses: Response[];
}

export const CloseAskModal: React.FC<CloseAskModalProps> = ({
    visible,
    onClose,
    askId,
    responses,
}) => {
    const { colors } = useTheme();
    const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
    const closeAskMutation = useCloseAsk();

    const handleCloseAsk = async () => {
        try {
            await closeAskMutation.mutateAsync({
                askId,
                serverId: selectedServerId || undefined
            });
            onClose();
        } catch (error) {
            logger.error('Failed to close ask', error);
        }
    };

    // Filter unique users from responses
    const uniqueResponders = Array.from(
        new Map(responses.map(r => [r.user_id, r.user])).values()
    ).filter(Boolean);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.surface }]}>
                    <View style={styles.header}>
                        <Typography variant="h6">Close Ask</Typography>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Typography variant="body" color="secondary" style={{ marginBottom: spacing[4] }}>
                        Who fulfilled this ask? Select the server to give them credit.
                    </Typography>

                    <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: spacing[4] }}>
                        {uniqueResponders.map((responder) => (
                            <TouchableOpacity
                                key={responder!.id}
                                onPress={() => setSelectedServerId(responder!.id)}
                            >
                                <Card
                                    variant={selectedServerId === responder!.id ? 'elevated' : 'outlined'}
                                    style={[
                                        styles.responderCard,
                                        selectedServerId === responder!.id && { borderColor: colors.primary, borderWidth: 2 }
                                    ]}
                                >
                                    <View style={styles.responderInfo}>
                                        <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                                            <Typography variant="h6" color="primary">
                                                {responder!.username.charAt(0).toUpperCase()}
                                            </Typography>
                                        </View>
                                        <Typography variant="body" weight="medium">
                                            {responder!.username}
                                        </Typography>
                                    </View>
                                    {selectedServerId === responder!.id && (
                                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                    )}
                                </Card>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            onPress={() => setSelectedServerId(null)}
                            style={{ marginTop: spacing[2] }}
                        >
                            <Typography variant="bodySmall" color="secondary" align="center">
                                No one / I did it myself
                            </Typography>
                        </TouchableOpacity>
                    </ScrollView>

                    <View style={styles.footer}>
                        <LoadingButton
                            title="Close Ask"
                            onPress={handleCloseAsk}
                            loading={closeAskMutation.isPending}
                            fullWidth
                        />
                    </View>
                </View>
            </View>
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
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    list: {
        maxHeight: 400,
    },
    responderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing[3],
        marginBottom: spacing[2],
    },
    responderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    footer: {
        marginTop: spacing[4],
    },
});
