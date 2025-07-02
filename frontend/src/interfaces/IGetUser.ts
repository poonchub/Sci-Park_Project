import { RequestTypeInterface } from "./IRequestTypes";



export interface GetUserInterface {
    ID?: number;
    EmployeeID?: string;
    CompanyName?: string;
    BusinessDetail?: string;
    FirstName?: string;
    LastName?: string;
    Gender? :{
        name:string;
    }
    Email?: string;
    Phone?: string;
    ProfilePath?: string;
    UserPackageID?: number;
    RoleID?: number;
    Role?: {
        name:string;
    };
    Password?: string;
    Profile_Image?: File;
    Token?: string;
    IsEmployee?:    boolean;
    RequestTypeID?: number;
    RequestType?:   RequestTypeInterface;
    UserPackages?:string;

    UserNameCombined?: string;
}
