"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Plus, LayoutDashboard, FileText, MessageCircle, User as UserIcon, Heart, Search, MapPin, ShieldAlert, Moon, Sun, Bell } from "lucide-react";
import CreateAskModal from "@/components/CreateAskModal";
import SearchOverlay from "@/components/SearchOverlay";
import OnboardingTour from "@/components/OnboardingTour";
import { useDashboard } from "@/hooks/useDashboard";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const {
        user,
        loading,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isSearchOpen,
        setIsSearchOpen,
        searchMode,
        isDark,
        toggleTheme,
        userLocation,
        isFetchingLocation,
        unreadNotifications,
        unreadMessages,
        handleAskCreated
    } = useDashboard();

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent flex rounded-full animate-spin"></div>
            </div>
        );
    }

    const navItems = [
        { name: 'Home', href: '/app', icon: LayoutDashboard },
        { name: 'My Asks', href: '/app/my-asks', icon: FileText },
        { name: 'Interested', href: '/app/interested', icon: Heart },
        { name: 'Messages', href: '/app/messages', icon: MessageCircle },
        { name: 'Profile', href: '/app/profile', icon: UserIcon },
    ];

    if (user?.is_admin) {
        navItems.push({ name: 'Admin', href: '/app/admin', icon: ShieldAlert });
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 pb-12 transition-colors">
            {/* Top Navigation Bar */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-colors">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-20 flex items-center gap-3 sm:gap-8 overflow-hidden">
                    {/* Logo & Location */}
                    <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
                        <Link href="/app" className="flex items-center gap-2 group">
                            <Logo className="h-8 sm:h-12 w-auto group-hover:scale-105 transition-transform" />
                        </Link>
                        
                        <button className="hidden lg:flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Delivering to</p>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 leading-none">
                                    {isFetchingLocation ? "Locating..." : userLocation} <span className="text-[8px]">▼</span>
                                </p>
                            </div>
                        </button>
                    </div>

                    {/* Search Bar - Now triggers Magical Overlay */}
                    <div 
                        id="tour-search"
                        onClick={() => setIsSearchOpen(true)}
                        className="flex-1 max-w-2xl relative group cursor-pointer"
                    >
                        <Search className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors" />
                        <div className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 sm:py-4 pl-10 sm:pl-14 pr-2 sm:pr-6 text-[10px] sm:text-sm font-bold text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:border-primary/20 transition-all flex items-center justify-between">
                            <span className="hidden sm:inline">Search for &quot;plumbing&quot;, &quot;delivery&quot; or &quot;cleaning&quot;</span>
                            <span className="sm:hidden">Search...</span>
                            <div className="hidden sm:flex items-center gap-1 text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg text-slate-300 dark:text-slate-400 font-black shadow-sm">
                                <span className="text-[8px]">CTRL</span> K
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <button 
                            id="tour-create-ask"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-primary hover:bg-primary-dark text-white px-3 py-2 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl font-black transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2 text-xs sm:text-sm active:scale-95"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3px]" />
                            <span className="hidden xl:inline">Post an Ask</span>
                        </button>
                        
                        <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-800 hidden sm:block"></div>

                        <button 
                            onClick={toggleTheme}
                            className="hidden sm:flex w-12 h-12 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl items-center justify-center text-slate-500 transition-all group"
                        >
                            {isDark ? <Sun className="w-5 h-5 group-hover:scale-110 transition-transform text-slate-200" /> : <Moon className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                        </button>

                        <Link href="/app/messages" className="hidden sm:flex w-12 h-12 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl items-center justify-center text-slate-500 transition-all relative group">
                            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform dark:text-slate-200" />
                            {unreadMessages > 0 && (
                                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                            )}
                        </Link>

                        <Link href="/app/notifications" className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-500 transition-all relative group">
                            <Bell className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform dark:text-slate-200" />
                            {unreadNotifications > 0 && (
                                <span className="absolute top-1 sm:top-2 right-1 sm:right-2 w-3 sm:w-4 h-3 sm:h-4 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full text-white text-[8px] font-black flex items-center justify-center">
                                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                </span>
                            )}
                        </Link>

                        <Link href="/app/profile" className="flex items-center gap-3 sm:pl-2 group">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-gradient-to-tr from-slate-100 dark:from-slate-800 to-slate-200 dark:to-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-black transition-all group-hover:border-primary/30 shadow-sm">
                                {user?.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden lg:block text-left">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Welcome back</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{user?.username}</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Secondary Nav Bar */}
                <nav className="border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-x-auto no-scrollbar transition-colors">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-6 sm:gap-10">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link 
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 text-[11px] sm:text-[13px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] h-full border-b-[3px] transition-all whitespace-nowrap px-1 group ${
                                        isActive 
                                        ? 'border-primary text-primary' 
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    <item.icon className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:scale-110 ${isActive ? 'stroke-[3px]' : 'stroke-[2px]'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </header>

            {/* Main Content Area */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mt-6 sm:mt-10">
                <main className="w-full">
                    {children}
                </main>
            </div>

            <OnboardingTour />

            <CreateAskModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={handleAskCreated}
            />

            <SearchOverlay 
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                initialMode={searchMode}
            />
        </div>
    );
}
