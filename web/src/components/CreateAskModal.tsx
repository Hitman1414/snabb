import { useState } from "react";
import { X, Loader2, MapPin, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";
import { Ask as AskType } from "@/types";

type CreateAskModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newAsk: AskType) => void;
};

export default function CreateAskModal({ isOpen, onClose, onSuccess }: CreateAskModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "Services",
        location: "",
        budget_min: "",
        budget_max: "",
        contact_phone: "",
    });

    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [showManualAddress, setShowManualAddress] = useState(false);
    const [manualAddress, setManualAddress] = useState({ houseNo: "", area: "", landmark: "" });
    const [coordinates, setCoordinates] = useState<{ latitude: number, longitude: number } | null>(null);
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [locationSearch, setLocationSearch] = useState("");
    const [locationResults, setLocationResults] = useState<{display_name: string, lat: string, lon: string}[]>([]);
    const [searchingLocation, setSearchingLocation] = useState(false);

    const [magicText, setMagicText] = useState("");
    const [isMagicLoading, setIsMagicLoading] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);

    const handleMagicAsk = async () => {
        if (!magicText.trim()) return;
        setIsMagicLoading(true);
        setError("");
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/ai/magic-ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: magicText })
            });
            if (!res.ok) {
                if (res.status === 429) {
                    throw new Error("AI is temporarily busy. Please wait a minute and try again.");
                }
                throw new Error("Failed to process Magic Ask");
            }
            const data = await res.json();
            
            setFormData(prev => ({
                ...prev,
                title: data.title || prev.title,
                description: data.description || prev.description,
                category: data.category || prev.category,
                budget_min: data.budget_min !== null ? String(data.budget_min) : prev.budget_min,
                budget_max: data.budget_max !== null ? String(data.budget_max) : prev.budget_max,
            }));
            setMagicText("");
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Magic Ask failed. Please try again.");
        } finally {
            setIsMagicLoading(false);
        }
    };

    const handleEnhanceDescription = async () => {
        if (!formData.description.trim() || formData.description.length < 10) {
            setError("Please write a few words in the description first to enhance it.");
            return;
        }
        setIsEnhancing(true);
        setError("");
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/ai/enhance-description`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ description: formData.description })
            });
            if (!res.ok) {
                let errorMsg = "Failed to enhance description";
                try {
                    const errData = await res.json();
                    errorMsg = errData.detail || errData.error?.message || errorMsg;
                } catch (e) {}
                throw new Error(errorMsg);
            }
            const data = await res.json();
            setFormData(prev => ({ ...prev, description: data.enhanced_text }));
        } catch (err) {
            console.error(err);
            setError("Failed to enhance description.");
        } finally {
            setIsEnhancing(false);
        }
    };

    const categories = [
        "Electronics", "Furniture", "Vehicles", "Real Estate", 
        "Services", "Jobs", "Education", "Fashion", "Sports", "Other"
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        const token = localStorage.getItem('token');
        if (!token) {
            setError("Authentication token not found. Please log in again.");
            return;
        }

        setLoading(true);



        if (!formData.title || formData.title.trim().length < 10) {
            setError("Title must be at least 10 characters long for better clarity.");
            setLoading(false);
            return;
        }

        if (!formData.description || formData.description.trim().length < 30) {
            setError("Please provide a more detailed description (at least 30 characters).");
            setLoading(false);
            return;
        }

        const bMin = formData.budget_min ? parseFloat(formData.budget_min) : 0;
        const bMax = formData.budget_max ? parseFloat(formData.budget_max) : null;

        if (bMin < 0) {
            setError("Budget cannot be negative. Please enter a valid amount.");
            setLoading(false);
            return;
        }

        if (bMax !== null && bMax < 0) {
            setError("Maximum budget cannot be negative.");
            setLoading(false);
            return;
        }

        if (bMax !== null && bMax < bMin) {
            setError("Maximum budget must be greater than your minimum budget.");
            setLoading(false);
            return;
        }

        if (bMin === 0 && bMax === null) {
            setError("Please specify a budget range or a minimum amount.");
            setLoading(false);
            return;
        }

        let finalLocation = formData.location;
        if (showManualAddress) {
            const parts = [manualAddress.houseNo, manualAddress.area, manualAddress.landmark, formData.location].filter(val => val && val.trim().length > 0);
            finalLocation = parts.join(', ');
        }
        
        if (!finalLocation || finalLocation.trim().length === 0) {
            setError("Please enter a location or use a manual address.");
            setLoading(false);
            return;
        }

        try {
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('category', formData.category);
            submitData.append('location', finalLocation);
            if (bMin !== null) submitData.append('budget_min', bMin.toString());
            if (bMax !== null) submitData.append('budget_max', bMax.toString());
            if (coordinates) {
                submitData.append('latitude', coordinates.latitude.toString());
                submitData.append('longitude', coordinates.longitude.toString());
            }
            if (formData.contact_phone && formData.contact_phone.trim() !== "") {
                submitData.append('contact_phone', formData.contact_phone.trim());
            }

            images.forEach((img) => {
                submitData.append('images', img);
            });

            const response = await fetch(`${API_URL}/asks`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: submitData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to create ask");
            }

            const newAsk = await response.json();
            alert("Your ask has been posted successfully!");
            onSuccess(newAsk);
            onClose();
            // Cleanup previews
            previewUrls.forEach(url => URL.revokeObjectURL(url));
            setImages([]);
            setPreviewUrls([]);
            setCoordinates(null);
            setShowManualAddress(false);
            setManualAddress({ houseNo: "", area: "", landmark: "" });

            // Reset form
            setFormData({
                title: "", description: "", category: "Services",
                location: "", budget_min: "", budget_max: "", contact_phone: ""
            });
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

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            
            // Check limits
            if (images.length + newFiles.length > 5) {
                setError("You can only upload a maximum of 5 images.");
                return;
            }

            // Check sizes
            const oversized = newFiles.find(file => file.size > 5 * 1024 * 1024);
            if (oversized) {
                setError("Each image must be smaller than 5MB.");
                return;
            }

            setImages(prev => [...prev, ...newFiles]);
            
            // Generate Previews
            const newUrls = newFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newUrls]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(previewUrls[index]);
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCoordinates({ latitude, longitude });
                
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                    const data = await res.json();
                    
                    if (data && data.display_name) {
                        setFormData(prev => ({ ...prev, location: data.display_name }));
                        setLocationSearch(data.display_name);
                    } else {
                        const locStr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                        setFormData(prev => ({ ...prev, location: locStr }));
                        setLocationSearch(locStr);
                    }
                } catch (err) {
                    console.error("Geocoding failed", err);
                    const locStr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                    setFormData(prev => ({ ...prev, location: locStr }));
                    setLocationSearch(locStr);
                } finally {
                    setDetectingLocation(false);
                }
            },
            (err) => {
                setShowManualAddress(true);
                setDetectingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
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

    const selectLocation = (result: {display_name: string, lat: string, lon: string}) => {
        setFormData(prev => ({ ...prev, location: result.display_name }));
        setLocationSearch(result.display_name);
        setCoordinates({ latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) });
        setLocationResults([]);
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
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
                                {error}
                            </div>
                        )}

                        {/* Magic Ask Section (Commented out for next phase) */}
                        {/* 
                        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-4 mb-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-primary mb-2">
                                <Sparkles className="w-4 h-4" />
                                Magic Auto-fill
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={magicText}
                                    onChange={(e) => setMagicText(e.target.value)}
                                    placeholder="e.g. Need a plumber tomorrow for $50..."
                                    className="flex-1 bg-white dark:bg-surface-variant border border-primary/20 rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleMagicAsk();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleMagicAsk}
                                    disabled={isMagicLoading || !magicText.trim()}
                                    className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                                >
                                    {isMagicLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Auto-fill"}
                                </button>
                            </div>
                        </div>
                        */}

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Title</label>
                            <input 
                                type="text" 
                                required
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                className="w-full bg-surface-variant border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" 
                                placeholder="I need someone to fix my sink..." 
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-semibold text-foreground">Description</label>
                                {/* AI Enhance description feature temporarily disabled
                                <button
                                    type="button"
                                    onClick={handleEnhanceDescription}
                                    disabled={isEnhancing || !formData.description}
                                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-50 disabled:no-underline"
                                >
                                    {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                    Enhance with AI
                                </button>
                                */}
                            </div>
                            <textarea 
                                required
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full bg-surface-variant border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-y" 
                                placeholder="Looking for a licensed plumber. Must have tools..."
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Contact Phone (Optional)</label>
                            <input 
                                type="tel" 
                                value={formData.contact_phone}
                                onChange={e => setFormData({...formData, contact_phone: e.target.value})}
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
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    {categories.map(cat => (
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
                                                onChange={e => handleLocationSearch(e.target.value)}
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
                                            {detectingLocation ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="font-bold text-lg">📍</span>}
                                        </button>
                                    </div>
                                    
                                    {/* Search Results Dropdown */}
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
                                            onChange={e => setManualAddress({...manualAddress, houseNo: e.target.value})}
                                            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                                            placeholder="House / Flat / Office No." 
                                        />
                                        <input 
                                            type="text" 
                                            value={manualAddress.area}
                                            onChange={e => setManualAddress({...manualAddress, area: e.target.value})}
                                            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                                            placeholder="Area / Colony / Street" 
                                        />
                                        <input 
                                            type="text" 
                                            value={manualAddress.landmark}
                                            onChange={e => setManualAddress({...manualAddress, landmark: e.target.value})}
                                            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                                            placeholder="Landmark (Optional)" 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Min Budget ($)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={formData.budget_min}
                                    onChange={e => setFormData({...formData, budget_min: e.target.value})}
                                    className="w-full bg-surface-variant border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" 
                                    placeholder="e.g. 50" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Max Budget ($)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={formData.budget_max}
                                    onChange={e => setFormData({...formData, budget_max: e.target.value})}
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
                                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-surface-variant flex flex-col items-center justify-center text-text-tertiary hover:border-primary hover:text-primary transition-colors cursor-pointer cursor-allowed">
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
                    </form>

                    <div className="p-6 border-t border-border bg-surface-variant/50 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-text-secondary hover:bg-surface transition-colors border border-transparent hover:border-border">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            onClick={handleSubmit}
                            disabled={loading || !formData.title || !formData.description || !formData.location}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Post Ask
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
