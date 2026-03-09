import apiClient from './api';
import { LoginCredentials, RegisterData, AuthTokens, User } from '../types';

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthTokens> {
        // Manual string construction for maximum compatibility
        const params = `username=${encodeURIComponent(credentials.username)}&password=${encodeURIComponent(credentials.password)}`;

        const response = await apiClient.post<AuthTokens>('/auth/login', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    },

    async register(data: RegisterData): Promise<User> {
        const response = await apiClient.post<User>('/auth/register', data);
        return response.data;
    },

    async getCurrentUser(): Promise<User> {
        const response = await apiClient.get<User>('/auth/me');
        return response.data;
    },

    async updateProfile(data: Partial<RegisterData>): Promise<User> {
        const response = await apiClient.put<User>('/auth/me', data);
        return response.data;
    },
};
