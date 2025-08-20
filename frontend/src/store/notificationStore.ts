import { create } from "zustand";

interface NotificationCountsInterface {
    UnreadRequests: number;
    UnreadTasks: number;
    UnreadInvoice: number;
}

interface NotificationStore {
    notificationCounts: NotificationCountsInterface;
    setNotificationCounts: (counts: NotificationCountsInterface) => void;
    increment: (key: keyof NotificationCountsInterface) => void;
    clear: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
    notificationCounts: { UnreadRequests: 0, UnreadTasks: 0, UnreadInvoice: 0 },

    setNotificationCounts: (notificationCounts) => set({ notificationCounts }),

    increment: (key) =>
        set((state) => ({
            notificationCounts: { ...state.notificationCounts, [key]: state.notificationCounts[key] + 1 },
        })),

    clear: () => set({ notificationCounts: { UnreadRequests: 0, UnreadTasks: 0, UnreadInvoice: 0 } }),
}));
