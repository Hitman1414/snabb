"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import {
    FileText,
    MessageCircle,
    User as UserIcon,
    Activity,
    Search,
    ShoppingBag,
    Utensils,
    Home,
    Car,
    Banknote,
    Heart,
    Briefcase,
    Globe,
    MapPin,
    Users,
    ArrowRight,
    X,
    LayoutGrid,
    List
} from "lucide-react";
import AskCard from "@/components/AskCard";
import DashboardBanners from "@/components/DashboardBanners";
import CreateAskModal from "@/components/CreateAskModal";
import SnabbProModal from "@/components/SnabbProModal";
import { User, Ask } from "@/types";

const CATEGORIES = [
    { title: 'All', icon: Globe, color: 'text-blue-500' },
    { title: 'Digital & Support', icon: Activity, color: 'text-purple-500' },
    { title: 'Food & Delivery', icon: Utensils, color: 'text-red-500' },
    { title: 'Home & Repairs', icon: Home, color: 'text-indigo-500' },
    { title: 'Errands & Shopping', icon: ShoppingBag, color: 'text-orange-500' },
    { title: 'Ride & Transport', icon: Car, color: 'text-blue-600' },
    { title: 'Financial Assistance', icon: Banknote, color: 'text-green-600' },
    { title: 'Pet Care', icon: Heart, color: 'text-pink-500' },
    { title: 'Health & Wellness', icon: Activity, color: 'text-teal-500' },
    { title: 'Freelance Tasks', icon: Briefcase, color: 'text-slate-600' },
];

