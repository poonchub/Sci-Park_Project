import { BookingRoomsInterface } from "./IBookingRooms"
import { PaymentStatusInterface } from "./IPaymentStatuses"
import { UserInterface } from "./IUser"

export interface PaymentInterface {
    ID?:            number
    PaymentDate?:   string
    Amount?:        number
    SlipPath?:      string
    Note?:          string
    UserID?:        number
    
    PayerID?:       number
    Payer?:         UserInterface
    ApproverID?:    number
    Approver?:      UserInterface
    BookingRoomID?: number
    BookingRoom?:   BookingRoomsInterface
    StatusID?:      number
    Status?:        PaymentStatusInterface
}