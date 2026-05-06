"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    loading: (message: string) => string;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        
        if (type !== 'loading') {
            setTimeout(() => dismiss(id), 5000);
        }
        return id;
    }, [dismiss]);

    const success = (msg: string) => toast(msg, 'success');
    const error = (msg: string) => toast(msg, 'error');
    const info = (msg: string) => toast(msg, 'info');
    const loading = (msg: string) => toast(msg, 'loading');

    return (
        <ToastContext.Provider value={{ toast, success, error, info, loading, dismiss }}>
            {children}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-md px-4">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="pointer-events-auto"
                        >
                            <div className={`
                                flex items-center gap-3 px-5 py-4 rounded-3xl shadow-2xl border backdrop-blur-xl
                                ${t.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : ''}
                                ${t.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' : ''}
                                ${t.type === 'info' ? 'bg-primary/10 border-primary/20 text-primary' : ''}
                                ${t.type === 'loading' ? 'bg-slate-900/10 border-slate-900/20 text-slate-900 dark:bg-white/10 dark:border-white/20 dark:text-white' : ''}
                            `}>
                                {t.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                                {t.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                                {t.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
                                {t.type === 'loading' && <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />}
                                
                                <p className="text-sm font-black tracking-tight flex-1">{t.message}</p>
                                
                                <button 
                                    onClick={() => dismiss(t.id)}
                                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 opacity-50" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
