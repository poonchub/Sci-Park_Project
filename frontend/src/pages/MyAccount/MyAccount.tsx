import {
    apiUrl,
    CheckSlip,
    CreatePayment,
    DeleteMaintenanceRequestByID,
    GetInvoiceByID,
    GetInvoiceByOption,
    GetMaintenanceRequestByID,
    GetMaintenanceRequestsForUser,
    GetPaymentByOption,
    GetQuota,
    GetRequestStatuses,
    ListPaymentStatus,
    socketUrl,
    UpdateInvoiceByID,
    UpdateMaintenanceRequestByID,
    UpdateNotificationsByRequestID,
} from "../../services/http";

import React, { useState, useEffect } from "react";
import {
    Button,
    Typography,
    Avatar,
    Grid,
    Box,
    Card,
    Divider,
    useTheme,
    Container,
    Tabs,
    Tab,
    Skeleton,
    Tooltip,
    useMediaQuery,
    Badge,
} from "@mui/material";
import "../AddUser/AddUserForm.css"; // Import the updated CSS
import { GetUserById } from "../../services/http";

import { analyticsService, KEY_PAGES } from "../../services/analyticsService";
import { useInteractionTracker } from "../../hooks/useInteractionTracker";
import {
    X,
    HelpCircle,
    Clock,
    Check,
    Eye,
    Pencil,
    FileText,
    FileText as FilePdf,
    Mail,
    Phone,
    Briefcase,
    Calendar,
    ShieldUser,
    Wallet,
    ReceiptText,
    Repeat,
    HandCoins,
    File,
} from "lucide-react";
import { a11yProps } from "../AcceptWork/AcceptWork";
import CustomTabPanel from "../../components/CustomTabPanel/CustomTabPanel";
import FilterSection from "../../components/FilterSection/FilterSection";
import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";
import dayjs from "dayjs";
import { GridColDef } from "@mui/x-data-grid";
import { statusConfig } from "../../constants/statusConfig";
import dateFormat from "../../utils/dateFormat";
import { maintenanceTypeConfig } from "../../constants/maintenanceTypeConfig";
import timeFormat from "../../utils/timeFormat";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";
import { Base64 } from "js-base64";
import { Link, useNavigate } from "react-router-dom";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import { NotificationsInterface } from "../../interfaces/INotifications";
import handleActionInspection from "../../utils/handleActionInspection";
import ReworkPopup from "../../components/ReworkPopup/ReworkPopup";
import { io } from "socket.io-client";
import { UserInterface } from "../../interfaces/IUser";
import { InvoiceInterface } from "../../interfaces/IInvoices";
import { roomStatusConfig } from "../../constants/roomStatusConfig";
import { formatToMonthYear } from "../../utils/formatToMonthYear";
import { paymentStatusConfig } from "../../constants/paymentStatusConfig";
import PaymentPopup from "../../components/PaymentPopup/PaymentPopup";
import { PaymentStatusInterface } from "../../interfaces/IPaymentStatuses";
import PDFPopup from "../../components/PDFPopup/PDFPopup";
// import { generateInvoicePDF } from "../../utils/generateInvoicePDF";
import "./MyAccount.css"
import { useNotificationStore } from "../../store/notificationStore";
import AnimatedBell from "../../components/AnimatedIcons/AnimatedBell";
import { handleUpdateNotification } from "../../utils/handleUpdateNotification";
import { convertPathsToFiles } from "../../utils/convertPathsToFiles";
import { handleUpdatePaymentAndInvoice } from "../../utils/handleUpdatePaymentAndInvoice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { PaymentInterface } from "../../interfaces/IPayments";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import { isAdmin, isManager } from "../../routes";


