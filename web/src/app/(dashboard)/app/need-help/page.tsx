"use client";

import React from 'react';
import { Megaphone, List, FileText, ChevronRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NeedHelpHubPage() {
    const router = useRouter();

    const actions = [
        {
            title: 'Post an Ask',
            subtitle: 'Describe what you need and get offers',
            icon: Megaphone,
            color: 'bg-red-500',
            onClick: () => {
                if (window.location.pathname === '/app') {
                    window.dispatchEvent(new CustomEvent('open-create-ask'));
                } else {
                    router.push('/app?openCreate=true');
                }
            }
        },
        {
            title: 'My Active Asks',
            subtitle: 'Track your ongoing requests',
            icon: List,
            color: 'bg-blue-500',
            href: '/app/my-asks'
        },
        {
            title: 'Drafts',
            subtitle: 'Continue your saved requests',
            icon: FileText,
            color: 'bg-indigo-500',
            href: '/app/my-asks?tab=draft'
        }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-10 py-10">
            {/* Header */}
            <div className="relative p-12 bg-red-50 dark:bg-red-950/20 rounded-[3rem] overflow-hidden border border-red-100 dark:border-red-900/30">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-red-100/50 dark:bg-red-900/10 -skew-x-12 translate-x-10" />
                
                <button 
                    onClick={() => router.back()}
                    className="mb-8 flex items-center gap-2 text-red-700 dark:text-red-400 font-bold hover:gap-3 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Explore
                </button>

                <div className="relative z-10 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-xl shadow-red-500/20">
                        <Megaphone className="w-8 h-8" />
                    </div>
                    <h1 className="text-5xl font-black text-red-900 dark:text-red-100 tracking-tight">NEED HELP?</h1>
                    <p className="text-xl text-red-700/80 dark:text-red-400/80 max-w-xl font-medium leading-relaxed">
                        Post a task and get matched with local professionals who are ready to help you today.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Quick Actions</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {actions.map((action, index) => (
                            <div 
                                key={index} 
                                onClick={() => action.onClick ? action.onClick() : router.push(action.href || '#')}
                                className="flex items-center gap-6 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl hover:border-red-500/30 hover:shadow-xl hover:shadow-red-500/5 transition-all group cursor-pointer"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-slate-200 dark:shadow-none`}>
                                    <action.icon className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{action.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">{action.subtitle}</p>
                                </div>
                                <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-red-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* How it works */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">How it works</h2>
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-8">
                        {[
                            "Post your task details & budget",
                            "Pros will send you offers",
                            "Accept an offer and get it done!"
                        ].map((step, i) => (
                            <div key={i} className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-black flex-shrink-0 text-sm">
                                    {i + 1}
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 font-bold leading-tight pt-1">
                                    {step}
                                </p>
                            </div>
                        ))}
                        
                        <div className="pt-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase tracking-widest mb-2">
                                    <CheckCircle2 className="w-4 h-4" /> Trusted Platform
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                    All professionals are verified. Payments are secure and held in escrow until you're satisfied.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
