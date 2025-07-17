import { UserInterface } from "./IUser";
import { NewsImagesInterface } from "./NewsImages";

export interface NewsInterface {
    ID?:        number;
    CreatedAt?: string;
    UpdatedAt?: string;
    Title?:     string;
    Summary?:   string;
    FullContent?:   string;
    DisplayStart?:      string;
    DisplayEnd?:        string;
    IsActive?:  boolean;
    IsPinned?:   boolean;

    UserID?:    number;
    User?:      UserInterface;

    NewsImages?:        NewsImagesInterface[];
}