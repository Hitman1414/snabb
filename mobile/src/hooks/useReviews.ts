/**
 * Review Hooks
 * React Query hooks for review operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';

export interface Review {
    id: number;
    ask_id: number;
    reviewer_id: number;
    reviewee_id: number;
    rating: number;
    comment?: string;
    created_at: string;
    updated_at: string;
    reviewer?: {
        id: number;
        username: string;
    };
    reviewee?: {
        id: number;
        username: string;
    };
}

export interface ReviewCreate {
    ask_id: number;
    reviewee_id: number;
    rating: number;
    comment?: string;
}

export interface ReviewUpdate {
    rating?: number;
    comment?: string;
}

export interface UserRating {
    user_id: number;
    average_rating: number;
    review_count: number;
}

// Get reviews for an ask
export const useAskReviews = (askId: number) => {
    return useQuery<Review[]>({
        queryKey: ['reviews', 'ask', askId],
        queryFn: async () => {
            const response = await apiClient.get(`/reviews/ask/${askId}`);
            return response.data;
        },
        enabled: !!askId,
    });
};

// Get reviews for a user
export const useUserReviews = (userId: number) => {
    return useQuery<Review[]>({
        queryKey: ['reviews', 'user', userId],
        queryFn: async () => {
            const response = await apiClient.get(`/reviews/user/${userId}`);
            return response.data;
        },
        enabled: !!userId,
    });
};

// Get user rating
export const useUserRating = (userId: number) => {
    return useQuery<UserRating>({
        queryKey: ['rating', 'user', userId],
        queryFn: async () => {
            const response = await apiClient.get(`/reviews/user/${userId}/rating`);
            return response.data;
        },
        enabled: !!userId,
    });
};

// Create review
export const useCreateReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (review: ReviewCreate) => {
            const response = await apiClient.post('/reviews', review);
            return response.data;
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['reviews', 'ask', data.ask_id] });
            queryClient.invalidateQueries({ queryKey: ['reviews', 'user', data.reviewee_id] });
            queryClient.invalidateQueries({ queryKey: ['rating', 'user', data.reviewee_id] });
        },
    });
};

// Update review
export const useUpdateReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ reviewId, update }: { reviewId: number; update: ReviewUpdate }) => {
            const response = await apiClient.put(`/reviews/${reviewId}`, update);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['reviews', 'ask', data.ask_id] });
            queryClient.invalidateQueries({ queryKey: ['reviews', 'user', data.reviewee_id] });
            queryClient.invalidateQueries({ queryKey: ['rating', 'user', data.reviewee_id] });
        },
    });
};

// Delete review
export const useDeleteReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (reviewId: number) => {
            await apiClient.delete(`/reviews/${reviewId}`);
            return reviewId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            queryClient.invalidateQueries({ queryKey: ['rating'] });
        },
    });
};
