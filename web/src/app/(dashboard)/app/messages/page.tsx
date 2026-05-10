"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { MessageCircle, Search, ChevronRight, Clock, LayoutGrid, List } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Conversation = {
    other_user: {
        id: number;
        username: string;
        avatar_url?: string;
    };
    ask: {
        id: number;
        title: string;
    };
    last_message: {
        content: string;
        created_at: string;
    };
    unread_count: number;
};

export default function MessagesPage() {
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        const fetchConversations = async () => {

            try {
                const res = await fetch(`${API_URL}/messages/conversations`, { credentials: "include", 
                    });
                if (res.ok) {
                    setConversations(await res.json());
                } else {
                    router.push('/login');
                }
            } catch (err) {
                console.error(err);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [router]);

    const filteredConversations = conversations.filter(c => 
        c.other_user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.ask.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent flex rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Messages</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-1 text-sm uppercase tracking-[0.15em]">Direct Conversations</p>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search chats..."
                            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-2xl py-3.5 pl-11 pr-4 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm font-bold text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Grid / List toggle */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="Grid view"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="List view"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {conversations.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 py-24 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none flex flex-col items-center justify-center text-center px-4 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-orange-400"></div>
                    <div className="w-24 h-24 bg-orange-50 dark:bg-orange-900/20 rounded-3xl flex items-center justify-center mb-8 text-orange-500 rotate-12 group hover:rotate-0 transition-transform duration-500">
                        <MessageCircle className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Your inbox is quiet</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed mb-10">
                        Respond to local asks or post a request to start a conversation with the community.
                    </p>
                    <button 
                        onClick={() => router.push('/app')}
                        className="bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all"
                    >
                        Browse Live Asks
                    </button>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "flex flex-col gap-4"}>
                    {filteredConversations.map((conv) => (
                        <button 
                            key={`${conv.other_user.id}-${conv.ask.id}`}
                            onClick={() => router.push(`/app/chat?otherUserId=${conv.other_user.id}&askId=${conv.ask.id}&otherUserName=${conv.other_user.username}&askTitle=${encodeURIComponent(conv.ask.title)}`)}
                            className="w-full bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-primary/20 dark:hover:border-primary/30 flex items-center gap-5 hover:bg-slate-50/50 dark:hover:bg-slate-800 transition-all text-left shadow-sm shadow-slate-200/30 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none group relative"
                        >
                            <div className="relative flex-shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-100 dark:from-slate-800 to-slate-200 dark:to-slate-700 flex items-center justify-center text-2xl text-slate-500 dark:text-slate-300 font-black shadow-inner">
                                    {conv.other_user.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full"></div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1.5">
                                    <h3 className="font-black text-lg text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors flex items-center gap-2">
                                        {conv.other_user.username}
                                        {conv.other_user.username === 'snabb' && <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter">Admin</span>}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase tracking-widest">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                <p className="text-[10px] text-primary font-black mb-1.5 truncate uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-primary/30 rounded-full"></span>
                                    {conv.ask.title}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate pr-10">
                                    {conv.last_message.content}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {conv.unread_count > 0 && (
                                    <div className="bg-primary text-white text-[10px] font-black px-2.5 py-1.5 rounded-xl animate-pulse shadow-lg shadow-primary/25">
                                        {conv.unread_count} NEW
                                    </div>
                                )}
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
