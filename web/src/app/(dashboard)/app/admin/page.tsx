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
    ArrowRight,
    BadgeCheck,
    X,
    UserCheck,
    IdCard
} from "lucide-react";
import { API_URL, getFullImageUrl } from "@/lib/api";
import { format } from "date-fns";

type PendingPro = {
    id: number;
    username: string;
    email: string;
    pro_category: string;
    pro_bio: string;
    id_card_url: string | null;
    created_at: string;
};

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

type ModerationLog = {
    username: string;
    email: string;
    content_type: string;
    content_text: string;
    platform: 'browser' | 'mobile' | string;
    flagged_reason: string;
};

export default function AdminPortal() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'system' | 'pro-approvals'>('system');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [modLogs, setModLogs] = useState<ModerationLog[]>([]);
    const [pendingPros, setPendingPros] = useState<PendingPro[]>([]);
    const [proActionLoading, setProActionLoading] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPendingPros = async () => {
        try {
            const res = await fetch(`${API_URL}/users/pending-pros`, { credentials: "include", 
                            });
            if (res.ok) {
                const data = await res.json();
                setPendingPros(data);
            }
        } catch (err) {
            console.error('Failed to fetch pending pros', err);
        }
    };

    const handleProAction = async (userId: number, action: 'approve' | 'reject') => {
        setProActionLoading(userId);
        try {
            const res = await fetch(`${API_URL}/users/${userId}/${action}-pro`, { credentials: "include", 
                method: 'POST',
                            });
            if (res.ok) {
                setPendingPros(prev => prev.filter(p => p.id !== userId));
            }
        } catch (err) {
            console.error(`Failed to ${action} pro`, err);
        } finally {
            setProActionLoading(null);
        }
    };

    const fetchStats = async () => {
        // Audit #4: send token via Authorization header, NEVER as ?token=...
        // Query-string tokens leak into server logs, browser history, and
        // Referer headers — Authorization headers don't.

        const authHeaders = {};

        try {
            const res = await fetch(`${API_URL}/admin/stats`, { credentials: "include",  });
            if (res.status === 401) {
                router.push('/login');
                return;
            }
            if (res.status === 403) {
                router.push('/app');
                return;
            }
            if (!res.ok) {
                console.error('Admin stats fetch failed', res.status);
                return;
            }

            const data = await res.json();
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

            // Fetch Moderation Logs with the same auth header.
            const modRes = await fetch(`${API_URL}/admin/moderation-logs`, { credentials: "include",  });
            if (modRes.ok) {
                const modData = await modRes.json();
                setModLogs(modData.logs || []);
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
        fetchPendingPros();
        const interval = setInterval(fetchStats, 10000); // Auto refresh every 10s
        return () => clearInterval(interval);
    }, []);

    if (loading || !stats) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
                <div className="w-12 h-12 border-4 border-slate-900 dark:border-white border-t-transparent dark:border-t-transparent rounded-full animate-spin"></div>
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
                        <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2 rounded-xl">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic">Control Center</h1>
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Live System Monitoring • {format(new Date(stats.server_time), "MMM d, HH:mm:ss")}
                    </p>
                </div>
                <button 
                    onClick={() => { setRefreshing(true); fetchStats(); }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-4 rounded-2xl flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-black text-xs uppercase tracking-widest shadow-sm active:scale-95 disabled:opacity-50 text-slate-900 dark:text-white"
                    disabled={refreshing}
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh Engine
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-2xl p-2 border border-slate-100 dark:border-slate-700 self-start w-fit shadow-sm">
                <button
                    onClick={() => setActiveTab('system')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'system'
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                >
                    <Server className="w-4 h-4" />
                    System
                </button>
                <button
                    onClick={() => { setActiveTab('pro-approvals'); fetchPendingPros(); }}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'pro-approvals'
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                >
                    <UserCheck className="w-4 h-4" />
                    Pro Approvals
                    {pendingPros.length > 0 && (
                        <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                            {pendingPros.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Pro Approvals Tab */}
            {activeTab === 'pro-approvals' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Pending Pro Applications</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {pendingPros.length} application{pendingPros.length !== 1 ? 's' : ''} awaiting review
                            </p>
                        </div>
                        <button
                            onClick={fetchPendingPros}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-black text-xs uppercase tracking-widest shadow-sm text-slate-900 dark:text-white"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Refresh
                        </button>
                    </div>

                    {pendingPros.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-20 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                <BadgeCheck className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">All Clear!</h3>
                            <p className="text-slate-400 font-bold text-sm">No pending Pro applications to review.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {pendingPros.map((pro) => (
                                <div key={pro.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-500/20 dark:to-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 font-black text-xl">
                                                {pro.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white">{pro.username}</p>
                                                <p className="text-xs text-slate-400 font-bold">{pro.email}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black text-[9px] uppercase tracking-widest border border-orange-100 dark:border-orange-500/20">
                                            Pending
                                        </span>
                                    </div>

                                    {/* Category */}
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Category</p>
                                        <p className="font-black text-slate-900 dark:text-white text-sm">{pro.pro_category}</p>
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Professional Bio</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{pro.pro_bio}</p>
                                    </div>

                                    {/* ID Document */}
                                    {pro.id_card_url ? (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                                                <IdCard className="w-3.5 h-3.5" /> ID Document
                                            </p>
                                            <a
                                                href={getFullImageUrl(pro.id_card_url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full h-40 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-600 hover:opacity-80 transition-opacity"
                                            >
                                                <img
                                                    src={getFullImageUrl(pro.id_card_url)}
                                                    alt="ID Document"
                                                    className="w-full h-full object-cover"
                                                />
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-4 flex items-center gap-3 border border-amber-100 dark:border-amber-500/20">
                                            <IdCard className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">No ID document uploaded</p>
                                        </div>
                                    )}

                                    {/* Applied date */}
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Applied {format(new Date(pro.created_at), "MMM d, yyyy")}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <button
                                            onClick={() => handleProAction(pro.id, 'reject')}
                                            disabled={proActionLoading === pro.id}
                                            className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-red-200 dark:border-red-500/30 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-40 active:scale-95"
                                        >
                                            <X className="w-4 h-4" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleProAction(pro.id, 'approve')}
                                            disabled={proActionLoading === pro.id}
                                            className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 active:scale-95"
                                        >
                                            <BadgeCheck className="w-4 h-4" />
                                            {proActionLoading === pro.id ? 'Processing...' : 'Approve'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && <>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Total Marketplace Asks" 
                    value={db.total_asks} 
                    icon={FileText} 
                    color="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    sub="Lifetime requests"
                />
                <MetricCard 
                    title="Registered Users" 
                    value={db.total_users} 
                    icon={Users} 
                    color="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    sub="Verified accounts"
                />
                <MetricCard 
                    title="API Total Traffic" 
                    value={monitoring.total_requests} 
                    icon={Activity} 
                    color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    sub="Requests handled"
                />
                <MetricCard 
                    title="Engine Latency" 
                    value={`${monitoring.avg_latency_ms}ms`} 
                    icon={Zap} 
                    color="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    sub="Avg response time"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Analytics: Usage & Traffic (Left 8/12) */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Platform Analysis Chart */}
                    <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Platform Utilization</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Browser vs Mobile Usage Share</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-slate-900 dark:bg-slate-100 rounded-full"></div>
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
                                    <h4 className="text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter">{browserPercent}%</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{browserUsage} Web Users</p>
                                </div>
                                <div className="h-20 w-[1px] bg-slate-100 dark:bg-slate-700 mx-10 hidden md:block"></div>
                                <div className="text-center">
                                    <h4 className="text-5xl font-black text-primary italic tracking-tighter">{mobilePercent}%</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{mobileUsage} App Users</p>
                                </div>
                            </div>

                            {/* Custom Progress Bar Chart */}
                            <div className="h-16 w-full bg-slate-50 dark:bg-slate-900/50 rounded-[1.5rem] overflow-hidden flex shadow-inner border border-slate-100 dark:border-slate-700 p-2">
                                <div 
                                    style={{ width: `${browserPercent}%` }} 
                                    className="h-full bg-slate-900 dark:bg-slate-100 rounded-xl transition-all duration-1000 flex items-center justify-center relative group"
                                >
                                    <Globe className="w-5 h-5 text-white/20 dark:text-slate-900/20 group-hover:text-white/50 dark:group-hover:text-slate-900/50 transition-colors" />
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
                    <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Database className="w-5 h-5 text-slate-400" />
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Real-time Traffic Log</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 20 Requests</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-8 py-4">Method</th>
                                        <th className="px-8 py-4">Endpoint</th>
                                        <th className="px-8 py-4">Platform</th>
                                        <th className="px-8 py-4">Status</th>
                                        <th className="px-8 py-4 text-right">Latency</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                    {monitoring.recent_traffic.map((req, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors text-slate-900 dark:text-slate-100">
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-lg font-black text-[9px] uppercase border ${
                                                    req.method === 'GET' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' :
                                                    req.method === 'POST' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                                                    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                                                }`}>
                                                    {req.method}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-300 truncate max-w-xs">{req.path}</td>
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

                    {/* Moderation Logs */}
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-[3rem] shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden mt-10">
                        <div className="p-8 border-b border-red-100 dark:border-red-900/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="w-5 h-5 text-red-500" />
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Flagged Content Logs</h3>
                            </div>
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Active Moderation</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-red-100/50 dark:bg-red-900/20 text-[10px] font-black uppercase tracking-widest text-red-500 border-b border-red-100 dark:border-red-900/30">
                                    <tr>
                                        <th className="px-8 py-4">Offender</th>
                                        <th className="px-8 py-4">Content Type</th>
                                        <th className="px-8 py-4">Flagged Text</th>
                                        <th className="px-8 py-4">Platform</th>
                                        <th className="px-8 py-4">Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-red-100/50 dark:divide-red-900/20">
                                    {modLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-10 text-center text-red-400 font-bold text-sm">
                                                No flagged content found. Platform is safe!
                                            </td>
                                        </tr>
                                    ) : modLogs.map((log, i) => (
                                        <tr key={i} className="hover:bg-red-100/30 dark:hover:bg-red-900/10 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-bold text-slate-900 dark:text-white">{log.username}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase">{log.email}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1 rounded-lg font-black text-[9px] uppercase bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                                                    {log.content_type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-sm text-slate-600 dark:text-slate-300 italic max-w-xs truncate">
                                                &quot;{log.content_text}&quot;
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    {log.platform === 'mobile' ? <Smartphone className="w-3.5 h-3.5 text-primary" /> : <Globe className="w-3.5 h-3.5 text-blue-500" />}
                                                    <span className="text-[10px] font-black uppercase text-slate-500">{log.platform}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-2 py-1 rounded-md font-black text-[10px] text-red-600 bg-red-100 uppercase tracking-widest">
                                                    {log.flagged_reason}
                                                </span>
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
                    <div className="bg-slate-900 dark:bg-slate-800 rounded-[3rem] p-10 text-white shadow-xl shadow-slate-900/20 dark:shadow-none active:scale-[0.99] transition-transform border border-transparent dark:border-slate-700">
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
                    <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 shadow-sm border border-slate-100 dark:border-slate-700 space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700 pb-6">
                            <Server className="w-5 h-5 text-slate-400" />
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Service Clusters</h3>
                        </div>
                        
                        <HealthItem icon={Database} name="Supabase DB" status="Operational" />
                        <HealthItem icon={Zap} name="Redis Cache" status="Active" color="text-emerald-500" />
                        <HealthItem icon={Globe} name="Vercel Edge" status="Healthy" />
                        
                        <div className="pt-4">
                            <button className="w-full py-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest border border-slate-100 dark:border-slate-700 hover:bg-slate-900 dark:hover:bg-slate-700 hover:text-white transition-all">
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
        </>}
    </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MetricCard({ title, value, icon: Icon, color, sub }: any) {
    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-all group">
            <div className="flex items-center justify-between mb-6">
                <div className={`${color} p-4 rounded-2xl shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="text-emerald-500 dark:text-emerald-400 font-black text-[10px] flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <ArrowUpRight className="w-3 h-3" />
                    +14%
                </div>
            </div>
            <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-1 italic">{value}</h4>
            <div className="flex flex-col">
                <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{title}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1">{sub}</span>
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HealthItem({ icon: Icon, name, status, color = "text-emerald-500 dark:text-emerald-400" }: any) {
    return (
        <div className="flex items-center justify-between group cursor-help">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500`}></span>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{status}</p>
                    </div>
                </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-200 dark:text-slate-600" />
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function QuickAction({ icon: Icon, label }: any) {
    return (
        <button className="flex flex-col items-center gap-3 p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] hover:border-primary/20 dark:hover:border-primary/50 hover:bg-primary/5 group transition-all">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-all">
                <Icon className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-primary">{label}</span>
        </button>
    );
}
