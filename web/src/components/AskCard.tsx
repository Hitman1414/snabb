import { formatDistanceToNow } from "date-fns";
import { MapPin, IndianRupee, MessageSquare } from "lucide-react";
import Link from "next/link";
import { CATEGORY_THEMES } from "@/constants/categories";
import { Ask } from "@/types";
import { getFullImageUrl } from "@/lib/api";

type AskCardProps = {
    ask: Ask;
};

export default function AskCard({ ask }: AskCardProps) {
    const theme = CATEGORY_THEMES[ask.category] || CATEGORY_THEMES['Other'];
    const Icon = theme.icon;

    return (
        <Link href={`/app/asks/${ask.id}`} className="block h-full">
            <div 
                className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-full group cursor-pointer shadow-sm relative overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:shadow-[0px_20px_40px_rgba(0,0,0,0.08)]"
            >
                {/* Visual Header (Image or Gradient) */}
                <div className="relative h-32 -mx-5 -mt-5 mb-4 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {ask.images && ask.images.length > 0 ? (
                        <div className="relative w-full h-full">
                            <img 
                                src={getFullImageUrl(ask.images[0])} 
                                alt="" 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                    // Hide the broken image and show the placeholder underneath
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                            {/* Placeholder is always behind the image as a fallback if it fails to load or has transparency */}
                            <div className={`absolute inset-0 -z-10 flex items-center justify-center bg-gradient-to-br ${CATEGORY_THEMES[ask.category]?.gradient || CATEGORY_THEMES['Other'].gradient}`}>
                                <Icon className="w-10 h-10 text-white opacity-40" />
                            </div>
                        </div>
                    ) : (
                        <div 
                            className={`w-full h-full flex items-center justify-center relative overflow-hidden transition-all duration-500 bg-slate-50 dark:bg-slate-800/80`}
                        >
                            {/* Essence / Background Glow */}
                            <div className={`absolute inset-0 opacity-[0.08] dark:opacity-[0.15] bg-gradient-to-br ${theme.gradient}`} />
                            
                            {/* Watermark */}
                            <Icon className="absolute w-32 h-32 opacity-[0.04] dark:opacity-[0.06] text-slate-900 dark:text-white -right-4 -bottom-6 rotate-12 transition-transform duration-700 group-hover:rotate-6 group-hover:scale-110" />
                            <Icon className="absolute w-24 h-24 opacity-[0.03] dark:opacity-[0.04] text-slate-900 dark:text-white -left-6 -top-4 -rotate-12 transition-transform duration-700 group-hover:-rotate-6 group-hover:scale-110" />
                            
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br ${theme.gradient} group-hover:scale-110 transition-transform duration-500 z-10`}>
                                <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-sm" />
                            </div>
                        </div>
                    )}
                    <div className="absolute top-3 right-3">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm border ${
                            ask.status === 'open' 
                            ? 'bg-emerald-500/80 text-white border-emerald-400/30' 
                            : 'bg-blue-500/80 text-white border-blue-400/30'
                        }`}>
                            {ask.status}
                        </span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-1.5 mb-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${CATEGORY_THEMES[ask.category]?.bg || 'bg-slate-50'} ${CATEGORY_THEMES[ask.category]?.text || 'text-slate-500'} ${CATEGORY_THEMES[ask.category]?.border || 'border-slate-100'}`}>
                            {ask.category}
                        </span>
                    </div>
                    
                    <h3 className="text-base font-black text-slate-900 dark:text-white mb-1.5 group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-1 leading-tight tracking-tight">
                        {ask.title}
                    </h3>
                    
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-4 line-clamp-2 leading-relaxed font-medium">
                        {ask.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4 mt-auto">
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 p-1.5 rounded-lg border border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700/50 transition-all overflow-hidden">
                            <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 truncate">{ask.location}</span>
                        </div>
                        {(ask.budget_min || ask.budget_max || ask.budget_min === 0) && (
                            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 p-1.5 rounded-lg border border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700/50 transition-all overflow-hidden">
                                <IndianRupee className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                <span className="text-[9px] font-black text-slate-900 dark:text-white truncate">
                                    {ask.budget_min === 0 && ask.budget_max === 0 ? 'Flexible' : `₹${ask.budget_min || 0}-₹${ask.budget_max || 'Flex'}`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-100 dark:from-slate-800 to-slate-200 dark:to-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[13px] font-black border border-slate-200 dark:border-slate-600 shadow-inner uppercase">
                            {ask.user?.username.charAt(0) || 'U'}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[100px]">{ask.user?.username || 'Anonymous'}</p>
                                {ask.user?.is_pro && (
                                    <span className="bg-emerald-500/10 text-emerald-600 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-emerald-500/20">PRO</span>
                                )}
                                {ask.user?.is_ai_subscribed && (
                                    <span className="bg-indigo-500/10 text-indigo-600 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-indigo-500/20">AI PRO</span>
                                )}
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                {formatDistanceToNow(new Date(ask.created_at.endsWith('Z') ? ask.created_at : ask.created_at + 'Z'), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-primary bg-primary/5 px-2.5 py-1.5 rounded-xl border border-primary/10 transition-colors group-hover:bg-primary group-hover:text-white" title="Responses">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black">{ask.response_count || 0}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
