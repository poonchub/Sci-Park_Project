import React from "react";
import { Dialog } from "@mui/material";
import InvoicePDF from "../InvoicePDF/InvoicePDF";

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
            <InvoicePDF invoice={invoice ?? {}} />
        </Dialog>
    );
};

export default PDFPopup;