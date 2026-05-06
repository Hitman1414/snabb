import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../constants/config';
import { storageService } from './storage';
import { logger } from './logger';

// Simple event handler for auth events (React Native compatible)
type AuthEventHandler = () => void;
let unauthorizedHandler: AuthEventHandler | null = null;

export const authEvents = {
    on: (event: string, handler: AuthEventHandler) => {
        if (event === 'unauthorized') {
            unauthorizedHandler = handler;
        }
    },
    off: (event: string, handler: AuthEventHandler) => {
        if (event === 'unauthorized' && unauthorizedHandler === handler) {
            unauthorizedHandler = null;
        }
    },
    emit: (event: string) => {
        if (event === 'unauthorized' && unauthorizedHandler) {
            unauthorizedHandler();
        }
    },
};

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Accept': 'application/json',
        'X-Client-Platform': 'mobile',
    },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
    async (config) => {
        const token = await storageService.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        logger.error('API Request Error', error);
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const isUnauthorized = error.response?.status === 401;
        const url = error.config?.url || '';
        const isLoginRequest = url.includes('/auth/login');

        if (!isUnauthorized) {
            logger.error('API Response Error', error, {
                url,
                method: error.config?.method,
                status: error.response?.status,
                data: error.response?.data,
            });
        }

        if (isUnauthorized && !isLoginRequest) {
            // Handle unauthorized access (token expired)
            await storageService.removeItem('access_token');
            // Emit event to trigger logout in AuthProvider
            authEvents.emit('unauthorized');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
