"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { Bell, BellOff, CheckCircle2, MessageCircle, Star, IndianRupee, Clock, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsPage() {
    const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
    const router = useRouter();

    const handleNotificationClick = (n: any) => {
        if (!n.is_read) markAsRead(n.id);
        
        if (n.type === 'NEW_MESSAGE' && n.data?.ask_id) {
            router.push(`/app/chat?otherUserId=${n.data.sender_id}&askId=${n.data.ask_id}`);
        } else if (n.data?.ask_id) {
            router.push(`/app/asks/${n.data.ask_id}`);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'NEW_BID':
                return <IndianRupee className="w-5 h-5 text-emerald-500" />;
            case 'BID_ACCEPTED':
                return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'SHORTLISTED':
                return <Star className="w-5 h-5 text-amber-500" />;
            case 'NEW_MESSAGE':
                return <MessageCircle className="w-5 h-5 text-primary" />;
            default:
                return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent flex rounded-full animate-spin"></div>
            </div>
        );
    }

    const hasUnread = notifications.some(n => !n.is_read);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-1 text-sm uppercase tracking-[0.15em]">Updates for you</p>
                </div>
                
                {hasUnread && (
                    <button 
                        onClick={markAllAsRead}
                        className="text-sm font-black text-primary hover:text-primary-dark transition-colors uppercase tracking-widest flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark all as read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 py-24 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none flex flex-col items-center justify-center text-center px-4 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700"></div>
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-8 text-slate-300 group hover:rotate-12 transition-transform duration-500">
                        <BellOff className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">No notifications yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed mb-10">
                        We&apos;ll notify you when someone responds to your asks or sends you a message.
                    </p>
                    <button 
                        onClick={() => router.push('/app')}
                        className="bg-slate-900 dark:bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all"
                    >
                        Explore Snabb
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {notifications.map((n) => (
                            <motion.div
                                key={n.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                            >
                                <button
                                    onClick={() => handleNotificationClick(n)}
                                    className={`w-full text-left p-6 rounded-[2rem] border transition-all flex items-start gap-5 relative group ${
                                        n.is_read 
                                        ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm' 
                                        : 'bg-primary/[0.02] dark:bg-primary/[0.05] border-primary/20 shadow-lg shadow-primary/[0.03]'
                                    }`}
                                >
                                    {!n.is_read && (
                                        <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] animate-pulse"></div>
                                    )}

                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500 ${
                                        n.is_read ? 'bg-slate-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-800 shadow-sm'
                                    }`}>
                                        {getIcon(n.type)}
                                    </div>

                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-black text-lg tracking-tight ${n.is_read ? 'text-slate-900 dark:text-white' : 'text-primary'}`}>
                                                {n.title}
                                            </h3>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-3">
                                            {n.body}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                        </div>
                                    </div>

                                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
