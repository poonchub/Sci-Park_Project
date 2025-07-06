import { MaintenanceRequestsInterface } from "./IMaintenanceRequests";
import { RequestStatusesInterface } from "./IRequestStatuses";
import { UserInterface } from "./IUser";

export interface InspectionsInterface {
    ID?:        number;
    CreatedAt?:  string;
    Note?:   string;
    UserID?:        number;
    User?:          UserInterface;
    RequestID?:     number;
    MaintenanceRequest?:    MaintenanceRequestsInterface;
    RequestStatusID?:   number;
    RequestStatus?:     RequestStatusesInterface;
}