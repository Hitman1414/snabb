"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, LayoutDashboard, FileText, MessageCircle, User as UserIcon, LogOut, Heart, Search, MapPin, ShieldAlert, Moon, Sun } from "lucide-react";
import { API_URL } from "@/lib/api";
import CreateAskModal from "@/components/CreateAskModal";
import SearchOverlay from "@/components/SearchOverlay";
import OnboardingTour from "@/components/OnboardingTour";

type User = {
    id: string;
    username: string;
    is_pro: boolean;
    is_admin: boolean;
    location?: string;
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchMode, setSearchMode] = useState<'all' | 'pros' | 'asks'>('all');
    const [isDark, setIsDark] = useState(false);
    const [userLocation, setUserLocation] = useState<string>("Not Set");
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

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

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const userRes = await fetch(`${API_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!userRes.ok) throw new Error('Unauthorized');
                const userData = await userRes.json();
                setUser(userData);
            } catch {
                localStorage.removeItem('token');
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

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
                console.error("Geolocation error:", error);
                setIsFetchingLocation(false);
            });
        }
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const handleAskCreated = () => {
        window.location.reload(); 
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent flex rounded-full animate-spin"></div>
            </div>
        );
    }

    const navItems = [
        { name: 'Home', href: '/app', icon: LayoutDashboard },
        { name: 'My Asks', href: '/app/my-asks', icon: FileText },
        { name: 'Interested', href: '/app/interested', icon: Heart },
        { name: 'Messages', href: '/app/messages', icon: MessageCircle },
        { name: 'Profile', href: '/app/profile', icon: UserIcon },
    ];

    if (user?.is_admin) {
        navItems.push({ name: 'Admin', href: '/app/admin', icon: ShieldAlert });
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 pb-12 transition-colors">
            {/* Top Navigation Bar */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-colors">
                <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center gap-8">
                    {/* Logo & Location */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                        <Link href="/app" className="flex items-center gap-2 group">
                            <img src="/snabb-logo.svg" alt="Snabb Logo" className="h-12 w-auto group-hover:scale-105 transition-transform" />
                        </Link>
                        
                        <button className="hidden lg:flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Delivering to</p>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 leading-none">
                                    {isFetchingLocation ? "Locating..." : userLocation} <span className="text-[8px]">▼</span>
                                </p>
                            </div>
                        </button>
                    </div>

                    {/* Search Bar - Now triggers Magical Overlay */}
                    <div 
                        id="tour-search"
                        onClick={() => setIsSearchOpen(true)}
                        className="flex-1 max-w-2xl relative group cursor-pointer"
                    >
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors" />
                        <div className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:border-primary/20 transition-all flex items-center justify-between">
                            <span>Search for &quot;plumbing&quot;, &quot;delivery&quot; or &quot;cleaning&quot;</span>
                            <div className="flex items-center gap-1 text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg text-slate-300 dark:text-slate-400 font-black shadow-sm">
                                <span className="text-[8px]">CTRL</span> K
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <button 
                            id="tour-create-ask"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2 text-sm active:scale-95"
                        >
                            <Plus className="w-5 h-5 stroke-[3px]" />
                            <span className="hidden xl:inline">Post an Ask</span>
                        </button>
                        
                        <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-800 hidden sm:block"></div>

                        <button 
                            onClick={toggleTheme}
                            className="w-12 h-12 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500 transition-all group"
                        >
                            {isDark ? <Sun className="w-5 h-5 group-hover:scale-110 transition-transform text-slate-200" /> : <Moon className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                        </button>

                        <Link href="/app/messages" className="w-12 h-12 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500 transition-all relative group">
                            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform dark:text-slate-200" />
                            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                        </Link>

                        <button 
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-12 h-12 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all group"
                        >
                            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>

                        <Link href="/app/profile" className="flex items-center gap-3 pl-2 group">
                            <div className="w-11 h-11 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-gradient-to-tr from-slate-100 dark:from-slate-800 to-slate-200 dark:to-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-black transition-all group-hover:border-primary/30 shadow-sm">
                                {user?.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden lg:block text-left">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Welcome back</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{user?.username}</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Secondary Nav Bar */}
                <nav className="border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-x-auto no-scrollbar transition-colors">
                    <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-10">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link 
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2.5 text-[13px] font-black uppercase tracking-[0.25em] h-full border-b-[3px] transition-all whitespace-nowrap px-1 group ${
                                        isActive 
                                        ? 'border-primary text-primary' 
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'stroke-[3px]' : 'stroke-[2px]'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </header>

            {/* Main Content Area */}
            <div className="max-w-[1400px] mx-auto px-6 mt-10">
                <main className="w-full">
                    {children}
                </main>
            </div>

            {/* Logout Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mb-8 mx-auto border border-red-100">
                            <LogOut className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-3xl font-black text-center text-slate-900 mb-2 tracking-tight">Sign Out?</h2>
                        <p className="text-slate-500 font-bold text-center mb-10 leading-relaxed">Are you sure you want to log out of your session?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setShowLogoutConfirm(false)}
                                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 py-5 rounded-2xl font-black transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleLogout}
                                className="w-full bg-red-500 hover:bg-red-600 text-white py-5 rounded-2xl font-black transition-all shadow-xl shadow-red-500/20 active:scale-95"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <OnboardingTour />

            <CreateAskModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={handleAskCreated}
            />

            <SearchOverlay 
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                initialMode={searchMode}
            />
        </div>
    );
}
