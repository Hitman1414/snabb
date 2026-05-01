"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Users, ArrowRight, ShieldCheck, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

type ProType = {
    id: number;
    username: string;
    pro_category: string | null;
    pro_rating: number;
    pro_completed_tasks: number;
};

export default function SnabbProModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [pros, setPros] = useState<ProType[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            fetchPros();
        };
        window.addEventListener('open-snabb-pro', handleOpen);
        return () => window.removeEventListener('open-snabb-pro', handleOpen);
    }, []);

    const fetchPros = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/search?role=pro`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const items = data.items || [];
                setPros(items.sort((a: ProType, b: ProType) => (b.pro_completed_tasks || 0) - (a.pro_completed_tasks || 0)));
            }
        } catch (error) {
            console.error("Failed to fetch pros", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setIsOpen(false)}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 sticky top-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-800">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">SNABB PRO</h2>
                                <p className="text-sm font-bold text-slate-400">The premium professional network</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="w-10 h-10 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 no-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                        
                        {/* Section 1: Join Network */}
                        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                            <div className="flex items-center gap-3 mb-6">
                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Join the Network</h3>
                            </div>
                            
                            <div className="bg-gradient-to-br from-emerald-600 to-teal-500 rounded-[2rem] p-8 sm:p-10 text-white relative overflow-hidden group shadow-xl shadow-emerald-500/20">
                                <div className="relative z-10 max-w-lg">
                                    <h4 className="text-3xl font-black mb-4 tracking-tight leading-none">Turn your skills into earnings.</h4>
                                    <p className="text-emerald-50 font-medium mb-8 leading-relaxed">
                                        Become a Snabb Pro and get access to exclusive tasks, verified badge, and priority support. Help people nearby and get paid instantly.
                                    </p>
                                    <button 
                                        onClick={() => { setIsOpen(false); router.push('/app/profile'); }}
                                        className="bg-white text-emerald-600 text-sm font-black uppercase tracking-widest px-8 py-4 rounded-xl flex items-center gap-3 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 cursor-pointer"
                                    >
                                        Apply for Pro Status
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                                <Sparkles className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-10 group-hover:rotate-12 transition-transform duration-700 pointer-events-none" />
                            </div>
                        </div>

                        {/* Section 2: Professionals */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                            <div className="flex items-center gap-3 mb-6">
                                <Users className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Featured Professionals</h3>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {pros.length === 0 ? (
                                        <div className="sm:col-span-2 py-10 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                                            <p className="text-xs font-bold uppercase tracking-widest">No pros found</p>
                                        </div>
                                    ) : (
                                        pros.map((pro) => (
                                            <div
                                                key={pro.id}
                                                onClick={() => { setIsOpen(false); router.push(`/app/profile?userId=${pro.id}`); }}
                                                className="group p-5 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-4 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none active:scale-[0.98]"
                                            >
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary/10 to-primary/20 flex items-center justify-center text-primary font-black text-xl group-hover:scale-110 transition-transform shadow-inner shrink-0">
                                                    {pro.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-black text-slate-900 dark:text-white text-base truncate group-hover:text-primary transition-colors">{pro.username}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md">
                                                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black tracking-tight">
                                                                {(pro.pro_rating || 0).toFixed(1)}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{pro.pro_completed_tasks || 0} tasks</span>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-300 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-primary group-hover:border-primary/20 transition-colors shadow-sm group-hover:translate-x-1">
                                                    <ArrowRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
