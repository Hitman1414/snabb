"use client";

import React from 'react';
import Link from 'next/link';
import { Megaphone, Trophy, Sparkles, ChevronRight } from 'lucide-react';

export default function HubPortals() {
    const hubs = [
        {
            id: 'need-help',
            title: 'Need Help?',
            subtitle: 'Post tasks & find local help',
            icon: Megaphone,
            color: 'bg-red-500',
            bg: 'bg-red-50',
            hover: 'hover:bg-red-100',
            text: 'text-red-900',
            iconColor: 'text-red-600',
            href: '/app/need-help',
            isMain: true
        },
        {
            id: 'snabb-pro',
            title: 'Snabb Pro',
            subtitle: 'Find opportunities, serve customers, and grow your business',
            icon: Trophy,
            color: 'bg-emerald-500',
            bg: 'bg-emerald-50',
            hover: 'hover:bg-emerald-100',
            text: 'text-emerald-900',
            iconColor: 'text-emerald-600',
            href: '/app/snabb-pro',
            isMain: false
        },
        {
            id: 'snabb-ai',
            title: 'Snabb AI',
            subtitle: 'Smart matchmaking to find the perfect help for your needs',
            icon: Sparkles,
            color: 'bg-indigo-500',
            bg: 'bg-indigo-50',
            hover: 'hover:bg-indigo-100',
            text: 'text-indigo-900',
            iconColor: 'text-indigo-600',
            href: '/app/snabb-ai',
            isMain: false
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hubs.map((hub, index) => {
                const isSnabbAsk = index === 0;
                const title = isSnabbAsk ? "Snabb Ask" : hub.title;
                const subtitle = isSnabbAsk ? "Need Help? Post help and get things done by Professionals." : hub.subtitle;
                
                return (
                    <div 
                        key={hub.id}
                        className="flex-1"
                    >
                        <Link 
                            href={hub.href}
                            className={`group h-full flex flex-col justify-center p-8 ${hub.bg} ${hub.hover} rounded-[2.5rem] border border-transparent hover:border-slate-200 transition-all duration-300 shadow-sm`}
                        >
                            <div className={`w-12 h-12 rounded-2xl ${hub.color} flex items-center justify-center text-white mb-4 shadow-lg transition-transform group-hover:scale-110`}>
                                <hub.icon className="w-6 h-6" />
                            </div>
                            <h3 className={`text-xl font-black ${hub.text}`}>{title}</h3>
                            <p className={`text-[11px] font-bold opacity-70 ${hub.text}`}>{subtitle}</p>
                        </Link>
                    </div>
                );
            })}
        </div>
    );
}
