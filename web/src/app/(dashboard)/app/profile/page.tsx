"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    User as UserIcon,
    Mail,
    Shield,
    Award,
    Settings,
    Bell,
    ChevronRight,
    X,
    Loader2,
    CheckCircle2,
    Lock,
    Compass,
    LogOut
} from "lucide-react";

import { User } from "@/types";

const PRO_CATEGORIES = [
    'Technical Support',
    'Plumbing & Repairs',
    'Delivery & Errands',
    'Cleaning',
    'Moving & Lifting',
    'Personal Assistant',
];

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [proError, setProError] = useState("");

    // Form states
    const [editForm, setEditForm] = useState({ username: "", email: "", phone_number: "", location: "" });
    const [proForm, setProForm] = useState({ category: "", bio: "", experience: "", idCardUrl: "" });
    const [proStep, setProStep] = useState(1);

    useEffect(() => {
        const fetchUser = async () => {

            try {
                const res = await fetch(`${API_URL}/auth/me`, { credentials: "include", 
                    });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    setEditForm({ 
                        username: data.username, 
                        email: data.email, 
                        phone_number: data.phone_number || "", 
                        location: data.location || "" 
                    });
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

        fetchUser();

        // Handle openModal query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const openModal = urlParams.get('openModal');
        if (openModal === 'pro') {
            setActiveModal('pro');
        }
    }, [router]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/users/me`, { credentials: "include", 
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username: editForm.username,
                    phone_number: editForm.phone_number || null,
                    location: editForm.location || null
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setUser(updated);
                setSuccessMessage("Profile updated successfully!");
                setTimeout(() => { setSuccessMessage(""); setActiveModal(null); }, 2000);
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to update profile.");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }


        const formData = new FormData();
        formData.append('file', file);

        try {
            setSaving(true);
            const res = await fetch(`${API_URL}/users/me/avatar`, { credentials: "include", 
                method: 'POST',
                                body: formData
            });

            if (res.ok) {
                const updated = await res.json();
                setUser(updated);
                setSuccessMessage("Avatar updated successfully!");
                setTimeout(() => setSuccessMessage(""), 2000);
            } else {
                alert("Failed to upload avatar");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred during upload.");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        setSaving(true);
        try {
            await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: "include" });
            localStorage.clear();
            router.push('/login');
        } catch (err) {
            console.error(err);
            router.push('/login');
        } finally {
            setSaving(false);
            setActiveModal(null);
        }
    };

    const handleUpgradePro = async () => {
        setProError("");
        if (proStep < 3) {
            setProStep(proStep + 1);
            return;
        }

        if (!proForm.category || !proForm.bio || !proForm.experience || !proForm.idCardUrl) {
            setProError("Please complete all fields, including your Gov ID.");
            return;
        }


        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/users/me/apply-pro`, { credentials: "include", 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pro_category: proForm.category,
                    pro_bio: proForm.bio,
                    id_card_url: proForm.idCardUrl || null
                })
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser);
                setSuccessMessage("Your application has been submitted! Welcome to Snabb Pro.");
                setTimeout(() => {
                    setSuccessMessage("");
                    setActiveModal(null);
                    setProStep(1);
                }, 3000);
            } else {
                alert("Failed to update pro status. Please try again.");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent flex rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return null;

    const sections = [
        { id: 'edit', icon: UserIcon, label: "Edit Personal Info", sub: "Update your name and profile details" },
        { id: 'notifications', icon: Bell, label: "Notifications", sub: "Manage how you receive alerts" },
        { id: 'privacy', icon: Shield, label: "Privacy & Security", sub: "Password and account security" },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Account Profile</h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold mt-1 text-sm uppercase tracking-[0.15em]">Manage your presence</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-orange-400"></div>
                        <div className="relative z-10">
                            <div 
                                className="w-28 h-28 bg-gradient-to-tr from-slate-50 dark:from-slate-800 to-slate-100 dark:to-slate-700 rounded-[2rem] mx-auto flex items-center justify-center text-5xl text-primary font-black mb-6 shadow-inner border border-slate-100 dark:border-slate-700 relative overflow-hidden group/avatar cursor-pointer"
                                onClick={() => document.getElementById('avatar-upload')?.click()}
                            >
                                {user.avatar_url ? (
                                    <img src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API_URL.replace('/api/v1', '')}${user.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    user.username.charAt(0).toUpperCase()
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">Upload</span>
                                </div>
                                <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{user.username}</h2>
                            <p className="text-slate-400 dark:text-slate-500 font-bold text-xs mb-8 flex items-center justify-center gap-2 uppercase tracking-widest">
                                <Mail className="w-3 h-3 text-primary" /> {user.email}
                            </p>
                            
                            <div className="pt-8 border-t border-slate-50 dark:border-slate-800">
                                {user.is_pro ? (
                                    <div className="space-y-3">
                                        <div className="bg-primary/10 text-primary px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border border-primary/20 uppercase tracking-widest">
                                            <Award className="w-4 h-4" /> Snabb Pro
                                        </div>
                                        <button 
                                            onClick={() => setActiveModal('pro')}
                                            className="w-full text-slate-400 hover:text-primary font-black text-[10px] uppercase tracking-[0.2em] transition-colors"
                                        >
                                            View Pro Profile
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setActiveModal('pro')}
                                        className="w-full bg-primary hover:bg-primary-dark text-white px-4 py-4 rounded-2xl font-black transition-all shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1"
                                    >
                                        Upgrade to Pro
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings Sections */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800">
                            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Settings className="w-4 h-4 text-primary" />
                                Account Settings
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                            {sections.map((item) => (
                                <button 
                                    key={item.id} 
                                    onClick={() => setActiveModal(item.id)}
                                    className="w-full p-8 flex items-center gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all text-left group"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors tracking-tight">{item.label}</p>
                                        <p className="text-sm text-slate-400 dark:text-slate-500 font-bold">{item.sub}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors">
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between px-8">
                        <div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Member Since</p>
                            <p className="font-bold text-slate-900 dark:text-white">{new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                        </div>
                        <button className="text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 py-3 px-6 rounded-2xl transition-all active:scale-95">
                            Delete Account
                        </button>
                    </div>

                    {/* Sign Out */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setActiveModal('logout')}
                            className="w-full p-6 flex items-center gap-5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-left group px-8"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 transition-all shadow-inner group-hover:scale-110">
                                <LogOut className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p className="text-lg font-black text-red-500 tracking-tight">Sign Out</p>
                                <p className="text-sm text-slate-400 dark:text-slate-500 font-bold">Log out of your account</p>
                            </div>
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <button
                            onClick={() => {
                                localStorage.removeItem('hasSeenTour');
                                window.location.reload();
                            }}
                            className="w-full p-6 flex items-center gap-5 hover:bg-primary/5 transition-all text-left group px-8"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-all shadow-inner">
                                <Compass className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors tracking-tight">Replay App Tour</p>
                                <p className="text-sm text-slate-400 dark:text-slate-500 font-bold">Re-watch the guided onboarding walkthrough</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {activeModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActiveModal(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden relative z-10"
                        >
                            <div className="flex justify-between items-center p-10 border-b border-slate-50 dark:border-slate-800">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {activeModal === 'edit' && "Edit Profile"}
                                        {activeModal === 'notifications' && "Notifications"}
                                        {activeModal === 'privacy' && "Privacy"}
                                        {activeModal === 'pro' && "Snabb Pro"}
                                    </h2>
                                    <p className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Configure your account</p>
                                </div>
                                <button onClick={() => setActiveModal(null)} className="w-12 h-12 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl flex items-center justify-center transition-colors">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="p-10">
                                {successMessage ? (
                                    <div className="text-center py-10 space-y-6">
                                        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                                            <CheckCircle2 className="w-10 h-10" />
                                        </div>
                                        <p className="text-2xl font-black text-slate-900 tracking-tight">{successMessage}</p>
                                    </div>
                                ) : (
                                    <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                                        {activeModal === 'logout' && (
                                            <div className="text-center py-6 space-y-8">
                                                <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto shadow-inner">
                                                    <LogOut className="w-10 h-10" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h2 className="text-3xl font-black tracking-tight">Sign Out?</h2>
                                                    <p className="text-slate-400 font-bold">Are you sure you want to log out of your account?</p>
                                                </div>
                                                <div className="flex gap-4">
                                                    <button 
                                                        onClick={() => setActiveModal(null)}
                                                        className="flex-1 py-5 font-black text-slate-400 border-2 border-slate-100 dark:border-slate-800 rounded-[1.5rem] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={handleLogout}
                                                        disabled={saving}
                                                        className="flex-[1.5] bg-red-500 text-white py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-2 shadow-xl shadow-red-500/20 transition-all active:scale-[0.98]"
                                                    >
                                                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : "Yes, Sign Out"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {activeModal === 'edit' && (
                                            <form onSubmit={handleUpdateProfile} className="space-y-8">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Username</label>
                                                    <input 
                                                        type="text" 
                                                        value={editForm.username}
                                                        onChange={e => setEditForm({...editForm, username: e.target.value})}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] p-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                                                        <input 
                                                            type="tel" 
                                                            value={editForm.phone_number}
                                                            onChange={e => setEditForm({...editForm, phone_number: e.target.value})}
                                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] p-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Location</label>
                                                        <input 
                                                            type="text" 
                                                            value={editForm.location}
                                                            onChange={e => setEditForm({...editForm, location: e.target.value})}
                                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] p-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-900 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                                                    <input 
                                                        type="email" 
                                                        value={editForm.email}
                                                        onChange={e => setEditForm({...editForm, email: e.target.value})}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] p-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                                <button 
                                                    type="submit"
                                                    disabled={saving}
                                                    className="w-full bg-primary hover:bg-primary-dark text-white py-5 rounded-[1.5rem] font-black transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 text-lg"
                                                >
                                                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : "Update Profile"}
                                                </button>
                                            </form>
                                        )}

                                        {activeModal === 'notifications' && (
                                            <div className="space-y-6">
                                                {[
                                                    { label: "Email Alerts", sub: "Periodic updates & marketing" },
                                                    { label: "Push Alerts", sub: "Real-time chat & task updates" },
                                                    { label: "SMS Alerts", sub: "Critical security notifications" },
                                                ].map((pref, i) => (
                                                    <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-200 group hover:border-primary/30 transition-colors">
                                                        <div>
                                                            <p className="font-black text-slate-900">{pref.label}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pref.sub}</p>
                                                        </div>
                                                        <div className="w-14 h-8 bg-primary rounded-full relative cursor-pointer p-1 shadow-inner">
                                                            <div className="w-6 h-6 bg-white rounded-full ml-auto shadow-md"></div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button onClick={() => setActiveModal(null)} className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black mt-8">Save Preferences</button>
                                            </div>
                                        )}

                                        {activeModal === 'privacy' && (
                                            <div className="space-y-8">
                                                <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl flex gap-5">
                                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary flex-shrink-0 shadow-sm border border-primary/5">
                                                        <Shield className="w-7 h-7" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900">Account Protection</p>
                                                        <p className="text-xs font-bold text-slate-500 leading-relaxed">Your account is secured with 256-bit encryption and multi-factor capabilities.</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 py-5 rounded-[1.5rem] font-black text-left px-8 transition-all flex items-center justify-between group">
                                                        Change Access Password
                                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                                    </button>
                                                    <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 py-5 rounded-[1.5rem] font-black text-left px-8 transition-all flex items-center justify-between group">
                                                        Two-Step Verification
                                                        <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-black">ACTIVE</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {activeModal === 'pro' && (
                                            <div className="space-y-10">
                                                {proError && (
                                                    <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3 mb-6">
                                                        <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                                                        {proError}
                                                    </div>
                                                )}

                                                {!user.is_pro && (
                                                    <div className="flex gap-3">
                                                        {[1, 2, 3].map(s => (
                                                            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= proStep ? 'bg-primary' : 'bg-slate-100'}`} />
                                                        ))}
                                                    </div>
                                                )}

                                                {proStep === 1 && !user.is_pro && (
                                                    <div className="space-y-10 text-center">
                                                        <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-primary/10 shadow-inner">
                                                            <Award className="w-12 h-12 text-primary" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Become a Pro</h3>
                                                            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Scale your influence</p>
                                                        </div>
                                                        <div className="space-y-4 text-left">
                                                            {[
                                                                { title: "Premium Earnings", icon: <Award className="w-6 h-6 text-green-600" />, sub: "Unlock higher service fees.", color: "bg-green-50/50" },
                                                                { title: "Priority Support", icon: <Settings className="w-6 h-6 text-blue-600" />, sub: "Get help from us 24/7.", color: "bg-blue-50/50" },
                                                                { title: "Verified Badge", icon: <Shield className="w-6 h-6 text-purple-600" />, sub: "Build instant trust with users.", color: "bg-purple-50/50" },
                                                            ].map((b, i) => (
                                                                <div key={i} className={`flex items-start gap-5 p-6 rounded-[2rem] ${b.color} border border-slate-100`}>
                                                                    <span className="flex-shrink-0">{b.icon}</span>
                                                                    <div>
                                                                        <p className="font-black text-slate-900">{b.title}</p>
                                                                        <p className="text-xs font-bold text-slate-500">{b.sub}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <button 
                                                            onClick={() => setProStep(2)}
                                                            className="w-full bg-primary hover:bg-primary-dark text-white py-6 rounded-[1.5rem] font-black transition-all shadow-2xl shadow-primary/30 text-lg"
                                                        >
                                                            Start Application
                                                        </button>
                                                    </div>
                                                )}

                                                {proStep === 2 && !user.is_pro && (
                                                    <div className="space-y-8">
                                                        <div className="text-center">
                                                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Choose Category</h3>
                                                            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Specialization</p>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {PRO_CATEGORIES.map(cat => (
                                                                <button 
                                                                    key={cat}
                                                                    onClick={() => setProForm({...proForm, category: cat})}
                                                                    className={`p-5 rounded-2xl border-4 text-left font-black transition-all ${
                                                                        proForm.category === cat 
                                                                        ? 'border-primary bg-primary/5 text-primary' 
                                                                        : 'border-slate-50 bg-slate-50 hover:border-slate-100 text-slate-500'
                                                                    }`}
                                                                >
                                                                    {cat}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-4 pt-4">
                                                            <button onClick={() => setProStep(1)} className="flex-1 py-5 font-black text-slate-400 border-2 border-slate-100 rounded-[1.5rem] hover:bg-slate-50 transition-all">Back</button>
                                                            <button 
                                                                disabled={!proForm.category}
                                                                onClick={() => setProStep(3)} 
                                                                className="flex-[2] bg-primary text-white py-5 rounded-[1.5rem] font-black disabled:opacity-50 shadow-xl shadow-primary/20"
                                                            >
                                                                Continue
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {proStep === 3 && !user.is_pro && (
                                                    <div className="space-y-8">
                                                        <div className="text-center">
                                                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Final Details</h3>
                                                            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Bio & Experience</p>
                                                        </div>
                                                        <div className="space-y-6">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Professional Pitch</label>
                                                                <textarea 
                                                                    placeholder="Why should users hire you?"
                                                                    value={proForm.bio}
                                                                    onChange={e => setProForm({...proForm, bio: e.target.value})}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary h-40 resize-none font-bold text-slate-900"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Years Working</label>
                                                                <input 
                                                                    type="text"
                                                                    placeholder="e.g. 5+"
                                                                    value={proForm.experience}
                                                                    onChange={e => setProForm({...proForm, experience: e.target.value})}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary font-bold text-slate-900"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Gov ID Verification <span className="text-red-500">(Required)</span></label>
                                                                <div className="relative">
                                                                    <input 
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={async (e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (!file) return;
                                                                            setSaving(true);
                                                                            const formData = new FormData();
                                                                            formData.append('file', file);
                                                                            try {
                                                                                const res = await fetch(`${API_URL}/users/me/id-card`, { credentials: "include", 
                                                                                    method: 'POST',
                                                                                                                                                                        body: formData
                                                                                });
                                                                                if(res.ok) {
                                                                                    const updated = await res.json();
                                                                                    setProForm({...proForm, idCardUrl: updated.id_card_url});
                                                                                } else {
                                                                                    alert("Failed to upload ID");
                                                                                }
                                                                            } catch(err) {
                                                                                console.error(err);
                                                                            } finally {
                                                                                setSaving(false);
                                                                            }
                                                                        }}
                                                                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-4 text-xs font-bold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer transition-all"
                                                                    />
                                                                </div>
                                                                {proForm.idCardUrl && <p className="text-[10px] text-green-500 font-bold ml-2">✓ ID Card Uploaded</p>}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-4 pt-4">
                                                            <button onClick={() => setProStep(2)} className="flex-1 py-5 font-black text-slate-400 border-2 border-slate-100 rounded-[1.5rem]">Back</button>
                                                            <button 
                                                                disabled={saving}
                                                                onClick={handleUpgradePro} 
                                                                className="flex-[2] bg-primary text-white py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                                                            >
                                                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Submit"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {user.is_pro && (
                                                    <div className="space-y-10 text-center">
                                                        <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-primary/10">
                                                            <Award className="w-12 h-12 text-primary" />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Snabb Pro Profile</h3>
                                                            <div className="flex flex-col gap-2">
                                                                <span className="text-primary font-black uppercase tracking-[0.2em] text-[10px] bg-primary/5 py-2 px-6 rounded-2xl mx-auto border border-primary/10">{user.pro_category || "Service Provider"}</span>
                                                            </div>
                                                        </div>
                                                        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 text-left relative">
                                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-4">Current Pitch</p>
                                                            <p className="text-slate-600 font-bold leading-relaxed italic">&quot;{user.pro_bio || "No bio yet."}&quot;</p>
                                                        </div>
                                                        <button onClick={() => setActiveModal(null)} className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
                                                            Close Profile
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
