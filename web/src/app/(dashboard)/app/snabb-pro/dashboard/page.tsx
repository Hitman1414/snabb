"use client";

import React, { useState, useEffect } from 'react';
import { 
    BarChart3, 
    TrendingUp, 
    CheckCircle2, 
    Star, 
    ArrowLeft, 
    Wallet, 
    Clock, 
    MessageSquare,
    ChevronRight,
    ArrowUpRight,
    Search,
    Trophy
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { useDashboard } from '@/hooks/useDashboard';
import Link from 'next/link';

export default function ProDashboardPage() {
    const router = useRouter();
    const { user } = useDashboard();
    const [stats, setStats] = useState({
        total_earnings: 0,
        completed_tasks: 0,
        rating: 0,
        active_tasks: 0,
        pending_offers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_URL}/users/me/stats`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Earnings',
            value: `₹${stats.total_earnings.toLocaleString()}`,
            icon: Wallet,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20'
        },
        {
            label: 'Success Rate',
            value: '98%',
            icon: TrendingUp,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20'
        },
        {
            label: 'Average Rating',
            value: stats.rating.toFixed(1),
            icon: Star,
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-900/20'
        },
        {
            label: 'Tasks Done',
            value: stats.completed_tasks,
            icon: CheckCircle2,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20'
        }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-10 py-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <button 
                        onClick={() => router.back()}
                        className="mb-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold hover:gap-3 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Pro Hub
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <BarChart3 className="w-10 h-10 text-emerald-500" />
                        Pro Dashboard
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Link 
                        href="/app"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95"
                    >
                        <Search className="w-5 h-5" />
                        Find Tasks
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Work */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Active Work</h2>
                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-black">
                            {stats.active_tasks} ACTIVE
                        </span>
                    </div>

                    {stats.active_tasks === 0 ? (
                        <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] py-16 flex flex-col items-center justify-center text-center px-6">
                            <Clock className="w-12 h-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-black text-slate-400">No active tasks</h3>
                            <p className="text-slate-400 text-sm font-medium mt-1">Browse the marketplace to find new opportunities.</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-slate-500 text-sm font-medium">You have {stats.active_tasks} task(s) currently in progress.</p>
                            </div>
                            <Link href="/app/interested" className="p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center gap-2 text-sm font-black text-emerald-600 hover:bg-emerald-50 transition-colors">
                                View Active Tasks <ArrowUpRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Recent Activity</h2>
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-slate-900 dark:text-white">New Response</p>
                                <p className="text-xs text-slate-500 font-medium">{stats.pending_offers} pending offers</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-500/20">
                        <Trophy className="w-10 h-10 mb-4 opacity-50" />
                        <h3 className="text-xl font-black mb-2">Grow your business</h3>
                        <p className="text-emerald-50/80 text-sm font-medium mb-6 leading-relaxed">
                            Complete more tasks with 5-star ratings to boost your visibility in the expert catalog.
                        </p>
                        <Link href="/app" className="block w-full py-3 bg-white text-emerald-600 rounded-xl text-center font-black text-sm hover:shadow-lg transition-all active:scale-95">
                            Browse Tasks
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
