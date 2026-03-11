import Link from "next/link";

export default function Login() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-lg border border-border">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-primary mx-auto rounded-xl flex items-center justify-center mb-4 text-white font-bold text-2xl">
                        S
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
                    <p className="text-text-secondary mt-2">Log in to your Snabb account</p>
                </div>

                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Email or Phone</label>
                        <input type="text" className="w-full bg-surface-variant border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Enter your email or phone" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                        <input type="password" className="w-full bg-surface-variant border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Enter your password" />
                    </div>

                    <button type="button" className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl shadow mt-6 transition-colors">
                        Sign In
                    </button>
                </form>

                <div className="text-center mt-6 text-sm text-text-secondary">
                    Don&apos;t have an account? <Link href="#" className="text-primary hover:underline">Sign up</Link>
                </div>
            </div>
        </div>
    );
}
