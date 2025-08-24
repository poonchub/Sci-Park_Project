import { getSystemAnalytics, getDashboardAnalytics, trackPageVisit, getVisitsRange, getPopularPagesByPeriod, getPerformanceAnalytics } from './http';

// Interfaces for analytics data
export interface AnalyticsData {
    today_visits: number;
    week_visits: number;
    month_visits: number;
    popular_pages_today: PageAnalyticsData[];
    active_users_today: UserAnalyticsSummaryData[];
}

export interface SystemAnalyticsData {
    system_analytics: {
        total_users: number;
        active_users: number;
        total_visits: number;
        total_pages: number;
        average_session: number;
        peak_hour: number;
        peak_day: string;
    };
    total_users: number;
    total_visits: number;
    total_pages: number;
    popular_pages: PageAnalyticsData[];
    active_users: UserAnalyticsSummaryData[];
}

export interface PageAnalyticsData {
    page_path: string;
    page_name: string;
    total_visits: number;
    unique_visitors: number;
    average_duration: number;
    bounce_rate: number;
}

export interface UserAnalyticsSummaryData {
    user_id: number;
    total_visits: number;
    unique_pages: number;
    total_duration: number;
    last_visit: string;
    most_visited_page: string;
    average_duration: number;
    bounce_rate: number;
    returning_rate: number;
}

export interface PopularPagesByPeriodData {
    period: string;
    total_visits: number;
    data: Array<{
        name: string;
        visits: number;
        color: string;
        icon: string;
    }>;
}

export interface PerformanceAnalyticsData {
    page_performance: Array<{
        page_path: string;
        page_name: string;
        total_visits: number;
        unique_visitors: number;
        average_duration: number;
        engagement_score: number;
    }>;
    time_slots: Array<{
        slot: string;
        visits: number;
    }>;
    session_duration_distribution: Array<{
        range: string;
        count: number;
        percentage: number;
    }>;
    peak_hour: { hour: number; visits: number };
    peak_day: { day: string; visits: number };
    date_range: { start: string; end: string };
}

export interface TrackPageVisitData {
    user_id: number;
    page_path: string;
    page_name: string;
    duration?: number;
    is_bounce?: boolean;
    is_returning?: boolean;
    interaction_count?: number; // เพิ่ม interaction_count
}

// Key pages configuration - Track specific pages
export const KEY_PAGES = {
    HOME: '/',
    BOOKING_ROOM: '/booking-room',
    CREATE_MAINTENANCE_REQUEST: '/create-maintenance-request',
    MY_ACCOUNT: '/my-account',
    NEWS: '/news',
    CREATE_SERVICE_AREA: '/create-service-area-request',
} as const;

export type KeyPagePath = typeof KEY_PAGES[keyof typeof KEY_PAGES];

class AnalyticsService {
    /**
     * Get dashboard analytics data
     */
    async getDashboardAnalytics(): Promise<AnalyticsData | null> {
        try {
            const response = await getDashboardAnalytics();
            if (response) {
                return response;
            }
            return null;
        } catch (error) {
            console.error('Error fetching dashboard analytics:', error);
            return null;
        }
    }

    /**
     * Get system analytics data
     */
    async getSystemAnalytics(): Promise<SystemAnalyticsData | null> {
        try {
            const response = await getSystemAnalytics();
            if (response) {
                return response;
            }
            return null;
        } catch (error) {
            console.error('Error fetching system analytics:', error);
            return null;
        }
    }

    /**
     * Track a page visit
     */
    async trackPageVisit(data: TrackPageVisitData): Promise<boolean> {
        try {
            const response = await trackPageVisit(data);
            return response !== false;
        } catch (error) {
            console.error('Error tracking page visit:', error);
            return false;
        }
    }

    /**
     * Track a key page visit with default data
     */
    async trackKeyPageVisit(pagePath: KeyPagePath, pageName: string, interaction_count?: number): Promise<boolean> {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            console.warn('No user ID found for analytics tracking');
            return false;
        }

        const userIdNum = parseInt(userId);
        if (isNaN(userIdNum) || userIdNum <= 0) {
            console.warn('Invalid user ID for analytics tracking:', userId);
            return false;
        }

        const trackData: TrackPageVisitData = {
            user_id: userIdNum,
            page_path: pagePath,
            page_name: pageName,
            duration: 0, // Will be updated when user leaves the page
            is_bounce: false,
            is_returning: this.isReturningUser(),
            interaction_count: interaction_count ?? 0,
        };

        try {
            const result = await this.trackPageVisit(trackData);
            if (result) {
                // Mark user as returning for future visits
                this.markUserAsReturning();
            }
            return result;
        } catch (error) {
            console.error('Error tracking page visit:', error);
            return false;
        }
    }

    /**
     * Get total visits per day in a date range
     */
    async getVisitsRange(start: string, end: string): Promise<Array<{date: string, total_visits: number}> | null> {
        try {
            const response = await getVisitsRange(start, end);
            if (response) {
                return response;
            }
            return null;
        } catch (error) {
            console.error('Error fetching visits range:', error);
            return null;
        }
    }

    /**
     * Get popular pages by period (today, week, month, year)
     */
    async getPopularPagesByPeriod(period: string): Promise<PopularPagesByPeriodData | null> {
        try {
            const response = await getPopularPagesByPeriod(period);
            if (response) {
                return response;
            }
            return null;
        } catch (error) {
            console.error('Error fetching popular pages by period:', error);
            return null;
        }
    }

    /**
     * Get performance analytics for a date range
     */
    async getPerformanceAnalytics(start: string, end: string): Promise<PerformanceAnalyticsData | null> {
        try {
            const response = await getPerformanceAnalytics(start, end);
            if (response) {
                return response;
            }
            return null;
        } catch (error) {
            console.error('Error fetching performance analytics:', error);
            return null;
        }
    }

    /**
     * Check if user is returning
     */
    private isReturningUser(): boolean {
        return localStorage.getItem('returning_user') === 'true';
    }

    /**
     * Mark user as returning
     */
    markUserAsReturning(): void {
        localStorage.setItem('returning_user', 'true');
    }

    /**
     * Update page visit duration (deprecated - use trackPageVisit with duration instead)
     */
    updatePageVisitDuration(duration: number): void {
        console.warn('updatePageVisitDuration is deprecated. Use trackPageVisit with duration parameter instead.');
    }
}

// Export a singleton instance
export const analyticsService = new AnalyticsService(); 