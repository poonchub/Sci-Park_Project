import { HandoverImagesInterface } from "./IHandoverImages";
import { MaintenanceRequestsInterface } from "./IMaintenanceRequests";
import { RequestStatusesInterface } from "./IRequestStatuses";
import { UserInterface } from "./IUser";

export interface MaintenanceTasksInterface {
    ID?:    number;
    CreatedAt?: string;
    UpdatedAt?:  string;
    Description?:   string;
    UserID?:    number;
    User?:      UserInterface;
    RequestID?: number;
    MaintenanceRequest?: MaintenanceRequestsInterface;
    RequestStatusID?:   number;
    RequestStatus?: RequestStatusesInterface;
    HandoverImages?: HandoverImagesInterface[];
}