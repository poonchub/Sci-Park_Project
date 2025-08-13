import { GetInvoicePDF } from "../services/http";

export const handleDownloadInvoice = async (id: number) => {
    try {
        const pdfBlob = await GetInvoicePDF(id);

        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to download invoice PDF", error);
    }
};
