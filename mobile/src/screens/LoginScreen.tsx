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
import { spacing, elevation } from '../design-system/tokens';
import { toastService } from '../services/toast.service';
import { loginSchema } from '../lib/validation';
import { z } from 'zod';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const { login } = useAuth();
    const { colors } = useTheme();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        try {
            // Validate form data
            const validatedData = loginSchema.parse({
                username: username.trim(),
                password,
            });

            setLoading(true);
            await login(validatedData);
            toastService.success('Welcome back!');
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                toastService.error(error.issues[0].message);
            } else {
                console.error('Login error:', error);
                const errorMessage = error.response?.data?.detail ||
                    error.message ||
                    'Invalid credentials. Please try again.';
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
                <View style={[styles.hero, { backgroundColor: colors.primary }]}>
                    <Ionicons name="flash" size={80} color="#FFD700" style={{ marginBottom: spacing[2] }} />
                    <Typography variant="h1" weight="bold" style={{ color: colors.textInverse }}>
                        Snabb
                    </Typography>
                    <Typography variant="body" style={{ color: colors.textInverse, opacity: 0.9 }}>
                        Get help instantly, anywhere.
                    </Typography>
                </View>

                <View style={[styles.formCard, { backgroundColor: colors.background }]}>
                    <Typography variant="h3" weight="bold" style={styles.title}>
                        Welcome Back
                    </Typography>
                    <Typography variant="bodySmall" color="secondary" style={styles.subtitle}>
                        Enter your credentials to continue
                    </Typography>
                    <Input
                        label="Username"
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter your username"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Input
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        secureTextEntry
                        autoCapitalize="none"
                    />

                    <LoadingButton
                        title="Login"
                        onPress={handleLogin}
                        loading={loading}
                        fullWidth
                        size="lg"
                        style={styles.loginButton}
                    />

                    <View style={styles.footerStatus}>
                        <Typography variant="bodySmall" color="secondary">
                            Don't have an account?{' '}
                        </Typography>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Typography variant="bodySmall" weight="bold" color="primary">
                                Sign Up
                            </Typography>
                        </TouchableOpacity>
                    </View>
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
        height: 300,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing[12],
    },
    heroLogo: {
        marginBottom: spacing[2],
    },
    formCard: {
        flex: 1,
        marginTop: -spacing[8],
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: spacing[8],
        ...elevation.lg,
    },
    title: {
        marginBottom: spacing[1],
        marginTop: spacing[2],
    },
    subtitle: {
        marginBottom: spacing[8],
    },
    loginButton: {
        marginTop: spacing[4],
        borderRadius: 16,
    },
    footerStatus: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing[8],
    },
});

export default LoginScreen;
