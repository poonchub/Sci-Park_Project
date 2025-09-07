import React from "react";
import { Dialog } from "@mui/material";
import RoomBookingInvoicePDF from "../InvoicePDF/RoomBookingInvoicePDF";

interface PDFPopupProps {
    open: boolean;
    invoice: any;
    onClose: () => void;
}

const PDFPopup: React.FC<PDFPopupProps> = ({ open, invoice, onClose }) => {
    return (
        <Dialog
            open={open && invoice?.ID != 0}
            onClose={onClose}
            maxWidth={false}
            sx={{
                "& .MuiDialog-paper": {
                    maxWidth: "70vw",
                    width: "auto",
                    margin: 0,
                    borderRadius: 0,
                },
            }}
        >
            <RoomBookingInvoicePDF invoice={invoice ?? {}} />
        </Dialog>
    );
};

export default PDFPopup;