import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/api";

export type Notification = {
    id: number;
    title: string;
    body: string;
    type: string;
    data: any;
    is_read: boolean;
    created_at: string;
};

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/notifications`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id: number) => {
        try {
            const res = await fetch(`${API_URL}/notifications/${id}/read`, { 
                method: 'PUT',
                credentials: "include" 
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch(`${API_URL}/notifications/read-all`, { 
                method: 'PUT',
                credentials: "include" 
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            }
        } catch (err) {
            console.error(err);
        }
    };

    return {
        notifications,
        loading,
        refetch: fetchNotifications,
        markAsRead,
        markAllAsRead
    };
}
