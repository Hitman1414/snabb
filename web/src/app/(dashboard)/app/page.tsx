"use client";

import { useEffect, useState, Suspense } from "react";
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
    X
} from "lucide-react";
import AskCard, { AskType } from "@/components/AskCard";
import DashboardBanners from "@/components/DashboardBanners";
import CreateAskModal from "@/components/CreateAskModal";

export type User = {
    id: string;
    username: string;
    email: string;
    is_pro: boolean;
    created_at: string;
    updated_at: string;
};

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

const MOCK_PROS = [
    { name: "Expert Helper 1", rating: 5.0, reviews: 21, initial: "A", category: "Digital & Support" },
    { name: "Expert Helper 2", rating: 5.0, reviews: 22, initial: "B", category: "Home & Repairs" },
    { name: "Expert Helper 3", rating: 5.0, reviews: 23, initial: "C", category: "Freelance Tasks" },
    { name: "Expert Helper 4", rating: 5.0, reviews: 24, initial: "D", category: "Ride & Transport" },
    { name: "Expert Helper 5", rating: 5.0, reviews: 25, initial: "E", category: "Errands & Shopping" },
];

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const q = searchParams.get('q') || "";
    const [user, setUser] = useState<User | null>(null);
    const [allAsks, setAllAsks] = useState<AskType[]>([]);
    const [filteredAsks, setFilteredAsks] = useState<AskType[]>([]);
    const [filteredPros, setFilteredPros] = useState(MOCK_PROS);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [unreadMsgs, setUnreadMsgs] = useState(0);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
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

                const asksRes = await fetch(`${API_URL}/asks/?skip=0&limit=100`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (asksRes.ok) {
                    const asksData = await asksRes.json();
                    const items = asksData.items || [];
                    setAllAsks(items);
                    setFilteredAsks(items);
                }

                const convRes = await fetch(`${API_URL}/messages/conversations`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (convRes.ok) {
                    const convs = await convRes.json();
                    const count = convs.reduce((acc: number, c: any) => acc + (c.unread_count || 0), 0);
                    setUnreadMsgs(count);
                }
            } catch (err) {
                console.error(err);
                localStorage.removeItem('token');
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [router]);

    useEffect(() => {
        let result = allAsks;
        let proResult = MOCK_PROS;

        if (selectedCategory !== 'All') {
            result = result.filter(ask => ask.category === selectedCategory);
            // Also filter pros by category if selected
            proResult = proResult.filter(pro => pro.category === selectedCategory);
        }

        if (q) {
            const query = q.toLowerCase();
            result = result.filter(ask => 
                ask.title.toLowerCase().includes(query) || 
                ask.description.toLowerCase().includes(query) ||
                ask.location.toLowerCase().includes(query) ||
                ask.category.toLowerCase().includes(query)
            );

            proResult = proResult.filter(pro => 
                pro.name.toLowerCase().includes(query) ||
                pro.category.toLowerCase().includes(query)
            );
        }
        setFilteredAsks(result);
        setFilteredPros(proResult);
    }, [selectedCategory, allAsks, q]);

    const handleAskCreated = (newAsk: AskType) => {
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
                                <span className="text-sm font-black text-primary">"{q}"</span>
                                <button onClick={clearSearch} className="hover:bg-slate-50 p-1 rounded-md transition-colors cursor-pointer">
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                        </div>
                        <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Found {filteredAsks.length} asks and {filteredPros.length} professionals
                        </p>
                    </div>
                </div>
            )}

            {/* Visual Category Grid */}
            {!isSearching && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Shop by Category</h2>
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('open-search', { detail: { mode: 'all' } }))}
                            className="text-primary font-black text-[10px] uppercase tracking-widest hover:text-primary/70 transition-colors cursor-pointer flex items-center gap-1 group"
                        >
                            View All <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-10 gap-x-4 gap-y-6 justify-center items-start">
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
                                        : 'bg-white border-slate-50 group-hover:border-primary/20 group-hover:scale-105 group-hover:shadow-md'
                                    }`}>
                                        <cat.icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${isSelected ? 'text-white' : cat.color}`} />
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest text-center leading-tight transition-colors px-1 ${isSelected ? 'text-primary' : 'text-slate-500 group-hover:text-slate-900'}`}>
                                        {cat.title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {!isSearching && <DashboardBanners />}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Asks (8/12) */}
                <div className="lg:col-span-8 space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                    {isSearching ? 'Matching Opportunities' : 'Active Opportunities'}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {isSearching ? 'Asks that match your search' : 'Tasks needing immediate help'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {!isSearching && (
                                <button 
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-search', { detail: { mode: 'asks' } }))}
                                    className="text-primary font-black text-[10px] uppercase tracking-widest hover:text-primary/70 transition-colors cursor-pointer flex items-center gap-1 group whitespace-nowrap"
                                >
                                    See More <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                                </button>
                            )}
                            {!isSearching && (
                                <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 shadow-inner">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    32+ Online
                                </div>
                            )}
                        </div>
                    </div>

                    {filteredAsks.length === 0 ? (
                        <div className="bg-white py-24 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center text-center px-4 shadow-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-slate-50/10 pointer-events-none"></div>
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8 text-slate-200 shadow-inner">
                                <Search className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No opportunities found</h3>
                            <p className="text-slate-400 font-medium mb-8 max-w-xs">We couldn't find any asks matching your criteria. Try adjusting your filters.</p>
                            <button 
                                onClick={() => {setSelectedCategory('All'); clearSearch(); router.push('/app');}}
                                className="bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] px-10 py-5 rounded-2xl shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            >
                                Reset Search
                            </button>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-2 gap-6">
                            {filteredAsks.map((ask) => (
                                <AskCard key={ask.id} ask={ask} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Professionals (4/12) */}
                <div className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 sticky top-24 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border-t-primary/10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/5 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/5">
                                    <Users className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                    {isSearching ? 'Matching Pros' : 'Professionals'}
                                </h2>
                            </div>
                            <button 
                                onClick={() => window.dispatchEvent(new CustomEvent('open-search', { detail: { mode: 'pros' } }))}
                                className="text-primary font-black text-[9px] uppercase tracking-widest hover:text-primary/70 transition-colors cursor-pointer underline underline-offset-4 decoration-2 decoration-primary/20"
                            >
                                View All
                            </button>
                        </div>

                        <div className="space-y-4">
                            {filteredPros.length === 0 ? (
                                <div className="py-10 text-center text-slate-400">
                                    <p className="text-xs font-bold uppercase tracking-widest">No matching pros</p>
                                </div>
                            ) : (
                                filteredPros.map((pro, i) => (
                                    <div 
                                        key={pro.name} 
                                        onClick={() => router.push(`/app/profile?user=${pro.name.replace(' ', '')}`)}
                                        className="group p-4 bg-slate-50/50 hover:bg-white rounded-[2rem] border border-transparent hover:border-slate-100 transition-all cursor-pointer flex items-center gap-4 hover:shadow-xl hover:shadow-slate-200/50 active:scale-[0.98]"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/10 to-primary/20 flex items-center justify-center text-primary font-black text-lg group-hover:scale-110 transition-transform shadow-inner">
                                            {pro.initial}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-slate-900 text-[13px] truncate group-hover:text-primary transition-colors">{pro.name}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-amber-500 font-black tracking-tight">{pro.rating} ★</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{pro.reviews} Reviews</span>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:border-primary/20 transition-colors shadow-sm group-hover:rotate-12">
                                            <Users className="w-4 h-4" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('open-search', { detail: { mode: 'pros' } }))}
                            className="w-full mt-8 bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-primary hover:shadow-primary/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 group"
                        >
                            Join the Network
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>
            </div>

            <button id="new-request-btn" className="hidden" onClick={() => setIsCreateModalOpen(true)}></button>
            <CreateAskModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={handleAskCreated} 
            />
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
