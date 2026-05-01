"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { Mail, Lock, Key, ChevronRight, ArrowLeft, Loader2 } from "lucide-react";

export default function ForgotPassword() {
    const [step, setStep] = useState<"email" | "reset" | "success">("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to send reset code.");
            }
            setStep("reset");
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError("An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code, new_password: newPassword }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to reset password.");
            }
            setStep("success");
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError("An unknown error occurred.");
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
                <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-primary to-orange-500 text-white relative">
                    <div className="relative z-10">
                        <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-bold border border-white/30 hover:bg-white/30 transition-all mb-12">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                        
                        <div className="space-y-6">
                            <h2 className="text-5xl font-extrabold leading-tight tracking-tight">
                                Never lose access <br />
                                <span className="opacity-70">to your account.</span>
                            </h2>
                            <p className="text-white/80 text-lg font-medium max-w-sm">
                                Reset your password securely and instantly.
                            </p>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full translate-x-1/2 translate-y-1/2 blur-xl"></div>
                </div>

                {/* Form Side */}
                <div className="p-8 md:p-16 flex flex-col justify-center">
                    <div className="mb-10 flex items-center">
                        <img src="/snabb-logo.svg" alt="Snabb Logo" className="h-16 w-auto" />
                    </div>

                    <div className="mb-8">
                        <h1 className="text-4xl font-black text-foreground mb-3 tracking-tight">Recover Password</h1>
                        <p className="text-text-secondary font-medium">
                            {step === "email" ? "Enter your email to receive an OTP code." : 
                             step === "reset" ? "Enter the OTP code and your new password." : 
                             "Password reset successfully."}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 mb-6">
                            <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                            {error}
                        </div>
                    )}

                    {step === "success" ? (
                        <div className="bg-green-50 text-green-700 p-6 rounded-2xl border border-green-100 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-2 text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl font-bold">✓</div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Password Reset Complete!</h3>
                                <p className="text-sm font-medium opacity-80">You can now sign in with your new password.</p>
                            </div>
                            <Link href="/login" className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl shadow-lg transition-all text-center flex items-center justify-center cursor-pointer">
                                Return to Login
                            </Link>
                        </div>
                    ) : step === "email" ? (
                        <form className="space-y-6" onSubmit={handleSendCode}>
                            <div className="space-y-2 group">
                                <label className="text-xs font-black text-text-secondary uppercase tracking-[0.15em] ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within/email:text-primary transition-colors" />
                                    <input 
                                        type="email" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] pl-14 pr-6 py-4 text-foreground font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-text-tertiary placeholder:font-medium" 
                                        placeholder="Enter your email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading || !email}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-[1.25rem] shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Send Reset Code"}
                                {!loading && <ChevronRight className="w-6 h-6" />}
                            </button>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleResetPassword}>
                            <div className="space-y-2 group">
                                <label className="text-xs font-black text-text-secondary uppercase tracking-[0.15em] ml-1">OTP Code</label>
                                <div className="relative">
                                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within/code:text-primary transition-colors" />
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] pl-14 pr-6 py-4 text-foreground font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-text-tertiary placeholder:font-medium" 
                                        placeholder="Enter 6-digit code" 
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-xs font-black text-text-secondary uppercase tracking-[0.15em] ml-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within/pass:text-primary transition-colors" />
                                    <input 
                                        type="password" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] pl-14 pr-6 py-4 text-foreground font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-text-tertiary placeholder:font-medium" 
                                        placeholder="••••••••" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading || !code || !newPassword}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-[1.25rem] shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Reset Password"}
                                {!loading && <ChevronRight className="w-6 h-6" />}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
