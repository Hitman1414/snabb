/**
 * Sentry browser-side configuration.
 * This file is loaded automatically by @sentry/nextjs on the client.
 * Set NEXT_PUBLIC_SENTRY_DSN in .env.local (dev) or Vercel/Render env vars (prod).
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Capture 10 % of page loads as performance traces — tune per plan.
    tracesSampleRate: 0.1,

    // Only send events in production builds.
    enabled: process.env.NODE_ENV === 'production',

    // Ignore noisy browser extensions / bots.
    ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
    ],
});
