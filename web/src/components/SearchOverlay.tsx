"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Activity, Users, ArrowRight, MapPin, IndianRupee, Clock, Sparkles, User as UserIcon, ShieldCheck, Trophy, Zap, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL, getFullImageUrl } from "@/lib/api";
import { Ask as AskType } from "@/types";
import { useDashboard } from "@/hooks/useDashboard";

type SearchOverlayProps = {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'all' | 'pros' | 'asks';
};

type ProUserFormatted = {
    id: number;
    name: string;
    rating: number;
    reviews: number;
    initial: string;
    category: string;
    is_pro: boolean;
    avatar_url?: string;
};

export default function SearchOverlay({ isOpen, onClose, initialMode = 'all' }: SearchOverlayProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [asks, setAsks] = useState<AskType[]>([]);
    const [pros, setPros] = useState<ProUserFormatted[]>([]);
    const [topPros, setTopPros] = useState<ProUserFormatted[]>([]);
    const [askers, setAskers] = useState<{username: string, askCount: number, rating: number, initial: string}[]>([]);
    const [aiResults, setAiResults] = useState<{user: any, match_reason: string}[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAiMode, setIsAiMode] = useState(false);
    const { user } = useDashboard();
    const inputRef = useRef<HTMLInputElement>(null);

    // ... (rest of the file lines will be checked below)

    // Fetch top pros for the carousel on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const prosRes = await fetch(`${API_URL}/users/pros?limit=10`, { credentials: "include" });
                if (prosRes.ok) {
                    const fetchedPros = await prosRes.json();
                    setTopPros(fetchedPros.map((p: any) => ({
                        id: p.id,
                        name: p.username,
                        rating: p.pro_rating || 5.0,
                        reviews: p.pro_completed_tasks || 0,
                        initial: p.username ? p.username.charAt(0).toUpperCase() : "?",
                        category: p.pro_category || "General",
                        is_pro: p.is_pro,
                        avatar_url: p.avatar_url
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch initial pros", err);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
            if (initialMode !== 'all') {
                performSearch(""); 
            }
        } else {
            document.body.style.overflow = 'unset';
            setQuery("");
            setAsks([]);
            setPros([]);
            setAskers([]);
            setIsAiMode(false);
        }
    }, [isOpen, initialMode]);

    const performSearch = async (q: string) => {
        setLoading(true);
        setAiResults([]);
        
        if (isAiMode && q.trim().length > 3) {
            try {
                const aiRes = await fetch(`${API_URL}/ai/magic-search`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: q }),
                    credentials: "include"
                });
                if (aiRes.status === 402) {
                    window.dispatchEvent(new CustomEvent('ai-paywall'));
                    setIsAiMode(false);
                    setLoading(false);
                    return;
                }
                if (aiRes.ok) {
                    const data = await aiRes.json();
                    setAiResults(data);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("AI Search Error", err);
            }
        }

        try {
            const [asksRes, prosRes] = await Promise.all([
                fetch(`${API_URL}/asks/?skip=0&limit=50&search=${encodeURIComponent(q)}`, { credentials: "include" }),
                fetch(`${API_URL}/users/pros?limit=50${q ? `&search=${encodeURIComponent(q)}` : ''}`, { credentials: "include" })
            ]);

            let fetchedAsks: AskType[] = [];
            let fetchedPros: any[] = [];

            if (asksRes.ok) {
                const data = await asksRes.json();
                fetchedAsks = data.items || [];
            }
            if (prosRes.ok) {
                fetchedPros = await prosRes.json();
            }

            const formattedPros = fetchedPros.map(p => ({
                id: p.id,
                name: p.username,
                rating: p.pro_rating || 5.0,
                reviews: p.pro_completed_tasks || 0,
                initial: p.username ? p.username.charAt(0).toUpperCase() : "?",
                category: p.pro_category || "General",
                is_pro: p.is_pro,
                avatar_url: p.avatar_url
            }));

            const askerMap = new Map();
            fetchedAsks.forEach(ask => {
                if (ask.user) {
                    if (!askerMap.has(ask.user.username)) {
                        askerMap.set(ask.user.username, {
                            username: ask.user.username,
                            askCount: 1,
                            rating: ask.user.pro_rating || 5.0,
                            initial: ask.user.username.charAt(0).toUpperCase()
                        });
                    } else {
                        askerMap.get(ask.user.username).askCount += 1;
                    }
                }
            });
            const formattedAskers = Array.from(askerMap.values());

            const searchQ = q.toLowerCase();
            
            if (q.trim() === "") {
                if (initialMode === 'asks' || initialMode === 'all') {
                    setAsks(fetchedAsks.sort((a, b) => (b.response_count || 0) - (a.response_count || 0)).slice(0, 10));
                }
                if (initialMode === 'pros' || initialMode === 'all') {
                    setPros(formattedPros);
                    setAskers(formattedAskers);
                }
            } else {
                setAsks(fetchedAsks.slice(0, 10));
                setPros(formattedPros.filter(p => 
                    p.name.toLowerCase().includes(searchQ) || 
                    p.category.toLowerCase().includes(searchQ)
                ));
                setAskers(formattedAskers.filter(a => 
                    a.username.toLowerCase().includes(searchQ)
                ));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length > 0) {
                performSearch(query);
            } else if (isOpen && initialMode !== 'all') {
                performSearch("");
            } else {
                setAsks([]);
                setPros([]);
                setAskers([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleNavigate = (path: string) => {
        onClose();
        router.push(path);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center pt-[5vh]">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/70 backdrop-blur-2xl cursor-pointer"
                    />

                    <motion.div 
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                        className="relative w-full max-w-5xl bg-white sm:rounded-[3.5rem] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] m-4"
                    >
                        {/* Immersive Search Header */}
                        <div className="p-4 sm:p-10 border-b border-slate-50 relative group bg-white z-10">
                            <div className="flex items-center gap-3 sm:gap-6 mb-4 sm:mb-8">
                                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isAiMode ? 'bg-primary shadow-lg shadow-primary/20 rotate-12' : 'bg-slate-100'}`}>
                                    {isAiMode ? <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white" /> : <Search className={`w-6 h-6 sm:w-8 sm:h-8 ${query ? 'text-primary' : 'text-slate-300'}`} />}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                        {isAiMode ? 'AI Magical Match' : 'Magical Search'}
                                    </h2>
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        {isAiMode ? 'Gemini AI is finding your best match...' : 'Instantly find anything on Snabb'}
                                    </p>
                                </div>
                                {(user?.is_ai_subscribed || user?.ai_override || user?.is_admin) && (
                                    <button 
                                        onClick={() => setIsAiMode(!isAiMode)}
                                        className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isAiMode ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        {isAiMode ? 'AI Active' : 'AI Mode'}
                                    </button>
                                )}
                                <button onClick={onClose} className="ml-2 sm:hidden p-2 bg-slate-50 rounded-full text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="relative">
                                <input 
                                    ref={inputRef}
                                    type="text"
                                    placeholder={isAiMode ? "Describe what you need, and Gemini will find the best pro..." : "Search for asks, pros, or communities..."}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-slate-50 rounded-[2.5rem] py-4 sm:py-7 pl-6 sm:pl-10 pr-12 sm:pr-16 text-lg sm:text-2xl font-black text-slate-900 focus:bg-white focus:ring-[8px] sm:focus:ring-[12px] focus:ring-primary/5 focus:border-primary transition-all outline-none border border-transparent shadow-inner placeholder:text-slate-300"
                                />
                                {query && (
                                    <button 
                                        onClick={() => setQuery("")}
                                        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-2 sm:p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-colors cursor-pointer"
                                    >
                                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Results Grid - Multi-Section */}
                        <div className="flex-1 overflow-y-auto px-4 sm:px-10 py-6 sm:py-12 no-scrollbar bg-white">
                            {!query ? (
                                <div className="space-y-12 sm:space-y-16">
                                    {/* PRO CAROUSEL SECTION */}
                                    <div className="space-y-6 sm:space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100">
                                                    <Trophy className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Community Experts</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Top rated pros available now</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleNavigate('/app/pros')}
                                                className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-1 group"
                                            >
                                                View All <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                        
                                        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 no-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
                                            {topPros.length > 0 ? topPros.map((pro) => (
                                                <motion.div 
                                                    key={pro.id}
                                                    whileHover={{ y: -5 }}
                                                    onClick={() => handleNavigate(`/app/profile?user=${pro.name.replace(' ', '')}`)}
                                                    className="min-w-[240px] sm:min-w-[280px] bg-slate-50/50 hover:bg-white p-6 rounded-[2.5rem] border border-transparent hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-4 mb-5">
                                                        <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-primary font-black text-2xl border border-primary/5 shadow-inner flex-shrink-0 relative overflow-hidden">
                                                            {pro.avatar_url ? (
                                                                <img src={getFullImageUrl(pro.avatar_url)} alt={pro.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                pro.initial
                                                            )}
                                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center border-2 border-white">
                                                                <Star className="w-3 h-3 fill-white" />
                                                            </div>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <h4 className="font-black text-slate-900 tracking-tight truncate group-hover:text-primary transition-colors">{pro.name}</h4>
                                                                <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] font-black text-amber-500">{pro.rating.toFixed(1)} ★</span>
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{pro.reviews} REVIEWS</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <span className="inline-block text-[8px] font-black uppercase tracking-widest bg-white text-primary px-3 py-1.5 rounded-full border border-primary/10 shadow-sm">
                                                            {pro.category}
                                                        </span>
                                                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-primary font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                            View Full Expert Profile <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )) : (
                                                // Skeleton
                                                [1, 2, 3].map(i => (
                                                    <div key={i} className="min-w-[280px] h-48 bg-slate-50 animate-pulse rounded-[2.5rem]"></div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* AI Tip / Promotion */}
                                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[3rem] p-8 sm:p-12 text-white relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                                        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-[2rem] flex items-center justify-center text-primary backdrop-blur-xl border border-white/20 shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                                                <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse fill-primary/20" />
                                            </div>
                                            <div className="flex-1 text-center sm:text-left">
                                                <h3 className="text-2xl sm:text-3xl font-black mb-3 tracking-tight">Try AI-Powered Magical Search</h3>
                                                <p className="text-slate-300 font-bold text-xs sm:text-sm leading-relaxed mb-6">Gemini AI understands your needs. Just describe what you're looking for, and we'll handle the vetting and matching for you.</p>
                                                <button 
                                                    onClick={() => setIsAiMode(true)}
                                                    className="bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95"
                                                >
                                                    Activate Snabb AI
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : loading ? (
                                <div className="py-10 sm:py-20 flex flex-col items-center gap-6 sm:gap-8">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 border-[4px] sm:border-[6px] border-primary border-t-transparent rounded-full animate-spin shadow-lg"></div>
                                    <p className="text-xs sm:text-sm font-black text-primary uppercase tracking-[0.4em]">Summoning Magic...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
                                    {/* Main Results: Asks & Professionals (Left 8/12) */}
                                    <div className="lg:col-span-8 space-y-8 sm:space-y-12">
                                        {/* SECTION: AI RESULTS */}
                                        {isAiMode && aiResults.length > 0 && (
                                            <div className="space-y-6 animate-in zoom-in-95 duration-500">
                                                <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
                                                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                                        <Sparkles className="w-4 h-4" />
                                                    </div>
                                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">AI Recommended Matches</h3>
                                                </div>
                                                <div className="space-y-4">
                                                    {aiResults.map(({ user, match_reason }) => (
                                                        <div 
                                                            key={user.id}
                                                            onClick={() => handleNavigate(`/app/profile?user=${user.username.replace(' ', '')}`)}
                                                            className="group p-6 bg-gradient-to-br from-primary/5 to-transparent hover:from-primary/10 rounded-[2.5rem] border border-primary/10 hover:border-primary/20 transition-all cursor-pointer flex flex-col sm:flex-row gap-6 relative overflow-hidden"
                                                        >
                                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                                <Sparkles className="w-12 h-12" />
                                                            </div>
                                                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] bg-white shadow-xl shadow-primary/5 flex items-center justify-center text-primary font-black text-3xl flex-shrink-0 overflow-hidden border border-primary/5">
                                                                {user.avatar_url ? (
                                                                    <img src={getFullImageUrl(user.avatar_url)} alt={user.username} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    user.username.charAt(0).toUpperCase()
                                                                )}
                                                            </div>
                                                            <div className="flex-1 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="font-black text-slate-900 text-xl tracking-tight">{user.username}</h4>
                                                                        <ShieldCheck className="w-5 h-5 text-primary" />
                                                                    </div>
                                                                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-primary/10 shadow-sm">
                                                                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                                        <span className="text-[10px] font-black text-slate-900">{(user.pro_rating || 5.0).toFixed(1)}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-primary/5">
                                                                    <p className="text-primary font-black text-[10px] uppercase tracking-widest mb-1 flex items-center gap-2">
                                                                        <Zap className="w-3 h-3" /> Why this match?
                                                                    </p>
                                                                    <p className="text-slate-600 font-bold text-sm italic leading-relaxed">
                                                                        &quot;{match_reason}&quot;
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-3 pt-2">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest bg-primary text-white px-3 py-1.5 rounded-full shadow-lg shadow-primary/20">
                                                                        {user.pro_category}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* SECTION: ASKS */}
                                        {asks.length > 0 && (
                                            <div className="space-y-4 sm:space-y-6">
                                                <div className="flex items-center justify-between border-b border-slate-50 pb-3 sm:pb-4">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                                                        <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Matching Asks</h3>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                                    {asks.map(ask => (
                                                        <div 
                                                            key={ask.id} 
                                                            onClick={() => handleNavigate(`/app/asks/${ask.id}`)}
                                                            className="group p-4 sm:p-6 bg-slate-50/50 hover:bg-white rounded-2xl sm:rounded-[2.5rem] border border-transparent hover:border-slate-100 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between hover:shadow-2xl hover:shadow-slate-200/50 gap-4 sm:gap-0"
                                                        >
                                                            <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                                                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-inner font-black uppercase italic text-xl sm:text-2xl border border-slate-50 flex-shrink-0">
                                                                    {ask.title.charAt(0)}
                                                                </div>
                                                                <div className="space-y-1 flex-1 min-w-0">
                                                                    <h4 className="font-black text-slate-900 text-base sm:text-lg group-hover:text-primary transition-colors tracking-tight truncate">{ask.title}</h4>
                                                                    <div className="flex items-center gap-3 sm:gap-4">
                                                                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400 font-black uppercase truncate max-w-[120px] sm:max-w-none">
                                                                            <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" /> <span className="truncate">{ask.location}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-500 font-black uppercase flex-shrink-0">
                                                                            <IndianRupee className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> {ask.budget_max || 'Flex'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-slate-100 items-center justify-center text-slate-200 group-hover:text-primary group-hover:border-primary/20 transition-all group-hover:translate-x-1 shadow-sm flex-shrink-0">
                                                                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* SECTION: PRO PEOPLE */}
                                        {pros.length > 0 && (
                                            <div className="space-y-4 sm:space-y-6">
                                                <div className="flex items-center justify-between border-b border-slate-50 pb-3 sm:pb-4">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                                                        <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Magical Professional Matches</h3>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                    {pros.map(pro => (
                                                        <div 
                                                            key={pro.id} 
                                                            onClick={() => handleNavigate(`/app/profile?user=${pro.name.replace(' ', '')}`)}
                                                            className="group p-5 sm:p-6 bg-slate-50/50 hover:bg-white rounded-2xl sm:rounded-[2.5rem] border border-transparent hover:border-slate-100 transition-all cursor-pointer flex flex-col gap-4 sm:gap-6 hover:shadow-2xl hover:shadow-slate-200/50 active:scale-[0.98] border-b-4 border-b-transparent hover:border-b-primary"
                                                        >
                                                            <div className="flex items-center gap-4 sm:gap-5">
                                                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-[1.5rem] bg-gradient-to-tr from-primary/10 to-primary/20 flex items-center justify-center text-primary font-black text-2xl sm:text-3xl group-hover:scale-105 transition-transform shadow-inner border border-primary/5 flex-shrink-0 overflow-hidden">
                                                                    {pro.avatar_url ? (
                                                                        <img src={getFullImageUrl(pro.avatar_url)} alt={pro.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        pro.initial
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="font-black text-slate-900 text-base sm:text-lg group-hover:text-primary transition-colors tracking-tight truncate">{pro.name}</h4>
                                                                        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                                                                    </div>
                                                                    <div className="flex items-center gap-2 sm:gap-3 mt-1">
                                                                        <span className="text-[10px] sm:text-xs text-amber-500 font-black">{pro.rating.toFixed(1)} ★</span>
                                                                        <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">{pro.reviews} REVIEWS</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <span className="text-[8px] font-black uppercase tracking-widest bg-primary/5 text-primary px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-primary/10">
                                                                    {pro.category}
                                                                </span>
                                                                <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                                                                    VERIFIED PRO
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sidebar Results: Askers & Communities (Right 4/12) */}
                                    <div className="lg:col-span-4 space-y-6 sm:space-y-10">
                                        {/* SECTION: ASKERS (Profiles) */}
                                        {askers.length > 0 && (
                                            <div className="bg-slate-50/50 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 space-y-6 sm:space-y-8 border border-slate-100">
                                                <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-200 pb-3 sm:pb-4">
                                                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                                                    <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">Active Askers</h3>
                                                </div>
                                                <div className="space-y-4 sm:space-y-6">
                                                    {askers.map(asker => (
                                                        <div 
                                                            key={asker.username}
                                                            onClick={() => handleNavigate(`/app/profile?user=${asker.username.replace(' ', '')}`)}
                                                            className="flex items-center gap-3 sm:gap-4 group cursor-pointer"
                                                        >
                                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 font-black group-hover:border-primary transition-all shadow-sm group-hover:scale-110 flex-shrink-0">
                                                                {asker.initial}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h5 className="font-black text-slate-900 text-xs sm:text-sm truncate group-hover:text-primary transition-colors">{asker.username}</h5>
                                                                <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{asker.askCount} ASKS POSTED</p>
                                                            </div>
                                                            <div className="text-[9px] sm:text-[10px] font-black text-amber-500 bg-white px-2 py-1 rounded-lg border border-slate-100 italic flex-shrink-0">{asker.rating.toFixed(1)} ★</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* TIP CARD */}
                                        <div className="bg-primary rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-primary/20">
                                            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 sm:-mr-16 sm:-mt-16"></div>
                                            <div className="relative z-10">
                                                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4 opacity-50" />
                                                <h4 className="text-lg sm:text-xl font-black mb-1 sm:mb-2 leading-tight">Match with AI?</h4>
                                                <p className="text-[10px] sm:text-xs font-bold opacity-80 leading-relaxed mb-4 sm:mb-6">Toggle AI Mode to let Gemini find the absolute best person based on your specific requirements.</p>
                                                <button 
                                                    onClick={() => setIsAiMode(true)}
                                                    className="bg-white text-primary px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 hover:text-white transition-all"
                                                >
                                                    Switch to AI
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Immersive Footer */}
                        <div className="hidden md:flex p-10 bg-slate-50 border-t border-slate-100 items-center justify-center gap-12">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xs font-black shadow-sm tracking-tight italic">CTRL</div>
                                <span className="text-slate-300 font-black">+</span>
                                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xs font-black shadow-sm tracking-tight italic">K</div>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Quick Search</span>
                            </div>
                            <div className="h-8 w-[1.5px] bg-slate-200"></div>
                            <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-[0.25em]">
                                <Clock className="w-5 h-5 text-primary opacity-50" />
                                Instant Navigation Interface
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
