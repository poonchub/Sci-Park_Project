import { InvoiceInterface } from "../interfaces/IInvoices";
import { PaymentInterface } from "../interfaces/IPayments";
import { UpdateInvoiceByID, UpdatePaymentByID } from "../services/http";

export const updatePaymentAndInvoice = async (
    invoiceId: number,
    paymentId: number,
    statusID: number,
    approverId?: number,
    note?: string,
    slipFile?: File
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
        formData.append("files", slipFile);
    }

    await UpdatePaymentByID(paymentId, formData);

    const invoiceData: InvoiceInterface = { StatusID: statusID };
    await UpdateInvoiceByID(invoiceId, invoiceData);
};
