import { RoomsInterface } from "./IRooms";  
import { RoomTypeLayouts } from "./IRoomtypeLayouts";  
import { RoomTypeImagesInterface } from "./IRoomTypeImages";  
import { RoomEquipmentsInterface } from "./IRoomEquipments";  
import { RoomPriceInterface } from "./IRoomPrices";  

export interface RoomtypesInterface {
  ID?: number;
  CreatedAt?: Date;
  UpdatedAt?: Date;
  DeletedAt?: Date | null;

  TypeName?: string;
  RoomSize?: number;
  ForRental?: boolean;
  HasMultipleSizes?: boolean;
  Category?: string;
  EmployeeDiscount?: number;

  Rooms?: RoomsInterface[];
  RoomTypeLayouts?: RoomTypeLayouts[];
  RoomTypeImages?: RoomTypeImagesInterface[];
  RoomPrices?: RoomPriceInterface[];
  RoomEquipments?: RoomEquipmentsInterface[];
}
