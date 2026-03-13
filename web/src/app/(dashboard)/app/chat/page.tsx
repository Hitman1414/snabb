"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { Send, ChevronLeft, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    created_at: string;
    ask_id: number;
};

export default function ChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const otherUserId = parseInt(searchParams.get("otherUserId") || "0");
    const otherUserName = searchParams.get("otherUserName") || "User";
    const askId = parseInt(searchParams.get("askId") || "0");
    const askTitle = searchParams.get("askTitle") || "Ask";

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [sending, setSending] = useState(false);
    
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                // Fetch current user
                const userRes = await fetch(`${API_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setCurrentUser(userData);
                } else {
                    localStorage.removeItem('token');
                    router.push('/login');
                    return;
                }

                // Fetch messages
                const msgRes = await fetch(`${API_URL}/messages/conversation/${otherUserId}?ask_id=${askId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (msgRes.ok) {
                    setMessages(await msgRes.json());
                } else if (msgRes.status === 401) {
                    localStorage.removeItem('token');
                    router.push('/login');
                }
            } catch (err) {
                console.error(err);
                localStorage.removeItem('token');
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        
        // Polling for new messages
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [otherUserId, askId, router]);

    useEffect(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            
            if (isNearBottom || messages.length <= 1) {
                scrollRef.current.scrollTop = scrollHeight;
            }
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token || !newMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch(`${API_URL}/messages/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    receiver_id: otherUserId,
                    content: newMessage,
                    ask_id: askId
                })
            });

            if (res.ok) {
                const msg = await res.json();
                setMessages(prev => [...prev, msg]);
                setNewMessage("");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent flex rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            {/* Chat Header */}
            <div className="px-8 py-6 border-b border-slate-50 bg-white/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => router.back()} 
                        className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                    >
                        <ChevronLeft className="w-6 h-6 text-slate-500" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
                            {otherUserName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 leading-tight flex items-center gap-2">
                                {otherUserName}
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            </h3>
                            <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5">
                                <span className="w-1 h-1 bg-primary/30 rounded-full"></span>
                                {askTitle}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-slate-50/30"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-6">
                        <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary/40">
                            <MessageCircle className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <p className="font-black text-slate-900 text-lg">Send a friendly greeting</p>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest px-10">Start the conversation about this request</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {messages.map((msg, idx) => {
                            const isMine = msg.sender_id === currentUser?.id;
                            return (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    key={msg.id}
                                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`group relative max-w-[75%] p-5 rounded-[2rem] shadow-sm transition-all hover:shadow-md ${
                                        isMine 
                                        ? 'bg-slate-900 text-white rounded-br-none' 
                                        : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                                    }`}>
                                        <p className="font-bold leading-relaxed text-sm">{msg.content}</p>
                                        <p className={`text-[9px] mt-2 font-black uppercase tracking-widest ${isMine ? 'text-white/40' : 'text-slate-400'}`}>
                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-slate-50 bg-white shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.05)]">
                <form onSubmit={handleSendMessage} className="flex gap-4 relative">
                    <input 
                        type="text"
                        placeholder="Message your helper..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-[1.5rem] px-8 py-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-sm"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button 
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="bg-primary hover:bg-primary-dark text-white w-14 h-14 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:scale-90 flex-shrink-0"
                    >
                        {sending ? (
                            <div className="w-5 h-5 border-[3px] border-white border-t-transparent animate-spin rounded-full"></div>
                        ) : (
                            <Send className="w-6 h-6 stroke-[3px]" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
