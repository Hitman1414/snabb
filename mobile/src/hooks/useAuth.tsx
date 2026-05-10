import React, { createContext, useState, useContext, useEffect } from 'react';
import { logger } from '../services/logger';
import { authService } from '../services/auth.service';
import { storageService } from '../services/storage';
import { User, LoginCredentials, RegisterData } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    toggleSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    // Listen for 401 unauthorized events from API interceptor
    useEffect(() => {
        const handleUnauthorized = () => {
            console.log('Token expired, logging out...');
            setUser(null);
        };

        const handlePaymentRequired = () => {
            toastService.info('Snabb AI Pro subscription required.');
            // We can add navigation logic here if needed
        };

        // Import authEvents dynamically to avoid circular dependency
        import('../services/api').then(({ authEvents }) => {
            authEvents.on('unauthorized', handleUnauthorized);
            authEvents.on('payment_required', handlePaymentRequired);
            return () => {
                authEvents.off('unauthorized', handleUnauthorized);
                authEvents.off('payment_required', handlePaymentRequired);
            };
        });
    }, []);

    const checkAuth = async () => {
        try {
            const token = await storageService.getItem('access_token');
            if (token) {
                const userData = await authService.getCurrentUser();
                setUser(userData);
            }
        } catch (error) {
            // Expected if token is expired or invalid
            logger.warn('Auth check failed:', error);
            await storageService.removeItem('access_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials: LoginCredentials) => {
        const { access_token } = await authService.login(credentials);
        await storageService.setItem('access_token', access_token);
        await refreshUser();
    };

    const register = async (data: RegisterData) => {
        await authService.register(data);
        // Automatically login after registration or redirect to login
        // For now, let's just redirect to login (handled by UI)
    };

    const logout = async () => {
        await storageService.removeItem('access_token');
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
        } catch (error) {
            logger.error('Failed to refresh user:', error);
        }
    };

    const toggleSubscription = async () => {
        try {
            const response = await import('../services/api').then(m => m.default.post('/ai/subscribe'));
            setUser(prev => prev ? { ...prev, is_ai_subscribed: response.data.is_ai_subscribed } : null);
            toastService.success(response.data.is_ai_subscribed ? 'AI Pro Activated!' : 'AI Pro Deactivated');
        } catch (error) {
            logger.error('Failed to toggle subscription:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, toggleSubscription }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
