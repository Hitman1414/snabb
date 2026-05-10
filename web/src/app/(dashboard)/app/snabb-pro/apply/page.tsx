"use client";

import React, { useState } from 'react';
import { 
    Trophy, 
    ArrowLeft, 
    CheckCircle2, 
    Upload, 
    Loader2,
    ShieldCheck,
    Briefcase,
    BadgeCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { useDashboard } from '@/hooks/useDashboard';
import { useToast } from '@/components/Toast';
const CATEGORIES = [
    "Plumbing", "Electrical", "Carpentry", "Cleaning", 
    "Painting", "Moving", "Appliance Repair", "Yard Work", "Other"
];

export default function ApplyProPage() {
    const router = useRouter();
    const { user, mutate } = useDashboard();
    const { success: toastSuccess, error: toastError } = useToast();
    
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        pro_category: CATEGORIES[0],
        pro_bio: '',
        id_card_url: ''
    });
    const [idCardFile, setIdCardFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                toastError("File size must be less than 5MB");
                return;
            }
            setIdCardFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let idCardUrl = '';
            if (idCardFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', idCardFile);
                const uploadRes = await fetch(`${API_URL}/users/me/id-card`, {
                    method: 'POST',
                    credentials: 'include',
                    body: uploadFormData
                });
                if (!uploadRes.ok) throw new Error("ID Card upload failed");
                const uploadData = await uploadRes.json();
                idCardUrl = uploadData.id_card_url;
            }

            const res = await fetch(`${API_URL}/users/me/apply-pro`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    id_card_url: idCardUrl
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Application failed");
            }

            toastSuccess("🎉 Application submitted! Admin will review it shortly.");
            await mutate(); // Refresh user state
            router.push('/app/snabb-pro');
        } catch (err: any) {
            toastError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (user?.is_pro) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <BadgeCheck className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black">You are already a Pro!</h1>
                <p className="text-slate-500 font-medium">Head over to your dashboard to manage your business.</p>
                <button onClick={() => router.push('/app/snabb-pro')} className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold">
                    Go to Pro Hub
                </button>
            </div>
        );
    }

    if (user?.pro_status === 'pending') {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600 text-3xl">
                    ⏳
                </div>
                <h1 className="text-3xl font-black">Application Pending</h1>
                <p className="text-slate-500 font-medium">We are currently reviewing your application. You'll be notified once approved.</p>
                <button onClick={() => router.push('/app/snabb-pro')} className="text-emerald-600 font-bold hover:underline">
                    Back to Pro Hub
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 py-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold hover:gap-3 transition-all"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                            <Trophy className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Become a Snabb Pro</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            Complete your application to join Gurugram's fastest-growing professional network.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { title: 'Verified Badge', desc: 'Build instant trust with a Pro badge on your profile.', icon: BadgeCheck },
                            { title: 'High-Value Tasks', desc: 'Get access to tasks with higher budgets.', icon: Briefcase },
                            { title: 'Priority Support', desc: 'Our team is here to help you grow.', icon: ShieldCheck }
                        ].map((benefit, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                    <benefit.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{benefit.title}</h4>
                                    <p className="text-xs text-slate-500">{benefit.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
                        <div>
                            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                                Your Expertise
                            </label>
                            <select 
                                required
                                value={formData.pro_category}
                                onChange={(e) => setFormData({ ...formData, pro_category: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
                            >
                                {CATEGORIES.map((cat: string) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                                Professional Bio
                            </label>
                            <textarea 
                                required
                                value={formData.pro_bio}
                                onChange={(e) => setFormData({ ...formData, pro_bio: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-medium min-h-[120px]"
                                placeholder="Tell us about your experience and skills..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                                ID Verification
                            </label>
                            <div className="relative">
                                <input 
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="id-card-upload"
                                />
                                <label 
                                    htmlFor="id-card-upload"
                                    className="flex flex-col items-center justify-center w-full aspect-video bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl cursor-pointer hover:bg-emerald-50 transition-all group overflow-hidden"
                                >
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="ID Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <Upload className="w-10 h-10 text-slate-300 group-hover:text-emerald-500 mb-4 transition-colors" />
                                            <p className="text-sm font-bold text-slate-400 group-hover:text-emerald-600">Upload Aadhaar / ID Card</p>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Max 5MB • JPG/PNG</p>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                                {loading ? 'Submitting...' : 'Submit Application'}
                            </button>
                            <p className="text-center text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-[0.2em]">
                                Your data is secured with end-to-end encryption
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
