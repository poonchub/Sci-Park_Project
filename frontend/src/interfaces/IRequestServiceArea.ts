import { RequestStatusesInterface } from './IRequestStatuses';
import { UserInterface } from './IUser';

export interface RequestServiceAreaInterface {
  ID: number;
  UserID: number;
  User?: UserInterface;
  RequestStatusID: number;
  RequestStatus?: RequestStatusesInterface;
  PurposeOfUsingSpace: string;
  NumberOfEmployees: number;
  ActivitiesInBuilding: string;
  CollaborationPlan: string;
  CollaborationBudget: number; // float64 equivalent in TS
  ProjectStartDate: string; // time.Time equivalent in TS
  ProjectEndDate: string; // time.Time equivalent in TS
  SupportingActivitiesForSciencePark: string;
  ServiceRequestDocument?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
}

// New interface for the API response format
export interface RequestServiceAreaListInterface {
  ID: number; // now required
  UserID: number;
  CompanyName: string;
  UserNameCombined: string;
  CreatedAt: string;
  StatusID: number;
  BusinessGroupID: number | null;
} 