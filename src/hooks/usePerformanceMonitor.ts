/**
 * Performance Monitoring Hook
 * Track screen render times and performance metrics
 */
import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
    screenName: string;
    renderTime: number;
    timestamp: number;
}

const performanceLog: PerformanceMetrics[] = [];

export const usePerformanceMonitor = (screenName: string) => {
    const startTime = useRef<number>(Date.now());

    useEffect(() => {
        // Track initial render time
        const renderTime = Date.now() - startTime.current;

        const metrics: PerformanceMetrics = {
            screenName,
            renderTime,
            timestamp: Date.now(),
        };

        performanceLog.push(metrics);

        // Log to console in development
        if (__DEV__) {
            console.log(`📊 Performance [${screenName}]: ${renderTime}ms`);
        }

        // Cleanup old logs (keep last 50)
        if (performanceLog.length > 50) {
            performanceLog.shift();
        }

        return () => {
            // Track unmount time if needed
            const unmountTime = Date.now() - startTime.current;
            if (__DEV__) {
                console.log(`📊 Screen lifetime [${screenName}]: ${unmountTime}ms`);
            }
        };
    }, [screenName]);

    return {
        getMetrics: () => performanceLog,
        getAverageRenderTime: () => {
            const screenMetrics = performanceLog.filter(m => m.screenName === screenName);
            if (screenMetrics.length === 0) return 0;
            const total = screenMetrics.reduce((sum, m) => sum + m.renderTime, 0);
            return total / screenMetrics.length;
        },
    };
};
