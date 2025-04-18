import { MaintenanceRequestsInterface } from "./IMaintenanceRequests";
import { RequestStatusesInterface } from "./IRequestStatuses";
import { UserInterface } from "./IUser";

export interface MaintenanceTasksInterface {
    ID?:    number;
    CreatedAt?: string;
    UpdateAt?:  string;
    Description?:   string;
    UserID?:    number;
    User?:      UserInterface;
    RequestID?: number;
    MaintenanceRequest?: MaintenanceRequestsInterface;
    RequestStatusID?:   number;
    RequestStatus?: RequestStatusesInterface;
}