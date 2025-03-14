export interface MaintenanceRequestsInterface {
    ID?:            number;
    Description?:   string;
    StartTime?:     string;
    EndTime?:       string;
    UserID?:        number;
    RoomID?:        number;
    RequestStatusID?:   number;
    AreaID?:        number;
    MaintenanceTypeID?: number;
}