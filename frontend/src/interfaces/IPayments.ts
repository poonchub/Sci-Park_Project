import { BookingRoomsInterface } from "./IBookingRooms"
import { RentalRoomInvoiceInterface } from "./IRentalRoomInvoices"
import { PaymentStatusInterface } from "./IPaymentStatuses"
import { UserInterface } from "./IUser"

export interface PaymentInterface {
    ID?:            number
    PaymentDate?:   string
    Amount?:        number
    SlipPath?:      string
    Note?:          string
    ReceiptPath?:   string;
    
    PayerID?:       number
    Payer?:         UserInterface
    ApproverID?:    number
    Approver?:      UserInterface
    BookingRoomID?: number
    BookingRoom?:   BookingRoomsInterface
    RentalRoomInvoiceID?:     number
    RentalRoomInvoice?:       RentalRoomInvoiceInterface
    StatusID?:      number
    Status?:        PaymentStatusInterface
}