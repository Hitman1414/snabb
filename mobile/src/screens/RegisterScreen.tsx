import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';
import { Input, Typography, LoadingButton } from '../design-system/components';
import { useTheme } from '../design-system/ThemeContext';
import { spacing } from '../design-system/tokens';
import { toastService } from '../services/toast.service';
import { registerSchema } from '../lib/validation';
import { z } from 'zod';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    const { register } = useAuth();
    const { colors } = useTheme();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async () => {
        try {
            // Check password match first (since it's not in the base schema)
            if (password !== confirmPassword) {
                toastService.error('Passwords do not match');
                return;
            }

            // Validate form data
            const validatedData = registerSchema.parse({
                username: username.trim(),
                email: email.trim(),
                password,
                phone_number: phoneNumber.trim() || undefined,
                location: location.trim() || undefined,
            });

            setLoading(true);
            await register(validatedData);

            toastService.success('Account created successfully! Please login.');
            setTimeout(() => navigation.navigate('Login'), 1500);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                toastService.error(error.issues[0].message);
            } else {
                console.error('Registration error:', error);
                const errorMessage = error.response?.data?.detail ||
                    error.message ||
                    'Unable to create account. Please try again.';
                toastService.error(errorMessage);
            }
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
                <View style={styles.header}>
                    <Typography variant="h2" weight="bold" style={styles.title}>
                        Create Account
                    </Typography>
                    <Typography variant="body" color="secondary" style={styles.subtitle}>
                        Join Snabb today
                    </Typography>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Username *"
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Choose a username"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Input
                        label="Email *"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="your@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Input
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Choose a strong password"
                        secureTextEntry={!showPassword}
                        rightIcon={
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        }
                    />

                    <Input
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm your password"
                        secureTextEntry={!showPassword}
                        rightIcon={
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        }
                    />

                    <Input
                        label="Phone Number"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder="+91 1234567890"
                        keyboardType="phone-pad"
                    />

                    <Input
                        label="Location"
                        value={location}
                        onChangeText={setLocation}
                        placeholder="City, State"
                    />

                    <LoadingButton
                        title="Create Account"
                        onPress={handleRegister}
                        loading={loading}
                        fullWidth
                        size="lg"
                        style={styles.registerButton}
                    />

                    <View style={styles.footer}>
                        <Typography variant="body" color="secondary">
                            Already have an account?{' '}
                        </Typography>
                        <LoadingButton
                            title="Login"
                            onPress={() => navigation.navigate('Login')}
                            variant="ghost"
                            size="sm"
                        />
                    </View>

                    <Typography variant="caption" color="secondary" style={styles.disclaimer} align="center">
                        <Typography variant="caption" color="secondary">
                            By creating an account, you agree to our{' '}
                        </Typography>
                        <Typography variant="caption" color="primary" weight="bold" onPress={() => navigation.navigate('TermsOfService')}>
                            Terms of Service
                        </Typography>
                        <Typography variant="caption" color="secondary">
                            {' '}and{' '}
                        </Typography>
                        <Typography variant="caption" color="primary" weight="bold" onPress={() => navigation.navigate('PrivacyPolicy')}>
                            Privacy Policy
                        </Typography>
                        <Typography variant="caption" color="secondary">
                            .
                        </Typography>
                    </Typography>
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
        padding: spacing[6],
        paddingTop: spacing[12],
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing[8],
    },
    title: {
        marginBottom: spacing[2],
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    registerButton: {
        marginTop: spacing[4],
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing[6],
    },
    disclaimer: {
        marginTop: spacing[4],
        paddingHorizontal: spacing[2],
        lineHeight: 20,
    },
});

export default RegisterScreen;
