// Session Manager Utility
const apiUrl = "http://localhost:8000";

// Global variables for session data
let sessionTimeoutId: NodeJS.Timeout | null = null;
let lastActivityTime = Date.now();
let isMonitoring = false;

export const handleSessionExpiration = () => {
    // Clear localStorage
    localStorage.clear();
    localStorage.setItem("isLogin", "false");
    
    // Redirect to login page
    window.location.href = "/login";
    
    // Show alert notification
    alert("Session expired. Please login again.");
};

// Function to check token in localStorage (lightweight)
export const checkTokenLocally = (token: string): { isValid: boolean; expiresAt: number | null } => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // If token is expired
        if (payload.exp && payload.exp < currentTime) {
            return { isValid: false, expiresAt: payload.exp };
        }
        
        return { isValid: true, expiresAt: payload.exp };
    } catch (error) {
        console.error("Error parsing token:", error);
        return { isValid: false, expiresAt: null };
    }
};

// Function to update last activity time
export const updateLastActivity = () => {
    lastActivityTime = Date.now();
};

// Function to check token with API
export const checkTokenWithAPI = async (userId: string | null, token: string): Promise<boolean> => {
    if (!userId) return false;

    try {
        const response = await fetch(`${apiUrl}/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return response.status !== 401;
    } catch (error) {
        console.error("Error checking token with API:", error);
        return true; // If error occurs, skip for now
    }
};

// Function to set timeout based on token expiration time
const setupTokenTimeout = (expiresAt: number) => {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = (expiresAt - currentTime) * 1000; // Convert to milliseconds

    // Clear old timeout
    if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
    }

    // Set new timeout
    sessionTimeoutId = setTimeout(() => {
        handleSessionExpiration();
    }, timeUntilExpiry);

    console.log(`Token will expire in ${Math.floor(timeUntilExpiry / 1000)} seconds`);
};

// Function to check user activity
const checkUserActivity = () => {
    const currentTime = Date.now();
    const inactiveTime = currentTime - lastActivityTime;
    // เปลี่ยนกลับเป็นค่าปกติ
    const maxInactiveTime = 30 * 60 * 1000; // 30 minutes

    console.log(`Checking activity... Inactive for ${Math.floor(inactiveTime / 1000)} seconds`);

    if (inactiveTime > maxInactiveTime) {
        console.log("User inactive for too long, logging out...");
        handleSessionExpiration();
    }
};

// Function to set up smart session monitoring
export const setupSmartSessionMonitoring = (userId: string | null) => {
    if (isMonitoring) return; // Prevent duplicate setup
    
    isMonitoring = true;
    
    const token = localStorage.getItem("token");
    if (!token || !userId) {
        handleSessionExpiration();
        return;
    }

    // Check token in localStorage
    const { isValid, expiresAt } = checkTokenLocally(token);
    
    if (!isValid) {
        handleSessionExpiration();
        return;
    }

    if (expiresAt) {
        // Set timeout based on token expiration time
        setupTokenTimeout(expiresAt);
    }

    // Set up user activity check every 2 seconds (for testing)
    const activityCheckInterval = setInterval(() => {
        checkUserActivity();
    }, 5 * 60 * 1000); // 5 minutes

    // Set up token check with API every 15 minutes (backup)
    const apiCheckInterval = setInterval(async () => {
        const currentToken = localStorage.getItem("token");
        if (currentToken) {
            const isValid = await checkTokenWithAPI(userId, currentToken);
            if (!isValid) {
                handleSessionExpiration();
            }
        }
    }, 15 * 60 * 1000); // 15 minutes

    // Add event listeners for user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
        updateLastActivity();
    };

    activityEvents.forEach(event => {
        document.addEventListener(event, handleActivity, true);
    });

    // Return cleanup function
    return () => {
        isMonitoring = false;
        if (sessionTimeoutId) {
            clearTimeout(sessionTimeoutId);
        }
        clearInterval(activityCheckInterval);
        clearInterval(apiCheckInterval);
        
        activityEvents.forEach(event => {
            document.removeEventListener(event, handleActivity, true);
        });
    };
};

// Legacy functions (for backward compatibility)
export const checkTokenValidity = async (userId: string | null) => {
    const token = localStorage.getItem("token");
    if (!token || !userId) {
        handleSessionExpiration();
        return false;
    }

    const { isValid } = checkTokenLocally(token);
    if (!isValid) {
        handleSessionExpiration();
        return false;
    }

    return await checkTokenWithAPI(userId, token);
};

export const setupSessionMonitoring = (userId: string | null) => {
    return setupSmartSessionMonitoring(userId);
}; 