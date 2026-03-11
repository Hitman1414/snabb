import apiClient from './api';
import { Response, CreateResponseData } from '../types';

export const responseService = {
    async getResponsesForAsk(askId: number): Promise<Response[]> {
        const response = await apiClient.get<Response[]>(`/responses/ask/${askId}`);
        return response.data;
    },

    async createResponse(askId: number, data: CreateResponseData): Promise<Response> {
        const response = await apiClient.post<Response>(`/responses/ask/${askId}`, data);
        return response.data;
    },

    async acceptResponse(responseId: number): Promise<Response> {
        const response = await apiClient.post<Response>(`/responses/${responseId}/accept`);
        return response.data;
    },

    async getMyResponses(): Promise<Response[]> {
        const response = await apiClient.get<Response[]>('/responses/my-responses');
        return response.data;
    },

    async deleteResponse(responseId: number): Promise<void> {
        await apiClient.delete(`/responses/${responseId}`);
    },
};
