/**
 * React Query hooks for message operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import { Conversation, Message, CreateMessageData } from '../types';

// Fetch all messages for current user
export const useMessages = () => {
    return useQuery({
        queryKey: ['messages'],
        queryFn: async () => {
            const response = await apiClient.get<Message[]>('/messages');
            return response.data;
        },
    });
};

// Fetch conversations
export const useConversations = () => {
    return useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const response = await apiClient.get<Conversation[]>('/messages/conversations');
            return response.data;
        },
    });
};

// Fetch conversation with specific user
export const useConversation = (otherUserId: number, askId?: number) => {
    return useQuery({
        queryKey: ['conversation', otherUserId, askId],
        queryFn: async () => {
            const params = askId ? { ask_id: askId } : {};
            const response = await apiClient.get<Message[]>(`/messages/conversation/${otherUserId}`, { params });
            return response.data;
        },
        enabled: !!otherUserId,
    });
};

// Send a message
export const useSendMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateMessageData) => {
            const response = await apiClient.post<Message>('/messages', data);
            return response.data;
        },
        onSuccess: (newMessage) => {
            // Invalidate messages list
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });

            // Update conversation cache optimistically or invalidate
            if (newMessage.receiver_id) {
                queryClient.invalidateQueries({
                    queryKey: ['conversation', newMessage.receiver_id]
                });
            }
        },
    });
};

// Mark messages as read for a specific ask
export const useMarkMessagesRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (askId: number) => {
            await apiClient.post(`/messages/mark-read/${askId}`);
        },
        onSuccess: () => {
            // Invalidate responses to update unread count
            queryClient.invalidateQueries({ queryKey: ['responses'] });
            queryClient.invalidateQueries({ queryKey: ['ask'] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
    });
};
