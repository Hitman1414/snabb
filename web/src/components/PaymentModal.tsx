"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Wallet, ShieldCheck, CheckCircle2 } from "lucide-react";
import { API_URL } from "@/lib/api";

type PaymentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    bidAmount: number;
    askId: number;
    responseId: number;
    completedAsksCount: number;
    onSuccess: () => void;
};

export default function PaymentModal({ isOpen, onClose, bidAmount, askId, responseId, completedAsksCount, onSuccess }: PaymentModalProps) {
    const { error: toastError, success: toastSuccess } = useToast();
    const [method, setMethod] = useState<'stripe' | 'cash'>('stripe');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const isFree = completedAsksCount < 3;
    const feePercent = isFree ? 0 : 3;
    const platformFee = (bidAmount * feePercent) / 100;
    const totalAmount = method === 'stripe' ? bidAmount + platformFee : bidAmount;

    const handlePayment = async () => {
        setLoading(true);
        try {
            // If cash, we could just accept the response directly, or create a 0-amount intent.
            // But we have /payments/create-payment-intent to handle this.
            const res = await fetch(`${API_URL}/payments/create-payment-intent`, { credentials: "include", 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ask_id: askId,
                    bid_amount: bidAmount,
                    payment_method: method
                })
            });

            if (res.ok) {
                // Usually here we would use Stripe elements to complete payment.
                // For now, we simulate success for cash/UPI or direct intent creation.
                toastSuccess("Payment setup successfully!");
                setSuccess(true);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            } else {
                toastError("Payment setup failed.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col p-8"
                >
                    {success ? (
                        <div className="text-center py-10 space-y-6">
                            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Payment Initiated!</p>
                            <p className="text-slate-500 font-bold">You have accepted this response.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Accept & Pay</h2>
                                    <p className="text-sm font-bold text-slate-400">Secure checkout</p>
                                </div>
                                <button onClick={onClose} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-slate-500">Service Bid</span>
                                    <span className="font-black text-slate-900 dark:text-white">${bidAmount.toFixed(2)}</span>
                                </div>
                                {method === 'stripe' && (
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-bold text-slate-500">
                                            Convenience Fee (3%)
                                            <p className="text-[9px] uppercase tracking-widest text-primary mt-1">
                                                {isFree ? `WAIVED (${3 - completedAsksCount} Free Asks Left)` : 'Supports the platform'}
                                            </p>
                                        </span>
                                        <span className={`font-black ${isFree ? 'text-green-500' : 'text-slate-900 dark:text-white'}`}>
                                            {isFree ? 'FREE' : `$${platformFee.toFixed(2)}`}
                                        </span>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <span className="text-lg font-black text-slate-900 dark:text-white">Total</span>
                                    <span className="text-2xl font-black text-primary">${totalAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Payment Method</p>
                                <button 
                                    onClick={() => setMethod('stripe')}
                                    className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] border-2 transition-all ${
                                        method === 'stripe' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'stripe' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-slate-900 dark:text-white">Secure In-App Payment</p>
                                        <p className="text-xs font-bold text-slate-500">Credit/Debit Card (Stripe)</p>
                                    </div>
                                    {method === 'stripe' && <ShieldCheck className="w-6 h-6 text-primary ml-auto" />}
                                </button>

                                <button 
                                    onClick={() => setMethod('cash')}
                                    className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] border-2 transition-all ${
                                        method === 'cash' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'cash' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-slate-900 dark:text-white">Free Will (Cash / UPI)</p>
                                        <p className="text-xs font-bold text-slate-500">Pay directly to the pro</p>
                                    </div>
                                    {method === 'cash' && <CheckCircle2 className="w-6 h-6 text-emerald-500 ml-auto" />}
                                </button>
                            </div>

                            <button 
                                onClick={handlePayment}
                                disabled={loading}
                                className="w-full bg-slate-900 dark:bg-primary text-white py-5 rounded-[1.5rem] font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin rounded-full"></div> : `Confirm $${totalAmount.toFixed(2)}`}
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
