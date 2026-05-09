"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { Mail, Lock, ChevronRight, User, Phone, ArrowLeft, Loader2, Wrench, CheckCircle, MapPin, Star, Clock, MessageSquare, Package } from "lucide-react";
import { motion } from "framer-motion";

const LIVE_FEED = [
    { icon: Wrench, title: "Plumber accepted your task", time: "2 min ago", accent: "bg-blue-400/20" },
    { icon: MessageSquare, title: "New bid on Furniture Assembly", time: "Just now", accent: "bg-purple-400/20" },
    { icon: CheckCircle, title: "Task completed: Dog Walking", time: "5 min ago", accent: "bg-green-400/20" },
    { icon: MapPin, title: "3 pros available nearby", time: "Live", accent: "bg-red-400/20" },
    { icon: Star, title: "Rahul rated 5 stars", time: "8 min ago", accent: "bg-yellow-400/20" },
    { icon: Clock, title: "Electrician on the way", time: "1 min ago", accent: "bg-cyan-400/20" },
    { icon: Package, title: "Delivery picked up", time: "3 min ago", accent: "bg-emerald-400/20" },
];

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        // Match mobile generic validation
        if (!email.trim()) {
            setError("Username or Email is required");
            return;
        }
        if (!password) {
            setError("Password is required");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, { credentials: "include", 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    username: email,
                    password: password,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Login failed');
            }

            const data = await response.json();
            router.push('/app');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#F8FAFC]">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-200/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-[1100px] grid md:grid-cols-2 bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white overflow-hidden m-4 relative z-10">
                {/* Visual Side */}
                <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#FF5F1F] via-primary to-orange-600 text-white relative overflow-hidden">
                    {/* Animated Background Blobs */}
                    <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-white/10 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[-5%] left-[-5%] w-[200px] h-[200px] bg-black/10 rounded-full blur-[80px]"></div>
                    
                    <div className="relative z-10">
                        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-xl rounded-full text-xs font-black border border-white/20 hover:bg-white/20 transition-all mb-16 tracking-widest uppercase">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                        </Link>
                        
                        <div className="space-y-6">
                            <h2 className="text-6xl font-black leading-[1.1] tracking-tighter">
                                Ask. Serve.<br />
                                <span className="text-white/40 italic">Earn.</span>
                            </h2>
                            <div className="w-20 h-1.5 bg-white/30 rounded-full"></div>
                            <p className="text-white/90 text-lg font-bold max-w-sm leading-relaxed">
                                Join thousands getting <span className="text-white underline decoration-white/30 underline-offset-4">instant help</span> from local pros every day.
                            </p>
                        </div>
                    </div>

                    <div
                        className="relative z-10 w-full max-w-sm h-[340px] mt-8 overflow-hidden rounded-3xl"
                        style={{ WebkitMaskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)" }}
                    >
                        {LIVE_FEED.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <motion.div
                                    key={i}
                                    className="absolute left-0 right-0 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[1.5rem] px-6 py-5 shadow-2xl flex items-center gap-5"
                                    initial={{ y: 340, opacity: 0, scale: 0.9 }}
                                    animate={{ y: [340, -120], opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.9] }}
                                    transition={{
                                        duration: 10,
                                        repeat: Infinity,
                                        ease: "linear",
                                        delay: i * 2.5,
                                        times: [0, 0.1, 0.9, 1],
                                    }}
                                >
                                    <div className={`w-12 h-12 rounded-2xl ${item.accent} flex items-center justify-center shrink-0 shadow-lg border border-white/10`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-white text-[13px] font-black truncate tracking-tight">{item.title}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">{item.time}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Branding Tag */}
                    <div className="relative z-10 flex items-center gap-2 opacity-50">
                        <div className="w-8 h-[1px] bg-white"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Verified by Snabb</span>
                    </div>
                </div>

                {/* Form Side */}
                <div className="p-8 md:p-16 flex flex-col justify-center">
                    <div className="mb-10 flex items-center">
                        <Logo className="h-20 w-auto" />
                    </div>

                    <div className="mb-10">
                        <h1 className="text-4xl font-black text-foreground mb-3 tracking-tight">Welcome back</h1>
                        <p className="text-text-secondary font-medium">Please enter your details to sign in.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-2 group">
                            <label className="text-xs font-black text-text-secondary uppercase tracking-[0.15em] ml-1">Email or Phone</label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within/email:text-primary transition-colors" />
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] pl-14 pr-6 py-4 text-foreground font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-text-tertiary placeholder:font-medium" 
                                    placeholder="Enter your id" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-black text-text-secondary uppercase tracking-[0.15em]">Password</label>
                                <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">Forgot?</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within/pass:text-primary transition-colors" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] pl-14 pr-12 py-4 text-foreground font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-text-tertiary placeholder:font-medium" 
                                    placeholder="••••••••" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        {showPassword ? (
                                            <>
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                            </>
                                        ) : (
                                            <>
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </>
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-[1.25rem] shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sign In"}
                            {!loading && <ChevronRight className="w-6 h-6" />}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-500 font-medium">
                            Don&apos;t have an account? <Link href="/signup" className="text-primary font-black hover:underline px-2 py-1">Create Account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
