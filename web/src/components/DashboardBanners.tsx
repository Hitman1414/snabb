"use client";

import { motion } from "framer-motion";
import { Sparkles, Megaphone, Cpu, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardBanners() {
    const router = useRouter();

    const banners = [
        {
            title: "ZERO FEES",
            subtitle: "On your first 3 requests",
            description: "Get help for free this week. No service charges, just pure community help.",
            icon: Megaphone,
            gradient: "from-indigo-600 to-violet-600",
            badge: "PROMO",
            action: () => {
                const btn = document.getElementById('new-request-btn');
                if (btn) btn.click();
            },
            cta: "Request Now"
        },
        {
            title: "EVERYDAY LOWEST",
            subtitle: "Verified Snabb Pros",
            description: "Connect with the best helpers in your city with guaranteed lowest service fees.",
            icon: Sparkles,
            gradient: "from-rose-500 to-orange-500",
            badge: "VERIFIED",
            action: () => window.dispatchEvent(new CustomEvent('open-search', { detail: { mode: 'pros' } })),
            cta: "Join Network"
        },
        {
            title: "SMART AI",
            subtitle: "Every task, simplified",
            description: "Not sure how to describe your task? Let our AI draft it for you in seconds.",
            icon: Cpu,
            gradient: "from-emerald-500 to-teal-600",
            badge: "NEW",
            action: () => router.push('/app/chat'),
            cta: "Try Snabb AI"
        }
    ];

    return (
        <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar px-1 py-1 -m-1">
            {banners.map((banner, i) => (
                <motion.button
                    key={i}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={banner.action}
                    className={`flex-shrink-0 w-[400px] h-[220px] bg-gradient-to-br ${banner.gradient} rounded-[2.5rem] p-8 text-left relative overflow-hidden group shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/10 transform-gpu isolation-auto`}
                >
                    <div className="relative z-20 h-full flex flex-col justify-between text-white border-none bg-transparent">
                        <div className="space-y-1">
                            <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black tracking-[0.2em] mb-2 border border-white/10 uppercase">
                                {banner.badge}
                            </div>
                            <h3 className="text-2xl font-black mb-0.5 tracking-tight leading-none uppercase">{banner.title}</h3>
                            <h4 className="text-sm font-bold opacity-90">{banner.subtitle}</h4>
                            <p className="opacity-70 text-[11px] font-medium leading-relaxed max-w-[220px] pt-2">
                                {banner.description}
                            </p>
                        </div>
                        <div className="z-30 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl self-start flex items-center gap-2 shadow-xl transition-all transform group-hover:translate-x-1 cursor-pointer hover:bg-slate-900 hover:text-white">
                            {banner.cta}
                            <ChevronRight className="w-4 h-4 stroke-[3px]" />
                        </div>
                    </div>
                    
                    {/* Visual Elements - Scaled Down */}
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-white/10 -skew-x-12 translate-x-1/2 z-0 pointer-events-none"></div>
                    <banner.icon className="absolute -right-8 -bottom-8 opacity-10 text-white w-48 h-48 -rotate-12 group-hover:rotate-0 transition-transform duration-700 z-0 pointer-events-none" />
                </motion.button>
            ))}
        </div>
    );
}
