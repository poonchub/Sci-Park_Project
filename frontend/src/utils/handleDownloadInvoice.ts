import { GetInvoicePDF } from "../services/http";

export const handleDownloadInvoice = async (id: number, fileName: string) => {
    try {
        // 1. โหลดไฟล์จาก server (รอตรงนี้ได้)
        const pdfBlob = await GetInvoicePDF(id);

        // 2. ให้ browser จัดการดาวน์โหลด
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        // เสร็จสิ้นในมุมมอง JavaScript
        return true;
    } catch (error) {
        console.error("Failed to download invoice PDF", error);
        return false;
    }
};
