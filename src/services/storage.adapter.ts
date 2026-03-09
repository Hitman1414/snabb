/**
 * Storage Adapter
 * Unified interface for MMKV (production) and AsyncStorage (Expo Go fallback)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface for storage adapter
export interface StorageAdapter {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
}

let mmkvStorage: any = null;

// Try to initialize MMKV, but fail gracefully for Expo Go
try {
    // We use require to avoid top-level import crash in Expo Go
    const { MMKV } = require('react-native-mmkv');
    const mmkv = new MMKV();

    mmkvStorage = {
        getItem: async (key: string) => {
            const value = mmkv.getString(key);
            if (key === 'access_token') console.log('🔐 MMKV getItem access_token:', value ? 'FOUND' : 'MISSING');
            return value !== undefined ? value : null;
        },
        setItem: async (key: string, value: string) => {
            if (key === 'access_token') console.log('🔐 MMKV setItem access_token');
            mmkv.set(key, value);
        },
        removeItem: async (key: string) => {
            mmkv.delete(key);
        }
    };
    console.log('✅ MMKV Storage initialized');
} catch (e) {
    console.log('⚠️ MMKV not available, falling back to AsyncStorage (Expo Go mode)');
}

// Fallback to AsyncStorage if MMKV is not available
const asyncStorageAdapter: StorageAdapter = {
    getItem: async (key: string) => {
        const value = await AsyncStorage.getItem(key);
        if (key === 'access_token') console.log('🔐 AsyncStorage getItem access_token:', value ? 'FOUND' : 'MISSING');
        return value;
    },
    setItem: async (key: string, value: string) => {
        if (key === 'access_token') console.log('🔐 AsyncStorage setItem access_token');
        return AsyncStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
        if (key === 'access_token') console.log('🔐 AsyncStorage removeItem access_token');
        return AsyncStorage.removeItem(key);
    },
};

export const storage: StorageAdapter = mmkvStorage || asyncStorageAdapter;
