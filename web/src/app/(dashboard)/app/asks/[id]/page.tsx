"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { API_URL, getFullImageUrl } from "@/lib/api";
import { MapPin, IndianRupee, MessageSquare, ChevronLeft, Send, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Ask as AskType, User as UserType } from "@/types";
import PaymentModal from "@/components/PaymentModal";

type ResponseType = {
    id: number;
    message: string;
    bid_amount?: number | null;
    is_accepted: boolean;
    is_interested: boolean;
    created_at: string;
    user_id: number;
    user?: {
        username: string;
        avatar_url?: string;
    };
};

export default function AskDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: askId } = use(params);
    const router = useRouter();
    const [ask, setAsk] = useState<AskType | null>(null);
    const [responses, setResponses] = useState<ResponseType[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<UserType | null>(null);
    const { success: toastSuccess, error: toastError } = useToast();
    const [selectedResponseForPayment, setSelectedResponseForPayment] = useState<ResponseType | null>(null);
    
    // Form state
    const [responseMessage, setResponseMessage] = useState("");
    const [bidAmount, setBidAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {

            try {
                // Fetch User
                const userRes = await fetch(`${API_URL}/auth/me`, { credentials: "include", 
                    });
                if (userRes.ok) {
                    setCurrentUser(await userRes.json());
                }

                // Fetch Ask
                const askRes = await fetch(`${API_URL}/asks/${askId}`, { credentials: "include", 
                    });
                if (!askRes.ok) throw new Error("Ask not found");
                setAsk(await askRes.json());

                // Fetch Responses
                const respRes = await fetch(`${API_URL}/responses/ask/${askId}`, { credentials: "include", 
                    });
                if (respRes.ok) {
                    setResponses(await respRes.json());
                }
            } catch (err) {
                console.error(err);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [askId, router]);

    const handleSubmitResponse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!responseMessage.trim()) return;

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`${API_URL}/responses/ask/${askId}`, { credentials: "include", 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: responseMessage,
                    bid_amount: bidAmount ? parseFloat(bidAmount) : null
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to submit response");
            }

            const newResponse = await res.json();
            setResponses(prev => [newResponse, ...prev]);
            setResponseMessage("");
            setBidAmount("");
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent flex rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!ask) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Ask Not Found</h2>
                <button onClick={() => router.back()} className="mt-4 text-primary font-medium hover:underline">Go Back</button>
            </div>
        );
    }

    const isOwner = currentUser?.id === ask.user_id;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Back Button */}
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-text-secondary hover:text-foreground transition-colors group"
            >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </button>

            {/* Ask Details Main Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-8">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${ask.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {ask.status.toUpperCase()}
                                </span>
                                <span className="bg-primary/10 text-primary-dark px-3 py-1 rounded-full text-xs font-bold">
                                    {ask.category}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                                {ask.title}
                            </h1>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 min-w-[150px]">
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Budget Range</p>
                            <p className="text-xl font-bold text-primary">
                                ₹{ask.budget_min} - ₹{ask.budget_max || "Flexible"}
                            </p>
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-8 whitespace-pre-wrap">
                        {ask.description}
                    </p>

                    {/* Images */}
                    {Array.isArray(ask.images) && ask.images.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto pb-4 mb-8 no-scrollbar">
                            {(ask.images as string[]).map((img, idx) => (
                                <img 
                                    key={idx}
                                    src={getFullImageUrl(img)}
                                    alt="Ask attachment"
                                    className="w-48 h-48 rounded-2xl object-cover border border-border hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0"
                                />
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-border">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center text-primary font-bold text-lg">
                                {ask.user?.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs text-text-tertiary font-bold uppercase tracking-wider">Posted By</p>
                                <p className="font-bold">{ask.user?.username}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center text-primary">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-text-tertiary font-bold uppercase tracking-wider">Location</p>
                                <p className="font-bold">{ask.location}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Responses Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <MessageSquare className="w-6 h-6 text-primary" />
                        Responses ({responses.length})
                    </h2>
                </div>

                {/* Submit Response Form (for non-owners) */}
                {!isOwner && ask.status === 'open' && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Send your proposal</h3>
                        <form onSubmit={handleSubmitResponse} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3">
                                    <textarea 
                                        placeholder="Explain how you can help..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl p-4 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none min-h-[100px] transition-all"
                                        value={responseMessage}
                                        onChange={(e) => setResponseMessage(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                                        <input 
                                            type="number"
                                            placeholder="Bid (Optional)"
                                            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-4 pl-10 pr-4 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(e.target.value)}
                                            min="0"
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={submitting || !responseMessage.trim()}
                                        className="w-full bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div> : <Send className="w-5 h-5" />}
                                        Submit
                                    </button>
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                        </form>
                    </div>
                )}

                {/* Responses List */}
                <div className="space-y-4">
                    {responses.length === 0 ? (
                        <div className="bg-surface rounded-3xl p-12 text-center border border-border border-dashed">
                            <p className="text-text-tertiary font-medium text-lg">No responses yet. Be the first to help!</p>
                        </div>
                    ) : (
                        responses.map((resp) => (
                            <motion.div 
                                key={resp.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 items-start"
                            >
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary font-bold">
                                                {resp.user?.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{resp.user?.username}</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">{formatDistanceToNow(new Date(resp.created_at.endsWith('Z') ? resp.created_at : resp.created_at + 'Z'), { addSuffix: true })}</p>
                                            </div>
                                        </div>
                                        {resp.is_accepted && (
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Accepted</span>
                                        )}
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{resp.message}</p>
                                </div>
                                <div className="w-full md:w-auto flex md:flex-col gap-3 min-w-[120px]">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center flex-1">
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Bid</p>
                                        <p className="font-bold text-primary">₹{resp.bid_amount || "N/A"}</p>
                                    </div>
                                    {isOwner && (
                                        <div className="grid grid-cols-2 gap-2 mt-2 w-full">
                                            <button 
                                                onClick={() => setSelectedResponseForPayment(resp)}
                                                className="col-span-2 bg-primary hover:bg-primary-dark text-white rounded-2xl py-5 px-4 font-black text-lg transition-all shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-95"
                                            >
                                                Accept & Pay
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`${API_URL}/responses/${resp.id}/interested?is_interested=${!resp.is_interested}`, { credentials: "include", 
                                                            method: 'PUT',
                                                        });
                                                        if (res.ok) {
                                                            setResponses(prev => prev.map(r => r.id === resp.id ? {...r, is_interested: !r.is_interested} : r));
                                                            toastSuccess(resp.is_interested ? "Removed from shortlist" : "Response shortlisted!");
                                                        } else {
                                                            toastError("Failed to update status");
                                                        }
                                                    } catch (err) {
                                                        toastError("Something went wrong");
                                                    }
                                                }}
                                                className={`rounded-2xl py-4 px-4 font-bold text-sm transition-all active:scale-95 flex items-center justify-center ${
                                                    resp.is_interested 
                                                    ? 'bg-slate-800 text-white' 
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                                }`}
                                            >
                                                {resp.is_interested ? 'Shortlisted' : 'Shortlist'}
                                            </button>
                                            <button 
                                                onClick={() => router.push(`/app/chat?otherUserId=${resp.user_id}&askId=${askId}&otherUserName=${resp.user?.username}&askTitle=${encodeURIComponent(ask.title)}`)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 px-4 font-bold text-sm transition-all active:scale-95 flex items-center justify-center"
                                            >
                                                Message
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {selectedResponseForPayment && (
                <PaymentModal 
                    isOpen={!!selectedResponseForPayment}
                    onClose={() => setSelectedResponseForPayment(null)}
                    askId={askId}
                    responseId={selectedResponseForPayment.id}
                    bidAmount={selectedResponseForPayment.bid_amount || 0}
                    completedAsksCount={currentUser?.completed_asks_count || 0}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}
