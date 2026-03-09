import apiClient from './api';
import { Ask, CreateAskData } from '../types';

export const askService = {
    async getAsks(params?: {
        skip?: number;
        limit?: number;
        category?: string;
        search?: string;
        location?: string;
    }): Promise<Ask[]> {
        const response = await apiClient.get<Ask[]>('/asks/', { params });
        return response.data;
    },

    async getAskById(id: number): Promise<Ask> {
        const response = await apiClient.get<Ask>(`/asks/${id}`);
        return response.data;
    },

    async createAsk(data: CreateAskData): Promise<Ask> {
        const response = await apiClient.post<Ask>('/asks/', data);
        return response.data;
    },

    async updateAsk(id: number, data: Partial<CreateAskData>): Promise<Ask> {
        const response = await apiClient.put<Ask>(`/asks/${id}`, data);
        return response.data;
    },

    async deleteAsk(id: number): Promise<void> {
        await apiClient.delete(`/asks/${id}`);
    },

    async getMyAsks(): Promise<Ask[]> {
        const response = await apiClient.get<Ask[]>('/asks/my-asks');
        return response.data;
    },

    async closeAsk(id: number): Promise<Ask> {
        // Assuming there's an endpoint or we update status
        const response = await apiClient.put<Ask>(`/asks/${id}`, { status: 'closed' });
        return response.data;
    },
};
