import { RequestTypeInterface } from "./IRequestTypes";
import { RolesInterface } from "./IRoles";
import { TitlePrefix } from "./ITitlePrefix";
import { JobPositionInterface } from "./IJobPosition";

export interface UserInterface {
    ID?: number;
    EmployeeID?: string;
    CompanyName?: string;
    BusinessDetail?: string;
    FirstName?: string;
    LastName?: string;
    GenderID?: number;
    Gender?: string; // หรืออาจจะเป็น enum ถ้า Gender มีค่าคงที่
    Email?: string;
    Phone?: string;
    ProfilePath?: string;
    SignaturePath?: string;
    UserPackageID?: number;
    RoleID?: number;
    Role?: RolesInterface;
    JobPositionID?: number;
    JobPosition?: JobPositionInterface;
    Password?: string;
    Profile_Image?: File;
    Token?: string;
    IsEmployee?:    boolean;
    IsBusinessOwner?: boolean;
    RequestTypeID?: number;
    RequestType?:   RequestTypeInterface;
    PrefixID?:  number;
    Prefix?:    TitlePrefix;

    UserNameCombined?: string;
}
