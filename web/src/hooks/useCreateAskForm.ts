import { useState, useEffect, useCallback, FormEvent, ChangeEvent } from "react";
import { API_URL } from "@/lib/api";
import { Ask as AskType } from "@/types";

type CreateAskProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newAsk: AskType) => void;
};

export function useCreateAskForm({ isOpen, onClose, onSuccess }: CreateAskProps) {
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

    // Reset when closed
    useEffect(() => {
        if (!isOpen) {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
            if (previewUrls.length > 0 || images.length > 0) {
                setImages([]);
                setPreviewUrls([]);
            }
            if (formData.title) {
                setFormData({
                    title: "", description: "", category: "Services",
                    location: "", budget_min: "", budget_max: "", contact_phone: ""
                });
                setCoordinates(null);
                setShowManualAddress(false);
                setManualAddress({ houseNo: "", area: "", landmark: "" });
                setLocationSearch("");
                setLocationResults([]);
                setError("");
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleMagicAsk = async () => {
        if (!magicText.trim()) return;
        setIsMagicLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_URL}/ai/magic-ask`, { 
                credentials: "include", 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            const res = await fetch(`${API_URL}/ai/enhance-description`, { 
                credentials: "include", 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    // TASK-25 [Perf] Web: add 500ms debounce to Nominatim location search in CreateAskModal
    useEffect(() => {
        if (locationSearch.length < 3) {
            setLocationResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setSearchingLocation(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&limit=5`);
                const data = await res.json();
                setLocationResults(data);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setSearchingLocation(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [locationSearch]);

    const handleLocationSearchInput = (query: string) => {
        setLocationSearch(query);
        setFormData(prev => ({ ...prev, location: query }));
    };

    const selectLocation = (result: {display_name: string, lat: string, lon: string}) => {
        setFormData(prev => ({ ...prev, location: result.display_name }));
        setLocationSearch(result.display_name);
        setCoordinates({ latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) });
        setLocationResults([]);
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

    const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (images.length + newFiles.length > 5) {
                setError("You can only upload a maximum of 5 images.");
                return;
            }
            const oversized = newFiles.find(file => file.size > 5 * 1024 * 1024);
            if (oversized) {
                setError("Each image must be smaller than 5MB.");
                return;
            }
            setImages(prev => [...prev, ...newFiles]);
            const newUrls = newFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newUrls]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(previewUrls[index]);
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        
        // TASK-24 [UI] Web: move form validation before setLoading(true) in CreateAskModal
        if (!formData.title || formData.title.trim().length < 10) {
            setError("Title must be at least 10 characters long for better clarity.");
            return;
        }

        if (!formData.description || formData.description.trim().length < 30) {
            setError("Please provide a more detailed description (at least 30 characters).");
            return;
        }

        const bMin = formData.budget_min ? parseFloat(formData.budget_min) : 0;
        const bMax = formData.budget_max ? parseFloat(formData.budget_max) : null;

        if (bMin < 0) {
            setError("Budget cannot be negative. Please enter a valid amount.");
            return;
        }

        if (bMax !== null && bMax < 0) {
            setError("Maximum budget cannot be negative.");
            return;
        }

        if (bMax !== null && bMax < bMin) {
            setError("Maximum budget must be greater than your minimum budget.");
            return;
        }

        if (bMin === 0 && bMax === null) {
            setError("Please specify a budget range or a minimum amount.");
            return;
        }

        let finalLocation = formData.location;
        if (showManualAddress) {
            const parts = [manualAddress.houseNo, manualAddress.area, manualAddress.landmark, formData.location].filter(val => val && val.trim().length > 0);
            finalLocation = parts.join(', ');
        }
        
        if (!finalLocation || finalLocation.trim().length === 0) {
            setError("Please enter a location or use a manual address.");
            return;
        }

        setLoading(true);

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
                credentials: "include", 
                method: "POST",
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

    return {
        loading,
        error,
        formData,
        setFormData,
        images,
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
        magicText,
        setMagicText,
        isMagicLoading,
        isEnhancing,
        handleMagicAsk,
        handleEnhanceDescription,
        handleLocationSearchInput,
        selectLocation,
        detectLocation,
        handleImageSelect,
        removeImage,
        handleSubmit,
    };
}
