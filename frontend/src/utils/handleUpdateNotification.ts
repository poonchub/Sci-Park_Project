import { NotificationsInterface } from "../interfaces/INotifications";
import {
    GetNotificationsByInvoiceAndUser,
    GetNotificationsByRequestAndUser,
    GetNotificationsByTaskAndUser,
    UpdateNotificationByID,
} from "../services/http";

export const handleUpdateNotification = async (
    user_id: number,
    IsRead: boolean,
    request_id?: number,
    task_id?: number,
    invoiceId?: number
): Promise<void> => {
    try {
        let resNotification: any = null;

        // กรณี request
        if (request_id && request_id !== 0) {
            resNotification = await GetNotificationsByRequestAndUser(request_id, user_id);
        }
        // กรณี task
        else if (task_id && task_id !== 0) {
            resNotification = await GetNotificationsByTaskAndUser(task_id, user_id);
        }
        // กรณี invoice
        else if (invoiceId && invoiceId !== 0) {
            resNotification = await GetNotificationsByInvoiceAndUser(invoiceId, user_id);
        }

        if (!resNotification || resNotification.error) {
            console.error("❌ Error fetching notification.");
            return;
        }

        const notificationData: NotificationsInterface = { IsRead: IsRead };
        const notificationID = resNotification.data.ID;

        await UpdateNotificationByID(notificationData, notificationID);

        console.log("✅ Notification updated successfully.");
        
    } catch (error) {
        console.error("❌ Error updating notification:", error);
    }
};