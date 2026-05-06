"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import AskCard from "@/components/AskCard";
import { Ask as AskType } from "@/types";
import { FileText, Plus } from "lucide-react";
import CreateAskModal from "@/components/CreateAskModal";

export default function MyAsksPage() {
    const router = useRouter();
    const [myAsks, setMyAsks] = useState<AskType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const fetchMyAsks = async () => {

            try {
                // Use the dedicated endpoint — returns only the current user's asks server-side
                const asksRes = await fetch(`${API_URL}/asks/my-asks`, { credentials: "include", 
                    });
                if (!asksRes.ok) {
                    router.push('/login');
                    return;
                }
                const data = await asksRes.json();
                // Endpoint returns a plain array, not a paginated object
                setMyAsks(Array.isArray(data) ? data : (data.items || []));
            } catch (err) {
                console.error(err);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchMyAsks();
    }, [router]);

    const handleAskCreated = (newAsk: AskType) => {
        setMyAsks(prev => [newAsk, ...prev]);
        setIsCreateModalOpen(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent flex rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">My Asks</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-1 text-sm uppercase tracking-[0.15em]">Manage your requests</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 flex items-center gap-3 active:scale-95"
                >
                    <Plus className="w-5 h-5 stroke-[3px]" />
                    New Request
                </button>
            </div>

            {myAsks.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 py-24 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col items-center justify-center text-center px-6 overflow-hidden relative">
                    <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center mb-8 text-primary shadow-inner">
                        <FileText className="w-12 h-12" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">No active requests found</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mb-10 leading-relaxed">
                        Need help with something? Post your first request and get help from verified community members.
                    </p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-slate-900/20 hover:shadow-slate-900/40 hover:-translate-y-1 transition-all active:scale-95"
                    >
                        Create Your First Ask
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {myAsks.map((ask) => (
                        <AskCard key={ask.id} ask={ask} />
                    ))}
                </div>
            )}

            <CreateAskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleAskCreated}
            />
        </div>
    );
}
