"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, Search, BarChart3, Briefcase, ChevronRight, Star, ArrowLeft, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { useDashboard } from '@/hooks/useDashboard';

export default function SnabbProHubPage() {
    const router = useRouter();
    const { user } = useDashboard();
    const [topPros, setTopPros] = useState<any[]>([]);

    useEffect(() => {
        fetch(`${API_URL}/users/pros?limit=10`)
            .then(res => res.json())
            .then(data => setTopPros(data))
            .catch(err => console.error(err));
    }, []);

    const actions = [
        {
            title: 'Browse Tasks',
            subtitle: 'Find people looking for help nearby',
            icon: Search,
            color: 'bg-emerald-500',
            href: '/app'
        },
        {
            title: 'Pro Dashboard',
            subtitle: 'Track your earnings and ratings',
            icon: BarChart3,
            color: 'bg-cyan-500',
            href: '#'
        },
        {
            title: 'My Applications',
            subtitle: 'Manage tasks you are interested in',
            icon: Briefcase,
            color: 'bg-indigo-500',
            href: '/app/interested'
        }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-10 py-10 px-4">
            {/* Header */}
            <div className="relative p-12 bg-emerald-50 dark:bg-emerald-950/20 rounded-[3rem] overflow-hidden border border-emerald-100 dark:border-emerald-900/30">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-emerald-100/30 dark:bg-emerald-900/10 -skew-x-12 translate-x-10" />
                
                <button 
                    onClick={() => router.back()}
                    className="mb-8 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold hover:gap-3 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Explore
                </button>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                            <Trophy className="w-8 h-8" />
                        </div>
                        {user?.is_pro && (
                            <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                                <BadgeCheck className="w-4 h-4" /> Verified Pro
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-emerald-900 dark:text-emerald-100 tracking-tight">SNABB PRO</h1>
                        <p className="text-xl text-emerald-700/80 dark:text-emerald-400/80 max-w-xl font-medium leading-relaxed mt-2">
                            Join our elite professional network and start earning by helping your community.
                        </p>
                    </div>
                </div>
            </div>

            {!user?.is_pro && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[2rem] p-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-white">
                    <div className="space-y-2 text-center lg:text-left">
                        <h2 className="text-3xl font-black">Ready to go Pro?</h2>
                        <p className="text-emerald-100 font-medium">Verify your skills and start receiving high-paying task offers.</p>
                    </div>
                    <Link 
                        href="/app/profile"
                        className="px-10 py-5 bg-white text-emerald-600 rounded-2xl font-black text-lg hover:shadow-2xl hover:scale-105 transition-all whitespace-nowrap"
                    >
                        Apply to Join Pro
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Professional Actions */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        Manage Your Business
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        {actions.map((action, index) => (
                            <Link 
                                key={index} 
                                href={action.href}
                                className="flex items-center gap-6 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${action.color} bg-opacity-10 flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                                    <action.icon className={`w-6 h-6 ${action.color.replace('bg-', 'text-')}`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{action.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">{action.subtitle}</p>
                                </div>
                                <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Community Experts migrated here */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Top Community Experts</h2>
                    <div className="space-y-4">
                        {topPros.map((pro, index) => (
                            <Link 
                                key={pro.id} 
                                href={`/app/profile?username=${pro.username}`}
                                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center font-black text-emerald-700 dark:text-emerald-400 overflow-hidden">
                                    {pro.avatar_url ? (
                                        <img src={`${API_URL}${pro.avatar_url}`} alt={pro.username} className="w-full h-full object-cover" />
                                    ) : (
                                        pro.username.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-900 dark:text-white truncate">{pro.username}</h4>
                                    <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                        <span className="text-xs font-bold text-slate-500">{pro.pro_rating || 5.0}</span>
                                        <span className="text-slate-300 mx-1">•</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{pro.pro_category || 'Pro'}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
