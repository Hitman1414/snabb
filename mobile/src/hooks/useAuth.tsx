import React, { createContext, useState, useContext, useEffect } from 'react';
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

        // Import authEvents dynamically to avoid circular dependency
        import('../services/api').then(({ authEvents }) => {
            authEvents.on('unauthorized', handleUnauthorized);
            return () => {
                authEvents.off('unauthorized', handleUnauthorized);
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
            console.warn('Auth check failed:', error);
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
            console.error('Failed to refresh user:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
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
