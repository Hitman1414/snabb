"use client";

import React from 'react';
import { X, Sparkles, Search, Rocket, Zap, CheckCircle2 } from 'lucide-react';

interface AiProModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubscribe: () => void;
    isSubscribed: boolean;
}

export default function AiProModal({ isOpen, onClose, onSubscribe, isSubscribed }: AiProModalProps) {
    if (!isOpen) return null;

    const features = [
        {
            icon: Sparkles,
            title: 'Unlimited Magical Matches',
            description: 'Use Gemini AI to find the perfect professional for any task, instantly.'
        },
        {
            icon: Search,
            title: 'Contextual Semantic Search',
            description: 'Search using natural language. We understand what you mean, not just what you type.'
        },
        {
            icon: Rocket,
            title: 'AI SaaS App Catalog',
            description: 'Get exclusive access to our upcoming suite of AI productivity tools.'
        },
        {
            icon: Zap,
            title: 'Priority AI Processing',
            description: 'Your requests are handled by our fastest premium AI models.'
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
                    <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/30 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-[100px]" />
                </div>

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="relative p-8 sm:p-12">
                    {/* Header */}
                    <div className="text-center space-y-4 mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 mb-2 relative">
                            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping opacity-20" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">SNABB AI PRO</h2>
                        <p className="text-slate-400 font-medium">Unlock the full power of artificial intelligence.</p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                        {features.map((feature, index) => (
                            <div key={index} className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex gap-4 group hover:bg-slate-800 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white">{feature.title}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA Section */}
                    <div className="text-center space-y-6">
                        <div className="flex items-baseline justify-center gap-2">
                            <span className="text-4xl font-black text-white">$9.99</span>
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">/ month</span>
                        </div>

                        <button 
                            onClick={() => {
                                onSubscribe();
                                if (!isSubscribed) onClose();
                            }}
                            className="w-full py-5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95"
                        >
                            {isSubscribed ? 'CANCEL SUBSCRIPTION' : 'GET SNABB AI PRO'}
                        </button>

                        <div className="flex items-center justify-center gap-6">
                            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle2 className="w-3 h-3 text-primary" />
                                7-day free trial
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle2 className="w-3 h-3 text-primary" />
                                Cancel anytime
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
