/**
 * Jest Setup File
 * Configure testing environment
 */
import '@testing-library/react-native/extend-expect';

// Mock expo modules
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
    fetch: jest.fn(() => Promise.resolve({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
    })),
    addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('react-native-mmkv', () => ({
    MMKV: jest.fn().mockImplementation(() => ({
        getString: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
    })),
}));

// Silence console warnings in tests
global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn(),
};
