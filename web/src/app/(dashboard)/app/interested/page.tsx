"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { Heart, Loader2 } from "lucide-react";
import AskCard, { AskType } from "@/components/AskCard";

export default function InterestedPage() {
    const router = useRouter();
    const [asks, setAsks] = useState<AskType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInterested = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/asks/interested`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setAsks(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch interested asks", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInterested();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-8 rounded-[2.5rem] border border-border shadow-sm overflow-hidden relative group">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Interested Asks</h1>
                    <p className="text-text-secondary font-medium">Asks where you expressed interest to help.</p>
                </div>
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                <Heart className="hidden md:block w-16 h-16 text-primary/10 absolute right-8 top-1/2 -translate-y-1/2 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
            </div>

            {asks.length === 0 ? (
                <div className="bg-surface py-24 rounded-[3rem] border border-border border-dashed flex flex-col items-center justify-center text-center px-6">
                    <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 text-primary/30">
                        <Heart className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">No interested asks yet</h3>
                    <p className="text-text-secondary max-w-sm font-medium leading-relaxed">
                        Go to the dashboard and find some asks where you can help. Once you express interest, they will show up here.
                    </p>
                    <button 
                        onClick={() => router.push('/app')}
                        className="mt-10 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg shadow-primary/20 hover:-translate-y-1 active:scale-95"
                    >
                        Explore Asks
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8">
                    {asks.map((ask) => (
                        <AskCard key={ask.id} ask={ask} />
                    ))}
                </div>
            )}
        </div>
    );
}
