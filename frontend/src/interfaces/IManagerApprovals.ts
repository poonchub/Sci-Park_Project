import { UserInterface } from "./IUser";

export interface ManagerApprovalsInterface {
    ID?:            number;
    CreatedAt?:     string;
    UpdatedAt?:     string;
    Note?:   string;
    UserID?:        number;
    User?:          UserInterface;
    RequestID?:     number;
    RequestStatusID?:   number;
}