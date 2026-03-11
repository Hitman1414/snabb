import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_CONFIG } from '../constants/config';
import { storageService } from '../services/storage';
import { Message } from '../types';

export const useChatSocket = (askId?: number) => {
    const queryClient = useQueryClient();
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [reconnectCount, setReconnectCount] = useState(0);

    const connect = useCallback(async () => {
        const token = await storageService.getItem('access_token');
        if (!token) return;

        // Construct WS URL with token
        const wsUrl = `${API_CONFIG.WS_URL}/ws/chat?token=${token}`;
        
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('✅ WebSocket connected');
            setIsConnected(true);
            setReconnectCount(0);
        };

        ws.current.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'NEW_MESSAGE') {
                    const newMessage: Message = payload.data;
                    
                    // Optimistically update the conversation cache if it's the right one
                    // or just invalidate to stay safe
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                    
                    if (newMessage.ask_id) {
                        queryClient.invalidateQueries({ 
                            queryKey: ['conversation', newMessage.sender_id, newMessage.ask_id] 
                        });
                        queryClient.invalidateQueries({ 
                            queryKey: ['conversation', newMessage.receiver_id, newMessage.ask_id] 
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to parse WS message', error);
            }
        };

        ws.current.onclose = (e) => {
            console.log('󰝛 WebSocket disconnected', e.reason);
            setIsConnected(false);
            // Simple exponential backoff for reconnection
            if (reconnectCount < 5) {
                const timeout = Math.pow(2, reconnectCount) * 1000;
                setTimeout(() => {
                    setReconnectCount(prev => prev + 1);
                }, timeout);
            }
        };

        ws.current.onerror = (e) => {
            console.error('❌ WebSocket error', e);
        };
    }, [queryClient, reconnectCount]);

    useEffect(() => {
        connect();
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [connect]);

    return { isConnected };
};
