import {
    Box,
    Button,
    Card,
    CardMedia,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    Typography,
    Zoom,
} from "@mui/material";
import { CircleAlert, CircleX, CreditCard, Landmark, ReceiptText, Wallet } from "lucide-react";
import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import generatePayload from "promptpay-qr";
import { PaymentInterface } from "../../interfaces/IPayments";
import { apiUrl } from "../../services/http";
import { paymentStatusConfig } from "../../constants/paymentStatusConfig";
import { faImage, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dateFormat from "../../utils/dateFormat";
import { Close } from "@mui/icons-material";
import ImageUploader from "../ImageUploader/ImageUploader";
import AlertGroup from "../AlertGroup/AlertGroup";

interface PaymentProps {
    open: boolean;
    onClose: () => void;
    file: File[];
    onChangeFile: (files: File[]) => void;
    paymentData?: PaymentInterface;
    isButtonActive?: boolean;
}

const PaymentPopup: React.FC<PaymentProps> = ({ open, onClose, file, onChangeFile, paymentData, isButtonActive }) => {
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);

    const accountNumber = "662-1-84151-5";
    const accountName = "RSP นครราชสีมา โดย เทคโนธานี";
    const bankName = "Krungthai Bank";

    const statusName = paymentData?.Status?.Name;
    const statusKey = paymentData?.Status?.Name as keyof typeof paymentStatusConfig;
    const { color, colorLite, icon } = paymentStatusConfig[statusKey] ?? {
        color: "#000",
        colorLite: "#000",
        icon: faQuestionCircle,
    };

    return (
        <Dialog
            open={open}
            onClose={() => {
                onClose();
            }}
            slotProps={{
                paper: {
                    sx: {
                        width: { xs: "90%", sm: "70%", md: "50%", lg: "40%" },
                        maxWidth: "1200px",
                        minWidth: "0px",
                    },
                },
            }}
        >
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

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
                        color: "primary.main",
                    }}
                >
                    <Wallet />
                    <Typography sx={{ fontWeight: 700, fontSize: 22 }}>Payment</Typography>
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            position: "absolute",
                            right: 8,
                            top: 8,
                        }}
                    >
                        <Close />
                    </IconButton>
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
                    <Grid size={{ xs: 12 }}>
                        <Card sx={{ py: 2, px: 3, display: "flex", flexDirection: "column", gap: 1.4 }}>
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <Landmark size={18} />
                                <Typography sx={{ fontWeight: 500 }}>Bank Transfer Details</Typography>
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    height: "100%",
                                    alignItems: "center",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontWeight: 500,
                                        fontSize: 14,
                                        color: "text.secondary",
                                    }}
                                >
                                    Bank Name
                                </Typography>
                                <Typography
                                    sx={{
                                        fontWeight: 500,
                                        fontSize: 14,
                                        color: "text.main",
                                    }}
                                >
                                    {bankName}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    height: "100%",
                                    alignItems: "center",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontWeight: 500,
                                        fontSize: 14,
                                        color: "text.secondary",
                                    }}
                                >
                                    Account Name
                                </Typography>
                                <Typography
                                    sx={{
                                        fontWeight: 500,
                                        fontSize: 14,
                                        color: "text.main",
                                    }}
                                >
                                    {accountName}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    height: "100%",
                                    alignItems: "center",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontWeight: 500,
                                        fontSize: 14,
                                        color: "text.secondary",
                                    }}
                                >
                                    Account Number
                                </Typography>
                                <Typography
                                    sx={{
                                        fontWeight: 500,
                                        fontSize: 14,
                                        color: "text.main",
                                    }}
                                >
                                    {accountNumber}
                                </Typography>
                            </Box>
                        </Card>
                    </Grid>

                    {paymentData?.SlipPath && (
                        <Grid container size={{ xs: 12 }} spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <Card sx={{ py: 2, px: 3, display: "flex", flexDirection: "column", gap: 1.4 }}>
                                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                        <ReceiptText size={18} />
                                        <Typography sx={{ fontWeight: 500 }}>Payment Details</Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            height: "100%",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontWeight: 500,
                                                fontSize: 14,
                                                color: "text.secondary",
                                            }}
                                        >
                                            Status
                                        </Typography>
                                        <Box
                                            sx={{
                                                bgcolor: colorLite,
                                                borderRadius: 10,
                                                px: 2.5,
                                                py: 0.5,
                                                gap: 1,
                                                color: color,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                display: "inline-flex",
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
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            height: "100%",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontWeight: 500,
                                                fontSize: 14,
                                                color: "text.secondary",
                                            }}
                                        >
                                            Date
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontWeight: 500,
                                                fontSize: 14,
                                                color: "text.main",
                                            }}
                                        >
                                            {dateFormat(paymentData.PaymentDate ?? "")}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            height: "100%",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontWeight: 500,
                                                fontSize: 14,
                                                color: "text.secondary",
                                            }}
                                        >
                                            Amount
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontWeight: 500,
                                                fontSize: 14,
                                                color: "text.main",
                                            }}
                                        >
                                            {paymentData.Amount?.toLocaleString("th-TH", {
                                                style: "currency",
                                                currency: "THB",
                                            })}
                                        </Typography>
                                    </Box>
                                    {statusName === "Rejected" && (
                                        <>
                                            <Divider />
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    height: "100%",
                                                    flexDirection: "column",
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: 14,
                                                        color: "error.main",
                                                        fontWeight: 500,
                                                        display: "flex",
                                                        gap: 0.5,
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <CircleAlert size={14} />
                                                    The slip is invalid. Please upload a new one.
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        fontSize: 13,
                                                        color: "error.main",
                                                        pl: "18px",
                                                    }}
                                                >
                                                    {`Note : ${paymentData.Note}`}
                                                </Typography>
                                            </Box>
                                        </>
                                    )}
                                </Card>
                            </Grid>

                            {statusName !== "Rejected" && (
                                <Grid
                                    size={{ xs: 12 }}
                                    container
                                    sx={{
                                        display: "flex",
                                        justifyContent: "center",
                                        py: 2.5,
                                        px: 2,
                                        borderRadius: 2,
                                        border: "1px solid #2c55b0",
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        image={
                                            paymentData?.SlipPath
                                                ? `${apiUrl}/${paymentData?.SlipPath}`
                                                : "https://placehold.co/300x420"
                                        }
                                        sx={{
                                            width: { xs: 250, lg: 300 },
                                            height: "auto",
                                            borderRadius: 2,
                                            cursor: "pointer",
                                        }}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    )}

                    {(!paymentData?.SlipPath || statusName === "Rejected") && (
                        <Grid size={{ xs: 12 }}>
                            <Card sx={{ py: 2, px: 3, display: "flex", flexDirection: "column", gap: 1.4 }}>
                                <Box display={"flex"}>
                                    <Typography variant="body1" className="title-field">
                                        Upload Payment Slip
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            ml: 0.5,
                                            color: "gray",
                                        }}
                                    >
                                        (maximum 1 file)
                                    </Typography>
                                </Box>

                                <ImageUploader
                                    value={file}
                                    onChange={onChangeFile}
                                    setAlerts={setAlerts}
                                    maxFiles={1}
                                    buttonText="Upload Payment Slip"
                                />

                                <Zoom in={isButtonActive} timeout={400} unmountOnExit>
                                    <Box sx={{ display: "flex", justifyContent: "end", mt: 1 }}>
                                        <Box sx={{ display: "flex", gap: 0.8, fontSize: 14, alignItems: "center" }}>
                                            <CircularProgress size={18} />
                                            Uploading...
                                        </Box>
                                    </Box>
                                </Zoom>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentPopup;
