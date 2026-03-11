import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import { Notification } from '../types';

export const useNotifications = () => {
    const queryClient = useQueryClient();

    const notificationsQuery = useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await apiClient.get('/notifications');
            return response.data;
        },
    });

    const markReadMutation = useMutation({
        mutationFn: async (notificationId: number) => {
            const response = await apiClient.post(`/notifications/mark-read/${notificationId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            const response = await apiClient.post('/notifications/mark-all-read');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const unreadCount = notificationsQuery.data?.filter(n => !n.is_read).length || 0;

    return {
        notifications: notificationsQuery.data || [],
        isLoading: notificationsQuery.isLoading,
        isError: notificationsQuery.isError,
        unreadCount,
        refetch: notificationsQuery.refetch,
        markAsRead: markReadMutation.mutate,
        markAllAsRead: markAllReadMutation.mutate,
    };
};
