// Cookie Manager Utility
export interface UserPreferences {
    theme: 'light' | 'dark';
    language: 'en' | 'th';
    sidebarExpanded: boolean;
    notificationsEnabled: boolean;
    autoSave: boolean;
    pageSize: number;
    lastVisitedPage?: string;
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
    theme: 'light',
    language: 'en',
    sidebarExpanded: true,
    notificationsEnabled: true,
    autoSave: true,
    pageSize: 10,
};

// Cookie options
const COOKIE_OPTIONS = {
    expires: 365, // 1 year
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
};

// Set cookie
export const setCookie = (name: string, value: string, options = {}) => {
    const opts = { ...COOKIE_OPTIONS, ...options };
    let cookieString = `${name}=${encodeURIComponent(value)}`;
    
    if (opts.expires) {
        const date = new Date();
        date.setTime(date.getTime() + (opts.expires * 24 * 60 * 60 * 1000));
        cookieString += `; expires=${date.toUTCString()}`;
    }
    
    if (opts.path) cookieString += `; path=${opts.path}`;
    if (opts.secure) cookieString += '; secure';
    if (opts.sameSite) cookieString += `; samesite=${opts.sameSite}`;
    
    document.cookie = cookieString;
};

// Get cookie
export const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
    }
    return null;
};

// Delete cookie
export const deleteCookie = (name: string) => {
    setCookie(name, '', { expires: -1 });
};

// Save user preferences
export const saveUserPreferences = (preferences: Partial<UserPreferences>) => {
    const currentPrefs = getUserPreferences();
    const updatedPrefs = { ...currentPrefs, ...preferences };
    
    setCookie('user_preferences', JSON.stringify(updatedPrefs));
    
    // Also save to localStorage as backup
    localStorage.setItem('user_preferences', JSON.stringify(updatedPrefs));
};

// Get user preferences
export const getUserPreferences = (): UserPreferences => {
    // Try cookie first
    const cookiePrefs = getCookie('user_preferences');
    if (cookiePrefs) {
        try {
            return { ...DEFAULT_PREFERENCES, ...JSON.parse(cookiePrefs) };
        } catch (error) {
            console.error('Error parsing cookie preferences:', error);
        }
    }
    
    // Fallback to localStorage
    const localPrefs = localStorage.getItem('user_preferences');
    if (localPrefs) {
        try {
            return { ...DEFAULT_PREFERENCES, ...JSON.parse(localPrefs) };
        } catch (error) {
            console.error('Error parsing localStorage preferences:', error);
        }
    }
    
    // Return defaults
    return { ...DEFAULT_PREFERENCES };
};

// Update specific preference
export const updatePreference = <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
) => {
    const prefs = getUserPreferences();
    prefs[key] = value;
    saveUserPreferences(prefs);
};

// Clear all preferences
export const clearUserPreferences = () => {
    deleteCookie('user_preferences');
    localStorage.removeItem('user_preferences');
};

// Analytics and tracking cookies
export const setAnalyticsCookie = (userId: string, sessionId: string) => {
    setCookie('user_id', userId, { expires: 30 }); // 30 days
    setCookie('session_id', sessionId, { expires: 1 }); // 1 day
};

// Get analytics data
export const getAnalyticsData = () => {
    return {
        userId: getCookie('user_id'),
        sessionId: getCookie('session_id'),
    };
};

// Remember me functionality
export const setRememberMe = (email: string, remember: boolean) => {
    if (remember) {
        setCookie('remember_email', email, { expires: 30 }); // 30 days
    } else {
        deleteCookie('remember_email');
    }
};

export const getRememberedEmail = (): string | null => {
    return getCookie('remember_email');
};

// Page visit tracking
export const trackPageVisit = (page: string) => {
    const visits = getCookie('page_visits');
    let visitHistory: string[] = [];
    
    if (visits) {
        try {
            visitHistory = JSON.parse(visits);
        } catch (error) {
            console.error('Error parsing visit history:', error);
        }
    }
    
    // Add current page to history (max 10 pages)
    visitHistory.unshift(page);
    visitHistory = visitHistory.slice(0, 10);
    
    setCookie('page_visits', JSON.stringify(visitHistory), { expires: 7 }); // 7 days
};

export const getPageVisitHistory = (): string[] => {
    const visits = getCookie('page_visits');
    if (visits) {
        try {
            return JSON.parse(visits);
        } catch (error) {
            console.error('Error parsing visit history:', error);
        }
    }
    return [];
}; 