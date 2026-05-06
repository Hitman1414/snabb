"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";

const footerLinks = {
    product: {
        title: "Product",
        links: [
            { label: "How it Works", href: "/how-it-works" },
            { label: "Features", href: "/#features" },
            { label: "Become a Pro", href: "/pro" },
            { label: "Pricing", href: "/pricing" },
            { label: "Download App", href: "/download" },
        ],
    },
    company: {
        title: "Company",
        links: [
            { label: "About Us", href: "/about" },
            { label: "Blog", href: "/blog" },
            { label: "Careers", href: "/careers" },
            { label: "Press Kit", href: "/press" },
            { label: "Contact Us", href: "/contact" },
        ],
    },
    support: {
        title: "Support",
        links: [
            { label: "Help Center", href: "/help" },
            { label: "Safety Guidelines", href: "/safety" },
            { label: "Report an Issue", href: "/report" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
        ],
    },
};

const socialLinks = [
    {
        label: "Twitter / X",
        href: "https://twitter.com/snabbapp",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    {
        label: "Instagram",
        href: "https://instagram.com/snabbapp",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
        ),
    },
    {
        label: "LinkedIn",
        href: "https://linkedin.com/company/snabb",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        ),
    },
];

export default function Footer() {
    return (
        <footer className="bg-[#0F172A] text-white">
            {/* Main footer content */}
            <div className="max-w-7xl mx-auto px-6 pt-20 pb-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand column */}
                    <div className="space-y-6">
                        <Logo className="h-14 w-auto" />
                        <p className="text-slate-400 leading-relaxed max-w-xs text-sm font-medium">
                            Ask. Serve. Earn. Connect with skilled professionals in your area and get help instantly.
                        </p>

                        {/* App Store Badges */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <a
                                href="/download"
                                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 transition-all group"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white flex-shrink-0">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide leading-none">Download on the</p>
                                    <p className="text-sm font-bold text-white leading-tight">App Store</p>
                                </div>
                            </a>
                            <a
                                href="/download"
                                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 transition-all group"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white flex-shrink-0">
                                    <path d="M3.18 23.76A1 1 0 012 22.87V1.13a1 1 0 011.18-.89l11.45 11.45-11.45 11.07zM21.37 10.6l-2.56-1.47L15.96 12l2.85 2.87 2.56-1.47a1.38 1.38 0 000-2.8zm-18.7 11.5L16.5 12 2.67 1.9v19.2z" />
                                </svg>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide leading-none">Get it on</p>
                                    <p className="text-sm font-bold text-white leading-tight">Google Play</p>
                                </div>
                            </a>
                        </div>

                        {/* Social links */}
                        <div className="flex gap-3 pt-2">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 flex items-center justify-center text-slate-400 hover:text-primary transition-all"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {Object.values(footerLinks).map((section) => (
                        <div key={section.title} className="space-y-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                                {section.title}
                            </h3>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-slate-400 hover:text-white font-medium transition-colors hover:translate-x-1 inline-block"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Newsletter bar */}
                <div className="mt-16 p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="text-base font-bold text-white mb-1">Stay in the loop</h4>
                        <p className="text-sm text-slate-400 font-medium">Get product updates, tips and community highlights.</p>
                    </div>
                    <form className="flex gap-3 w-full md:w-auto" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            className="flex-1 md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium"
                        />
                        <button
                            type="submit"
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 whitespace-nowrap"
                        >
                            Subscribe
                        </button>
                    </form>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-500 font-medium">
                        © 2026 Snabb Technologies Pvt. Ltd. All rights reserved.
                    </p>
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                        <Link href="/privacy" className="text-slate-500 hover:text-slate-300 font-medium transition-colors">Privacy</Link>
                        <Link href="/terms" className="text-slate-500 hover:text-slate-300 font-medium transition-colors">Terms</Link>
                        <Link href="/cookies" className="text-slate-500 hover:text-slate-300 font-medium transition-colors">Cookies</Link>
                        <span className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            All systems operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
