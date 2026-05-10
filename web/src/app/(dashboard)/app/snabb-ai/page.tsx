"use client";

import React, { useState } from 'react';
import { 
    Sparkles, 
    Zap, 
    Search, 
    Wand2, 
    Bot, 
    BadgeCheck, 
    ArrowLeft, 
    Check, 
    ShieldCheck, 
    Clock, 
    CreditCard,
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/hooks/useDashboard';
import { API_URL } from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function SnabbAiHubPage() {
    const router = useRouter();
    const { user, mutate } = useDashboard();
    const { success: toastSuccess, error: toastError } = useToast();
    const [loading, setLoading] = useState(false);
    
    // Feature toggles state
    const [magicSearch, setMagicSearch] = useState(true);
    const [autoFormFill, setAutoFormFill] = useState(true);

    const isSubscribed = user?.is_ai_subscribed || user?.ai_override || user?.is_admin;

    const handleToggleSubscription = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/me/toggle-ai`, {
                method: 'POST',
                credentials: 'include'
            });
            if (!res.ok) throw new Error("Failed to update subscription");
            
            await mutate();
            toastSuccess(isSubscribed ? "Subscription cancelled" : "🎉 Welcome to Snabb AI Pro!");
        } catch (err: any) {
            toastError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const features = [
        {
            title: 'Magic Ask',
            desc: 'Describe your need in plain text, and Gemini will fill the entire form for you instantly.',
            icon: Sparkles,
            color: 'text-indigo-500',
            bg: 'bg-indigo-50 dark:bg-indigo-950/30'
        },
        {
            title: 'AI Description Enhancer',
            desc: 'Turn a simple request into a professional, clear description that attracts better pros.',
            icon: Wand2,
            color: 'text-purple-500',
            bg: 'bg-purple-50 dark:bg-purple-950/30'
        },
        {
            title: 'Smart Matchmaking',
            desc: 'Our AI analyzes your task and suggests the most qualified professionals in Gurugram.',
            icon: Zap,
            color: 'text-amber-500',
            bg: 'bg-amber-50 dark:bg-amber-950/30'
        },
        {
            title: 'Expert AI Chat',
            desc: 'Get instant advice on budget, time required, and materials needed for your tasks.',
            icon: MessageSquareIcon,
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-950/30'
        }
    ];

    function MessageSquareIcon(props: any) {
        return (
            <svg
                {...props}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 py-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="relative p-12 bg-indigo-50 dark:bg-indigo-950/20 rounded-[3rem] overflow-hidden border border-indigo-100 dark:border-indigo-900/30">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-100/30 dark:bg-indigo-900/10 -skew-x-12 translate-x-10" />
                
                <button 
                    onClick={() => router.back()}
                    className="mb-8 flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold hover:gap-3 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" /> Back
                </button>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        {isSubscribed && (
                            <div className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                                <BadgeCheck className="w-4 h-4" /> AI Pro Member
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-indigo-900 dark:text-indigo-100 tracking-tight">SNABB AI</h1>
                        <p className="text-xl text-indigo-700/80 dark:text-indigo-400/80 max-w-xl font-medium leading-relaxed mt-2">
                            The smartest way to get things done. Powered by Gemini, built for Gurugram.
                        </p>
                    </div>
                </div>
            </div>

            {/* Pricing / CTA */}
            {!isSubscribed ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-8 p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">AI Pro Subscription</h2>
                            <p className="text-slate-500 font-medium">Unlock the full power of artificial intelligence.</p>
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-slate-900 dark:text-white">₹75</span>
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">/ month</span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold">
                                <Check className="w-5 h-5 text-indigo-500" />
                                1 Week FREE Trial
                            </div>
                            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold">
                                <Check className="w-5 h-5 text-indigo-500" />
                                Unlimited Magic Asks
                            </div>
                            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold">
                                <Check className="w-5 h-5 text-indigo-500" />
                                Advanced Description Enhancement
                            </div>
                            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold">
                                <Check className="w-5 h-5 text-indigo-500" />
                                Smart Professional Ranking
                            </div>
                        </div>

                        <button 
                            onClick={handleToggleSubscription}
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                            Start 7-Day Free Trial
                        </button>
                        
                        <div className="flex items-center justify-center gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Secure Payment</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Cancel Anytime</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Why Snabb AI?</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {features.map((feature, i) => (
                                <div key={i} className="flex items-start gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
                                    <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center flex-shrink-0`}>
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white">{feature.title}</h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed mt-1">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-12">
                    <div className="bg-indigo-600 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-indigo-500/20">
                        <div className="space-y-2 text-center md:text-left">
                            <h2 className="text-3xl font-black">You are an AI Pro!</h2>
                            <p className="text-indigo-100 font-medium">Enjoy unlimited access to all magical features.</p>
                        </div>
                        <button 
                            onClick={handleToggleSubscription}
                            className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-bold border border-white/20 transition-all"
                        >
                            Cancel Subscription
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Features Toggles */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Your AI Features</h2>
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
                                            <Search className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">Magic Search</h4>
                                            <p className="text-xs text-slate-500 font-medium">Find what you need using natural language</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={magicSearch}
                                            onChange={() => setMagicSearch(!magicSearch)}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-500"></div>
                                    </label>
                                </div>
                                <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-500">
                                            <Wand2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">Auto Form Fill</h4>
                                            <p className="text-xs text-slate-500 font-medium">Let AI fill task details automatically</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={autoFormFill}
                                            onChange={() => setAutoFormFill(!autoFormFill)}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-500"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* SaaS Apps */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">SaaS Apps</h2>
                            <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl py-12 flex flex-col items-center justify-center text-center px-6 h-[calc(100%-3rem)]">
                                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-500 mb-4">
                                    <Bot className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Coming Soon</h3>
                                <p className="text-sm text-slate-500 font-medium max-w-[250px] mx-auto">
                                    We will be launching a suite of SaaS applications in the next release. Stay tuned!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
