import { formatDistanceToNow } from "date-fns";
import { MapPin, DollarSign, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export type AskType = {
    id: number;
    title: string;
    description: string;
    category: string;
    location: string;
    status: string;
    budget_min?: number | null;
    budget_max?: number | null;
    created_at: string;
    response_count?: number;
    is_pro?: boolean;
    user?: {
        username: string;
        avatar_url?: string;
    };
    [key: string]: unknown;
};

type AskCardProps = {
    ask: AskType;
};

export default function AskCard({ ask }: AskCardProps) {
    return (
        <Link href={`/app/asks/${ask.id}`} className="block h-full">
            <motion.div 
                whileHover={{ y: -4, boxShadow: "0px 20px 40px rgba(0,0,0,0.08)" }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="bg-white rounded-[2rem] p-5 border border-slate-100 flex flex-col justify-between h-full group transition-all cursor-pointer shadow-sm relative overflow-hidden"
            >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors"></div>

                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-wrap gap-1.5">
                            <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border border-slate-100">
                                {ask.category}
                            </span>
                            <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                                ask.status === 'open' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                                {ask.status}
                            </span>
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug tracking-tight">
                        {ask.title}
                    </h3>
                    
                    <p className="text-slate-500 text-[13px] mb-5 line-clamp-2 leading-relaxed font-medium">
                        {ask.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-6">
                        <div className="flex items-center gap-2 text-slate-400 bg-slate-50/50 p-2 rounded-xl border border-transparent group-hover:border-slate-100 group-hover:bg-white transition-all overflow-hidden">
                            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <span className="text-[10px] font-black text-slate-600 truncate">{ask.location}</span>
                        </div>
                        {(ask.budget_min || ask.budget_max) && (
                            <div className="flex items-center gap-2 text-slate-400 bg-slate-50/50 p-2 rounded-xl border border-transparent group-hover:border-slate-100 group-hover:bg-white transition-all overflow-hidden">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                <span className="text-[10px] font-black text-slate-900 truncate">
                                    ${ask.budget_min || 0}-${ask.budget_max || 'Flex'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 text-[13px] font-black border border-slate-200 shadow-inner uppercase">
                            {ask.user?.username.charAt(0) || 'U'}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <p className="text-xs font-black text-slate-900 whitespace-nowrap">{ask.user?.username || 'Anonymous'}</p>
                                {ask.is_pro && (
                                    <span className="bg-primary/10 text-primary text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-primary/20">PRO</span>
                                )}
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                {formatDistanceToNow(new Date(ask.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-primary bg-primary/5 px-2.5 py-1.5 rounded-xl border border-primary/10 transition-colors group-hover:bg-primary group-hover:text-white" title="Responses">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black">{ask.response_count || 0}</span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
