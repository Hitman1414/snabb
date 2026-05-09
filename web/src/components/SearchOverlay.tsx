"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Activity, Users, ArrowRight, MapPin, IndianRupee, Clock, Sparkles, User as UserIcon, ShieldCheck, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { Ask as AskType } from "@/types";

type SearchOverlayProps = {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'all' | 'pros' | 'asks';
};

export default function SearchOverlay({ isOpen, onClose, initialMode = 'all' }: SearchOverlayProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [asks, setAsks] = useState<AskType[]>([]);
    const [pros, setPros] = useState<{name: string, rating: number, reviews: number, initial: string, category: string, is_pro: boolean}[]>([]);
    const [askers, setAskers] = useState<{username: string, askCount: number, rating: number, initial: string}[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

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
        }
    }, [isOpen, initialMode]);

    const performSearch = async (q: string) => {
        setLoading(true);
        try {
            // Fetch asks and pros in parallel
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

            // Transform Pros to match UI expected format
            const formattedPros = fetchedPros.map(p => ({
                name: p.username,
                rating: p.pro_rating || 5.0,
                reviews: p.pro_completed_tasks || 0,
                initial: p.username ? p.username.charAt(0).toUpperCase() : "?",
                category: p.pro_category || "General",
                is_pro: p.is_pro
            }));

            // Extract Askers from fetched asks
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
                // "Browse All" mode logic
                if (initialMode === 'asks' || initialMode === 'all') {
                    setAsks(fetchedAsks.sort((a, b) => (b.response_count || 0) - (a.response_count || 0)).slice(0, 10));
                }
                if (initialMode === 'pros' || initialMode === 'all') {
                    setPros(formattedPros);
                    setAskers(formattedAskers);
                }
            } else {
                setAsks(fetchedAsks.slice(0, 10));
                
                // Filter Pros (API might not support search=... depending on backend, so we filter locally too)
                setPros(formattedPros.filter(p => 
                    p.name.toLowerCase().includes(searchQ) || 
                    p.category.toLowerCase().includes(searchQ)
                ));

                // Filter Askers (Clients)
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
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/70 backdrop-blur-2xl cursor-pointer"
                    />

                    {/* Search Container */}
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
                                <Search className={`w-6 h-6 sm:w-8 sm:h-8 transition-colors duration-300 ${query ? 'text-primary' : 'text-slate-300'}`} />
                                <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">Magical Search</h2>
                                <button onClick={onClose} className="ml-auto sm:hidden p-2 bg-slate-50 rounded-full text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="relative">
                                <input 
                                    ref={inputRef}
                                    type="text"
                                    placeholder={initialMode === 'pros' ? "Find top-rated professionals..." : initialMode === 'asks' ? "Explore trending opportunities..." : "Search for asks, pros, or communities..."}
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
                            {!query && initialMode === 'all' ? (
                                <div className="py-10 sm:py-20 text-center space-y-6 sm:space-y-8">
                                    <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-tr from-primary/10 to-primary/5 rounded-[2rem] sm:rounded-[3rem] flex items-center justify-center mx-auto text-primary shadow-xl border border-primary/10">
                                        <Sparkles className="w-10 h-10 sm:w-14 sm:h-14 animate-pulse" />
                                    </div>
                                    <div className="max-w-md mx-auto space-y-2 sm:space-y-4">
                                        <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter italic">Experience Snabb Search</p>
                                        <p className="text-slate-400 font-bold leading-relaxed text-xs sm:text-base uppercase tracking-widest sm:text-[10px]">Asks • Pros • Askers • Community</p>
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
                                        {/* SECTION: ASKS */}
                                        {asks.length > 0 && (
                                            <div className="space-y-4 sm:space-y-6">
                                                <div className="flex items-center justify-between border-b border-slate-50 pb-3 sm:pb-4">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                                                        <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Trending Asks</h3>
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
                                                        <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Top-Rated Professionals</h3>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                    {pros.map(pro => (
                                                        <div 
                                                            key={pro.name} 
                                                            onClick={() => handleNavigate(`/app/profile?user=${pro.name.replace(' ', '')}`)}
                                                            className="group p-5 sm:p-6 bg-slate-50/50 hover:bg-white rounded-2xl sm:rounded-[2.5rem] border border-transparent hover:border-slate-100 transition-all cursor-pointer flex flex-col gap-4 sm:gap-6 hover:shadow-2xl hover:shadow-slate-200/50 active:scale-[0.98] border-b-4 border-b-transparent hover:border-b-primary"
                                                        >
                                                            <div className="flex items-center gap-4 sm:gap-5">
                                                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-[1.5rem] bg-gradient-to-tr from-primary/10 to-primary/20 flex items-center justify-center text-primary font-black text-2xl sm:text-3xl group-hover:scale-105 transition-transform shadow-inner border border-primary/5 flex-shrink-0">
                                                                    {pro.initial}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="font-black text-slate-900 text-base sm:text-lg group-hover:text-primary transition-colors tracking-tight truncate">{pro.name}</h4>
                                                                        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                                                                    </div>
                                                                    <div className="flex items-center gap-2 sm:gap-3 mt-1">
                                                                        <span className="text-[10px] sm:text-xs text-amber-500 font-black">5.0 ★</span>
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
                                                            <div className="pt-2 flex justify-between items-center text-primary font-black text-[9px] sm:text-[10px] uppercase tracking-widest">
                                                                VIEW PROFILE <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
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
                                                    <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">Top Askers</h3>
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
                                                            <div className="text-[9px] sm:text-[10px] font-black text-amber-500 bg-white px-2 py-1 rounded-lg border border-slate-100 italic flex-shrink-0">{asker.rating} ★</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button 
                                                    onClick={() => handleNavigate('/app/profile')}
                                                    className="w-full py-3 sm:py-4 text-slate-400 font-black text-[8px] sm:text-[9px] uppercase tracking-[0.2em] border-2 border-dashed border-slate-200 rounded-xl sm:rounded-2xl hover:border-primary hover:text-primary transition-all cursor-pointer"
                                                >
                                                    View All Askers
                                                </button>
                                            </div>
                                        )}

                                        {/* TIP CARD */}
                                        <div className="bg-primary rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-primary/20">
                                            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 sm:-mr-16 sm:-mt-16"></div>
                                            <div className="relative z-10">
                                                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4 opacity-50" />
                                                <h4 className="text-lg sm:text-xl font-black mb-1 sm:mb-2 leading-tight">Need a Pro ASAP?</h4>
                                                <p className="text-[10px] sm:text-xs font-bold opacity-80 leading-relaxed mb-4 sm:mb-6">Filter by &apos;Real-time&apos; to find locals currently online and ready to help.</p>
                                                <button className="bg-white text-primary px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 hover:text-white transition-all">
                                                    Filter Online
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
