export default function AppDashboard() {
    return (
        <div className="min-h-screen bg-background-secondary p-6">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 mt-8">
                <aside className="w-full lg:w-64 bg-surface rounded-2xl p-4 shadow-sm border border-border h-fit lg:h-[calc(100vh-8rem)] lg:sticky top-24">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-8 text-white font-bold text-xl ml-4">
                        S
                    </div>
                    <nav className="space-y-2">
                        <a href="#" className="flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary-dark rounded-xl font-medium">
                            <span>🏠</span> Home
                        </a>
                        <a href="#" className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:bg-surface-variant rounded-xl font-medium transition-colors">
                            <span>📋</span> My Asks
                        </a>
                        <a href="#" className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:bg-surface-variant rounded-xl font-medium transition-colors">
                            <span>💬</span> Messages
                        </a>
                        <a href="#" className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:bg-surface-variant rounded-xl font-medium transition-colors">
                            <span>👤</span> Profile
                        </a>
                    </nav>
                </aside>

                <main className="flex-1 space-y-6">
                    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground mb-1">Welcome to Snabb Web</h1>
                            <p className="text-text-secondary">Explore services, post asks, and connect with professionals.</p>
                        </div>
                        <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-md">
                            Create Ask
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border h-48 flex flex-col justify-center items-center border-dashed border-2 bg-surface-variant">
                            <span className="text-text-tertiary">Feature coming soon</span>
                        </div>
                        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border h-48 flex flex-col justify-center items-center border-dashed border-2 bg-surface-variant">
                            <span className="text-text-tertiary">Feature coming soon</span>
                        </div>
                        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border h-48 flex flex-col justify-center items-center border-dashed border-2 bg-surface-variant">
                            <span className="text-text-tertiary">Feature coming soon</span>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
