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
    UserPackageID?: number;
    RoleID?: number;
    Role?: string;
    Password?: string;
    Profile_Image?: File;
    Token?: string;


    UserNameCombined?: string;
}
