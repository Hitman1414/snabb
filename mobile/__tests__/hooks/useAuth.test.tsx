/**
 * Unit Tests for useAuth Hook
 */
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuth, AuthProvider } from '../../../src/hooks/useAuth';
import { authService } from '../../../src/services/auth.service';

jest.mock('../../../src/services/auth.service');

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{ children } </AuthProvider>
);

describe('useAuth Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes with loading state', () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        expect(result.current.loading).toBe(true);
    });

    it('logs in successfully', async () => {
        const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
        (authService.login as jest.Mock).mockResolvedValue({ access_token: 'token123' });
        (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await result.current.login({ username: 'testuser', password: 'password' });
        });

        await waitFor(() => {
            expect(result.current.user).toEqual(mockUser);
            expect(result.current.loading).toBe(false);
        });
    });

    it('logs out successfully', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await result.current.logout();
        });

        expect(result.current.user).toBeNull();
    });
});
