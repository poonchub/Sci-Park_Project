import { create } from "zustand";
import { GetUnreadNotificationCountsByUserID } from "../services/http";

interface NotificationCountsInterface {
    UnreadRequests: number;
    UnreadTasks: number;
    UnreadInvoice: number;
    UnreadServiceAreaRequests: number;
    UnreadBookingRoom: number;
}

interface NotificationStore {
    notificationCounts: NotificationCountsInterface;
    setNotificationCounts: (counts: NotificationCountsInterface) => void;
    increment: (key: keyof NotificationCountsInterface) => void;
    clear: () => void;
    getNewUnreadNotificationCounts: (userId?: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    notificationCounts: { UnreadRequests: 0, UnreadTasks: 0, UnreadInvoice: 0, UnreadServiceAreaRequests: 0, UnreadBookingRoom: 0 },

    setNotificationCounts: (notificationCounts) => set({ notificationCounts }),

    increment: (key) =>
        set((state) => ({
            notificationCounts: { ...state.notificationCounts, [key]: state.notificationCounts[key] + 1 },
        })),

    clear: () => set({ notificationCounts: { UnreadRequests: 0, UnreadTasks: 0, UnreadInvoice: 0, UnreadServiceAreaRequests: 0, UnreadBookingRoom: 0 } }),

    getNewUnreadNotificationCounts: async (userId?: number) => {
        try {
            const userIdToUse = userId || Number(localStorage.getItem("userId"));
            if (!userIdToUse) return;
            
            const resCounts = await GetUnreadNotificationCountsByUserID(userIdToUse);
            if (resCounts) {
                set({ notificationCounts: resCounts });
            }
        } catch (error) {
            console.error("Error fetching new notification counts:", error);
        }
    },
}));
