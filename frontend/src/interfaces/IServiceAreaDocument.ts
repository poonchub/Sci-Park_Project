import { RequestServiceAreaInterface } from './IRequestServiceArea';
import { RoomsInterface } from './IRooms';
import { ServiceUserTypeInterface } from './IServiceUserType';

export interface ServiceAreaDocumentInterface {
  ID: number;
  RequestServiceAreaID: number;
  RequestServiceArea?: RequestServiceAreaInterface;
  ServiceContractDocument?: string; // file path
  AreaHandoverDocument?: string; // file path
  QuotationDocument?: string; // file path
  RoomID?: number;
  Room?: RoomsInterface;
  ServiceUserTypeID?: number;
  ServiceUserType?: ServiceUserTypeInterface;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
} 