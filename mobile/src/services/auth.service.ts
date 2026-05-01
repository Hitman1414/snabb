import apiClient from './api';
import { LoginCredentials, RegisterData, AuthTokens, User } from '../types';

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthTokens> {
        // Use URLSearchParams for maximum compatibility and to match web app behavior exactly
        const params = new URLSearchParams();
        params.append('username', credentials.username);
        params.append('password', credentials.password);

        const response = await apiClient.post<AuthTokens>('/auth/login', params.toString(), {
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