const MyAccount: React.FC = () => {
    const theme = useTheme();
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [user, setUser] = useState<UserInterface | null>();
    const [invoices, setInvoices] = useState<InvoiceInterface[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInterface | null>();
    const [valueTab, setValueTab] = useState(0);
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([]);
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequestsInterface>({});
    const [slipfile, setSlipFile] = useState<File[]>([]);
    const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatusInterface[]>([]);
    const [payments, setPayments] = useState<PaymentInterface[]>([])

    const [statusCounts, setStatusCounts] = useState<Record<string, number>>();
    const [searchText, setSearchText] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>([0]);
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);

    const [invoicePage, setInvoicePage] = useState(0);
    const [invoiceLimit, setInvoiceLimit] = useState(10);
    const [invoiceTotal, setInvoiceTotal] = useState(0);

    const [paymentPage, setPaymentPage] = useState(0);
    const [paymentLimit, setPaymentLimit] = useState(10);
    const [paymentTotal, setPaymentTotal] = useState(0);

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isLoadingInvoice, setIsLoadingInvoice] = useState<boolean>(true);
    const [isLoadingPayment, setIsLoadingPayment] = useState<boolean>(true);

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
    const [isButtonActive, setIsButtonActive] = useState(false);

    const [openConfirmInspection, setOpenConfirmInspection] = useState<boolean>(false);
    const [openConfirmRework, setOpenConfirmRework] = useState<boolean>(false);
    const [openConfirmCancelled, setOpenConfirmCancelled] = useState<boolean>(false);
    const [openPopupPayment, setOpenPopupPayment] = useState(false);
    const [openPDF, setOpenPDF] = useState(false);

    const [requestfiles, setRequestFiles] = useState<File[]>([]);
    const { notificationCounts } = useNotificationStore();

    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);

    const navigate = useNavigate();

    // Initialize interaction tracker
    const { getInteractionCount } = useInteractionTracker({
        pagePath: KEY_PAGES.MY_ACCOUNT,
        onInteractionChange: () => { },
    });

    const getMaintenanceRequests = async (pageNum: number = 1, setTotalFlag = false) => {
        try {
            const userId = localStorage.getItem("userId");
            const statusFormat = selectedStatuses.join(",");
            const res = await GetMaintenanceRequestsForUser(
                statusFormat,
                pageNum,
                limit,
                selectedDate ? selectedDate.format("YYYY-MM-DD") : "",
                Number(userId)
            );

            if (res) {
                setMaintenanceRequests(res.data);
                if (setTotalFlag) setTotal(res.total);

                const formatted = res.statusCounts.reduce((acc: any, item: any) => {
                    acc[item.status_name] = item.count;
                    return acc;
                }, {});
                setStatusCounts(formatted);
                setIsLoadingData(false);
            }
        } catch (error) {
            console.error("Error fetching maintenance requests:", error);
        }
    };

    const getRequestStatuses = async () => {
        try {
            const res = await GetRequestStatuses();
            if (res) {
                setRequestStatuses(res);
            }
        } catch (error) {
            console.error("Error fetching request statuses:", error);
        }
    };

    const getUser = async () => {
        try {
            const res = await GetUserById(Number(localStorage.getItem("userId")));
            if (res) {
                setUser(res);
                setProfileImage(res.ProfilePath);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    const getUpdateMaintenanceRequest = async (ID: number) => {
        try {
            const res = await GetMaintenanceRequestByID(ID);
            if (res) {
                setMaintenanceRequests((prev) => prev.map((item) => (item.ID === res.ID ? res : item)));
            }
        } catch (error) {
            console.error("Error updating maintenance request:", error);
        }
    };

    const getNewInvoice = async (ID: number) => {
        try {
            const res = await GetInvoiceByID(ID);
            if (res) {
                setInvoices((prev) => [res, ...prev]);
                setInvoiceTotal((prev) => prev + 1);
            }
        } catch (error) {
            console.error("Error fetching invoice:", error);
        }
    };

    const getUpdateInvoice = async (ID: number) => {
        try {
            const res = await GetInvoiceByID(ID);
            if (res) {
                setInvoices((prev) => prev.map((item) => (item.ID === res.ID ? res : item)));
            }
        } catch (error) {
            console.error("Error updating invoice:", error);
        }
    };

    const getInvoice = async () => {
        setIsLoadingInvoice(true);
        try {
            const userId = Number(localStorage.getItem("userId"));
            const resInvoice = await GetInvoiceByOption(invoicePage, invoiceLimit, 0, 0, userId);
            if (resInvoice) {
                setInvoiceTotal(resInvoice.total);
                setInvoices(resInvoice.data);
                setIsLoadingInvoice(false);
            }
        } catch (error) {
            console.error("Error fetching rooms:", error);
        }
    };

    const getPaymentStatuses = async () => {
        try {
            const res = await ListPaymentStatus();
            if (res) {
                setPaymentStatuses(res);
            }
        } catch (error) {
            console.error("Error fetching payment statuses:", error);
        }
    };

    const getPayment = async () => {
        setIsLoadingPayment(true)
        try {
            const userId = Number(localStorage.getItem("userId"));
            const resInvoice = await GetPaymentByOption(paymentPage, paymentLimit, userId);
            if (resInvoice) {
                setPaymentTotal(resInvoice.total);
                setPayments(resInvoice.data);
                setIsLoadingPayment(false);
            }
        } catch (error) {
            console.error("Error to fetching payments", error)
        }
    }

    const handleClickCheck = async (data: MaintenanceRequestsInterface) => {
        if (data) {
            const encodedId = Base64.encode(String(data.ID));
            const requestID = data?.ID;
            const userID = user?.ID ?? 0;
            await handleUpdateNotification(userID, true, requestID, undefined, undefined);
            navigate(`/maintenance/check-requests?request_id=${encodeURIComponent(encodedId)}`);
        }
    };

    const handleClickInspection = (
        statusName: "Completed" | "Rework Requested",
        actionType: "confirm" | "rework",
        note?: string
    ) => {
        setIsButtonActive(true);
        const statusID = requestStatuses?.find((item) => item.Name === statusName)?.ID || 0;
        const userID = Number(localStorage.getItem("userId"));

        handleActionInspection(statusID, {
            userID,
            selectedRequest,
            setAlerts,
            setOpenConfirmInspection,
            setOpenConfirmRework,
            actionType,
            note,
            files: requestfiles,
        });
        setIsButtonActive(false);
    };

    const handleClickCancel = async () => {
        try {
            setIsButtonActive(true);
            const resRequest = await DeleteMaintenanceRequestByID(selectedRequest?.ID);
            if (!resRequest || resRequest.error)
                throw new Error(resRequest?.error || "Failed to delete request status.");

            const notificationDataUpdate: NotificationsInterface = {
                IsRead: true,
            };
            const resUpdateNotification = await UpdateNotificationsByRequestID(
                notificationDataUpdate,
                selectedRequest.ID
            );
            if (!resUpdateNotification || resUpdateNotification.error)
                throw new Error(resUpdateNotification?.error || "Failed to update notification.");

            handleSetAlert("success", "Request cancelled successfully.");
            setTimeout(() => {
                setOpenConfirmCancelled(false);
                setIsButtonActive(false);
            }, 500);
        } catch (error) {
            setAlerts([]);
            console.error("API Error:", error);
            const errMessage = (error as Error).message || "Unknown error!";
            handleSetAlert("error", errMessage);
            setIsButtonActive(false);
        }
    };

    const handleUploadSlip = async (resCheckSlip?: any) => {
        if (!selectedInvoice?.ID) {
            handleSetAlert("error", "Invoice not found");
            setIsButtonActive(false);
            return;
        }

        try {
            const userId = Number(localStorage.getItem("userId"));
            const paymentData: PaymentInterface = {
                PaymentDate: resCheckSlip.data.transTimestamp,
                Amount: selectedInvoice?.TotalAmount,
                PayerID: userId,
                InvoiceID: selectedInvoice?.ID,
            };

            const formData = new FormData();
            for (const [key, value] of Object.entries(paymentData)) {
                if (value !== undefined && value !== null) {
                    formData.append(key, value);
                }
            }
            formData.append("slip", slipfile[0]);
            const resPayment = await CreatePayment(formData);

            const invoiceData: InvoiceInterface = {
                StatusID: resPayment.payment.StatusID,
            };
            await UpdateInvoiceByID(selectedInvoice?.ID ?? 0, invoiceData);

            await handleUpdateNotification(userId, true, undefined, undefined, selectedInvoice?.ID);
            await handleUpdateNotification(selectedInvoice.CreaterID ?? 0, false, undefined, undefined, selectedInvoice?.ID);

            handleSetAlert("success", "Upload slip successfully.");
            setTimeout(() => {
                handleClearInvoiceData();
                getInvoice();
                setOpenPopupPayment(false);
                setIsButtonActive(false);
            }, 500);
        } catch (error: any) {
            setAlerts([]);
            console.error("🚨 Error creating payment:", error);
            if (error.status === 409) {
                handleSetAlert("error", error.response?.data?.error || "Failed to create invoice");
            } else {
                handleSetAlert("error", "An unexpected error occurred");
            }
            setIsButtonActive(false);
        }
    };

    const handleClickUpdatePayment = async () => {
        if (!selectedInvoice?.ID) {
            handleSetAlert("error", "Invoice not found");
            setIsButtonActive(false);
            return;
        }

        try {
            const statusID = paymentStatuses.find((item) => item.Name === "Pending Verification")?.ID;
            if (!statusID) {
                console.error("Invalid payment status");
                setIsButtonActive(false);
                return;
            }

            await handleUpdatePaymentAndInvoice(
                selectedInvoice.ID,
                selectedInvoice?.Payments?.ID ?? 0,
                statusID,
                undefined,
                undefined,
                slipfile[0]
            );

            await handleUpdateNotification(selectedInvoice.CustomerID ?? 0, true, undefined, undefined, selectedInvoice?.ID);
            await handleUpdateNotification(selectedInvoice.CreaterID ?? 0, false, undefined, undefined, selectedInvoice?.ID);

            handleSetAlert("success", "Upload new slip successfully.");

            setTimeout(() => {
                handleClearInvoiceData();
                getInvoice();
                setOpenPopupPayment(false);
                setIsButtonActive(false);
            }, 1800);
        } catch (error) {
            console.error("🚨 Error updating payment:", error);
            handleSetAlert("error", "An unexpected error occurred");
            setIsButtonActive(false);
        }
    };

    const handleClearInvoiceData = () => {
        setSelectedInvoice(null);
        setSelectedInvoice(null);
        setSlipFile([]);
    };

    const handleSetAlert = (type: "success" | "error" | "warning", message: string) => {
        setAlerts((prevAlerts) => [...prevAlerts, { type, message }]);
    };

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValueTab(newValue);
    };

    const handleClearFillter = () => {
        setSelectedDate(null);
        setSearchText("");
        setSelectedStatuses([0]);
    };

    // Analytics tracking
    useEffect(() => {
        const startTime = Date.now();
        let sent = false;

        // ส่ง request ตอนเข้า (duration = 0)
        analyticsService.trackPageVisit({
            user_id: Number(localStorage.getItem("userId")),
            page_path: KEY_PAGES.MY_ACCOUNT,
            page_name: "My Account",
            duration: 0, // ตอนเข้า duration = 0
            is_bounce: false,
        });

        // ฟังก์ชันส่ง analytics ตอนออก
        const sendAnalyticsOnLeave = (isBounce: boolean) => {
            if (sent) {
                return;
            }
            sent = true;
            const duration = Math.floor((Date.now() - startTime) / 1000);
            analyticsService.trackPageVisit({
                user_id: Number(localStorage.getItem("userId")),
                page_path: KEY_PAGES.MY_ACCOUNT,
                page_name: "My Account",
                duration,
                is_bounce: isBounce,
                interaction_count: getInteractionCount(),
            });
        };

        // ออกจากหน้าแบบปิด tab/refresh
        const handleBeforeUnload = () => {
            sendAnalyticsOnLeave(true);
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        // ออกจากหน้าแบบ SPA (React)
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            sendAnalyticsOnLeave(false);
        };
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await Promise.all([getRequestStatuses(), getUser()]);
                setIsLoadingData(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (requestStatuses) {
            getMaintenanceRequests(page);
        }
    }, [page, limit]);

    useEffect(() => {
        getInvoice();
    }, [invoicePage, invoiceLimit]);

    useEffect(() => {
        getPayment();
    }, [paymentPage, paymentLimit]);

    useEffect(() => {
        if (requestStatuses) {
            getMaintenanceRequests(1, true);
        }
    }, [selectedStatuses, selectedDate]);

    useEffect(() => {
        if (valueTab === 2) {
            getInvoice();
            getPaymentStatuses();
        } else if (valueTab === 3) {
            getPayment()
        }
    }, [valueTab]);

    useEffect(() => {
        async function doCheckSlip() {
            setIsButtonActive(true);
            try {
                const resGetQuota = await GetQuota();
                console.log(resGetQuota.data.quota)
                if (resGetQuota.success && resGetQuota.data.quota > 0) {
                    const formData = new FormData();
                    formData.append("files", slipfile[0]);

                    const resCheckSlip = await CheckSlip(formData);

                    console.log("resCheckSlip: ", resCheckSlip)

                    const statusName = selectedInvoice?.Status?.Name;
                    if (resCheckSlip.success && statusName === "Pending Payment") {
                        handleUploadSlip(resCheckSlip);
                    } else if (resCheckSlip.success && statusName === "Rejected") {
                        handleClickUpdatePayment();
                    }
                }
            } catch (error: any) {
                setAlerts([]);
                console.error("🚨 Error check slip:", error);
                handleSetAlert("error", "The payment slip you uploaded is invalid. Please check and try again.");
                setIsButtonActive(false);
            }
        }

        if (slipfile.length === 1) {
            doCheckSlip();
        }
    }, [slipfile]);

    useEffect(() => {
        const socket = io(socketUrl);
        const userId = Number(localStorage.getItem("userId"))
        socket.on("maintenance_updated", (data) => {
            console.log("🔄 Maintenance request updated:", data);
            if (data.UserID === userId) {
                setTimeout(() => {
                    getUpdateMaintenanceRequest(data.ID);
                }, 1500);
            }
        });

        socket.on("maintenance_deleted", (data) => {
            console.log("🔄 Maintenance request deleted:", data);
            if (data.UserID === userId) {
                setTimeout(() => {
                    setMaintenanceRequests((prev) => prev.filter((item) => item.ID !== data.ID));
                }, 1500);
            }
        });

        socket.on("invoice_created", (data) => {
            console.log("📦 New invoice:", data);
            if (data.CustomerID === userId) {
                setTimeout(() => {
                    getNewInvoice(data.ID);
                }, 1500);
            }
        });

        socket.on("invoice_updated", (data) => {
            console.log("🔄 Invoice updated:", data);
            if (data.CustomerID === userId) {
                setTimeout(() => {
                    getUpdateInvoice(data.ID);
                }, 1500);
            }
        });

        socket.on("invoice_deleted", (data) => {
            console.log("🔄 Invoice deleted:", data);
            if (data.CustomerID === userId) {
                setTimeout(() => {
                    setInvoices((prev) => prev.filter((item) => item.ID !== data.ID));
                }, 1500);
            }
        });

        return () => {
            socket.off("maintenance_updated");
            socket.off("maintenance_deleted");
            socket.off("invoice_created");
            socket.off("invoice_updated");
            socket.off("invoice_deleted");
        };
    }, []);

    const filteredRequests = maintenanceRequests.filter((request) => {
        const requestId = String(request.ID);
        const roomTypeName = request.Room?.RoomType?.TypeName?.toLowerCase() || "";
        const floor = `Floor ${request.Room?.Floor?.Number}`;
        const roomNumber = String(request.Room?.RoomNumber).toLowerCase() || "";

        const matchText =
            !searchText ||
            requestId?.includes(searchText) ||
            roomTypeName.includes(searchText.toLowerCase()) ||
            floor.includes(searchText.toLowerCase()) ||
            roomNumber?.includes(searchText.toLowerCase());

        return matchText;
    });

    const getColumns = (): GridColDef[] => {
        if (isSmallScreen) {
            return [
                {
                    field: "All Maintenance Requests",
                    headerName: "All Maintenance Requests",
                    flex: 1,
                    renderCell: (params) => {
                        const data = params.row;
                        const statusName = params.row.RequestStatus?.Name || "Pending";
                        const statusKey = params.row.RequestStatus?.Name as keyof typeof statusConfig;
                        const {
                            color: statusColor,
                            colorLite: statusColorLite,
                            icon: statusIcon,
                        } = statusConfig[statusKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: HelpCircle,
                        };
                        const StatusIcon = statusIcon

                        const dateTime = `${dateFormat(params.row.CreatedAt || "")} ${timeFormat(params.row.CreatedAt || "")}`;

                        const description = params.row.Description;
                        const areaID = params.row.Area?.ID;
                        const areaDetail = params.row.AreaDetail;
                        const roomtype = params.row.Room?.RoomType?.TypeName;
                        const roomNum = params.row.Room?.RoomNumber;
                        const roomFloor = params.row.Room?.Floor?.Number;

                        const typeName = params.row.MaintenanceType?.TypeName || "Electrical Work";
                        const maintenanceKey = params.row.MaintenanceType
                            ?.TypeName as keyof typeof maintenanceTypeConfig;
                        const { color: typeColor, icon: typeIcon } = maintenanceTypeConfig[maintenanceKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: HelpCircle,
                        };
                        const TypeIcon = typeIcon

                        const showButtonConfirm = params.row.RequestStatus?.Name === "Waiting For Review";
                        const showButtonCancel = params.row.RequestStatus?.Name === "Pending";

                        const cardItem = document.querySelector(".card-item-container") as HTMLElement;
                        let width;
                        if (cardItem) {
                            width = cardItem.offsetWidth;
                        }

                        return (
                            <Grid container size={{ xs: 12 }} sx={{ px: 1 }} className="card-item-container" rowSpacing={1.5}>
                                <Grid size={{ xs: 12, sm: 7 }}>
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: "100%",
                                        }}
                                    >
                                        {areaID === 2
                                            ? `${areaDetail}`
                                            : `${roomtype} - Floor ${roomFloor}, Room No. ${roomNum}`}
                                    </Typography>
                                    <Box
                                        sx={{
                                            color: "text.secondary",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.4,
                                            my: 0.8,
                                        }}
                                    >
                                        <Clock size={16} style={{ minWidth: "16px", minHeight: "16px", paddingBottom: '2px' }} />
                                        <Typography
                                            sx={{
                                                fontSize: 13,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {dateTime}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: "100%",
                                            color: "text.secondary",
                                            my: 0.8,
                                        }}
                                    >
                                        {description}
                                    </Typography>
                                    <Box
                                        sx={{
                                            borderRadius: 10,
                                            py: 0.5,
                                            display: "inline-flex",
                                            gap: 1,
                                            color: typeColor,
                                            alignItems: "center",
                                        }}
                                    >
                                        <TypeIcon size={18} style={{ minWidth: "18px", minHeight: "18px", paddingBottom: '2px' }} />
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {typeName}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 5 }} container direction="column">
                                    <Box
                                        sx={{
                                            bgcolor: statusColorLite,
                                            borderRadius: 10,
                                            px: 1.5,
                                            py: 0.5,
                                            display: "flex",
                                            gap: 1,
                                            color: statusColor,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "100%",
                                        }}
                                    >
                                        <StatusIcon size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                maxWidth: "100%",
                                            }}
                                        >
                                            {statusName}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Divider sx={{ width: "100%", my: 1 }} />

                                <Grid size={{ xs: 12 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 0.8,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        {showButtonConfirm ? (
                                            <Grid container spacing={0.8} size={{ xs: 12 }}>
                                                <Grid size={{ xs: 5 }}>
                                                    <Tooltip title={"Confirm"}>
                                                        <Button
                                                            variant="contained"
                                                            onClick={() => {
                                                                setOpenConfirmInspection(true);
                                                                setSelectedRequest(data);
                                                            }}
                                                            fullWidth
                                                        >
                                                            <Check size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                                            <Typography
                                                                variant="textButtonClassic"
                                                                className="text-btn"
                                                            >
                                                                Confirm
                                                            </Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                                <Grid size={{ xs: 5 }}>
                                                    <Tooltip title={"Rework"}>
                                                        <Button
                                                            variant="outlined"
                                                            onClick={() => {
                                                                setOpenConfirmRework(true);
                                                                setSelectedRequest(data);
                                                            }}
                                                            fullWidth
                                                        >
                                                            <Repeat size={16} style={{ minWidth: "16px", minHeight: "16px" }} />
                                                            <Typography
                                                                variant="textButtonClassic"
                                                                className="text-btn"
                                                            >
                                                                Rework
                                                            </Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                                <Grid size={{ xs: 2 }}>
                                                    <Tooltip title={"Details"}>
                                                        <Button
                                                            variant="outlinedGray"
                                                            onClick={() => {
                                                                handleClickCheck(data);
                                                            }}
                                                            sx={{
                                                                minWidth: "42px",
                                                            }}
                                                            fullWidth
                                                        >
                                                            <Eye size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                                            {width && width > 530 && (
                                                                <Typography
                                                                    variant="textButtonClassic"
                                                                    className="text-btn"
                                                                >
                                                                    Details
                                                                </Typography>
                                                            )}
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                            </Grid>
                                        ) : showButtonCancel ? (
                                            <Grid container spacing={0.8} size={{ xs: 12 }}>
                                                <Grid size={{ xs: 7 }}>
                                                    <Tooltip title={"Cancel"}>
                                                        <Button
                                                            variant="outlinedCancel"
                                                            onClick={() => {
                                                                setOpenConfirmCancelled(true);
                                                                setSelectedRequest(data);
                                                            }}
                                                            fullWidth
                                                        >
                                                            <X size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                                            <Typography
                                                                variant="textButtonClassic"
                                                                className="text-btn"
                                                            >
                                                                Cancel
                                                            </Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                                <Grid size={{ xs: 5 }}>
                                                    <Tooltip title={"Details"}>
                                                        <Button
                                                            variant="outlinedGray"
                                                            onClick={() => {
                                                                handleClickCheck(data);
                                                            }}
                                                            sx={{
                                                                minWidth: "42px",
                                                            }}
                                                            fullWidth
                                                        >
                                                            <Eye size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                                            {width && width > 250 && (
                                                                <Typography
                                                                    variant="textButtonClassic"
                                                                    className="text-btn"
                                                                >
                                                                    Details
                                                                </Typography>
                                                            )}
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                            </Grid>
                                        ) : (
                                            <Tooltip title={"Details"}>
                                                <Button
                                                    className="btn-detail"
                                                    variant="outlinedGray"
                                                    onClick={() => {
                                                        handleClickCheck(data);
                                                    }}
                                                    sx={{
                                                        minWidth: "42px",
                                                        width: "100%",
                                                    }}
                                                >
                                                    <Eye size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                                    <Typography variant="textButtonClassic" className="text-btn">
                                                        Details
                                                    </Typography>
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        );
                    },
                },
            ];
        } else {
            return [
                {
                    field: "ID",
                    headerName: "No.",
                    flex: 0.5,
                    align: "center",
                    headerAlign: "center",
                    renderCell: (params) => {
                        const requestID = params.row.ID;
                        const notification = params.row.Notifications ?? [];
                        const hasNotificationForUser = notification.some((n: NotificationsInterface) => n.UserID === user?.ID && !n.IsRead);
                        return (
                            <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "5px" }}>
                                {hasNotificationForUser && <AnimatedBell />}
                                <Typography sx={{ fontSize: 14 }}>{requestID}</Typography>
                            </Box>
                        );
                    },
                },
                {
                    field: "Title",
                    headerName: "Title",
                    type: "string",
                    flex: 1.8,
                    renderCell: (params) => {
                        const description = params.row.Description;
                        const areaID = params.row.Area?.ID;
                        const areaDetail = params.row.AreaDetail;
                        const roomtype = params.row.Room?.RoomType?.TypeName;
                        const roomNum = params.row.Room?.RoomNumber;
                        const roomFloor = params.row.Room?.Floor?.Number;

                        const typeName = params.row.MaintenanceType?.TypeName || "Electrical Work";
                        const maintenanceKey = params.row.MaintenanceType
                            ?.TypeName as keyof typeof maintenanceTypeConfig;
                        const { color, icon } = maintenanceTypeConfig[maintenanceKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: HelpCircle,
                        };

                        const Icon = icon

                        return (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    height: "100%",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                    }}
                                >
                                    {areaID === 2
                                        ? `${areaDetail}`
                                        : `${roomtype} - Floor ${roomFloor}, Room No. ${roomNum}`}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                        color: "text.secondary",
                                    }}
                                >
                                    {description}
                                </Typography>
                                <Box
                                    sx={{
                                        borderRadius: 10,
                                        py: 0.5,
                                        display: "inline-flex",
                                        gap: 1,
                                        color: color,
                                        alignItems: "center",
                                    }}
                                >
                                    <Icon size={18} style={{ minWidth: "18px", minHeight: "18px", paddingBottom: '2px' }} />
                                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{typeName}</Typography>
                                </Box>
                            </Box>
                        );
                    },
                },
                {
                    field: "Date Submitted",
                    headerName: "Date Submitted",
                    type: "string",
                    flex: 1,
                    renderCell: (params) => {
                        const date = dateFormat(params.row.CreatedAt || "");
                        const time = timeFormat(params.row.CreatedAt || "");
                        return (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    height: "100%",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                    }}
                                >
                                    {date}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                        color: "text.secondary",
                                    }}
                                >
                                    {time}
                                </Typography>
                            </Box>
                        );
                    },
                },
                {
                    field: "RequestStatus",
                    headerName: "Status",
                    type: "string",
                    flex: 1,
                    renderCell: (params) => {
                        const statusName = params.row.RequestStatus?.Name || "Pending";
                        const statusKey = params.row.RequestStatus?.Name as keyof typeof statusConfig;
                        const { color, colorLite, icon } = statusConfig[statusKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: HelpCircle,
                        };

                        const Icon = icon

                        return (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    height: "100%",
                                }}
                            >
                                <Box
                                    sx={{
                                        bgcolor: colorLite,
                                        borderRadius: 10,
                                        px: 1.5,
                                        py: 0.5,
                                        display: "flex",
                                        gap: 1,
                                        color: color,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "100%",
                                    }}
                                >
                                    <Icon size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
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
                        );
                    },
                },
                {
                    field: "Actions",
                    headerName: "Actions",
                    type: "string",
                    flex: 1,
                    renderCell: (item) => {
                        const data = item.row;
                        const showButtonConfirm = item.row.RequestStatus?.Name === "Waiting For Review";
                        const showButtonCancel = item.row.RequestStatus?.Name === "Pending";
                        return (
                            <Box
                                className="container-btn"
                                sx={{
                                    display: "flex",
                                    gap: 0.8,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    height: "100%",
                                }}
                            >
                                {showButtonConfirm ? (
                                    <>
                                        <Tooltip title={"Confirm"}>
                                            <Button
                                                className="btn-confirm"
                                                variant="contained"
                                                onClick={() => {
                                                    setOpenConfirmInspection(true);
                                                    setSelectedRequest(data);
                                                }}
                                                sx={{
                                                    minWidth: "42px",
                                                }}
                                            >
                                                <Check size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                                <Typography variant="textButtonClassic" className="text-btn">
                                                    Confirm
                                                </Typography>
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title={"Rework"}>
                                            <Button
                                                className="btn-rework"
                                                variant="outlined"
                                                onClick={async () => {
                                                    setOpenConfirmRework(true);
                                                    setSelectedRequest(data);
                                                    const fileList = await convertPathsToFiles(data.MaintenanceImages || []);
                                                    if (fileList) {
                                                        setRequestFiles(fileList);
                                                    }
                                                }}
                                                sx={{
                                                    minWidth: "42px",
                                                }}
                                            >
                                                <Repeat size={16} style={{ minWidth: "16px", minHeight: "16px" }} />
                                                <Typography variant="textButtonClassic" className="text-btn">
                                                    Rework
                                                </Typography>
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title={"Details"}>
                                            <Button
                                                className="btn-detail"
                                                variant="outlinedGray"
                                                onClick={() => {
                                                    handleClickCheck(data);
                                                }}
                                                sx={{
                                                    minWidth: "42px",
                                                }}
                                            >
                                                <Eye size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                                <Typography variant="textButtonClassic" className="text-btn">
                                                    Details
                                                </Typography>
                                            </Button>
                                        </Tooltip>
                                    </>
                                ) : showButtonCancel ? (
                                    <>
                                        <Tooltip title={"Cancel"}>
                                            <Button
                                                className="btn-confirm"
                                                variant="outlinedCancel"
                                                onClick={() => {
                                                    setOpenConfirmCancelled(true);
                                                    setSelectedRequest(data);
                                                }}
                                                sx={{
                                                    minWidth: "42px",
                                                }}
                                            >
                                                <X size={20} />
                                                <Typography variant="textButtonClassic" className="text-btn">
                                                    Cancel
                                                </Typography>
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title={"Details"}>
                                            <Button
                                                className="btn-detail"
                                                variant="outlinedGray"
                                                onClick={() => {
                                                    handleClickCheck(data);
                                                }}
                                                sx={{
                                                    minWidth: "42px",
                                                }}
                                            >
                                                <Eye size={20} />
                                                <Typography variant="textButtonClassic" className="text-btn">
                                                    Details
                                                </Typography>
                                            </Button>
                                        </Tooltip>
                                    </>
                                ) : (
                                    <Tooltip title={"Details"}>
                                        <Button
                                            className="btn-detail"
                                            variant="outlinedGray"
                                            onClick={() => {
                                                handleClickCheck(data);
                                            }}
                                            sx={{
                                                minWidth: "42px",
                                            }}
                                        >
                                            <Eye size={20} />
                                            <Typography variant="textButtonClassic" className="text-btn">
                                                Details
                                            </Typography>
                                        </Button>
                                    </Tooltip>
                                )}
                            </Box>
                        );
                    },
                },
            ];
        }
    };

    const getInvoiceColumns = (): GridColDef[] => {
        if (isSmallScreen) {
            return [
                {
                    field: "All Invoice",
                    headerName: "All Invoice",
                    flex: 1,
                    renderCell: (item) => {
                        const data = item.row;
                        const statusName = data.Status?.Name
                        const statusKey = statusName as keyof typeof paymentStatusConfig;
                        const {
                            color: statusColor,
                            colorLite: statusColorLite,
                            icon: statusIcon,
                        } = paymentStatusConfig[statusKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: HelpCircle,
                        };

                        const invoiceNumber = data.InvoiceNumber
                        const notification = data.Notifications ?? [];
                        const hasNotificationForUser = notification.some((n: NotificationsInterface) => n.UserID === user?.ID && !n.IsRead);
                        const billingPeriod = formatToMonthYear(data.BillingPeriod)
                        const totalAmount = data.TotalAmount?.toLocaleString("th-TH", {
                            style: "currency",
                            currency: "THB",
                        })

                        const cardItem = document.querySelector(".card-item-container") as HTMLElement;
                        let width;
                        if (cardItem) {
                            width = cardItem.offsetWidth;
                        }

                        const receiptPath = data.Payments?.ReceiptPath
                        const fileName = receiptPath ? receiptPath?.split("/").pop() : ""

                        return (
                            <Grid container size={{ xs: 12 }} sx={{ px: 1 }} className="card-item-container" rowSpacing={1}>
                                <Grid size={{ xs: 12, mobileS: 7 }}>
                                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: "5px", width: "100%" }}>
                                        {hasNotificationForUser && <AnimatedBell />}
                                        <Typography
                                            sx={{
                                                fontSize: 16,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                maxWidth: "100%",
                                            }}
                                        >
                                            {invoiceNumber}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.6, my: 0.8 }}>
                                        <Calendar
                                            size={14}
                                            style={{
                                                paddingBottom: "4px"
                                            }}
                                        />
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {`Billing Period: ${billingPeriod}`}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 1.4, mb: 1 }}>
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                color: 'text.secondary'
                                            }}
                                        >
                                            Total Amount
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: 16,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                fontWeight: 500,
                                                color: "text.main"
                                            }}
                                        >
                                            {totalAmount}
                                        </Typography>
                                    </Box>

                                </Grid>

                                <Grid size={{ xs: 12, mobileS: 5 }} container direction="column">
                                    <Box
                                        sx={{
                                            bgcolor: statusColorLite,
                                            borderRadius: 10,
                                            px: 1.5,
                                            py: 0.5,
                                            display: "flex",
                                            gap: 1,
                                            color: statusColor,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "100%",
                                        }}
                                    >
                                        {React.createElement(statusIcon, { size: 16 })}
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                maxWidth: "100%",
                                            }}
                                        >
                                            {statusName}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    {
                                        fileName !== "" ? (

                                            <Box
                                                sx={{
                                                    display: 'inline-flex',
                                                    gap: 1,
                                                    border: '1px solid rgb(109, 110, 112, 0.4)',
                                                    borderRadius: 1,
                                                    px: 1,
                                                    py: 0.5,
                                                    bgcolor: '#FFF',
                                                    cursor: 'pointer',
                                                    transition: 'all ease 0.3s',
                                                    alignItems: 'center',
                                                    width: {
                                                        xs: '100%', mobileS: 'auto'
                                                    },
                                                    "&:hover": {
                                                        color: 'primary.main',
                                                        borderColor: 'primary.main'
                                                    }
                                                }}
                                            >
                                                <FileText size={16} style={{ minWidth: '16px', minHeight: '16px' }} />
                                                <Typography
                                                    variant="body1"
                                                    onClick={() => window.open(`${apiUrl}/${receiptPath}`, "_blank")}
                                                    sx={{
                                                        fontSize: 14,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                >
                                                    {fileName}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Box
                                                sx={{
                                                    display: 'inline-flex',
                                                    gap: 1,
                                                    border: '1px solid rgb(109, 110, 112, 0.4)',
                                                    borderRadius: 1,
                                                    px: 1,
                                                    py: 0.5,
                                                    bgcolor: '#FFF',
                                                    alignItems: 'center',
                                                    color: 'text.secondary',
                                                    width: {
                                                        xs: '100%', mobileS: 'auto'
                                                    },
                                                }}
                                            >
                                                <File size={16} style={{ minWidth: '16px', minHeight: '16px' }} />
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontSize: 14,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                >
                                                    No receipt file uploaded
                                                </Typography>
                                            </Box>
                                        )
                                    }
                                </Grid>

                                <Divider sx={{ width: "100%", my: 1 }} />

                                <Grid size={{ xs: 12 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 0.8,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Grid container spacing={0.8} size={{ xs: 12 }}>
                                            <Grid size={{ xs: 6 }}>
                                                <Tooltip title={statusName === "Pending Payment" ? "Pay Now" : "View Slip"}>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => {
                                                            setSelectedInvoice((prev) => ({
                                                                ...prev,
                                                                ...data,
                                                            }));
                                                            setOpenPopupPayment(true);
                                                        }}
                                                        sx={{ minWidth: "42px", width: '100%', height: '100%' }}
                                                    >
                                                        {
                                                            (statusName === "Pending Payment" || statusName === "Rejected") ? (
                                                                <>
                                                                    <HandCoins size={18} />
                                                                    <Typography variant="textButtonClassic" className="text-btn">
                                                                        Pay Now
                                                                    </Typography>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Wallet size={18} />
                                                                    <Typography variant="textButtonClassic" className="text-btn">
                                                                        View Slip
                                                                    </Typography>
                                                                </>
                                                            )
                                                        }
                                                    </Button>
                                                </Tooltip>
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Tooltip title="Download PDF">
                                                    <Button
                                                        variant="outlinedGray"
                                                        onClick={async () => {
                                                            setOpenPDF(true);
                                                            setSelectedInvoice(data);
                                                        }}
                                                        sx={{ minWidth: "42px", width: '100%', height: '100%' }}
                                                    >
                                                        <FontAwesomeIcon icon={faFilePdf} style={{ fontSize: 16 }} />
                                                        <Typography variant="textButtonClassic" className="text-btn">
                                                            Download PDF
                                                        </Typography>
                                                    </Button>
                                                </Tooltip>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Grid>
                            </Grid>
                        );
                    },
                },
            ];
        } else {
            return [
                {
                    field: "InvoiceNumber",
                    headerName: "Invoice No.",
                    flex: 1,
                    align: "center",
                    headerAlign: "center",
                    renderCell: (params) => {
                        const invoiceNumber = params.row.InvoiceNumber;
                        const notification = params.row.Notifications ?? [];
                        const hasNotificationForUser = notification.some((n: NotificationsInterface) => n.UserID === user?.ID && !n.IsRead);
                        return (
                            <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "5px" }}>
                                {hasNotificationForUser && <AnimatedBell />}
                                <Typography sx={{ fontSize: 14 }}>{invoiceNumber}</Typography>
                            </Box>
                        );
                    },
                },
                {
                    field: "BillingPeriod",
                    headerName: "Billing Period",
                    type: "string",
                    flex: 1.5,
                    renderCell: (params) => {
                        return (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    height: "100%",
                                }}
                            >
                                {formatToMonthYear(params.value)}
                            </Box>
                        );
                    },
                },
                {
                    field: "TotalAmount",
                    headerName: "Total Amount",
                    type: "string",
                    flex: 1.5,
                    renderCell: (params) => {
                        return (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    height: "100%",
                                }}
                            >
                                ฿
                                {params.value?.toLocaleString("th-TH", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </Box>
                        );
                    },
                },
                {
                    field: "Status",
                    headerName: "Status",
                    type: "string",
                    flex: 1.8,
                    renderCell: (item) => {
                        const statusName = item.value.Name || "";
                        const statusKey = item.value.Name as keyof typeof roomStatusConfig;
                        const { color, colorLite, icon } = paymentStatusConfig[statusKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: HelpCircle,
                        };
                        return (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    height: "100%",
                                }}
                            >
                                <Box
                                    sx={{
                                        bgcolor: colorLite,
                                        borderRadius: 10,
                                        px: 1.5,
                                        py: 0.5,
                                        display: "flex",
                                        gap: 1,
                                        color: color,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "100%",
                                    }}
                                >
                                    {React.createElement(icon, { size: 16 })}
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
                        );
                    },
                },
                {
                    field: "Receipt",
                    headerName: "Receipt",
                    type: "string",
                    flex: 2,
                    renderCell: (item) => {
                        const data = item.row;
                        const receiptPath = data.Payments?.ReceiptPath
                        const fileName = receiptPath ? receiptPath?.split("/").pop() : ""
                        return (
                            <Box
                                className="container-btn"
                                sx={{
                                    display: "flex",
                                    gap: 0.8,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    height: "100%",
                                }}
                            >
                                {
                                    fileName !== "" ? (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                gap: 1,
                                                border: '1px solid rgb(109, 110, 112, 0.4)',
                                                borderRadius: 1,
                                                px: 1,
                                                py: 0.5,
                                                bgcolor: '#FFF',
                                                cursor: 'pointer',
                                                transition: 'all ease 0.3s',
                                                alignItems: 'center',
                                                width: '100%',
                                                "&:hover": {
                                                    color: 'primary.main',
                                                    borderColor: 'primary.main'
                                                }
                                            }}
                                        >
                                            <FileText size={16} style={{ minWidth: '16px', minHeight: '16px' }} />
                                            <Typography
                                                variant="body1"
                                                onClick={() => window.open(`${apiUrl}/${receiptPath}`, "_blank")}
                                                sx={{
                                                    fontSize: 14,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {fileName}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                gap: 1,
                                                border: '1px solid rgb(109, 110, 112, 0.4)',
                                                borderRadius: 1,
                                                px: 1,
                                                py: 0.5,
                                                bgcolor: '#FFF',
                                                alignItems: 'center',
                                                color: 'text.secondary',
                                                width: '100%'
                                            }}
                                        >
                                            <File size={16} style={{ minWidth: '16px', minHeight: '16px' }} />
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    fontSize: 14,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                No file uploaded
                                            </Typography>
                                        </Box>
                                    )
                                }
                            </Box>
                        );
                    },
                },
                {
                    field: "Actions",
                    headerName: "Actions",
                    type: "string",
                    flex: 1.5,
                    renderCell: (item) => {
                        const data = item.row;
                        const statusName = data.Status?.Name
                        return (
                            <Box
                                className="container-btn"
                                sx={{
                                    display: "flex",
                                    gap: 0.8,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    height: "100%",
                                }}
                            >
                                <Tooltip title={statusName === "Pending Payment" ? "Pay Now" : "View Slip"}>
                                    <Button
                                        variant="contained"
                                        className="btn-payment"
                                        onClick={() => {
                                            setSelectedInvoice((prev) => ({
                                                ...prev,
                                                ...data,
                                            }));
                                            setOpenPopupPayment(true);
                                        }}
                                        sx={{ minWidth: "42px" }}
                                    >
                                        {
                                            (statusName === "Pending Payment" || statusName === "Rejected") ? (
                                                <>
                                                    <HandCoins size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
                                                    <Typography variant="textButtonClassic" className="text-btn">
                                                        Pay Now
                                                    </Typography>
                                                </>
                                            ) : (
                                                <>
                                                    <Wallet size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
                                                    <Typography variant="textButtonClassic" className="text-btn">
                                                        View Slip
                                                    </Typography>
                                                </>
                                            )
                                        }
                                    </Button>
                                </Tooltip>

                                <Tooltip title="Download PDF">
                                    <Button
                                        variant="outlinedGray"
                                        className="btn-download-pdf"
                                        onClick={async () => {
                                            setOpenPDF(true);
                                            setSelectedInvoice(data);
                                        }}
                                        sx={{ minWidth: "42px" }}
                                    >
                                        <FontAwesomeIcon icon={faFilePdf} style={{ fontSize: 16 }} />
                                    </Button>
                                </Tooltip>
                            </Box>
                        );
                    },
                },
            ];
        }
    };

    const getPaymentColumns = (): GridColDef[] => {
        if (isSmallScreen) {
            return [
                {
                    field: "Payment History",
                    headerName: "Payment History",
                    flex: 1,
                    renderCell: (item) => {
                        const data = item.row;
                        console.log("data: ", data)

                        const statusName = data.Status?.Name
                        const statusKey = statusName as keyof typeof paymentStatusConfig;
                        const {
                            color: statusColor,
                            colorLite: statusColorLite,
                            icon: statusIcon,
                        } = paymentStatusConfig[statusKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: HelpCircle,
                        };

                        const invoiceNumber = data.InvoiceNumber
                        const billingPeriod = formatToMonthYear(data.BillingPeriod)
                        const totalAmount = data.TotalAmount?.toLocaleString("th-TH", {
                            style: "currency",
                            currency: "THB",
                        })

                        const cardItem = document.querySelector(".card-item-container") as HTMLElement;
                        let width;
                        if (cardItem) {
                            width = cardItem.offsetWidth;
                        }

                        return (
                            <Grid container size={{ xs: 12 }} sx={{ px: 1 }} className="card-item-container" rowSpacing={1}>
                                <Grid size={{ xs: 12, mobileS: 7 }}>
                                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: "5px", width: "100%" }}>
                                        <Typography
                                            sx={{
                                                fontSize: 16,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                maxWidth: "100%",
                                                fontWeight: 500
                                            }}
                                        >
                                            {invoiceNumber}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.6, my: 0.8 }}>
                                        <Calendar
                                            size={14}
                                            style={{
                                                paddingBottom: "4px"
                                            }}
                                        />
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {`Billing Period: ${billingPeriod}`}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 1.4, mb: 1 }}>
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                color: 'text.secondary'
                                            }}
                                        >
                                            Total Amount
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: 16,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                fontWeight: 500,
                                                color: "text.main"
                                            }}
                                        >
                                            {totalAmount}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid size={{ xs: 12, mobileS: 5 }} container direction="column">
                                    <Box
                                        sx={{
                                            bgcolor: statusColorLite,
                                            borderRadius: 10,
                                            px: 1.5,
                                            py: 0.5,
                                            display: "flex",
                                            gap: 1,
                                            color: statusColor,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "100%",
                                        }}
                                    >
                                        {React.createElement(statusIcon, { size: 16 })}
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                maxWidth: "100%",
                                            }}
                                        >
                                            {statusName}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Divider sx={{ width: "100%", my: 1 }} />

                                <Grid size={{ xs: 12 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 0.8,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Grid container spacing={0.8} size={{ xs: 12 }}>
                                            <Grid size={{ xs: 6 }}>
                                                <Tooltip title="Download PDF">
                                                    <Button
                                                        variant="contained"
                                                        onClick={async () => {
                                                            setOpenPDF(true);
                                                            setSelectedInvoice(data);
                                                        }}
                                                        sx={{ minWidth: "42px", width: '100%', height: '100%' }}
                                                    >
                                                        <FilePdf size={16} />
                                                        <Typography variant="textButtonClassic" className="text-btn">
                                                            Download PDF
                                                        </Typography>
                                                    </Button>
                                                </Tooltip>
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Tooltip title={statusName === "Pending Payment" ? "Pay Now" : "View Slip"}>
                                                    <Button
                                                        variant="outlinedGray"
                                                        onClick={() => {
                                                            setSelectedInvoice((prev) => ({
                                                                ...prev,
                                                                ...data,
                                                            }));
                                                            setOpenPopupPayment(true);
                                                        }}
                                                        sx={{ minWidth: "42px", bgcolor: "#FFF", width: '100%', height: '100%' }}
                                                    >
                                                        {
                                                            (statusName === "Pending Payment" || statusName === "Rejected") ? (
                                                                <>
                                                                    <Wallet size={18} />
                                                                    <Typography variant="textButtonClassic" className="text-btn">
                                                                        Pay Now
                                                                    </Typography>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Eye size={18} />
                                                                    <Typography variant="textButtonClassic" className="text-btn">
                                                                        View Slip
                                                                    </Typography>
                                                                </>
                                                            )
                                                        }
                                                    </Button>
                                                </Tooltip>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Grid>
                            </Grid>
                        );
                    },
                },
            ];
        } else {
            return [
                {
                    field: "PaymentDate",
                    headerName: "Payment Date",
                    type: "string",
                    flex: 0.4,
                    renderCell: (params) => {
                        const date = dateFormat(params.value)
                        const time = timeFormat(params.value)
                        return (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    height: "100%",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                    }}
                                >
                                    {date}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                        color: "text.secondary",
                                    }}
                                >
                                    {time}
                                </Typography>
                            </Box>
                        );
                    },
                },
                {
                    field: "Amount",
                    headerName: "Amount",
                    type: "string",
                    flex: 0.4,
                    renderCell: (params) => {
                        return (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    height: "100%",
                                }}
                            >
                                ฿
                                {params.value?.toLocaleString("th-TH", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </Box>
                        );
                    },
                },
                {
                    field: "Status",
                    headerName: "Status",
                    type: "string",
                    flex: 0.5,
                    renderCell: (item) => {
                        const statusName = item.value.Name || "";
                        const statusKey = item.value.Name as keyof typeof roomStatusConfig;
                        const { color, colorLite, icon } = paymentStatusConfig[statusKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: HelpCircle,
                        };
                        return (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    height: "100%",
                                }}
                            >
                                <Box
                                    sx={{
                                        bgcolor: colorLite,
                                        borderRadius: 10,
                                        px: 1.5,
                                        py: 0.5,
                                        display: "flex",
                                        gap: 1,
                                        color: color,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "100%",
                                    }}
                                >
                                    {React.createElement(icon, { size: 16 })}
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
                        );
                    },
                },
                {
                    field: "Actions",
                    headerName: "Actions",
                    type: "string",
                    flex: 0.6,
                    renderCell: (item) => {
                        const data = item.row;
                        const statusName = data.Status?.Name
                        return (
                            <Box
                                className="container-btn"
                                sx={{
                                    display: "flex",
                                    gap: 0.8,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    height: "100%",
                                }}
                            >
                                <Tooltip title="Download Receipt">
                                    <Button
                                        variant="contained"
                                        sx={{ minWidth: "42px" }}
                                    >
                                        <ReceiptText size={18} />
                                        <Typography variant="textButtonClassic" >
                                            Receipt
                                        </Typography>
                                    </Button>
                                </Tooltip>
                            </Box>
                        );
                    },
                },
            ];
        }
    };

    return (
        <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
        <Box className="my-account-page">
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            <PaymentPopup
                open={openPopupPayment}
                onClose={() => {
                    setOpenPopupPayment(false);
                    setSlipFile([]);
                }}
                file={slipfile}
                onChangeFile={setSlipFile}
                paymentData={selectedInvoice?.Payments ?? {}}
                isButtonActive={isButtonActive}
            />

            <PDFPopup
                open={openPDF}
                invoice={selectedInvoice}
                onClose={() => {
                    setOpenPDF(false);
                    setSelectedInvoice(null);
                }}
            />

            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            {/* Inspection Confirm */}
            <ConfirmDialog
                open={openConfirmInspection}
                setOpenConfirm={setOpenConfirmInspection}
                handleFunction={() => handleClickInspection("Completed", "confirm")}
                title="Confirm Maintenance Inspection"
                message="Are you sure you want to confirm the inspection of this maintenance request? This action cannot be undone."
                buttonActive={isButtonActive}
            />

            {/* Rework Confirm */}
            <ReworkPopup
                open={openConfirmRework}
                setOpenConfirm={setOpenConfirmRework}
                handleFunction={(note) => handleClickInspection("Rework Requested", "rework", note)}
                setAlerts={setAlerts}
                title="Confirm Rework Request"
                message="Are you sure you want to request a rework for this maintenance job? This action cannot be undone."
                showNoteField
                files={requestfiles}
                onChangeFiles={setRequestFiles}
            />

            {/* Cancellation From OwnRequest Confirm */}
            <ConfirmDialog
                open={openConfirmCancelled}
                setOpenConfirm={setOpenConfirmCancelled}
                handleFunction={() => handleClickCancel()}
                title="Confirm Cancel Request"
                message="Are you sure you want to cancel this request? This action cannot be undone."
                buttonActive={isButtonActive}
            />

            <Container maxWidth={false} sx={{ padding: "0px 0px !important", width: "100%" }}>
                <Grid container spacing={3} >
                    <Grid container className="title-box" direction={"row"} size={{ xs: 5 }} sx={{ gap: 1 }}>
                        <ShieldUser size={26} />
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            My Account
                        </Typography>
                    </Grid>

                    <Grid container size={{ xs: 7, sm: 7 }} sx={{ justifyContent: "flex-end" }}>
                        <Link to="/my-account/edit-profile">
                            <Button variant="containedBlue">
                                <Pencil size={20} />
                                <Typography variant="textButtonClassic">Edit Profile</Typography>
                            </Button>
                        </Link>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        {user ? (
                            <Card
                                sx={{
                                    py: 3,
                                    px: 4,
                                    borderRadius: 2,
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                }}
                            >
                                <Box sx={{ display: "flex", gap: "30px" }}>
                                    <Box
                                        sx={{
                                            minHeight: "100%",
                                            width: 120,
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                width: 120,
                                                height: 120,
                                                boxShadow: 3,
                                            }}
                                            src={`${apiUrl}/${profileImage}` || ""}
                                        />
                                    </Box>
                                    <Box
                                        sx={{
                                            width: "calc(100% - 120px)",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontSize: 22,
                                                fontWeight: 600,
                                                color: `${theme.palette.primary.main} !important`,
                                                width: "100%",
                                            }}
                                        >
                                            {user?.FirstName} {user?.LastName}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: 18,
                                                fontWeight: 500,
                                            }}
                                            gutterBottom
                                        >
                                            {user?.CompanyName}
                                        </Typography>
                                        <Grid
                                            container
                                            size={{ xs: 12 }}
                                            columnSpacing={10}
                                            rowSpacing={1.2}
                                            sx={{ mt: 2 }}
                                        >
                                            <Grid>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                                    <Briefcase
                                                        size={16}
                                                        color={theme.palette.grey[500]}
                                                    />
                                                    <Typography
                                                        sx={{
                                                            fontSize: 16,
                                                            fontWeight: 600,
                                                            color: `${theme.palette.grey[500]} !important`,
                                                        }}
                                                    >
                                                        Role
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    sx={{
                                                        fontSize: 18,
                                                        fontWeight: 500,
                                                        color: "text.primary",
                                                    }}
                                                >
                                                    {user?.Role?.Name}
                                                </Typography>
                                            </Grid>
                                            <Grid>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                                    <Mail
                                                        size={16}
                                                        color={theme.palette.grey[500]}
                                                    />
                                                    <Typography
                                                        sx={{
                                                            fontSize: 16,
                                                            fontWeight: 600,
                                                            color: `${theme.palette.grey[500]} !important`,
                                                        }}
                                                    >
                                                        Email Address
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    sx={{
                                                        fontSize: 18,
                                                        fontWeight: 500,
                                                        color: "text.primary",
                                                    }}
                                                >
                                                    {user?.Email}
                                                </Typography>
                                            </Grid>
                                            <Grid>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                                    <Phone
                                                        size={16}
                                                        color={theme.palette.grey[500]}
                                                    />
                                                    <Typography
                                                        sx={{
                                                            fontSize: 16,
                                                            fontWeight: 600,
                                                            color: `${theme.palette.grey[500]} !important`,
                                                        }}
                                                    >
                                                        Phone Number
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    sx={{
                                                        fontSize: 18,
                                                        fontWeight: 500,
                                                        color: "text.primary",
                                                    }}
                                                >
                                                    {user?.Phone}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Box>
                            </Card>
                        ) : (
                            <Skeleton variant="rectangular" width="100%" height={182} sx={{ borderRadius: 2 }} />
                        )}
                    </Grid>

                    <Grid container size={{ xs: 12, md: 12 }} spacing={2.2}>
                        <Grid size={{ xs: 9 }}>
                            <Tabs
                                value={valueTab}
                                onChange={handleChange}
                                variant="scrollable"
                                allowScrollButtonsMobile
                            >
                                <Tab label={
                                    <Badge invisible={isAdmin() || isManager()} badgeContent={notificationCounts.UnreadRequests} color="primary">
                                        Maintenance Request
                                    </Badge>
                                } {...a11yProps(0)} />
                                <Tab label="Room Booking" {...a11yProps(1)} />
                                {
                                    !(user?.IsEmployee) && user?.Role?.Name === "User" &&
                                    <Tab label={
                                        <Badge badgeContent={notificationCounts.UnreadInvoice} color="primary">
                                            Invoice
                                        </Badge>
                                    } {...a11yProps(2)} />
                                }

                                <Tab label="Payment" {...a11yProps(3)} />
                            </Tabs>
                        </Grid>
                        <Grid container size={{ xs: 3 }} sx={{ justifyContent: "flex-end" }}>
                            <Link to="/maintenance/create-maintenance-request">
                                <Button variant="contained">
                                    <FileText size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                                    <Typography variant="textButtonClassic">Create Request</Typography>
                                </Button>
                            </Link>
                        </Grid>
                        <CustomTabPanel value={valueTab} index={0}>
                            <Grid container size={{ xs: 12 }} spacing={2}>
                                {/* Filters Section */}
                                {!statusCounts ? (
                                    <Skeleton variant="rectangular" width="100%" height={70} sx={{ borderRadius: 2 }} />
                                ) : (
                                    <FilterSection
                                        searchText={searchText}
                                        setSearchText={setSearchText}
                                        selectedDate={selectedDate}
                                        setSelectedDate={setSelectedDate}
                                        selectedStatuses={selectedStatuses}
                                        setSelectedStatuses={setSelectedStatuses}
                                        handleClearFilter={handleClearFillter}
                                        requestStatuses={requestStatuses}
                                    />
                                )}
                            </Grid>

                            {/* Data Table */}
                            <Grid size={{ xs: 12, md: 12 }} minHeight={"200px"}>
                                {isLoadingData ? (
                                    <Skeleton
                                        variant="rectangular"
                                        width="100%"
                                        height={200}
                                        sx={{ borderRadius: 2 }}
                                    />
                                ) : (
                                    <CustomDataGrid
                                        rows={filteredRequests}
                                        columns={getColumns()}
                                        rowCount={total}
                                        page={page}
                                        limit={limit}
                                        onPageChange={setPage}
                                        onLimitChange={setLimit}
                                        noDataText="Maintenance request information not found."
                                    />
                                )}
                            </Grid>
                        </CustomTabPanel>
                        <CustomTabPanel value={valueTab} index={1}></CustomTabPanel>
                        <CustomTabPanel value={valueTab} index={2}>
                            <Grid size={{ xs: 12, md: 12 }} minHeight={"200px"}>
                                {isLoadingInvoice ? (
                                    <Skeleton
                                        variant="rectangular"
                                        width="100%"
                                        height={255}
                                        sx={{ borderRadius: 2 }}
                                    />
                                ) : (
                                    <CustomDataGrid
                                        key={JSON.stringify(invoices.map(i => i.StatusID))}
                                        rows={invoices.toSorted((a, b) =>
                                            (b.BillingPeriod ?? "").localeCompare(a.BillingPeriod ?? "")
                                        )}
                                        columns={getInvoiceColumns()}
                                        rowCount={invoiceTotal}
                                        page={invoicePage}
                                        limit={invoiceLimit}
                                        onPageChange={setInvoicePage}
                                        onLimitChange={setInvoiceLimit}
                                        noDataText="Invoices information not found."
                                    />
                                )}
                            </Grid>
                        </CustomTabPanel>
                        <CustomTabPanel value={valueTab} index={3}>
                            <Grid size={{ xs: 12, md: 12 }} minHeight={"200px"}>
                                {isLoadingPayment ? (
                                    <Skeleton
                                        variant="rectangular"
                                        width="100%"
                                        height={255}
                                        sx={{ borderRadius: 2 }}
                                    />
                                ) : (
                                    <CustomDataGrid
                                        rows={payments.toSorted((a, b) =>
                                            (b.PaymentDate ?? "").localeCompare(a.PaymentDate ?? "")
                                        )}
                                        columns={getPaymentColumns()}
                                        rowCount={paymentTotal}
                                        page={paymentPage}
                                        limit={paymentLimit}
                                        onPageChange={setPaymentPage}
                                        onLimitChange={setPaymentLimit}
                                        noDataText="Payments information not found."
                                    />
                                )}
                            </Grid>
                        </CustomTabPanel>
                    </Grid>
                </Grid>
            </Container>
        </Box>
        </Container>
    );
};

export default MyAccount;
