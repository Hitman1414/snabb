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
    } = useCreateAskForm({ isOpen, onClose, onSuccess, onToastSuccess: toastSuccess });

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
            const msg = err.name === 'TypeError' && err.message === 'Failed to fetch' 
                ? "Could not connect to the server. Please check your internet connection."
                : err.message || "Magic Ask failed. Please try again.";
            
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
                        <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800/50 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-orange-500" />
                                <span className="text-sm font-bold text-orange-700 dark:text-orange-400">Magic Ask — AI fills the form for you</span>
                            </div>
                            <p className="text-xs text-orange-600/80 dark:text-orange-400/70 mb-3">
                                Describe what you need in plain English and AI will fill in the title, description, category, and budget.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={magicText}
                                    onChange={e => setMagicText(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleMagicAsk())}
                                    placeholder='e.g. "Need a plumber to fix my sink, budget around ₹500"'
                                    className="flex-1 bg-white dark:bg-orange-950/30 border border-orange-200 dark:border-orange-700 rounded-xl px-3 py-2 text-sm text-foreground placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                                />
                                <button
                                    type="button"
                                    onClick={handleMagicAsk}
                                    disabled={magicLoading || !magicText.trim()}
                                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 shadow-md shadow-orange-200 dark:shadow-orange-900/30 active:scale-95"
                                >
                                    {magicLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {magicLoading ? "Thinking…" : "Generate"}
                                </button>
                            </div>
                            {magicError && (
                                <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">{magicError}</p>
                            )}
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start animate-in fade-in slide-in-from-top-2 duration-300">
                                <span className="text-red-500 mr-3 text-xl">🚫</span>
                                <p className="text-red-700 text-sm font-medium leading-relaxed">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-surface-variant border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="I need someone to fix my sink..."
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-semibold text-foreground">Description</label>
                                <button
                                    type="button"
                                    onClick={handleEnhance}
                                    disabled={enhanceLoading || !formData.description.trim()}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark disabled:opacity-40 transition-colors"
                                    title="Rewrite your description to sound more professional using AI"
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

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Contact Phone (Optional)</label>
                            <input
                                type="tel"
                                value={formData.contact_phone}
                                onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                                className="w-full bg-surface-variant border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="+91 98765 43210"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Category</label>
                                <select
                                    className="w-full bg-surface-variant border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="flex items-center justify-between text-sm font-semibold text-foreground mb-1">
                                    <span>Location</span>
                                    <button
                                        type="button"
                                        onClick={() => setShowManualAddress(!showManualAddress)}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        {showManualAddress ? 'Hide Manual Address' : 'Add Manual Address'}
                                    </button>
                                </label>
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Min Budget (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.budget_min}
                                    onChange={e => setFormData({ ...formData, budget_min: e.target.value })}
                                    className="w-full bg-surface-variant border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="e.g. 50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Max Budget (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.budget_max}
                                    onChange={e => setFormData({ ...formData, budget_max: e.target.value })}
                                    className="w-full bg-surface-variant border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="e.g. 150"
                                />
                            </div>
                        </div>

                        {/* Images Section */}
                        <div className="pt-2">
                            <label className="flex items-center justify-between text-sm font-semibold text-foreground mb-2">
                                <span>Add Photos</span>
                                <span className="text-xs text-text-tertiary">({previewUrls.length}/5) Max 5MB each</span>
                            </label>

                            <div className="flex flex-wrap gap-3">
                                {previewUrls.map((url, idx) => (
                                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {previewUrls.length < 5 && (
                                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-surface-variant flex flex-col items-center justify-center text-text-tertiary hover:border-primary hover:text-primary transition-colors cursor-pointer">
                                        <span className="text-2xl mb-1">+</span>
                                        <span className="text-[10px] font-medium uppercase">Photo</span>
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
                            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-text-secondary hover:bg-surface transition-colors border border-transparent hover:border-border">
                                Cancel
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