type ProUser = {
    id: number;
    username: string;
    pro_category: string;
    pro_rating: number;
    pro_completed_tasks: number;
    avatar_url?: string;
};

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const q = searchParams.get('q') || "";
    const [user, setUser] = useState<User | null>(null);
    const [allAsks, setAllAsks] = useState<Ask[]>([]);
    const [allPros, setAllPros] = useState<ProUser[]>([]);
    const [filteredPros, setFilteredPros] = useState<ProUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [unreadMsgs, setUnreadMsgs] = useState(0);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [sortFilter, setSortFilter] = useState('latest');
    const [locationParams, setLocationParams] = useState<{lat?: number, lng?: number}>({});
    const [locationError, setLocationError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLocationError(null);
        const newSort = e.target.value;
        if (newSort === 'nearby') {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setLocationParams({ lat: position.coords.latitude, lng: position.coords.longitude });
                        setSortFilter('nearby');
                    },
                    () => {
                        setLocationError('Enable location access in browser settings to use Nearby.');
                        setSortFilter('latest');
                        setTimeout(() => setLocationError(null), 4000);
                    }
                );
            } else {
                setLocationError('Geolocation not supported in this browser.');
                setSortFilter('latest');
                setTimeout(() => setLocationError(null), 4000);
            }
        } else {
            setSortFilter(newSort);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {

            try {
                const userRes = await fetch(`${API_URL}/auth/me`, { credentials: "include", 
                    });

                if (!userRes.ok) throw new Error('Unauthorized');
                const userData = await userRes.json();
                setUser(userData);

                const convRes = await fetch(`${API_URL}/messages/conversations`, { credentials: "include", 
                    });
                if (convRes.ok) {
                    const convs = await convRes.json();
                    const count = convs.reduce((acc: number, c: { unread_count?: number }) => acc + (c.unread_count || 0), 0);
                    setUnreadMsgs(count);
                }

                const prosRes = await fetch(`${API_URL}/users/pros?limit=20`, { credentials: "include", 
                    });
                if (prosRes.ok) {
                    const prosData: ProUser[] = await prosRes.json();
                    setAllPros(prosData);
                    setFilteredPros(prosData);
                }
            } catch (err) {
                console.error(err);
                router.push('/login');
            }
        };

        fetchUserData();
    }, [router]);

    const fetchAsks = useCallback(async () => {
        try {
            let url = `${API_URL}/asks/?skip=0&limit=100&sort=${sortFilter}&status=open`;
            if (sortFilter === 'nearby' && locationParams.lat && locationParams.lng) {
                url += `&lat=${locationParams.lat}&lng=${locationParams.lng}&radius_km=30`;
            }
            if (selectedCategory !== 'All') {
                url += `&category=${encodeURIComponent(selectedCategory)}`;
            }
            if (q) {
                url += `&search=${encodeURIComponent(q)}`;
            }

            const asksRes = await fetch(url, { credentials: "include" });
            if (asksRes.ok) {
                const asksData = await asksRes.json();
                setAllAsks(asksData.items || asksData);
            }
        } catch (error) {
            console.error('Failed to fetch asks', error);
        } finally {
            setLoading(false);
        }
    }, [sortFilter, locationParams, selectedCategory, q]);

    useEffect(() => {
        fetchAsks();
    }, [fetchAsks, refreshTrigger]);

    useEffect(() => {
        const handleAskCreated = () => {
            setRefreshTrigger(prev => prev + 1);
        };
        window.addEventListener('ask-created', handleAskCreated);
        return () => window.removeEventListener('ask-created', handleAskCreated);
    }, []);


    useEffect(() => {
        let proResult = allPros;

        if (selectedCategory !== 'All') {
            proResult = proResult.filter(pro => pro.pro_category === selectedCategory);
        }

        if (q) {
            const query = q.toLowerCase();
            proResult = proResult.filter(pro =>
                pro.username.toLowerCase().includes(query) ||
                (pro.pro_category || '').toLowerCase().includes(query)
            );
        }
        setFilteredPros(proResult);
    }, [selectedCategory, allPros, q]);

    const handleAskCreated = (newAsk: Ask) => {
        setAllAsks(prev => [newAsk, ...prev]);
        setIsCreateModalOpen(false);
    };

    const clearSearch = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('q');
        router.push(`/app?${params.toString()}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent flex rounded-full animate-spin"></div>
            </div>
        );
    }

    const isSearching = !!q;

    return (
        <div className="space-y-10 pb-20">
            {/* Conditional Search Header Overlay Experience */}
            {isSearching && (
                <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/10">
                                <Search className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Search Results</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Showing results for:</span>
                            <div className="bg-white px-4 py-2 rounded-xl border border-primary/20 flex items-center gap-3 shadow-sm">
                                <span className="text-sm font-black text-primary">&quot;{q}&quot;</span>
                                <button onClick={clearSearch} className="hover:bg-slate-50 p-1 rounded-md transition-colors cursor-pointer">
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                        </div>
                        <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Found {allAsks.length} asks and {filteredPros.length} pro{filteredPros.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            )}

            {/* Visual Category Grid */}
            {!isSearching && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Shop by Category</h2>
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('open-search', { detail: { mode: 'all' } }))}
                            className="text-primary font-black text-[10px] uppercase tracking-widest hover:text-primary/70 transition-colors cursor-pointer flex items-center gap-1 group"
                        >
                            View All <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                    <div id="tour-categories" className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-10 gap-x-4 gap-y-6 justify-center items-start">
                        {CATEGORIES.map((cat) => {
                            const isSelected = selectedCategory === cat.title;
                            return (
                                <button
                                    key={cat.title}
                                    onClick={() => setSelectedCategory(cat.title)}
                                    className="group flex flex-col items-center gap-2 transition-all cursor-pointer"
                                >
                                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-[3px] shadow-sm transition-all duration-300 ${
                                        isSelected 
                                        ? 'bg-primary border-primary/20 scale-105 shadow-lg shadow-primary/20' 
                                        : 'bg-white dark:bg-slate-800 border-slate-50 dark:border-slate-700 group-hover:border-primary/20 group-hover:scale-105 group-hover:shadow-md'
                                    }`}>
                                        <cat.icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${isSelected ? 'text-white' : cat.color}`} />
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest text-center leading-tight transition-colors px-1 ${isSelected ? 'text-primary' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                        {cat.title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {!isSearching && <DashboardBanners />}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-12">
                {/* Left Column: Asks (Full Width Now) */}
                <div id="tour-opportunities" className="lg:col-span-12 space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-200 max-w-6xl mx-auto w-full">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {isSearching ? 'Matching Asks' : 'Active Ask'}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {isSearching ? 'Asks that match your search' : 'Open tasks needing immediate help'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 relative">
                            {!isSearching && (
                                <select
                                    value={sortFilter}
                                    onChange={handleSortChange}
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                >
                                    <option value="latest">Latest</option>
                                    <option value="nearby">Nearby</option>
                                    <option value="most_rated">Most Rated</option>
                                </select>
                            )}
                            {/* Grid / List toggle */}
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    title="Grid view"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    title="List view"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                            {locationError && (
                                <div className="absolute top-full mt-2 right-0 bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-red-100 shadow-sm whitespace-nowrap z-10">
                                    {locationError}
                                </div>
                            )}
                        </div>
                    </div>

                    {allAsks.length === 0 ? (
                        <div className="bg-white py-24 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center text-center px-4 shadow-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-slate-50/10 pointer-events-none"></div>
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8 text-slate-200 shadow-inner">
                                <Search className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No opportunities found</h3>
                            <p className="text-slate-400 font-medium mb-8 max-w-xs">We couldn&apos;t find any asks matching your criteria. Try adjusting your filters.</p>
                            <button 
                                onClick={() => {setSelectedCategory('All'); clearSearch(); router.push('/app');}}
                                className="bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] px-10 py-5 rounded-2xl shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            >
                                Reset Search
                            </button>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? 'grid lg:grid-cols-2 gap-6' : 'flex flex-col gap-4'}>
                            {allAsks.map((ask) => (
                                <AskCard key={ask.id} ask={ask} />
                            ))}
                        </div>
                    )}
                </div>

            </div>

            <button id="new-request-btn" className="hidden" onClick={() => setIsCreateModalOpen(true)}></button>
            <CreateAskModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={handleAskCreated} 
            />
            <SnabbProModal />
        </div>
    );
}

export default function AppDashboard() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center py-20"><Search className="w-8 h-8 animate-spin text-primary" /></div>}>
            <DashboardContent />
        </Suspense>
    );
}
