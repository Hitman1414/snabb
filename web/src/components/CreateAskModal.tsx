"use client";
import { useState } from "react";
import { X, Loader2, MapPin, Sparkles, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Ask as AskType } from "@/types";
import { useCreateAskForm } from "@/hooks/useCreateAskForm";
import { useToast } from "@/components/Toast";
import constants from "../../../shared/constants.json";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type CreateAskModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newAsk: AskType) => void;
};

const CATEGORIES = constants.CATEGORIES;

export default function CreateAskModal({ isOpen, onClose, onSuccess }: CreateAskModalProps) {
    const { success: toastSuccess, error: toastError } = useToast();
    const {
        loading,
        error,
        formData,
        setFormData,
        previewUrls,
        showManualAddress,
        setShowManualAddress,
        manualAddress,
        setManualAddress,
        detectingLocation,
        locationSearch,
        locationResults,
        searchingLocation,
        setLocationResults,
        handleLocationSearchInput,
        selectLocation,
        detectLocation,
        handleImageSelect,
        removeImage,
        handleSubmit,
        handleSaveDraft,
        user,
        setIsAiProModalOpen
    } = useCreateAskForm({ isOpen, onClose, onSuccess, onToastSuccess: toastSuccess });

    const hasAiAccess = user?.is_ai_subscribed || user?.ai_override || user?.is_admin;

    const [magicText, setMagicText] = useState("");
    const [magicLoading, setMagicLoading] = useState(false);
    const [magicError, setMagicError] = useState("");
    const [enhanceLoading, setEnhanceLoading] = useState(false);

    const handleMagicAsk = async () => {
        if (!magicText.trim()) return;
        setMagicLoading(true);
        setMagicError("");
        try {
            const res = await fetch(`${API_URL}/ai/magic-ask`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: magicText }),
            });
            
            let data;
            try {
                data = await res.json();
            } catch (e) {
                throw new Error("The server returned an unexpected response. Please try again.");
            }

            if (!res.ok) {
                // Check if it's a moderation block (400)
                const detail = data.detail || data.error?.message || "AI generation failed";
                throw new Error(detail);
            }

            setFormData({
                ...formData,
                title: data.title || formData.title,
                description: data.description || formData.description,
                category: data.category || formData.category,
                budget_min: data.budget_min?.toString() || formData.budget_min,
                budget_max: data.budget_max?.toString() || formData.budget_max,
            });
            setMagicText("");
            toastSuccess("✨ Magic Ask filled the form for you!");
        } catch (err: any) {
            let msg = err.message || "Magic Ask failed. Please try again.";
            
            // Clean up 429 error
            if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
                msg = "We're receiving too many requests right now. Please try again in a few minutes.";
            } else if (msg.includes("500") || msg.includes("Internal Server Error")) {
                msg = "The AI service is currently unavailable. Please try manual entry.";
            }

            setMagicError(msg.includes("violate") || msg.includes("Prohibited") ? `🚫 ${msg}` : msg);
        } finally {
            setMagicLoading(false);
        }
    };

    const handleEnhance = async () => {
        if (!formData.description.trim()) return;
        setEnhanceLoading(true);
        try {
            const res = await fetch(`${API_URL}/ai/enhance-description`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description: formData.description }),
            });
            
            let data;
            try {
                data = await res.json();
            } catch (e) {
                throw new Error("Server communication error.");
            }

            if (!res.ok) {
                throw new Error(data.detail || data.error?.message || "Enhance failed");
            }
            
            setFormData({ ...formData, description: data.enhanced_text });
            toastSuccess("🪄 Description enhanced!");
        } catch (err: any) {
            console.error("Enhance error:", err.message);
            const msg = err.message || "Enhance failed.";
            toastError(msg.includes("violate") ? `🚫 ${msg}` : msg);
        } finally {
            setEnhanceLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-surface w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="flex justify-between items-center p-6 border-b border-border">
                        <h2 className="text-xl font-bold text-foreground">Create a New Ask</h2>
                        <button onClick={onClose} className="text-text-secondary hover:text-foreground transition-colors p-2 rounded-full hover:bg-surface-variant">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">

                        {/* ── Magic Ask Banner ─────────────────────────────── */}
                        {!hasAiAccess ? (
                            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border border-slate-200 dark:border-slate-800 p-5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Sparkles className="w-16 h-16" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Magic Ask Locked</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold mb-4 leading-relaxed">
                                        Subscribe to <span className="text-primary">Snabb AI Pro</span> to unlock instant form filling, AI enhancement, and magical search.
                                    </p>
                                    <button 
                                        type="button"
                                        onClick={() => setIsAiProModalOpen(true)}
                                        className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                                    >
                                        Unlock with Pro
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800/50 p-4 relative overflow-hidden group">
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-700"></div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-sm font-black text-indigo-700 dark:text-indigo-400">Magic Ask — AI Power</span>
                                </div>
                                <p className="text-xs text-indigo-600/80 dark:text-indigo-400/70 mb-3 font-bold">
                                    Describe what you need and Gemini will handle the rest!
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={magicText}
                                        onChange={e => setMagicText(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleMagicAsk())}
                                        placeholder='e.g. "Fix my kitchen sink, budget ₹500"'
                                        className="flex-1 bg-white dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-700 rounded-xl px-3 py-2.5 text-sm text-foreground font-medium placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleMagicAsk}
                                        disabled={magicLoading || !magicText.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-indigo-200 dark:shadow-indigo-900/30 active:scale-95"
                                    >
                                        {magicLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        {magicLoading ? "Thinking…" : "Magic Fill"}
                                    </button>
                                </div>
                                {magicError && (
                                    <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30 flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-[10px] text-red-600 dark:text-red-400 font-bold leading-tight">{magicError}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start animate-in fade-in slide-in-from-top-2 duration-300">
                                <span className="text-red-500 mr-3 text-xl">🚫</span>
                                <p className="text-red-700 text-sm font-medium leading-relaxed">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Task Details Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Task Details</h3>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-surface-variant border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="What do you need help with?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Category</label>
                                <select
                                    className="w-full bg-surface-variant border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-semibold text-foreground">Description</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (hasAiAccess) {
                                                handleEnhance();
                                            } else {
                                                setIsAiProModalOpen(true);
                                            }
                                        }}
                                        disabled={enhanceLoading || !formData.description.trim()}
                                        className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-colors ${hasAiAccess ? 'text-primary hover:text-primary-dark' : 'text-slate-400'}`}
                                        title={hasAiAccess ? "Rewrite your description to sound more professional using AI" : "Snabb AI Pro Required"}
                                    >
                                        {enhanceLoading
                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            : <Wand2 className="w-3.5 h-3.5" />
                                        }
                                        {enhanceLoading ? "Enhancing…" : "✨ Enhance with AI"}
                                    </button>
                                </div>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-surface-variant border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-y"
                                    placeholder="Looking for a licensed plumber. Must have tools..."
                                />
                            </div>
                        </div>

                        {/* Location Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Location</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowManualAddress(!showManualAddress)}
                                    className="text-xs font-bold text-primary hover:text-primary-dark transition-colors bg-primary/10 px-3 py-1.5 rounded-full"
                                >
                                    {showManualAddress ? 'Hide Manual' : 'Add Manual Address'}
                                </button>
                            </div>
                            <div className="relative">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            required
                                            value={locationSearch}
                                            onChange={e => handleLocationSearchInput(e.target.value)}
                                            onFocus={() => { if (locationResults.length > 0) setLocationResults([]); }}
                                            className="w-full bg-surface-variant border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder="Search for an address..."
                                        />
                                        {searchingLocation && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={detectLocation}
                                        disabled={detectingLocation}
                                        className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95"
                                        title="Detect my location"
                                    >
                                        {detectingLocation ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {locationResults.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 5 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="absolute left-0 right-14 top-full bg-surface border border-border rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto"
                                        >
                                            {locationResults.map((res, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => selectLocation(res)}
                                                    className="w-full text-left p-3 hover:bg-primary/5 border-b border-border last:border-0 transition-colors flex items-start gap-3 group"
                                                >
                                                    <MapPin className="w-4 h-4 mt-1 text-text-tertiary group-hover:text-primary" />
                                                    <span className="text-sm font-medium">{res.display_name}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {showManualAddress && (
                                <div className="mt-3 space-y-3 p-3 bg-surface-variant/50 rounded-xl border border-border">
                                    <input
                                        type="text"
                                        value={manualAddress.houseNo}
                                        onChange={e => setManualAddress({ ...manualAddress, houseNo: e.target.value })}
                                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="House / Flat / Office No."
                                    />
                                    <input
                                        type="text"
                                        value={manualAddress.area}
                                        onChange={e => setManualAddress({ ...manualAddress, area: e.target.value })}
                                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Area / Colony / Street"
                                    />
                                    <input
                                        type="text"
                                        value={manualAddress.landmark}
                                        onChange={e => setManualAddress({ ...manualAddress, landmark: e.target.value })}
                                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Landmark (Optional)"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Contact Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Contact (Optional)</h3>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.contact_phone}
                                    onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                                    className="w-full bg-surface-variant border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>

                        {/* Budget Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Estimated Budget</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-1">Min (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.budget_min}
                                        onChange={e => setFormData({ ...formData, budget_min: e.target.value })}
                                        className="w-full bg-surface-variant border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-1">Max (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.budget_max}
                                        onChange={e => setFormData({ ...formData, budget_max: e.target.value })}
                                        className="w-full bg-surface-variant border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        placeholder="5000"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Photos Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
                            <label className="flex items-center justify-between text-sm font-semibold text-foreground mb-2">
                                <span className="text-lg font-black text-slate-900 dark:text-white">Add Photos</span>
                                <span className="text-xs font-bold text-text-tertiary">({previewUrls.length}/5) Max 5MB each</span>
                            </label>

                            <div className="flex flex-wrap gap-3">
                                {previewUrls.map((url, idx) => (
                                    <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border group shadow-sm">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}

                                {previewUrls.length < 5 && (
                                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
                                        <span className="text-2xl mb-1 font-light">+</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Photo</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handleImageSelect}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-border bg-surface-variant/50 flex justify-end gap-3 -mx-6 -mb-6 mt-4">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="px-5 py-2.5 rounded-xl font-medium text-text-secondary hover:bg-surface transition-colors border border-transparent hover:border-border"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={(e) => handleSaveDraft(e as any)}
                                disabled={loading || !formData.title || !formData.description || !formData.location}
                                className="px-5 py-2.5 rounded-xl font-bold text-primary hover:bg-primary/5 transition-all border border-primary/20 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save as Draft"}
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !formData.title || !formData.description || !formData.location}
                                className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Post Ask
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
