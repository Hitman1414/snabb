/**
 * React Query client configuration
 * Provides caching, background refetching, and optimistic updates
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Stale time: Data is considered fresh for 5 minutes
            staleTime: 1000 * 60 * 5,

            // Cache time: Unused data is garbage collected after 30 minutes
            gcTime: 1000 * 60 * 30,

            // Retry failed requests twice
            retry: 2,
            retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Don't refetch on window focus (mobile doesn't have windows)
            refetchOnWindowFocus: false,

            // Refetch on reconnect
            refetchOnReconnect: true,

            // Refetch on mount if data is stale
            refetchOnMount: true,
        },
        mutations: {
            // Retry mutations once
            retry: 1,
        },
    },
});
