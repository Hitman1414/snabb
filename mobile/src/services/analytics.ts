/**
 * Analytics Service
 * Mock service for tracking user events
 */
type EventName =
    | 'app_open'
    | 'login'
    | 'logout'
    | 'view_ask'
    | 'create_ask'
    | 'submit_response'
    | 'search_asks'
    | 'filter_asks';

class AnalyticsService {
    private static instance: AnalyticsService;
    private isInitialized = false;

    private constructor() { }

    static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    init() {
        if (this.isInitialized) return;
        console.log('[Analytics] Initialized');
        this.isInitialized = true;
        this.track('app_open');
    }

    track(event: EventName, properties?: Record<string, any>) {
        if (!this.isInitialized) this.init();

        // In a real app, this would send data to Mixpanel/Firebase/Segment
        console.log(`[Analytics] Track: ${event}`, properties || '');
    }

    identify(userId: string, traits?: Record<string, any>) {
        console.log(`[Analytics] Identify: ${userId}`, traits || '');
    }

    reset() {
        console.log('[Analytics] Reset');
    }
}

export const analytics = AnalyticsService.getInstance();
