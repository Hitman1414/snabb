import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2">
          {/* Logo Placeholder */}
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">Snabb</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-text-secondary hover:text-primary transition-colors font-medium">Features</Link>
          <Link href="#how-it-works" className="text-text-secondary hover:text-primary transition-colors font-medium">How it Works</Link>
          <Link href="#pro" className="text-text-secondary hover:text-primary transition-colors font-medium">Become a Pro</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden md:block text-text-secondary hover:text-foreground font-medium">
            Log in
          </Link>
          <Link
            href="/app"
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            Open Web App
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pt-20 pb-32 md:pt-32 md:pb-40 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          {/* Background Decorative Blob */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-primary-light/30 rounded-full blur-3xl -z-10 opacity-50 dark:opacity-10 pointer-events-none" />

          <div className="flex-1 space-y-8 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-light/50 text-primary-dark font-medium text-sm border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Now available on the web
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Get things done, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">
                faster than ever.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto md:mx-0 leading-relaxed">
              Connect with skilled professionals in your area instantly. From home repairs to tutoring, Snabb gets you the help you need, right when you need it.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-4">
              <Link
                href="/app"
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Get Started
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
              <Link
                href="#download"
                className="w-full sm:w-auto bg-surface hover:bg-surface-variant text-foreground border border-border px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                Download App
              </Link>
            </div>

            <div className="pt-8 flex items-center justify-center md:justify-start gap-8 border-t border-border mt-12">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-foreground">10k+</span>
                <span className="text-sm text-text-tertiary">Active Users</span>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-foreground">4.9/5</span>
                <span className="text-sm text-text-tertiary">Average Rating</span>
              </div>
            </div>
          </div>

          <div className="flex-1 relative w-full max-w-lg md:max-w-none">
            {/* Abstract UI Representation instead of an actual image to ensure it looks good immediately */}
            <div className="relative aspect-[4/5] md:aspect-square w-full bg-gradient-to-tr from-surface-variant to-surface rounded-3xl border border-border shadow-2xl overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-grid-slate-200/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-800/[0.04] dark:bg-bottom" style={{ maskImage: 'linear-gradient(to bottom, transparent, black)' }} />

              {/* Mock App UI Elements */}
              <div className="relative z-10 w-[85%] h-[80%] bg-background rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col">
                <div className="h-16 border-b border-border flex items-center px-4 justify-between bg-surface/50 backdrop-blur-sm">
                  <div className="w-32 h-6 bg-surface-variant rounded-full animate-pulse" />
                  <div className="w-8 h-8 bg-primary/20 rounded-full" />
                </div>
                <div className="p-4 space-y-4 flex-1 bg-background-secondary">
                  <div className="w-full h-32 bg-surface rounded-xl border border-border shadow-sm p-4 space-y-3">
                    <div className="w-1/3 h-5 bg-surface-variant rounded-md" />
                    <div className="w-full h-4 bg-surface-variant rounded-md" />
                    <div className="w-5/6 h-4 bg-surface-variant rounded-md" />
                  </div>
                  <div className="w-full h-32 bg-surface rounded-xl border border-border shadow-sm p-4 space-y-3">
                    <div className="w-1/4 h-5 bg-surface-variant rounded-md" />
                    <div className="w-full h-4 bg-surface-variant rounded-md" />
                    <div className="w-4/6 h-4 bg-surface-variant rounded-md" />
                  </div>
                  <div className="w-full h-32 bg-surface rounded-xl border border-border shadow-sm p-4 space-y-3 opacity-50">
                    <div className="w-1/2 h-5 bg-surface-variant rounded-md" />
                    <div className="w-full h-4 bg-surface-variant rounded-md" />
                  </div>
                </div>
              </div>

              {/* Floating Element */}
              <div className="absolute top-1/4 -right-6 md:-right-12 bg-surface p-4 rounded-xl shadow-lg border border-border z-20 flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-10 h-10 bg-success-light text-success rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Task Completed</div>
                  <div className="text-xs text-text-tertiary">Just now</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-background-secondary border-y border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-primary font-semibold tracking-wide uppercase text-sm">Why Snabb?</h2>
              <h3 className="text-3xl md:text-5xl font-bold text-foreground">Everything you need, <br />nothing you don&apos;t.</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'Lightning Fast', desc: 'Post an ask and get responses from available professionals within minutes, not days.', icon: '⚡' },
                { title: 'Verified Pros', desc: 'Every service provider is vetted and reviewed by the community to ensure high quality.', icon: '🛡️' },
                { title: 'Seamless Payments', desc: 'Pay securely through the app once the job is done to your satisfaction.', icon: '💳' }
              ].map((feature, i) => (
                <div key={i} className="bg-surface p-8 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-6">{feature.icon}</div>
                  <h4 className="text-xl font-bold text-foreground mb-3">{feature.title}</h4>
                  <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-bold text-foreground">Snabb</span>
            <span className="text-text-tertiary text-sm ml-4">© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-text-secondary hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="text-sm text-text-secondary hover:text-primary">Terms of Service</Link>
            <Link href="/contact" className="text-sm text-text-secondary hover:text-primary">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
