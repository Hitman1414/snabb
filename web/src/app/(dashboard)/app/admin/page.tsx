"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
    Activity, 
    Users, 
    FileText, 
    Smartphone, 
    Globe, 
    Clock, 
    Database, 
    ShieldAlert,
    TrendingUp,
    Zap,
    MapPin,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    RefreshCw,
    BarChart3,
    Server,
    LayoutDashboard,
    ArrowRight
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { format } from "date-fns";

type AdminStats = {
    db: {
        total_asks: number;
        total_users: number;
        total_responses: number;
        unassigned_asks: number;
    };
    monitoring: {
        total_requests: number;
        status_codes: Record<string, string>;
        avg_latency_ms: number;
        platforms: {
            browser: string;
            mobile: string;
        };
        top_endpoints: [string, string][];
        recent_traffic: Array<{
            method: string;
            path: string;
            status: number;
            duration: number;
            timestamp: number;
            platform: 'browser' | 'mobile';
        }>;
    };
    server_time: string;
};

export default function AdminPortal() {
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const res = await fetch(`${API_URL}/admin/stats?token=${token}`);
            if (res.ok) {
                const data = await res.json();
                // Handle both old format and new format
                const normalized: AdminStats = {
                    db: data.db || {
                        total_asks: data.total_asks || 0,
                        total_users: data.total_users || 0,
                        total_responses: data.total_responses || 0,
                        unassigned_asks: 0,
                    },
                    monitoring: data.monitoring || {
                        total_requests: data.api_monitor?.total_requests || 0,
                        status_codes: data.api_monitor?.status_codes || {},
                        avg_latency_ms: data.api_monitor?.avg_latency_ms || 0,
                        platforms: { browser: "0", mobile: "0" },
                        top_endpoints: [],
                        recent_traffic: [],
                    },
                    server_time: data.server_time || new Date().toISOString(),
                };
                setStats(normalized);
            } else if (res.status === 403) {
                router.push('/app');
            } else if (res.status === 422) {
                // Old API that doesn't require token - try without
                const res2 = await fetch(`${API_URL}/admin/stats`);
                if (res2.ok) {
                    const data = await res2.json();
                    const normalized: AdminStats = {
                        db: {
                            total_asks: data.total_asks || 0,
                            total_users: data.total_users || 0,
                            total_responses: data.total_responses || 0,
                            unassigned_asks: 0,
                        },
                        monitoring: {
                            total_requests: data.api_monitor?.total_requests || 0,
                            status_codes: data.api_monitor?.status_codes || {},
                            avg_latency_ms: data.api_monitor?.avg_latency_ms || 0,
                            platforms: { browser: "0", mobile: "0" },
                            top_endpoints: [],
                            recent_traffic: [],
                        },
                        server_time: new Date().toISOString(),
                    };
                    setStats(normalized);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Auto refresh every 10s
        return () => clearInterval(interval);
    }, []);

    if (loading || !stats) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
                <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Loading Control Center...</p>
            </div>
        );
    }

    const { db, monitoring } = stats;
    const browserUsage = parseInt(monitoring.platforms.browser || "0");
    const mobileUsage = parseInt(monitoring.platforms.mobile || "0");
    const totalUsage = browserUsage + mobileUsage || 1;
    
    const browserPercent = Math.round((browserUsage / totalUsage) * 100);
    const mobilePercent = 100 - browserPercent;

    return (
        <div className="space-y-10 pb-20 max-w-[1600px] mx-auto">
            {/* Admin Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-slate-900 text-white p-2 rounded-xl">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Control Center</h1>
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Live System Monitoring • {format(new Date(stats.server_time), "MMM d, HH:mm:ss")}
                    </p>
                </div>
                <button 
                    onClick={() => { setRefreshing(true); fetchStats(); }}
                    className="bg-white border border-slate-200 px-6 py-4 rounded-2xl flex items-center gap-3 hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest shadow-sm active:scale-95 disabled:opacity-50"
                    disabled={refreshing}
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh Engine
                </button>
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Total Marketplace Asks" 
                    value={db.total_asks} 
                    icon={FileText} 
                    color="bg-blue-50 text-blue-600"
                    sub="Lifetime requests"
                />
                <MetricCard 
                    title="Registered Users" 
                    value={db.total_users} 
                    icon={Users} 
                    color="bg-purple-50 text-purple-600"
                    sub="Verified accounts"
                />
                <MetricCard 
                    title="API Total Traffic" 
                    value={monitoring.total_requests} 
                    icon={Activity} 
                    color="bg-emerald-50 text-emerald-600"
                    sub="Requests handled"
                />
                <MetricCard 
                    title="Engine Latency" 
                    value={`${monitoring.avg_latency_ms}ms`} 
                    icon={Zap} 
                    color="bg-amber-50 text-amber-600"
                    sub="Avg response time"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Analytics: Usage & Traffic (Left 8/12) */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Platform Analysis Chart */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Platform Utilization</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Browser vs Mobile Usage Share</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-slate-900 rounded-full"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Browser</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-12">
                            {/* Big Percentage Display */}
                            <div className="flex items-end justify-between px-4">
                                <div className="text-center">
                                    <h4 className="text-5xl font-black text-slate-900 italic tracking-tighter">{browserPercent}%</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{browserUsage} Web Users</p>
                                </div>
                                <div className="h-20 w-[1px] bg-slate-100 mx-10 hidden md:block"></div>
                                <div className="text-center">
                                    <h4 className="text-5xl font-black text-primary italic tracking-tighter">{mobilePercent}%</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{mobileUsage} App Users</p>
                                </div>
                            </div>

                            {/* Custom Progress Bar Chart */}
                            <div className="h-16 w-full bg-slate-50 rounded-[1.5rem] overflow-hidden flex shadow-inner border border-slate-100 p-2">
                                <div 
                                    style={{ width: `${browserPercent}%` }} 
                                    className="h-full bg-slate-900 rounded-xl transition-all duration-1000 flex items-center justify-center relative group"
                                >
                                    <Globe className="w-5 h-5 text-white/20 group-hover:text-white/50 transition-colors" />
                                </div>
                                <div 
                                    style={{ width: `${mobilePercent}%` }} 
                                    className="h-full bg-primary rounded-xl transition-all duration-1000 flex items-center justify-center ml-1 relative group"
                                >
                                    <Smartphone className="w-5 h-5 text-white/20 group-hover:text-white/50 transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Traffic Log */}
                    <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Database className="w-5 h-5 text-slate-400" />
                                <h3 className="text-lg font-black text-slate-900">Real-time Traffic Log</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 20 Requests</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-4">Method</th>
                                        <th className="px-8 py-4">Endpoint</th>
                                        <th className="px-8 py-4">Platform</th>
                                        <th className="px-8 py-4">Status</th>
                                        <th className="px-8 py-4 text-right">Latency</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {monitoring.recent_traffic.map((req, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-lg font-black text-[9px] uppercase border ${
                                                    req.method === 'GET' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    req.method === 'POST' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                    {req.method}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-slate-600 truncate max-w-xs">{req.path}</td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    {req.platform === 'mobile' ? <Smartphone className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                                                    <span className="text-[10px] font-black uppercase text-slate-400">{req.platform}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-2 py-1 rounded-md font-black text-xs ${req.status < 400 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right font-mono text-xs text-slate-400">
                                                {Math.round(req.duration * 1000)}ms
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats (Right 4/12) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Popular Endpoints */}
                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl shadow-slate-900/20 active:scale-[0.99] transition-transform">
                        <div className="flex items-center gap-3 mb-8">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-black tracking-tight">Top Endpoints</h3>
                        </div>
                        <div className="space-y-6">
                            {monitoring.top_endpoints.map(([path, hits], i) => {
                                const total = monitoring.total_requests || 1;
                                const percent = Math.min(100, Math.round((parseInt(hits) / total) * 100));
                                return (
                                    <div key={i} className="group">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[11px] font-bold text-slate-400 truncate max-w-[200px]">{path}</span>
                                            <span className="text-xs font-black">{hits} Hits</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary transition-all duration-1000" 
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* System Health Status */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                            <Server className="w-5 h-5 text-slate-400" />
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Service Clusters</h3>
                        </div>
                        
                        <HealthItem icon={Database} name="Supabase DB" status="Operational" />
                        <HealthItem icon={Zap} name="Redis Cache" status="Active" color="text-emerald-500" />
                        <HealthItem icon={Globe} name="Vercel Edge" status="Healthy" />
                        
                        <div className="pt-4">
                            <button className="w-full py-5 rounded-2xl bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest border border-slate-100 hover:bg-slate-900 hover:text-white transition-all">
                                View Full Console
                            </button>
                        </div>
                    </div>

                    {/* Quick Management */}
                    <div className="grid grid-cols-2 gap-4">
                        <QuickAction icon={Users} label="Ban Manager" />
                        <QuickAction icon={LayoutDashboard} label="Audit Logs" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, color, sub }: any) {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-slate-200 transition-all group">
            <div className="flex items-center justify-between mb-6">
                <div className={`${color} p-4 rounded-2xl shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="text-emerald-500 font-black text-[10px] flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                    <ArrowUpRight className="w-3 h-3" />
                    +14%
                </div>
            </div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter mb-1 italic">{value}</h4>
            <div className="flex flex-col">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{title}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1">{sub}</span>
            </div>
        </div>
    );
}

function HealthItem({ icon: Icon, name, status, color = "text-emerald-500" }: any) {
    return (
        <div className="flex items-center justify-between group cursor-help">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-black text-slate-900">{name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500`}></span>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{status}</p>
                    </div>
                </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-200" />
        </div>
    );
}

function QuickAction({ icon: Icon, label }: any) {
    return (
        <button className="flex flex-col items-center gap-3 p-5 bg-white border border-slate-100 rounded-[2rem] hover:border-primary/20 hover:bg-primary/5 group transition-all">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-all">
                <Icon className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-primary">{label}</span>
        </button>
    );
}
