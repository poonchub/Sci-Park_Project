import {
    Box,
    Button,
    CardMedia,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Typography,
    Zoom,
} from "@mui/material";
import { CircleX, CreditCard, Wallet } from "lucide-react";
import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import generatePayload from "promptpay-qr";
import { PaymentInterface } from "../../interfaces/IPayments";
import { apiUrl } from "../../services/http";
import { paymentStatusConfig } from "../../constants/paymentStatusConfig";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface PaymentProps {
    open: boolean;
    onClose: () => void;
    amount: number;
    onChangeFile: (files: File) => void;
    paymentData?: PaymentInterface;
}

const PaymentPopup: React.FC<PaymentProps> = ({ open, onClose, amount, onChangeFile, paymentData }) => {
    const [qrCode, setqrCode] = React.useState<string>("");
    const qrSize = 256;
    const phoneNumber = "0985944576";
    const acountName = "Sci-Park";

    const statusName = paymentData?.Status?.Name;
    const statusKey = paymentData?.Status?.Name as keyof typeof paymentStatusConfig;
    const { color, colorLite, icon } = paymentStatusConfig[statusKey] ?? {
        color: "#000",
        colorLite: "#000",
        icon: faQuestionCircle,
    };

    function handleQR() {
        setqrCode(generatePayload(phoneNumber, { amount }));
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
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
                    <Wallet />
                    <Typography sx={{ fontWeight: 700, fontSize: 22 }}>{"Payment"}</Typography>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ minWidth: 350 }}>
                <Grid
                    container
                    size={{ xs: 12 }}
                    columnSpacing={3}
                    rowSpacing={2}
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    <Grid
                        container
                        size={{ xs: 6 }}
                        spacing={2}
                        sx={{
                            bgcolor: "rgba(74, 127, 240, 0.2)",
                            py: 2.5,
                            px: 2,
                            borderRadius: 2,
                            justifyContent: 'center'
                        }}
                        direction={"column"}
                    >
                        <Grid container size={{ xs: 12 }} sx={{ justifyContent: "center" }}>
                            <Box sx={{ p: 1, bgcolor: "#FFF", borderRadius: 1 }}>
                                <QRCode value={qrCode} size={qrSize} level="M" />
                            </Box>
                        </Grid>
                        <Grid container size={{ xs: 12 }} sx={{ textAlign: "center" }} spacing={0}>
                            <Typography sx={{ fontWeight: 500, width: "100%" }}>
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
                        <Grid container size={{ xs: 12 }} sx={{ justifyContent: "center" }}>
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

                    {paymentData?.SlipPath && (
                        <Grid
                            container
                            size={{ xs: 6 }}
                            spacing={2}
                            sx={{
                                py: 2.5,
                                px: 2,
                                borderRadius: 2,
                                border: '1px solid #2c55b0'
                            }}
                            direction={"column"}
                        >
                            <Grid
                                size={{ xs: 12 }}
                                container
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    image={`${apiUrl}/${paymentData?.SlipPath}`}
                                    sx={{
                                        width: { xs: 150, sm: 200, md: 200, md1000: 250, lg: 300 },
                                        height: "auto",
                                        borderRadius: 2,
                                        cursor: "pointer",
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Box
                                    sx={{
                                        display: "inline-flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        height: "100%",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            bgcolor: colorLite,
                                            borderRadius: 10,
                                            px: 2.5,
                                            py: 0.5,
                                            display: "flex",
                                            gap: 1,
                                            color: color,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "100%",
                                        }}
                                    >
                                        <FontAwesomeIcon icon={icon} />
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {statusName}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    )}
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
