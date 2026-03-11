/**
 * React Query hooks for responses data fetching
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import { Response, ResponseCreate } from '../types';

/**
 * Fetch responses for a specific ask
 */
export const useResponses = (askId: number) => {
    return useQuery({
        queryKey: ['responses', askId],
        queryFn: async () => {
            const response = await apiClient.get<Response[]>(`/responses/ask/${askId}`);
            return response.data;
        },
        enabled: !!askId,
    });
};

/**
 * Fetch user's responses
 */
export const useMyResponses = () => {
    return useQuery({
        queryKey: ['responses', 'my'],
        queryFn: async () => {
            const response = await apiClient.get<Response[]>('/responses/my');
            return response.data;
        },
    });
};

/**
 * Create new response with optimistic update
 */
export const useCreateResponse = (askId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (responseData: ResponseCreate) => {
            const response = await apiClient.post<Response>(
                `/responses/ask/${askId}`,
                responseData
            );
            return response.data;
        },
        onSuccess: () => {
            // Invalidate responses for this ask
            queryClient.invalidateQueries({ queryKey: ['responses', askId] });
        },
    });
};

/**
 * Accept a response (for ask owner)
 */
export const useAcceptResponse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (responseId: number) => {
            const response = await apiClient.post<Response>(
                `/responses/${responseId}/accept`
            );
            return response.data;
        },
        onSuccess: (data: Response) => {
            // Invalidate both the ask and its responses
            queryClient.invalidateQueries({ queryKey: ['ask', data.ask_id] });
            queryClient.invalidateQueries({ queryKey: ['responses', data.ask_id] });
            queryClient.invalidateQueries({ queryKey: ['asks'] });
        },
    });
};

/**
 * Toggle interested status for a response
 */
export const useToggleInterested = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ responseId, isInterested }: { responseId: number; isInterested: boolean }) => {
            const response = await apiClient.put<Response>(
                `/responses/${responseId}/interested`,
                null,
                { params: { is_interested: isInterested } }
            );
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['responses', data.ask_id] });
        },
    });
};
