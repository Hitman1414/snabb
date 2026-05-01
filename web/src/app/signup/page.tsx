"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { Mail, Lock, ChevronRight, User, Phone, ArrowLeft, Loader2, MapPin } from "lucide-react";

export default function Signup() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        phone_number: "",
        location: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [locationSearch, setLocationSearch] = useState("");
    const [locationResults, setLocationResults] = useState<{display_name: string, lat: string, lon: string}[]>([]);
    const [searchingLocation, setSearchingLocation] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Registration failed');
            }

            // After registration, redirect to login
            router.push('/login?registered=true');
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

    const handleLocationSearch = async (query: string) => {
        setLocationSearch(query);
        setFormData(prev => ({ ...prev, location: query }));
        
        if (query.length < 3) {
            setLocationResults([]);
            return;
        }

        setSearchingLocation(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
            const data = await res.json();
            setLocationResults(data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setSearchingLocation(false);
        }
    };

    const selectLocation = (result: {display_name: string}) => {
        setFormData(prev => ({ ...prev, location: result.display_name }));
        setLocationSearch(result.display_name);
        setLocationResults([]);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#F8FAFC]">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[120px]" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-[1100px] grid md:grid-cols-2 bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white overflow-hidden m-4 relative z-10">
                {/* Visual Side */}
                <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-600 to-primary text-white relative">
                    <div className="relative z-10">
                        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-bold border border-white/30 hover:bg-white/30 transition-all mb-12">
                            <ArrowLeft className="w-4 h-4" /> Back to Home
                        </Link>
                        
                        <div className="space-y-6">
                            <h2 className="text-5xl font-extrabold leading-tight tracking-tight">
                                Start your <br />
                                <span className="opacity-70">journey today.</span>
                            </h2>
                            <p className="text-white/80 text-lg font-medium max-w-sm">
                                Create an account and discover a world of possibilities with Snabb.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 w-full max-w-sm aspect-video bg-black/40 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 shadow-2xl flex items-center justify-center group mt-4">
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10"></div>
                        <video 
                            className="absolute inset-0 w-full h-full object-cover opacity-60"
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                        >
                            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                        </video>
                        <div className="relative z-20 flex flex-col items-center">
                            <div className="w-14 h-14 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform cursor-pointer border border-white/40 shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </div>
                            <p className="text-white font-bold text-sm tracking-wide">Snabb App Tutorial</p>
                        </div>
                    </div>

                    {/* Decorative abstract shapes */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full translate-x-1/2 translate-y-1/2 blur-xl"></div>
                </div>

                {/* Form Side */}
                <div className="p-8 md:p-12 flex flex-col justify-center overflow-y-auto max-h-[90vh]">
                    <div className="mb-8 flex items-center">
                        <Logo className="h-20 w-auto" />
                    </div>

                    <div className="mb-8">
                        <h1 className="text-4xl font-black text-foreground mb-3 tracking-tight">Create Account</h1>
                        <p className="text-text-secondary font-medium">Join us and start getting things done.</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSignup}>
                        {error && (
                            <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.15em] ml-1">Username</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within/user:text-primary transition-colors" />
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm text-foreground font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all transition-colors" 
                                        placeholder="johndoe" 
                                        value={formData.username}
                                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.15em] ml-1">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within/phone:text-primary transition-colors" />
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm text-foreground font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all transition-colors" 
                                        placeholder="+1 234..." 
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.15em] ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within/email:text-primary transition-colors" />
                                <input 
                                    type="email" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm text-foreground font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all transition-colors" 
                                    placeholder="name@example.com" 
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group relative">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.15em] ml-1">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within/loc:text-primary transition-colors" />
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-10 py-3 text-sm text-foreground font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all transition-colors" 
                                    placeholder="City, Country" 
                                    value={locationSearch}
                                    onChange={(e) => handleLocationSearch(e.target.value)}
                                    required
                                />
                                {searchingLocation && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    </div>
                                )}
                            </div>
                            
                            {/* Search Results Dropdown */}
                            {locationResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                                    {locationResults.map((res, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => selectLocation(res)}
                                            className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors flex items-start gap-3 group"
                                        >
                                            <MapPin className="w-3 h-3 mt-1 text-slate-400 group-hover:text-primary" />
                                            <span className="text-xs font-bold text-slate-600">{res.display_name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.15em] ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within/pass:text-primary transition-colors" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 py-3 text-sm text-foreground font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all transition-colors" 
                                    placeholder="••••••••" 
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    required
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                            className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-lg mt-4"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                            {!loading && <ChevronRight className="w-5 h-5" />}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-slate-500 font-medium">
                            Already have an account? <Link href="/login" className="text-primary font-black hover:underline px-2 py-1">Sign In</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
