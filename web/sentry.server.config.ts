/**
 * Sentry server-side / edge configuration.
 * Loaded automatically by @sentry/nextjs on the Node.js runtime.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === 'production',
});
