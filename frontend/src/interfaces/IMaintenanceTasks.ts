import { UserInterface } from "./IUser";

export interface MaintenanceTasksInterface {
    ID?:    number;
    CreatedAt?: string;
    Description?:   string;
    UserID?:    number;
    User?:      UserInterface;
    RequestID?: number;
    RequestStatusID?:   number;
}