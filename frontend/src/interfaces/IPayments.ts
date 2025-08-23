import { BookingRoomsInterface } from "./IBookingRooms"
import { InvoiceInterface } from "./IInvoices"
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
    InvoiceID?:     number
    Invoice?:       InvoiceInterface
    StatusID?:      number
    Status?:        PaymentStatusInterface
}