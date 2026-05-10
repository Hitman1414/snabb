import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export type User = {
    id: string;
    username: string;
    is_pro: boolean;
    is_admin: boolean;
    location?: string;
    is_ai_subscribed: boolean;
    ai_override?: boolean;
    pro_status?: string;
};

export function useDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchMode, setSearchMode] = useState<'all' | 'pros' | 'asks'>('all');
    const [isDark, setIsDark] = useState(false);
    const [userLocation, setUserLocation] = useState<string>("Not Set");
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (document.documentElement.classList.contains('dark')) {
                setIsDark(true);
            }
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        }
    };

    useEffect(() => {
        const handleOpenSearch = (e: CustomEvent | Event) => {
            const mode = 'detail' in e ? (e as CustomEvent).detail?.mode : undefined;
            setSearchMode(mode || 'all');
            setIsSearchOpen(true);
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchMode('all');
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('open-search', handleOpenSearch);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('open-search', handleOpenSearch);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const fetchUserData = async () => {
        try {
            const userRes = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
            if (!userRes.ok) throw new Error('Unauthorized');
            const userData = await userRes.json();
            setUser(userData);
        } catch {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [router]);

    useEffect(() => {
        if (!user) return;
        setUserLocation(user.location || "Not Set");

        if (navigator.geolocation) {
            setIsFetchingLocation(true);
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    if (data && data.address) {
                        const city = data.address.city || data.address.town || data.address.village || data.address.county;
                        const country = data.address.country;
                        if (city && country) {
                            setUserLocation(`${city}, ${country}`);
                        } else if (city || country) {
                            setUserLocation(city || country);
                        }
                    }
                } catch (error) {
                    console.error("Failed to reverse geocode:", error);
                } finally {
                    setIsFetchingLocation(false);
                }
            }, (error) => {
                console.warn("Background Geolocation Warning:", error.message || error.code);
                setIsFetchingLocation(false);
            }, { timeout: 10000 });
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const fetchUnreadCounts = async () => {
            try {
                const res = await fetch(`${API_URL}/notifications`, { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    const list = data.notifications || data || [];
                    const unread = list.filter((n: { is_read: boolean }) => !n.is_read).length;
                    setUnreadNotifications(unread);
                }
                const resMsg = await fetch(`${API_URL}/messages/conversations`, { credentials: "include" });
                if (resMsg.ok) {
                    const convos = await resMsg.json();
                    const unreadMsg = convos.reduce((acc: number, c: any) => acc + (c.unread_count || 0), 0);
                    setUnreadMessages(unreadMsg);
                }
            } catch {}
        };
        fetchUnreadCounts();
        const interval = setInterval(fetchUnreadCounts, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const handleAskCreated = () => {
        window.location.reload(); 
    };

    const [isAiProModalOpen, setIsAiProModalOpen] = useState(false);

    const toggleAiSubscription = async () => {
        try {
            const res = await fetch(`${API_URL}/ai/subscribe`, { method: "POST", credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setUser(prev => prev ? { ...prev, is_ai_subscribed: data.is_ai_subscribed } : null);
            }
        } catch (error) {
            console.error("Failed to toggle AI subscription:", error);
        }
    };

    useEffect(() => {
        const handleAiPaywall = () => setIsAiProModalOpen(true);
        const handleOpenCreate = () => setIsCreateModalOpen(true);
        window.addEventListener('ai-paywall', handleAiPaywall);
        window.addEventListener('open-create-ask', handleOpenCreate);
        return () => {
            window.removeEventListener('ai-paywall', handleAiPaywall);
            window.removeEventListener('open-create-ask', handleOpenCreate);
        };
    }, []);

    return {
        user,
        loading,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isSearchOpen,
        setIsSearchOpen,
        searchMode,
        setSearchMode,
        isDark,
        toggleTheme,
        userLocation,
        isFetchingLocation,
        unreadNotifications,
        setUnreadNotifications,
        unreadMessages,
        handleAskCreated,
        isAiProModalOpen,
        setIsAiProModalOpen,
        toggleAiSubscription,
        mutate: fetchUserData
    };
}
