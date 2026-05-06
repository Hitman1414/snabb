import React, { useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../ThemeContext';
import { spacing, borderRadius, elevation } from '../tokens';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../services/api';
import { toastService } from '../../services/toast.service';
import { logger } from '../../services/logger';

interface PaymentSheetProps {
    visible: boolean;
    onClose: () => void;
    askId: number;
    responseId: number;
    bidAmount: number;
    onSuccess: () => void;
}

export const PaymentSheet: React.FC<PaymentSheetProps> = ({
    visible,
    onClose,
    askId,
    responseId,
    bidAmount,
    onSuccess,
}) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [method, setMethod] = useState<'stripe' | 'cash'>('stripe');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const completedAsksCount = user?.completed_asks_count || 0;
    const isFree = completedAsksCount < 3;
    const feePercent = isFree ? 0 : 3;
    const platformFee = (bidAmount * feePercent) / 100;
    const totalAmount = method === 'stripe' ? bidAmount + platformFee : bidAmount;

    const handlePayment = async () => {
        setLoading(true);
        try {
            // Create intent or mock intent
            await apiClient.post('/payments/create-payment-intent', {
                ask_id: askId,
                amount: bidAmount,
                currency: 'usd' // Or fetch from config
            });

            // Accept response
            await apiClient.post(`/responses/${responseId}/accept`);

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (error: any) {
            logger.error('Failed to process payment setup', error);
            toastService.error('Failed to process payment setup');
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={[styles.container, { backgroundColor: colors.surface }]}>
                    {success ? (
                        <View style={styles.successContainer}>
                            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
                            <Typography variant="h3" weight="bold" style={{ marginTop: spacing[4] }}>Success!</Typography>
                            <Typography variant="body" color="secondary" style={{ marginTop: spacing[2], textAlign: 'center' }}>
                                Response accepted. The helper has been notified.
                            </Typography>
                        </View>
                    ) : (
                        <>
                            <View style={styles.header}>
                                <View>
                                    <Typography variant="h4" weight="bold">Accept & Pay</Typography>
                                    <Typography variant="caption" color="secondary">Secure checkout</Typography>
                                </View>
                                <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}>
                                    <Ionicons name="close" size={20} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.breakdown, { backgroundColor: colors.surfaceVariant }]}>
                                <View style={styles.row}>
                                    <Typography variant="body" color="secondary" weight="bold">Service Bid</Typography>
                                    <Typography variant="body" weight="bold">₹{bidAmount.toFixed(2)}</Typography>
                                </View>
                                {method === 'stripe' && (
                                    <View style={[styles.row, { marginTop: spacing[2] }]}>
                                        <View>
                                            <Typography variant="body" color="secondary" weight="bold">Convenience Fee (3%)</Typography>
                                            <Typography variant="caption" color="primary" weight="bold" style={{ marginTop: 2, textTransform: 'uppercase' }}>
                                                {isFree ? `WAIVED (${3 - completedAsksCount} Free Left)` : 'Supports the platform'}
                                            </Typography>
                                        </View>
                                        <Typography variant="body" weight="bold" style={{ color: isFree ? colors.success : colors.text }}>
                                            {isFree ? 'FREE' : `₹${platformFee.toFixed(2)}`}
                                        </Typography>
                                    </View>
                                )}
                                <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                                    <Typography variant="h6" weight="bold">Total</Typography>
                                    <Typography variant="h5" weight="bold" color="primary">₹{totalAmount.toFixed(2)}</Typography>
                                </View>
                            </View>

                            <Typography variant="caption" weight="bold" color="secondary" style={styles.methodLabel}>
                                PAYMENT METHOD
                            </Typography>

                            <TouchableOpacity
                                onPress={() => setMethod('stripe')}
                                style={[
                                    styles.methodBtn,
                                    { borderColor: method === 'stripe' ? colors.primary : colors.border },
                                    method === 'stripe' && { backgroundColor: colors.primaryLight + '20' }
                                ]}
                            >
                                <View style={[styles.iconBox, { backgroundColor: method === 'stripe' ? colors.primary : colors.surfaceVariant }]}>
                                    <Ionicons name="card" size={24} color={method === 'stripe' ? 'white' : colors.textTertiary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Typography variant="body" weight="bold">Secure In-App</Typography>
                                    <Typography variant="caption" color="secondary">Credit/Debit Card (Stripe)</Typography>
                                </View>
                                {method === 'stripe' && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setMethod('cash')}
                                style={[
                                    styles.methodBtn,
                                    { borderColor: method === 'cash' ? colors.success : colors.border },
                                    method === 'cash' && { backgroundColor: colors.successLight + '20' }
                                ]}
                            >
                                <View style={[styles.iconBox, { backgroundColor: method === 'cash' ? colors.success : colors.surfaceVariant }]}>
                                    <Ionicons name="wallet" size={24} color={method === 'cash' ? 'white' : colors.textTertiary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Typography variant="body" weight="bold">Free Will (Cash/UPI)</Typography>
                                    <Typography variant="caption" color="secondary">Pay directly to pro</Typography>
                                </View>
                                {method === 'cash' && <Ionicons name="checkmark-circle" size={24} color={colors.success} />}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                                onPress={handlePayment}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Typography variant="h6" weight="bold" color="inverse">Confirm ₹{totalAmount.toFixed(2)}</Typography>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
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
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: spacing[6],
        minHeight: 400,
        ...elevation.lg,
    },
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[10],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing[6],
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    breakdown: {
        padding: spacing[5],
        borderRadius: 24,
        marginBottom: spacing[6],
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing[4],
        paddingTop: spacing[4],
        borderTopWidth: 1,
    },
    methodLabel: {
        marginLeft: spacing[2],
        marginBottom: spacing[3],
        letterSpacing: 1,
    },
    methodBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        borderRadius: 20,
        borderWidth: 2,
        marginBottom: spacing[3],
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[4],
    },
    submitBtn: {
        padding: spacing[4],
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing[4],
        marginBottom: spacing[4],
    }
});
