import { Platform } from 'react-native';

// API Configuration
export const getApiUrl = () => {
    if (!__DEV__) {
        return 'https://your-production-api.com';
    }

    // Development URLs
    if (Platform.OS === 'web') {
        return 'http://localhost:8000';
    } else if (Platform.OS === 'android') {
        // Use LAN IP for physical device (works for emulator too if bridged, otherwise use 10.0.2.2)
        return 'http://192.168.31.250:8000';
    } else {
        // iOS Simulator or Physical Device
        // Using detected IP address
        return 'http://192.168.31.250:8000';
    }
};

export const getWsUrl = () => {
    const apiUrl = getApiUrl();
    return apiUrl.replace('http', 'ws');
};

export const API_CONFIG = {
    BASE_URL: getApiUrl(),
    WS_URL: getWsUrl(),
    TIMEOUT: 30000,
};

export const getFullImageUrl = (path: string | null | undefined, includeTimestamp = false): string | null => {
    if (!path) return null;
    let url = path;
    if (!path.startsWith('http://') && !path.startsWith('https://')) {
        url = `${getApiUrl()}${path}`;
    }
    
    if (includeTimestamp) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}t=${new Date().getTime()}`;
    }
    return url;
};

// Log the API URL for debugging
console.log('🔗 API Base URL:', getApiUrl());
console.log('📱 Platform:', Platform.OS);
console.log('🔧 Dev Mode:', __DEV__);

// App Configuration
export const APP_CONFIG = {
    NAME: 'Snabb',
    VERSION: '1.0.0',
    SUPPORT_EMAIL: 'support@snabb.com',
};

// Feature Flags
export const FEATURES = {
    ENABLE_LOCATION: true,
    ENABLE_PUSH_NOTIFICATIONS: true,
    ENABLE_IMAGE_UPLOAD: true,
    ENABLE_BIDDING: true,
};

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
};

// Categories (synced with backend)
export const CATEGORIES = {
    ELECTRONICS: 'Electronics',
    FURNITURE: 'Furniture',
    VEHICLES: 'Vehicles',
    REAL_ESTATE: 'Real Estate',
    SERVICES: 'Services',
    JOBS: 'Jobs',
    EDUCATION: 'Education',
    FASHION: 'Fashion',
    SPORTS: 'Sports',
    BOOKS: 'Books',
    PETS: 'Pets',
    OTHER: 'Other',
};
