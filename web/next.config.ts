import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "snabb-api.onrender.com",
                pathname: "/static/**",
            },
            {
                protocol: "https",
                hostname: "*.amazonaws.com",
                pathname: "/**",
            },
        ],
    },

    // ── Security headers ──────────────────────────────────────────────────────
    async headers() {
        // Base security headers (safe for both dev and prod)
        const securityHeaders = [
            // Prevent clickjacking
            { key: "X-Frame-Options", value: "DENY" },
            // Stop MIME-type sniffing
            { key: "X-Content-Type-Options", value: "nosniff" },
            // Referrer policy
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            // Permissions policy — disable unused browser APIs
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ];

        // Production-only headers
        if (!isDev) {
            // Force HTTPS for 1 year (only effective once on HTTPS)
            securityHeaders.push(
                { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
            );
            // Content Security Policy — only in production.
            // In dev, Next.js needs 'unsafe-eval' for HMR and connect-src must
            // include localhost, so CSP would break hydration.
            securityHeaders.push({
                key: "Content-Security-Policy",
                value: [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-inline' https://browser.sentry-cdn.com",
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                    "font-src 'self' https://fonts.gstatic.com",
                    "img-src 'self' data: blob: https://*.amazonaws.com https://snabb-api.onrender.com",
                    "connect-src 'self' https://snabb-api.onrender.com wss://snabb-api.onrender.com https://sentry.io https://*.sentry.io",
                    "frame-ancestors 'none'",
                ].join("; "),
            });
        }

        return [
            {
                source: "/(.*)",
                headers: securityHeaders,
            },
        ];
    },
};

// Sentry build-time config — uploads source maps to Sentry on production builds.
// Set SENTRY_AUTH_TOKEN in CI / Vercel env vars.
export default withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    // Silence the build output unless there's an error
    silent: !process.env.CI,
    // Upload source maps for readable stack traces
    widenClientFileUpload: true,
    // Hide source maps from the browser bundle
    hideSourceMaps: true,
    // Disable the Sentry telemetry on the build machine
    disableLogger: true,
});
