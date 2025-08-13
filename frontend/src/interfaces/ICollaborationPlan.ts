export interface CollaborationPlanInterface {
  ID: number;
  RequestServiceAreaID: number;
  CollaborationPlan: string;
  CollaborationBudget: number;
  ProjectStartDate: string;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt?: string;
}

export interface CollaborationPlanData {
  plan: string;
  budget: number;
  startDate: string;
}
