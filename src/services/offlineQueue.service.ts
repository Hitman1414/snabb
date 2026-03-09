/**
 * Offline Queue Service
 * Manages queued actions when offline and syncs when back online
 */
import { storage } from './storage.adapter';

export interface QueuedAction {
    id: string;
    type: 'CREATE_ASK' | 'UPDATE_ASK' | 'DELETE_ASK' | 'CREATE_RESPONSE';
    payload: any;
    timestamp: number;
    retries: number;
}

class OfflineQueueService {
    private readonly QUEUE_KEY = 'action_queue';
    private readonly MAX_RETRIES = 3;

    /**
     * Add action to queue
     */
    async enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>): Promise<void> {
        const queue = await this.getQueue();
        const newAction: QueuedAction = {
            ...action,
            id: `${Date.now()}_${Math.random()}`,
            timestamp: Date.now(),
            retries: 0,
        };
        queue.push(newAction);
        await this.saveQueue(queue);
    }

    /**
     * Get all queued actions
     */
    async getQueue(): Promise<QueuedAction[]> {
        try {
            const queueJson = await storage.getItem(this.QUEUE_KEY);
            return queueJson ? JSON.parse(queueJson) : [];
        } catch (error) {
            console.error('Failed to get queue', error);
            return [];
        }
    }

    /**
     * Remove action from queue
     */
    async dequeue(actionId: string): Promise<void> {
        const queue = await this.getQueue();
        const newQueue = queue.filter(action => action.id !== actionId);
        await this.saveQueue(newQueue);
    }

    /**
     * Increment retry count
     */
    async incrementRetry(actionId: string): Promise<void> {
        const queue = await this.getQueue();
        const newQueue = queue.map(action => {
            if (action.id === actionId) {
                return { ...action, retries: action.retries + 1 };
            }
            return action;
        });
        await this.saveQueue(newQueue);
    }

    /**
     * Check if action should be retried
     */
    shouldRetry(action: QueuedAction): boolean {
        return action.retries < this.MAX_RETRIES;
    }

    /**
     * Clear all queued actions
     */
    async clearQueue(): Promise<void> {
        await storage.removeItem(this.QUEUE_KEY);
    }

    /**
     * Get queue size
     */
    async getQueueSize(): Promise<number> {
        const queue = await this.getQueue();
        return queue.length;
    }

    private async saveQueue(queue: QueuedAction[]): Promise<void> {
        await storage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    }
}

export const offlineQueueService = new OfflineQueueService();
