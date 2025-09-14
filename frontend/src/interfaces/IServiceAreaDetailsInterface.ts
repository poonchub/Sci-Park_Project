export interface ServiceAreaDetailsInterface {
    RequestNo: number;
    UserID: number;
    RequestedAt: string;
    RequestStatusId: number;
    CompanyName: string;
    DescriptionCompany: string;
    PurposeOfUsingSpace: string;
    ActivitiesInBuilding: string;
    SupportingActivitiesForSciencePark: string;
    ServiceRequestDocument: string;
    CollaborationPlans: any[];
    CorporateRegistrationNumber?: string;
    BusinessGroupName?: string;
    CompanySizeName?: string;
    MainServices?: string;
    RegisteredCapital?: number;
    HiringRate?: number;
    ResearchInvestmentValue?: number;
    ThreeYearGrowthForecast?: string;
    ApproverUserName?: string;
    ApprovalNote?: string;
    TaskUserName?: string;
    TaskNote?: string;
    ServiceAreaDocumentId?: number;
    // New Service Area Document fields
    ServiceContractDocument?: string;
    AreaHandoverDocument?: string;
    QuotationDocument?: string;
    RefundGuaranteeDocument?: string;
    ContractNumber?: string;
    FinalContractNumber?: string;
    ContractStartAt?: string;
    ContractEndAt?: string;
    RoomNumber?: string;
    ServiceUserTypeID?: number;
    ServiceUserTypeName?: string;
    BusinessGroupID?: number; // Added BusinessGroupID
    // Cancellation Details
    CancellationDetails?: {
        ID: number;
        RequestServiceAreaID: number;
        UserID: number;
        PurposeOfCancellation: string;
        ProjectActivities: string;
        AnnualIncome: number;
        CancellationDocument: string;
        BankAccountDocument: string;
        CreatedAt: string;
        UpdatedAt: string;
        CancellationRequesterName: string;
        CancellationRequesterEmail: string;
    } | null;
}
