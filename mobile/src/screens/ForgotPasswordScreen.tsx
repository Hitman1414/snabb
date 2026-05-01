import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Input, Typography, LoadingButton } from '../design-system/components';
import { useTheme } from '../design-system/ThemeContext';
import { spacing, elevation } from '../design-system/tokens';
import { toastService } from '../services/toast.service';
import apiClient from '../services/api';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const [step, setStep] = useState<'email' | 'reset' | 'success'>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSendCode = async () => {
        if (!email) {
            toastService.error('Please enter your email');
            return;
        }
        setLoading(true);
        try {
            await apiClient.post('/auth/forgot-password', { email });
            toastService.success('Reset code sent!');
            setStep('reset');
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Failed to send reset code';
            toastService.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!code || !newPassword) {
            toastService.error('Please fill in all fields');
            return;
        }
        if (newPassword.length < 8) {
            toastService.error('Password must be at least 8 characters');
            return;
        }
        setLoading(true);
        try {
            await apiClient.post('/auth/reset-password', { email, code, new_password: newPassword });
            toastService.success('Password reset successfully!');
            setStep('success');
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Failed to reset password';
            toastService.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.hero, { backgroundColor: colors.primary }]}>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
                    </TouchableOpacity>
                    <Ionicons name="lock-closed" size={64} color={colors.textInverse} style={{ marginBottom: spacing[2] }} />
                    <Typography variant="h2" weight="bold" style={{ color: colors.textInverse }}>
                        Recover Password
                    </Typography>
                </View>

                <View style={[styles.formCard, { backgroundColor: colors.background }]}>
                    {step === 'email' && (
                        <>
                            <Typography variant="body" color="secondary" style={styles.subtitle}>
                                Enter your email to receive an OTP code.
                            </Typography>
                            <Input
                                label="Email Address"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <LoadingButton
                                title="Send Reset Code"
                                onPress={handleSendCode}
                                loading={loading}
                                fullWidth
                                size="lg"
                                style={styles.actionButton}
                            />
                        </>
                    )}

                    {step === 'reset' && (
                        <>
                            <Typography variant="body" color="secondary" style={styles.subtitle}>
                                Enter the OTP code sent to your email and your new password.
                            </Typography>
                            <Input
                                label="OTP Code"
                                value={code}
                                onChangeText={setCode}
                                placeholder="Enter 6-digit code"
                                keyboardType="number-pad"
                            />
                            <Input
                                label="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Enter your new password"
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                rightIcon={
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                }
                            />
                            <LoadingButton
                                title="Reset Password"
                                onPress={handleResetPassword}
                                loading={loading}
                                fullWidth
                                size="lg"
                                style={styles.actionButton}
                            />
                        </>
                    )}

                    {step === 'success' && (
                        <View style={styles.successContainer}>
                            <Ionicons name="checkmark-circle" size={80} color={colors.success} style={{ marginBottom: spacing[4] }} />
                            <Typography variant="h3" weight="bold" style={styles.successTitle}>
                                Password Reset Complete!
                            </Typography>
                            <Typography variant="body" color="secondary" style={styles.successSubtitle}>
                                You can now sign in with your new password.
                            </Typography>
                            <LoadingButton
                                title="Return to Login"
                                onPress={() => navigation.navigate('Login')}
                                fullWidth
                                size="lg"
                                style={styles.actionButton}
                            />
                        </View>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    hero: {
        height: 250,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing[8],
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: spacing[12],
        left: spacing[4],
        padding: spacing[2],
        zIndex: 10,
    },
    formCard: {
        flex: 1,
        marginTop: -spacing[8],
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: spacing[8],
        ...elevation.lg,
    },
    subtitle: {
        marginBottom: spacing[6],
        marginTop: spacing[2],
    },
    actionButton: {
        marginTop: spacing[6],
        borderRadius: 16,
    },
    successContainer: {
        alignItems: 'center',
        paddingTop: spacing[4],
    },
    successTitle: {
        marginBottom: spacing[2],
        textAlign: 'center',
    },
    successSubtitle: {
        marginBottom: spacing[8],
        textAlign: 'center',
    },
});

export default ForgotPasswordScreen;
