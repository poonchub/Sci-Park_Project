import { BusinessGroupInterface } from './IBusinessGroup';
import { CompanySizeInterface } from './ICompanySize';

export interface AboutCompanyInterface {
  ID: number;
  UserID: number;
  CorporateRegistrationNumber: string;
  BusinessGroupID?: number;
  BusinessGroup?: BusinessGroupInterface;
  CompanySizeID?: number;
  CompanySize?: CompanySizeInterface;
  MainServices: string;
  RegisteredCapital: number;
  HiringRate: number;
  ResearchInvestmentValue: number;
  ThreeYearGrowthForecast: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
} 