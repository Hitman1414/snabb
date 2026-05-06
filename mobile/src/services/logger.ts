/**
 * App-wide logger — production-safe wrapper around console.
 *
 * In development:  logs to the Metro console as normal.
 * In production:   error-level calls also capture to Sentry so crashes and
 *                  unexpected failures are visible in the dashboard.
 *
 * Usage:
 *   import { logger } from '../services/logger';
 *   logger.info('User logged in', { userId });
 *   logger.error('Payment failed', error);
 */
import * as Sentry from '@sentry/react-native';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const shouldLog = (level: LogLevel): boolean => {
    if (__DEV__) return true;
    // In production, suppress debug/info noise but keep warn and error
    return level === 'warn' || level === 'error';
};

function formatMessage(level: LogLevel, message: string, context?: unknown): string {
    return `[${level.toUpperCase()}] ${message}`;
}

export const logger = {
    debug(message: string, context?: unknown): void {
        if (!shouldLog('debug')) return;
        console.log(formatMessage('debug', message), context ?? '');
    },

    info(message: string, context?: unknown): void {
        if (!shouldLog('info')) return;
        console.log(formatMessage('info', message), context ?? '');
        if (!__DEV__) {
            Sentry.addBreadcrumb({ message, data: context as Record<string, unknown>, level: 'info' });
        }
    },

    warn(message: string, context?: unknown): void {
        if (!shouldLog('warn')) return;
        console.warn(formatMessage('warn', message), context ?? '');
        Sentry.addBreadcrumb({ message, data: context as Record<string, unknown>, level: 'warning' });
    },

    error(message: string, error?: unknown, context?: unknown): void {
        if (!shouldLog('error')) return;
        console.error(formatMessage('error', message), error ?? '', context ?? '');

        // Capture to Sentry with full context
        if (error instanceof Error) {
            Sentry.captureException(error, {
                extra: { message, ...(context as object ?? {}) },
            });
        } else {
            Sentry.captureMessage(message, {
                level: 'error',
                extra: { error, ...(context as object ?? {}) },
            });
        }
    },
};
