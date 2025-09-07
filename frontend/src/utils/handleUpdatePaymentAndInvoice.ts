import { RentalRoomInvoiceInterface } from "../interfaces/IRentalRoomInvoices";
import { PaymentInterface } from "../interfaces/IPayments";
import { UpdateInvoiceByID, UpdatePaymentByID } from "../services/http";

export const handleUpdatePaymentAndInvoice = async (
    invoiceId: number,
    paymentId: number,
    statusID: number,
    approverId?: number,
    note?: string,
    slipFile?: File,
    receiptFile?: File
) => {
    const paymentData: PaymentInterface = {
        StatusID: statusID,
        Note: note,
        ApproverID: approverId,
    };

    const formData = new FormData();
    for (const [key, value] of Object.entries(paymentData)) {
        if (value !== undefined && value !== null) {
            formData.append(key, value);
        }
    }

    if (slipFile) {
        formData.append("slip", slipFile);
    }

    if (receiptFile) {
        formData.append("receipt", receiptFile);
    }

    await UpdatePaymentByID(paymentId, formData);

    const invoiceData: RentalRoomInvoiceInterface = { StatusID: statusID };
    await UpdateInvoiceByID(invoiceId, invoiceData);
};
