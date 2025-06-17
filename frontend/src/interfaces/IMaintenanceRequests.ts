import { AreasInterface } from "./IAreas";
import { InspectionsInterface } from "./IInspections";
import { MaintenaceImagesInterface } from "./IMaintenaceImages";
import { MaintenanceTasksInterface } from "./IMaintenanceTasks";
import { MaintenanceTypesInteface } from "./IMaintenanceTypes";
import { ManagerApprovalsInterface } from "./IManagerApprovals";
import { NotificationsInterface } from "./INotifications";
import { RequestStatusesInterface } from "./IRequestStatuses";
import { RoomsInterface } from "./IRooms";
import { UserInterface } from "./IUser";

export interface MaintenanceRequestsInterface {
    ID?:            number;
    CreatedAt?:     string;
    UpdatedAt?:     string;
    AreaDetail?:    string;
    IsAnytimeAvailable?:    boolean;
    Description?:   string;
    StartTime?:     string;
    EndTime?:       string;
    OtherTypeDetail?:   string;
    UserID?:        number;
    User?:          UserInterface;
    RoomID?:        number;
    Room?:          RoomsInterface;
    RequestStatusID?:   number;
    RequestStatus?: RequestStatusesInterface;
    AreaID?:        number;
    Area?:          AreasInterface;
    MaintenanceTypeID?: number;
    MaintenanceType?:   MaintenanceTypesInteface;

    ManagerApproval?:   ManagerApprovalsInterface;
    MaintenanceTask?:   MaintenanceTasksInterface;
    Inspection?:        InspectionsInterface;
    MaintenanceImages?:  MaintenaceImagesInterface[];
    Notification?:     NotificationsInterface;
}