export interface ServiceAreaFormData {
  PurposeOfUsingSpace: string;
  NumberOfEmployees: number;
  ActivitiesInBuilding: string;
  SupportingActivitiesForSciencePark: string;
  ServiceRequestDocument?: File;
  CorporateRegistrationNumber: string;
  BusinessGroupID: number | null;
  CompanySizeID: number | null;
  MainServices: string;
  RegisteredCapital: number;
  HiringRate: number;
  ResearchInvestmentValue: number;
  ThreeYearGrowthForecast: string;
}
