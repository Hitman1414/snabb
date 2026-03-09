/**
 * React Query hooks for asks data fetching
 * Provides caching, pagination, and optimistic updates
 */
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import { Ask, AskCreate } from '../types';

interface AsksResponse {
    items: Ask[];
    total: number;
    skip: number;
    limit: number;
    has_more: boolean;
}

/**
 * Fetch paginated asks with infinite scroll support and filters
 */
export const useInfiniteAsks = (
    category?: string,
    status?: string,
    search?: string,
    minBudget?: number,
    maxBudget?: number,
    lat?: number,
    lng?: number,
    radiusKm?: number
) => {
    return useInfiniteQuery({
        queryKey: ['asks', category, status, search, minBudget, maxBudget, lat, lng, radiusKm],
        queryFn: async ({ pageParam = 0 }) => {
            const response = await apiClient.get<AsksResponse>('/asks', {
                params: {
                    skip: pageParam,
                    limit: 20,
                    category,
                    status,
                    search,
                    min_budget: minBudget,
                    max_budget: maxBudget,
                    lat,
                    lng,
                    radius_km: radiusKm,
                },
            });
            return response.data;
        },
        getNextPageParam: (lastPage: AsksResponse) => {
            return lastPage.has_more ? lastPage.skip + lastPage.limit : undefined;
        },
        initialPageParam: 0,
    });
};

/**
 * Fetch single ask by ID
 */
export const useAsk = (askId: number) => {
    return useQuery({
        queryKey: ['ask', askId],
        queryFn: async () => {
            const response = await apiClient.get<Ask>(`/asks/${askId}`);
            return response.data;
        },
        enabled: !!askId,
    });
};

/**
 * Fetch user's asks
 */
export const useMyAsks = () => {
    return useQuery({
        queryKey: ['myAsks'],
        queryFn: async () => {
            const response = await apiClient.get<Ask[]>('/asks/my-asks');
            return response.data;
        },
    });
};

/**
 * Fetch asks where user has interested responses
 */
export const useInterestedAsks = () => {
    return useQuery({
        queryKey: ['interestedAsks'],
        queryFn: async () => {
            const response = await apiClient.get<Ask[]>('/asks/interested');
            return response.data;
        },
    });
};

/**
 * Create new ask with optimistic update
 */
export const useCreateAsk = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ask: AskCreate) => {
            let data: FormData | AskCreate;

            const formData = new FormData();
            formData.append('title', ask.title);
            formData.append('description', ask.description);
            formData.append('category', ask.category);
            formData.append('location', ask.location);
            
            if (ask.budget_min !== undefined) formData.append('budget_min', ask.budget_min.toString());
            if (ask.budget_max !== undefined) formData.append('budget_max', ask.budget_max.toString());
            if (ask.latitude !== undefined) formData.append('latitude', ask.latitude.toString());
            if (ask.longitude !== undefined) formData.append('longitude', ask.longitude.toString());

            if (ask.images && ask.images.length > 0) {
                ask.images.forEach((imageUri, index) => {
                    if (!imageUri.startsWith('http')) {
                        const filename = imageUri.split('/').pop() || `image_${index}.jpg`;
                        const match = /\.(\w+)$/.exec(filename);
                        const type = match ? `image/${match[1]}` : 'image/jpeg';
                        
                        formData.append('images', {
                            uri: imageUri,
                            name: filename,
                            type,
                        } as any);
                    }
                });
            }
            
            data = formData;

            const response = await apiClient.post<Ask>('/asks', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['asks'] });
            queryClient.invalidateQueries({ queryKey: ['myAsks'] });
        },
    });
};

/**
 * Delete ask with optimistic update
 */
export const useDeleteAsk = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (askId: number) => {
            await apiClient.delete(`/asks/${askId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['asks'] });
        },
    });
};

/**
 * Close ask with server selection
 */
export const useCloseAsk = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ askId, serverId }: { askId: number; serverId?: number }) => {
            const params = serverId ? { server_id: serverId } : {};
            const response = await apiClient.post<Ask>(`/asks/${askId}/close`, null, { params });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['asks'] });
            queryClient.invalidateQueries({ queryKey: ['myAsks'] });
            queryClient.invalidateQueries({ queryKey: ['interestedAsks'] });
        },
    });
};
