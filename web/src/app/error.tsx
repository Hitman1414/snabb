'use client';

/**
 * Root error boundary for the Next.js app router.
 * Catches any unhandled error thrown during rendering and shows a recovery UI.
 * Also reports the error to Sentry automatically via the instrumentation hook.
 */
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        // Capture to Sentry (no-op when DSN is unset)
        Sentry.captureException(error);
    }, [error]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'sans-serif',
            backgroundColor: '#f9fafb',
        }}>
            <svg width="64" height="64" fill="none" stroke="#ef4444" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: '1.5rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>
                Something went wrong
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '2rem', textAlign: 'center', maxWidth: '360px' }}>
                An unexpected error occurred. Our team has been notified. Please try again.
            </p>
            <button
                onClick={reset}
                style={{
                    backgroundColor: '#6d28d9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '0.75rem 2rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                Try again
            </button>
        </div>
    );
}
