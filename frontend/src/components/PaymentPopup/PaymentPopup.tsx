import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Typography,
    Zoom,
} from "@mui/material";
import { CircleX, CreditCard } from "lucide-react";
import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import generatePayload from "promptpay-qr";

interface PaymentProps {
    open: boolean;
    onClose: () => void;
    amount: number;
    onChangeFile: (files: File) => void;
}

const PaymentPopup: React.FC<PaymentProps> = ({ 
    open, 
    onClose, 
    amount,
    onChangeFile
}) => {
    const [qrCode, setqrCode] = React.useState<string>("");
    const qrSize = 256;
    const phoneNumber = "0985944576";
    const acountName = "Sci-Park";

    const [alerts, setAlerts] = useState<
        { type: "warning" | "error" | "success"; message: string }[]
    >([]);

    function handleQR() {
        setqrCode(generatePayload(phoneNumber, { amount }));
    }

    const isValidImage = (file: File) => file.type.startsWith("image/");
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!isValidImage(file)) {
            setAlerts((prev) => [
                ...prev,
                {
                    type: "warning",
                    message: "Please select a valid image file.",
                },
            ]);
            return;
        }

        onChangeFile(file);
    };

    useEffect(() => {
        handleQR();
    }, [amount]);

    return (
        <Dialog
            open={open}
            onClose={() => {
                onClose();
            }}
            slotProps={{
                paper: {
                    sx: {
                        width: "70%",
                        maxWidth: "1200px",
                    },
                },
            }}
        >
            {/* Show Alerts */}
            {/* <AlertGroup alerts={alerts} setAlerts={setAlerts} /> */}

            <DialogTitle
                sx={{
                    display: "flex",
                    gap: 1,
                    justifyContent: "space-between",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                    }}
                >
                    <CreditCard />
                    <Typography sx={{ fontWeight: 700, fontSize: 22 }}>
                        {"Payment"}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ minWidth: 350 }}>
                <Grid container size={{ xs: 12 }} spacing={2}>
                    <Grid
                        container
                        size={{ xs: 12 }}
                        sx={{ justifyContent: "center" }}
                    >
                        <QRCode value={qrCode} size={qrSize} level="M" />
                    </Grid>
                    <Grid
                        container
                        size={{ xs: 12 }}
                        sx={{ textAlign: "center" }}
                        spacing={0}
                    >
                        <Typography
                            sx={{ fontWeight: 500, width: "100%" }}
                        >
                            {`Account Name: ${acountName}`}
                        </Typography>
                        <Typography sx={{ fontWeight: 500, width: "100%" }}>
                            {`Phone Number: ${phoneNumber}`}
                        </Typography>
                        <Typography sx={{ fontWeight: 500, width: "100%" }}>
                            {`Amount: ${amount.toLocaleString("th-TH", {
                                style: "currency",
                                currency: "THB",
                            })}`}
                        </Typography>
                    </Grid>
                    <Grid
                        container
                        size={{ xs: 12 }}
                        sx={{ justifyContent: "center" }}
                    >
                        <input
                            accept="image/png, image/jpeg, image/jpg"
                            type="file"
                            multiple={false}
                            // ref={fileInputRef}
                            // hidden
                            onChange={handleFileChange}
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Zoom in={open} timeout={400}>
                    <Button
                        onClick={() => {
                            onClose();
                        }}
                        variant="outlined"
                        startIcon={<CircleX size={18} />}
                    >
                        Close
                    </Button>
                </Zoom>
            </DialogActions>
        </Dialog>
    );
};

export default PaymentPopup;
