/**
 * Offline Context
 * Manages offline state and queued actions
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { offlineQueueService, QueuedAction } from '../services/offlineQueue.service';
import { askService } from '../services/ask.service';

interface OfflineContextType {
    isOnline: boolean;
    queueSize: number;
    syncInProgress: boolean;
    syncQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isConnected } = useNetworkStatus();
    const [queueSize, setQueueSize] = useState(0);
    const [syncInProgress, setSyncInProgress] = useState(false);

    // Update queue size
    const updateQueueSize = useCallback(async () => {
        const size = await offlineQueueService.getQueueSize();
        setQueueSize(size);
    }, []);

    // Sync queued actions
    const syncQueue = useCallback(async () => {
        if (!isConnected || syncInProgress) return;

        setSyncInProgress(true);
        const queue = await offlineQueueService.getQueue();

        for (const action of queue) {
            try {
                await processAction(action);
                offlineQueueService.dequeue(action.id);
            } catch (error) {
                console.error('Failed to sync action:', error);
                if (offlineQueueService.shouldRetry(action)) {
                    offlineQueueService.incrementRetry(action.id);
                } else {
                    // Max retries reached, remove from queue
                    offlineQueueService.dequeue(action.id);
                }
            }
        }

        setSyncInProgress(false);
        updateQueueSize();
    }, [isConnected, syncInProgress, updateQueueSize]);

    // Auto-sync when coming back online
    useEffect(() => {
        if (isConnected && queueSize > 0) {
            syncQueue();
        }
    }, [isConnected, queueSize, syncQueue]);

    // Update queue size on mount
    useEffect(() => {
        updateQueueSize();
    }, [updateQueueSize]);

    return (
        <OfflineContext.Provider
            value={{
                isOnline: isConnected,
                queueSize,
                syncInProgress,
                syncQueue,
            }}
        >
            {children}
        </OfflineContext.Provider>
    );
};

export const useOffline = () => {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOffline must be used within OfflineProvider');
    }
    return context;
};

// Process individual queued action
async function processAction(action: QueuedAction): Promise<void> {
    switch (action.type) {
        case 'CREATE_ASK':
            await askService.createAsk(action.payload);
            break;
        case 'UPDATE_ASK':
            await askService.updateAsk(action.payload.id, action.payload.data);
            break;
        case 'DELETE_ASK':
            await askService.deleteAsk(action.payload.id);
            break;
        default:
            throw new Error(`Unknown action type: ${action.type}`);
    }
}
