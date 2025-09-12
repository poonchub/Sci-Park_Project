import { NotificationsInterface } from "../interfaces/INotifications";
import {
    GetNotificationsByInvoiceAndUser,
    GetNotificationsByRequestAndUser,
    GetNotificationsByTaskAndUser,
    UpdateNotificationByID,
    UpdateNotificationsByServiceAreaRequestID,
    UpdateNotificationsByServiceAreaTaskID,
} from "../services/http";

export const handleUpdateNotification = async (
    user_id: number,
    IsRead: boolean,
    request_id?: number,
    task_id?: number,
    invoiceId?: number,
    service_area_request_id?: number,
    service_area_task_id?: number
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
        // กรณี service area request
        else if (service_area_request_id && service_area_request_id !== 0) {
            // สำหรับ Service Area เราใช้ bulk update แทน
            const notificationData: NotificationsInterface = { IsRead: IsRead };
            await UpdateNotificationsByServiceAreaRequestID(notificationData, service_area_request_id);
            console.log("✅ Service Area notification updated successfully.");
            return;
        }
        // กรณี service area task
        else if (service_area_task_id && service_area_task_id !== 0) {
            // สำหรับ Service Area Task เราใช้ bulk update แทน
            const notificationData: NotificationsInterface = { IsRead: IsRead };
            await UpdateNotificationsByServiceAreaTaskID(notificationData, service_area_task_id);
            console.log("✅ Service Area Task notification updated successfully.");
            return;
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