import { UserInterface } from "./IUser";

export interface ManagerApprovalsInterface {
    ID?:            number;
    CreatedAt?:     string;
    Description?:   string;
    UserID?:        number;
    User?:          UserInterface;
    RequestID?:     number;
    RequestStatusID?:   number;
}