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

let mmkvStorage: StorageAdapter | null = null;

// Try to initialize MMKV, but fail gracefully for Expo Go
try {
    // We use require to avoid top-level import crash in Expo Go
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const { MMKV } = require('react-native-mmkv');
    const mmkv = new MMKV();

    mmkvStorage = {
        getItem: async (key: string) => {
            const value = mmkv.getString(key);
            return value !== undefined ? value : null;
        },
        setItem: async (key: string, value: string) => {
            mmkv.set(key, value);
        },
        removeItem: async (key: string) => {
            mmkv.delete(key);
        }
    };
} catch (e) {
    // MMKV not available, fall back to AsyncStorage
}

// Fallback to AsyncStorage if MMKV is not available
const asyncStorageAdapter: StorageAdapter = {
    getItem: async (key: string) => {
        const value = await AsyncStorage.getItem(key);
        return value;
    },
    setItem: async (key: string, value: string) => {
        return AsyncStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
        return AsyncStorage.removeItem(key);
    },
};

export const storage: StorageAdapter = mmkvStorage || asyncStorageAdapter;
