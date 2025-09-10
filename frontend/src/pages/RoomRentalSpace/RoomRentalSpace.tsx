import { Box } from "@mui/system";
import React, { useEffect, useState } from "react";
import { RentalRoomInvoiceInterface } from "../../interfaces/IRentalRoomInvoices";
import { RoomsInterface } from "../../interfaces/IRooms";
import {
    apiUrl,
    CreateInvoice,
    CreateInvoiceItems,
    CreateNotification,
    DeleteInvoiceByID,
    DeleteInvoiceItemByID,
    DeletePaymentReceiptByID,
    GetFloors,
    GetInvoiceByID,
    GetInvoiceByOption,
    GetNextInvoiceNumber,
    GetRoomRentalSpaceByID,
    GetRoomRentalSpaceByOption,
    GetRoomStatus,
    ListPaymentStatus,
    socketUrl,
    UpdateInvoiceByID,
    UpdateInvoiceItemsByID,
} from "../../services/http";
import { FloorsInterface } from "../../interfaces/IFloors";
import { RoomStatusInterface } from "../../interfaces/IRoomStatus";
import {
    Badge,
    Button,
    Card,
    CardMedia,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    Menu,
    MenuItem,
    Skeleton,
    Slide,
    Tooltip,
    Typography,
    useMediaQuery,
    Zoom,
} from "@mui/material";
import {
    Activity,
    AlignVerticalSpaceAround,
    BrushCleaning,
    Building,
    Calendar,
    Check,
    CirclePlus,
    Clock,
    DoorClosed,
    Ellipsis,
    File,
    FileText,
    FolderOpen,
    HelpCircle,
    Loader,
    Maximize,
    NotebookPen,
    Pencil,
    PencilLine,
    ReceiptText,
    Save,
    ScrollText,
    Search,
    Send,
    Trash2,
    Upload,
    Wallet,
    X,
} from "lucide-react";
import { TextField } from "../../components/TextField/TextField";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { Select } from "../../components/Select/Select";
import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";
import { GridColDef } from "@mui/x-data-grid";
import theme from "../../styles/Theme";
import { roomStatusConfig } from "../../constants/roomStatusConfig";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { RentalRoomInvoiceItemInterface } from "../../interfaces/IRentalRoomInvoiceItems";
import dayjs from "dayjs";
import { CalendarMonth, Close } from "@mui/icons-material";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import { paymentStatusConfig } from "../../constants/paymentStatusConfig";
import { TransitionProps } from "@mui/material/transitions";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import { PaymentStatusInterface } from "../../interfaces/IPaymentStatuses";
import { formatToMonthYear } from "../../utils/formatToMonthYear";
import PDFPopup from "../../components/PDFPopup/PDFPopup";
import dateFormat from "../../utils/dateFormat";
import { NotificationsInterface } from "../../interfaces/INotifications";
import { handleUpdateNotification } from "../../utils/handleUpdateNotification";
import { handleUpdatePaymentAndInvoice } from "../../utils/handleUpdatePaymentAndInvoice";
import AnimatedBell from "../../components/AnimatedIcons/AnimatedBell";
import { io } from "socket.io-client";
import { useUserStore } from "../../store/userStore";
import InvoicePDF from "../../components/InvoicePDF/InvoicePDF";
import { createRoot } from "react-dom/client";

type InvoiceItemError = {
    Description?: string;
    Amount?: string;
};

type FormErrors = {
    InvoiceNumber?: string;
    IssueDate?: string;
    DueDate?: string;
    BillingPeriod?: string;
    invoiceItems?: InvoiceItemError[];
};

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<unknown>;
    },
    ref: React.Ref<unknown>
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function RoomRentalSpace() {
    const { user } = useUserStore();
    const [rooms, setRooms] = useState<RoomsInterface[]>([]);
    const [invoices, setInvoices] = useState<RentalRoomInvoiceInterface[]>([]);
    const [floors, setFloors] = useState<FloorsInterface[]>([]);
    const [roomstatuses, setRoomStatuses] = useState<RoomStatusInterface[]>([]);
    const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatusInterface[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<RoomsInterface | null>();
    const [selectedInvoice, setSelectedInvoice] = useState<RentalRoomInvoiceInterface | null>();
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [isLoadingInvoice, setIsLoadingInvoice] = useState<boolean>(true);
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [invoiceNumber, setInvoiceNumber] = useState()

    const [searchTextRoom, setSearchTextRoom] = useState("");
    const [searchTextInvoice, setSearchTextInvoice] = useState("");
    const [selectedOption, setSelectedOption] = useState({
        floorID: 0,
        roomStatusID: 0,
        paymentStatusID: 0,
    });

    const today = dayjs();
    const issueDate = today.toISOString();
    const dueDate = today.date(15).toISOString();
    const billingPeriod = today.subtract(1, "month").endOf("month").toISOString();
    const [invoiceFormData, setInvoiceFormData] = useState<RentalRoomInvoiceInterface>({
        InvoiceNumber: "",
        IssueDate: issueDate,
        DueDate: dueDate,
        BillingPeriod: billingPeriod,
        TotalAmount: 0,
        CreaterID: 0,
        RoomID: 0,
    });
    const [invoiceItemFormData, setInvoiceItemFormData] = useState<RentalRoomInvoiceItemInterface[]>([
        {
            Description: "ค่าใช้บริการพื้นที่",
            Amount: 0.0,
            RentalRoomInvoiceID: 0,
        },
        {
            Description: "ค่าใช้บริการไฟฟ้า",
            Amount: 0.0,
            RentalRoomInvoiceID: 0,
        },
    ]);

    const [roomPage, setRoomPage] = useState(0);
    const [roomLimit, setRoomLimit] = useState(20);
    const [roomTotal, setRoomTotal] = useState(0);

    const [invoicePage, setInvoicePage] = useState(0);
    const [invoiceLimit, setInvoiceLimit] = useState(10);
    const [invoiceTotal, setInvoiceTotal] = useState(0);

    const [openCreatePopup, setOpenCreatePopup] = useState(false);
    const [openPaymentPopup, setOpenPaymentPopup] = useState(false);
    const [openInvoicePopup, setOpenInvoicePopup] = useState(false);
    const [openDeletePopup, setOpenDeletePopup] = useState(false);
    const [openConfirmRejected, setOpenConfirmRejected] = useState<boolean>(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isButtonActive, setIsButtonActive] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [openPDF, setOpenPDF] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const openButtonMenu = Boolean(anchorEl);

    const userID = localStorage.getItem('userId')

    const getRooms = async () => {
        try {
            const resRooms = await GetRoomRentalSpaceByOption(
                roomPage,
                roomLimit,
                selectedOption.floorID,
                selectedOption.roomStatusID
            );
            if (resRooms) {
                setRoomTotal(resRooms.total);
                setRooms(resRooms.data);
            }
        } catch (error) {
            console.error("Error fetching rooms:", error);
        }
    };

    const getInvoice = async () => {
        setIsLoadingInvoice(true);
        try {
            const resInvoice = await GetInvoiceByOption(
                invoicePage,
                invoiceLimit,
                selectedRoom?.ID,
                selectedOption.paymentStatusID
            );
            if (resInvoice) {
                setInvoiceTotal(resInvoice.total);
                setInvoices(resInvoice.data);
                setIsLoadingInvoice(false);
            }
        } catch (error) {
            console.error("Error fetching invoices:", error);
        }
    };

    const getInvoiceNumber = async () => {
        setIsLoadingInvoice(true);
        try {
            const resInvoice = await GetNextInvoiceNumber();
            if (resInvoice) {
                setInvoiceFormData((prev) => ({ ...prev, InvoiceNumber: resInvoice.next_invoice_number }));
            }
        } catch (error) {
            console.error("Error fetching invoice number:", error);
        }
    };

    const getFloors = async () => {
        try {
            const resFloors = await GetFloors();
            if (resFloors) {
                setFloors(resFloors);
            }
        } catch (error) {
            console.error("Error fetching floor:", error);
        }
    };

    const getRoomStatuses = async () => {
        try {
            const resStatuses = await GetRoomStatus();
            if (resStatuses) {
                setRoomStatuses(resStatuses);
            }
        } catch (error) {
            console.error("Error fetching room statuses:", error);
        }
    };

    const getPaymentStatuses = async () => {
        try {
            const resStatuses = await ListPaymentStatus();
            if (resStatuses) {
                setPaymentStatuses(resStatuses);
            }
        } catch (error) {
            console.error("Error fetching payment statuses:", error);
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

    const getUpdateRoom = async (ID: number) => {
        try {
            const res = await GetRoomRentalSpaceByID(ID);
            if (res) {
                setRooms((prev) => prev.map((item) => (item.ID === res.ID ? res : item)));
            }
        } catch (error) {
            console.error("Error updating room:", error);
        }
    };

    const handleClearFillter = () => {
        setSelectedOption({
            floorID: 0,
            roomStatusID: 0,
            paymentStatusID: 0,
        });
    };

    const handleIncreaseItem = () => {
        setInvoiceItemFormData([
            ...invoiceItemFormData,
            {
                Description: "",
                Amount: 0,
                RentalRoomInvoiceID: 0,
            },
        ]);
    };

    const handleDecreaseItem = (index: number) => {
        setInvoiceFormData((form) => ({
            ...form,
            TotalAmount: (form.TotalAmount ?? 0) - (invoiceItemFormData[index]?.Amount ?? 0),
        }));
        setInvoiceItemFormData(invoiceItemFormData.filter((_, i) => i !== index));
    };

    const handleDateChange = (field: string, value: dayjs.Dayjs | null) => {
        setInvoiceFormData((prev) => ({
            ...prev,
            [field]: value ? value.toISOString() : "",
        }));
    };

    const handleInputInvoiceItemChange = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const target = e.target as HTMLInputElement;

        const { name, value, type } = target;
        const checked = type === "checkbox" ? target.checked : undefined;

        const numberFields = ["Amount", "UnitPrice"];

        setInvoiceItemFormData((prev) => {
            const newData = [...prev];
            newData[index] = {
                ...newData[index],
                [name]:
                    type === "checkbox"
                        ? checked
                        : numberFields.includes(name)
                            ? value === ""
                                ? ""
                                : Number(value)
                            : value,
            };

            const total = newData.reduce((sum, item) => sum + (Number(item.Amount) || 0), 0);

            setInvoiceFormData((form) => ({
                ...form,
                TotalAmount: total,
            }));

            return newData;
        });
    };

    const handleCreateInvoice = async () => {
        setIsButtonActive(true);
        setAlerts([])
        if (!validateForm()) {
            setIsButtonActive(false);
            return;
        }

        if (user?.ID === 0) {
            handleSetAlert("error", "UserID not found");
            setIsButtonActive(false);
            return;
        } else {
            invoiceFormData.CreaterID = user?.ID;
        }

        if (!user?.SignaturePath || user.SignaturePath === "") {
            handleSetAlert("warning", "Please upload your signature before proceeding.");
            setIsButtonActive(false);
            return;
        }

        if (!selectedRoom) {
            handleSetAlert("error", "Room not found");
            setIsButtonActive(false);
            return;
        } else {
            invoiceFormData.RoomID = selectedRoom.ID;
            const serviceAreas = selectedRoom.ServiceAreaDocument?.map((doc) => doc.RequestServiceArea).filter(Boolean);
            console.log("selectedRoom: ", selectedRoom)

            if (serviceAreas && serviceAreas.length > 0) {
                const lastRequestServiceArea = serviceAreas[serviceAreas.length - 1];
                invoiceFormData.CustomerID = lastRequestServiceArea?.UserID;
            }

            const dueDate = new Date(invoiceFormData.DueDate ?? "");
            dueDate.setHours(23, 59, 59, 999);
            invoiceFormData.DueDate = dueDate.toISOString();
        }

        try {
            console.log("invoiceFormData: ", invoiceFormData)
            const resInvoice = await CreateInvoice(invoiceFormData);

            const updatedItems = invoiceItemFormData.map((item) => ({
                ...item,
                RentalRoomInvoiceID: resInvoice.data.ID,
            }));

            const results = await Promise.all(
                updatedItems.map((item) =>
                    CreateInvoiceItems(item).catch((err) => {
                        return { error: err, item };
                    })
                )
            );

            const failedItems = results.filter((r: any) => r?.error);
            if (failedItems.length > 0) {
                console.warn("⚠️ Some invoice items failed:", failedItems);
            }

            const notificationData: NotificationsInterface = {
                RentalRoomInvoiceID: resInvoice.data.ID,
            };

            const resNotification = await CreateNotification(notificationData);
            if (!resNotification) {
                console.error("Failed to create notification")
                return;
            }

            await handleUploadPDF(resInvoice.data.ID);

            handleSetAlert("success", "Invoice created successfully!");
            setTimeout(() => {
                setIsButtonActive(false);
                setOpenCreatePopup(false);
                handleClearForm();
                if (!openInvoicePopup) {
                    setSelectedRoom(null);
                }
                getInvoice()
            }, 500);
        } catch (error: any) {
            console.error("🚨 Error creating invoice:", error);
            if (error.status === 409) {
                handleSetAlert("error", error.response?.data?.error || "Failed to create invoice");
            } else {
                handleSetAlert("error", "An unexpected error occurred");
            }
            setIsButtonActive(false);
        }
    };

    const handleUploadPDF = (invoiceId: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            try {
                const container = document.createElement("div");
                container.style.display = "none";
                document.body.appendChild(container);

                const root = createRoot(container);

                const handlePDFCompleted = () => {
                    root.unmount();
                    container.remove();
                    resolve();
                };

                const resInvoice = await GetInvoiceByID(invoiceId);
            root.render(<InvoicePDF invoice={resInvoice} onComplete={handlePDFCompleted} />);
            } catch (error) {
                console.error("🚨 Error creating invoice:", error);
                reject(error);
            }
        });
    };

    const handleDeleteInvoice = async () => {
        setIsButtonActive(true);
        setAlerts([])
        if (!selectedInvoice?.ID) {
            handleSetAlert("error", "InvoiceID not found");
            setIsButtonActive(false);
            return;
        }

        try {
            await DeleteInvoiceByID(selectedInvoice?.ID ?? 0);

            await handleUpdateNotification(selectedInvoice.CustomerID ?? 0, true, undefined, undefined, selectedInvoice?.ID);
            await handleUpdateNotification(selectedInvoice.CreaterID ?? 0, true, undefined, undefined, selectedInvoice?.ID);

            handleSetAlert("success", "Invoice deleted successfully!");

            setTimeout(() => {
                getInvoice();
                setIsButtonActive(false);
            }, 1800);
        } catch (error) {
            console.error("🚨 Unexpected error while deleting invoice:", error);
            handleSetAlert("error", "An unexpected error occurred while deleting the invoice");
            setIsButtonActive(false);
        }
    };

    const handleUpdateInvoice = async () => {
        setIsButtonActive(true);
        setAlerts([])
        if (!validateForm()) {
            setIsButtonActive(false);
            return;
        }

        try {
            const dueDate = new Date(invoiceFormData.DueDate ?? "");
            dueDate.setHours(23, 59, 59, 999);
            invoiceFormData.DueDate = dueDate.toISOString();

            await UpdateInvoiceByID(selectedInvoice?.ID ?? 0, invoiceFormData);

            if (selectedInvoice?.Items) {
                const deletedItems = selectedInvoice.Items.filter(
                    (oldItem) => !invoiceItemFormData.some((newItem) => newItem.ID === oldItem.ID)
                );

                await Promise.all(
                    deletedItems.map((item) =>
                        DeleteInvoiceItemByID(item.ID ?? 0).catch((err) => ({ error: err, item }))
                    )
                );

                const newItems = invoiceItemFormData.filter((item) => !item.ID);
                if (newItems.length > 0) {
                    await Promise.all(
                        newItems.map((item) =>
                            CreateInvoiceItems({ ...item, RentalRoomInvoiceID: selectedInvoice.ID }).catch((err) => ({
                                error: err,
                                item,
                            }))
                        )
                    );
                }

                const updatedItems = invoiceItemFormData
                    .filter((item) => !!item.ID)
                    .map((item) => ({
                        ...item,
                        InvoiceID: selectedInvoice.ID,
                    }));

                const results = await Promise.all(
                    updatedItems.map((item) =>
                        UpdateInvoiceItemsByID(item.ID ?? 0, item).catch((err) => ({ error: err, item }))
                    )
                );

                const failedItems = results.filter((r: any) => r?.error);
                if (failedItems.length > 0) {
                    console.warn("⚠️ Some invoice items failed:", failedItems);
                }
            }

            handleSetAlert("success", "The invoice has been updated successfully.");
            setTimeout(() => {
                setIsButtonActive(false);
                setSelectedInvoice(null);
                handleClearForm();
                setInvoices([]);
                getInvoice();
            }, 1800);
        } catch (error) {
            console.error("🚨 Error updating invoice:", error);
            handleSetAlert("error", "An unexpected error occurred");
            setIsButtonActive(false);
        }
    };

    const handleClickUpdatePayment = async (statusName: "Awaiting Receipt" | "Rejected", note?: string) => {
        setIsButtonActive(true);
        setAlerts([])
        if (!selectedInvoice?.ID) {
            handleSetAlert("error", "Invoice not found");
            setIsButtonActive(false);
            return;
        }

        if (statusName === "Rejected" && (!note || note.trim() === "")) {
            handleSetAlert("warning", "Please enter a reason before reject requested.");
            setIsButtonActive(false);
            return;
        }

        try {
            const statusID = paymentStatuses.find((item) => item.Name === statusName)?.ID;
            if (!statusID) {
                console.error("Invalid payment status");
                setIsButtonActive(false);
                return;
            }

            const approverId = Number(localStorage.getItem("userId"));
            await handleUpdatePaymentAndInvoice(
                selectedInvoice.ID,
                selectedInvoice?.Payments?.ID ?? 0,
                statusID,
                approverId,
                note
            );

            await handleUpdateNotification(selectedInvoice.CreaterID ?? 0, true, undefined, undefined, selectedInvoice?.ID);

            if (statusName === "Rejected") {
                await handleUpdateNotification(selectedInvoice.CustomerID ?? 0, false, undefined, undefined, selectedInvoice?.ID);
            }

            handleSetAlert("success", "Payment slip has been verified successfully.");

            setTimeout(() => {
                setIsButtonActive(false);
                setSelectedInvoice(null);
                setInvoices([]);
                getInvoice();
                setOpenPaymentPopup(false);
            }, 1800);
        } catch (error) {
            console.error("🚨 Error updating payment:", error);
            handleSetAlert("error", "An unexpected error occurred");
            setIsButtonActive(false);
        }
    };

    const handlePDFUploadReceipt = async (
        event: React.ChangeEvent<HTMLInputElement>,
        data: RentalRoomInvoiceInterface
    ) => {
        setAlerts([])
        const file = event.target.files?.[0];
        if (!file || !(file.type === "application/pdf")) {
            handleSetAlert("warning", "Please select a valid PDF file");
            return
        }

        try {
            const statusID = paymentStatuses.find((item) => item.Name === 'Paid')?.ID;
            if (!statusID) {
                console.error("Invalid payment status");
                return;
            }

            await handleUpdatePaymentAndInvoice(
                data.ID ?? 0,
                data.Payments?.ID ?? 0,
                statusID ?? 0,
                undefined,
                undefined,
                undefined,
                file
            )

            handleSetAlert("success", "Receipt uploaded successfully");

            setTimeout(() => {
                setSelectedInvoice(null);
                setAnchorEl(null);
                getInvoice();
            }, 1800);
        } catch (error) {
            console.error("🚨 Error uploading receipt:", error);
            handleSetAlert("error", "An unexpected error occurred");
        }
    };

    const handleDeleteReceipt = async (data: RentalRoomInvoiceInterface) => {
        setAlerts([])
        try {
            await DeletePaymentReceiptByID(data.Payments?.ID ?? 0);

            const statusID = paymentStatuses.find((item) => item.Name === 'Awaiting Receipt')?.ID;
            if (!statusID) {
                console.error("Invalid payment status");
                return;
            }
            await handleUpdatePaymentAndInvoice(
                data.ID ?? 0,
                data.Payments?.ID ?? 0,
                statusID ?? 0,
            )

            handleSetAlert("success", "Receipt deleted successfully");


            setTimeout(() => {
                setAnchorEl(null);
                getInvoice();
            }, 1800);
        } catch (error) {
            console.error("🚨 Error deleting receipt:", error);
            handleSetAlert("error", "Failed to delete receipt");
        }
    };

    const handleClickButtonMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const validateForm = () => {
        const newErrors: { [key: string]: any } = {};

        // Validate Invoice
        if (!invoiceFormData.InvoiceNumber || !invoiceFormData.InvoiceNumber.trim()) {
            newErrors.InvoiceNumber = "Please select the issue date.";
        }
        if (!invoiceFormData.IssueDate) {
            newErrors.IssueDate = "Please select the issue date.";
        }
        if (!invoiceFormData.DueDate) {
            newErrors.DueDate = "Please select the due date.";
        }
        if (!invoiceFormData.BillingPeriod) {
            newErrors.BillingPeriod = "Please select the billing period.";
        }
        if (invoiceFormData.IssueDate && invoiceFormData.DueDate) {
            const start = new Date(invoiceFormData.IssueDate);
            const end = new Date(invoiceFormData.DueDate);
            if (end < start) {
                newErrors.DueDate = "The end date must be later than the start date.";
            }
        }

        // Validate Invoice Items
        const itemErrors: { Description?: string; Amount?: string }[] = [];

        invoiceItemFormData.forEach((item, index) => {
            const errorItem: { Description?: string; Amount?: string } = {};
            if (!item.Description || !item.Description.trim()) {
                errorItem.Description = "Please enter description.";
            }
            if (item.Amount === null || item.Amount === undefined || item.Amount === 0) {
                errorItem.Amount = "Please enter amount.";
            } else if (item.Amount < 0) {
                errorItem.Amount = "Amount cannot be negative.";
            }
            itemErrors[index] = errorItem;
        });

        newErrors.invoiceItems = itemErrors;

        setErrors(newErrors);

        // Check if there are any errors
        const hasErrors =
            Object.keys(newErrors).length > 0 &&
            (Object.keys(newErrors).some((k) => k !== "invoiceItems") ||
                itemErrors.some((e) => Object.keys(e).length > 0));

        return !hasErrors;
    };

    const handleSetAlert = (type: "success" | "error" | "warning", message: string) => {
        setAlerts((prevAlerts) => [...prevAlerts, { type, message }]);
    };

    const handleClearForm = () => {
        setInvoiceFormData({
            ID: 0,
            IssueDate: issueDate,
            DueDate: dueDate,
            BillingPeriod: billingPeriod,
            TotalAmount: 0,
            CreaterID: 0,
            RoomID: 0,
        });

        setInvoiceItemFormData([
            {
                Description: "ค่าใช้บริการพื้นที่",
                Amount: 0.0,
                RentalRoomInvoiceID: 0,
            },
            {
                Description: "ค่าใช้บริการไฟฟ้า",
                Amount: 0.0,
                RentalRoomInvoiceID: 0,
            },
        ]);
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await Promise.all([getRooms(), getFloors(), getRoomStatuses(), getPaymentStatuses()]);
                setIsLoadingData(false);
            } catch (error) {
                console.log("Error fetching initial data: ", error);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (floors && roomstatuses) {
            getRooms();
        }
    }, [roomPage, roomLimit]);

    useEffect(() => {
        if (openInvoicePopup) {
            getInvoice();
        } else {
            getRooms();
        }
    }, [selectedOption]);

    useEffect(() => {
        getInvoice();
    }, [invoicePage, invoiceLimit]);

    useEffect(() => {
        if (openInvoicePopup && selectedRoom) {
            getInvoice();
        }
    }, [openInvoicePopup]);

    useEffect(() => {
        if (isEditMode && selectedInvoice && selectedInvoice.Items) {
            setInvoiceFormData(selectedInvoice);
            setInvoiceItemFormData(selectedInvoice.Items);
        }
    }, [selectedInvoice, isEditMode]);

    useEffect(() => {
        const socket = io(socketUrl);

        socket.on("invoice_created", (data) => {
            console.log("📦 New invoice:", data);
            setTimeout(() => {
                getUpdateRoom(data.RoomID)
            }, 1500);
        });

        socket.on("invoice_deleted", (data) => {
            console.log("🔄 Invoice deleted:", data);
            setTimeout(() => {
                getUpdateRoom(data.RoomID)
            }, 1500);
        });

        socket.on("invoice_updated", (data) => {
            console.log("🔄 Invoice updated:", data);
            setTimeout(() => {
                getUpdateRoom(data.RoomID)
                getUpdateInvoice(data.ID);
            }, 1500);
        });

        return () => {
            socket.off("invoice_created");
            socket.off("invoice_updated");
            socket.off("invoice_deleted");
        };
    }, []);

    const filteredRooms = rooms.filter((item) => {
        const roomNumber = item.RoomNumber;

        const matchText = !searchTextRoom || roomNumber?.includes(searchTextRoom.toLocaleLowerCase());

        return matchText;
    });

    const filteredInvoices = invoices.filter((item) => {
        const invoiceNumber = item.InvoiceNumber;
        const billingPeriod = formatToMonthYear(item.BillingPeriod || "");
        const totalAmount = String(item.TotalAmount);

        const matchText =
            !searchTextInvoice ||
            invoiceNumber?.includes(searchTextInvoice.toLocaleLowerCase()) ||
            billingPeriod?.includes(searchTextInvoice.toLocaleLowerCase()) ||
            totalAmount?.includes(searchTextInvoice);

        return matchText;
    });

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

    // const navigate = useNavigate();

    const getRoomColumns = (): GridColDef[] => {
        if (isSmallScreen) {
            return [
                {
                    field: "All Rental Room",
                    headerName: "All Rental Room",
                    flex: 1,
                    renderCell: (item) => {
                        const data = item.row;

                        const statusName = data.RoomStatus?.status_name
                        const statusKey = statusName as keyof typeof roomStatusConfig;
                        const {
                            color: statusColor,
                            colorLite: statusColorLite,
                            icon: statusIcon,
                        } = roomStatusConfig[statusKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: HelpCircle,
                        };
                        const Icon = statusIcon

                        const roomNumber = data.RoomNumber;
                        const floor = data.Floor.Number;
                        const roomSize = data.RoomSize;

                        const doc = data.ServiceAreaDocument;
                        let userType = "";
                        let companyName = "";
                        if (doc && doc.length > 0) {
                            userType = doc[doc.length - 1].ServiceUserType.Name;
                            companyName = doc[doc.length - 1].RequestServiceArea.User.CompanyName;
                        }

                        const invoice = data.RentalRoomInvoices ?? [];
                        const hasNotification = invoice.some(
                            (inv: RentalRoomInvoiceInterface) => inv.Notifications?.some((noti: NotificationsInterface) => noti.UserID === Number(userID) && !noti.IsRead)
                        );

                        const now = new Date();
                        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        const hasInvoiceCreated = invoice.some((inv: RentalRoomInvoiceInterface) => {
                            if (!inv.BillingPeriod) return false;

                            const billDate = new Date(inv.BillingPeriod);
                            return (
                                billDate.getFullYear() === prevMonth.getFullYear() &&
                                billDate.getMonth() === prevMonth.getMonth()
                            );
                        });

                        return (
                            <Grid container size={{ xs: 12 }} sx={{ px: 1 }} className="card-item-container" rowSpacing={1}>
                                <Grid size={{ xs: 12, mobileS: 7 }}>
                                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: "5px", width: "100%" }}>
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                maxWidth: "100%",
                                            }}
                                        >
                                            {`Room No. ${roomNumber}, Floor ${floor}`}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.4, my: 0.8 }}>
                                        <Maximize size={14} style={{ minWidth: '14px', minHeight: '14px', marginBottom: '2px' }} />
                                        <Typography
                                            sx={{
                                                fontSize: 13,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {`Size: ${roomSize} sqm`}
                                        </Typography>
                                    </Box>
                                    {
                                        companyName !== "" &&
                                        <>
                                            <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.4, mt: 1, mb: 0 }}>
                                                <Building size={14} style={{ minWidth: '14px', minHeight: '14px', marginBottom: '2px' }} />
                                                <Typography
                                                    sx={{
                                                        fontSize: 13,
                                                        // whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                >
                                                    {companyName}
                                                </Typography>
                                            </Box>
                                            <Typography
                                                sx={{
                                                    fontSize: 12,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    maxWidth: "100%",
                                                    color: "text.secondary",
                                                    ml: 1.9
                                                }}
                                            >
                                                ({userType})
                                            </Typography>
                                        </>
                                    }
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
                                        <Icon size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
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
                                    <Typography
                                        display={statusName === "Unavailable" ? 'block' : 'none'}
                                        variant="body1"
                                        sx={{
                                            fontSize: '12px',
                                            textAlign: 'center',
                                            color: 'text.secondary',
                                            lineHeight: 1
                                        }}
                                    >
                                        {hasInvoiceCreated ? 'Invoice created' : 'Invoice not created'}
                                    </Typography>
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
                                                <Tooltip title={"Create Invoice"}>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => {
                                                            setOpenCreatePopup(true);
                                                            getInvoiceNumber();
                                                            setSelectedRoom(data);
                                                        }}
                                                        sx={{
                                                            minWidth: "42px",
                                                            width: '100%',
                                                            height: '100%'
                                                        }}
                                                        disabled={statusName === "Available"}
                                                    >
                                                        <NotebookPen size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
                                                        <Typography variant="textButtonClassic" className="text-btn">
                                                            Create Invoice
                                                        </Typography>
                                                    </Button>
                                                </Tooltip>
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Badge
                                                    variant="dot"
                                                    invisible={!hasNotification}
                                                    color="primary"
                                                    sx={{
                                                        width: '100%',
                                                        "& .MuiBadge-dot": {
                                                            height: "12px",
                                                            minWidth: "12px",
                                                            borderRadius: "50%",
                                                        },
                                                        "& .MuiBadge-badge": {
                                                            top: 2,
                                                            right: 2,
                                                        }
                                                    }}
                                                >
                                                    <Tooltip title={"Invoice List"}>
                                                        <Button
                                                            variant="outlinedGray"
                                                            onClick={() => {
                                                                setOpenInvoicePopup(true);
                                                                setSelectedRoom(data);
                                                            }}
                                                            sx={{
                                                                minWidth: "42px",
                                                                bgcolor: "#FFFFFF",
                                                                width: '100%',
                                                                height: '100%'
                                                            }}
                                                        >
                                                            <FolderOpen size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
                                                            <Typography variant="textButtonClassic" className="text-btn">
                                                                Invoice List
                                                            </Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Badge>
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
                    field: "RoomDetails",
                    headerName: "Room Details",
                    type: "string",
                    flex: 0.6,
                    renderCell: (item) => {
                        const roomNumber = item.row.RoomNumber;
                        const floor = item.row.Floor.Number;
                        const roomSize = item.row.RoomSize;

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
                                    {`Room No. ${roomNumber}, Floor ${floor}`}
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
                                    {`Room Size: ${roomSize} sqm`}
                                </Typography>
                            </Box>
                        );
                    },
                },
                {
                    field: "CompanyName",
                    headerName: "Company Name",
                    type: "string",
                    flex: 0.8,
                    renderCell: (item) => {
                        const doc = item.row.ServiceAreaDocument;
                        let userType = "";
                        let companyName = "";
                        if (doc && doc.length > 0) {
                            userType = doc[doc.length - 1].ServiceUserType.Name;
                            companyName = doc[doc.length - 1].RequestServiceArea.User.CompanyName;
                        }

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
                                    {`${companyName}`}
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
                                    {`${userType}`}
                                </Typography>
                            </Box>
                        );
                    },
                },
                {
                    field: "RoomStatus",
                    headerName: "Room Status",
                    type: "string",
                    flex: 0.5,
                    renderCell: (item) => {
                        const statusName = item.value.status_name || "";
                        const statusKey = item.value.status_name as keyof typeof roomStatusConfig;
                        const { color, colorLite, icon } = roomStatusConfig[statusKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: HelpCircle,
                        };
                        const Icon = icon

                        const data = item.row;
                        const invoice = data.RentalRoomInvoices ?? [];
                        const now = new Date();
                        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        const hasInvoiceCreated = invoice.some((inv: RentalRoomInvoiceInterface) => {
                            if (!inv.BillingPeriod) return false;

                            const billDate = new Date(inv.BillingPeriod);
                            return (
                                billDate.getFullYear() === prevMonth.getFullYear() &&
                                billDate.getMonth() === prevMonth.getMonth()
                            );
                        });

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
                                    <Icon size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
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
                                <Typography
                                    display={statusName === "Unavailable" ? 'block' : 'none'}
                                    variant="body1"
                                    sx={{
                                        fontSize: '12px',
                                        mt: 1,
                                        textAlign: 'center',
                                        color: 'text.secondary',
                                        lineHeight: 1
                                    }}
                                >
                                    {hasInvoiceCreated ? 'Invoice created' : 'Invoice not created'}
                                </Typography>
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
                        const statusName = data.RoomStatus?.status_name

                        const invoice = data.RentalRoomInvoices ?? [];
                        const hasNotification = invoice.some(
                            (inv: RentalRoomInvoiceInterface) => inv.Notifications?.some((noti: NotificationsInterface) => noti.UserID === Number(userID) && !noti.IsRead)
                        );

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
                                <Tooltip title={"Create Invoice"}>
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            setOpenCreatePopup(true);
                                            setSelectedRoom(data);
                                            getInvoiceNumber();
                                        }}
                                        sx={{
                                            minWidth: "42px",
                                        }}
                                        disabled={statusName === "Available"}
                                    >
                                        <NotebookPen size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
                                        {/* <Typography variant="textButtonClassic" className="text-btn">
                                            Create Invoice
                                        </Typography> */}
                                    </Button>
                                </Tooltip>
                                <Badge
                                    variant="dot"
                                    invisible={!hasNotification}
                                    color="primary"
                                    sx={{
                                        "& .MuiBadge-dot": {
                                            height: "12px",
                                            minWidth: "12px",
                                            borderRadius: "50%",
                                        },
                                        "& .MuiBadge-badge": {
                                            top: 2,
                                            right: 2,
                                        }
                                    }}
                                >
                                    <Tooltip title={"Invoice List"}>
                                        <Button
                                            variant="outlinedGray"
                                            onClick={() => {
                                                setOpenInvoicePopup(true);
                                                setSelectedRoom(data);
                                            }}
                                            sx={{
                                                minWidth: "42px",
                                                bgcolor: "#FFFFFF",
                                            }}
                                        >
                                            <FolderOpen size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
                                            {/* <Typography variant="textButtonClassic" className="text-btn">
                                            Invoice List
                                        </Typography> */}
                                        </Button>
                                    </Tooltip>
                                </Badge>
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

                        const Icon = statusIcon

                        const invoiceNumber = data.InvoiceNumber
                        const billingPeriod = formatToMonthYear(data.BillingPeriod)
                        const dueDate = dateFormat(data.DueDate)
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

                        const invoicePDFPath = data.InvoicePDFPath

                        const notification = data.Notifications ?? [];
                        const hasNotificationForUser = notification.some((n: NotificationsInterface) => n.UserID === Number(userID) && !n.IsRead);

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
                                                fontWeight: 500
                                            }}
                                        >
                                            {invoiceNumber}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.6, my: 0.8 }}>
                                        <Calendar size={16} style={{ minWidth: '16px', minHeight: '16px', marginBottom: '2px' }} />
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
                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.6, my: 0.8 }}>
                                        <Clock
                                            size={14}
                                            style={{
                                                minHeight: '14px',
                                                minWidth: '14px',
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
                                            {`Due Date: ${dueDate}`}
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
                                        <Icon size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
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
                                        (statusName === "Awaiting Receipt" || statusName === "Paid") ? (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.8,
                                                    width: '100%',
                                                }}
                                            >
                                                <Button
                                                    id="basic-button"
                                                    aria-controls={openButtonMenu ? 'basic-menu' : undefined}
                                                    aria-haspopup="true"
                                                    aria-expanded={openButtonMenu ? 'true' : undefined}
                                                    onClick={handleClickButtonMenu}
                                                    variant="outlinedGray"
                                                    sx={{
                                                        minWidth: '42px'
                                                    }}
                                                >
                                                    <Ellipsis size={16} style={{ minWidth: '16px', minHeight: '16px' }} />
                                                </Button>
                                                <Menu
                                                    id="basic-menu"
                                                    anchorEl={anchorEl}
                                                    open={openButtonMenu}
                                                    onClose={() => setAnchorEl(null)}
                                                    slotProps={{
                                                        list: {
                                                            'aria-labelledby': 'basic-button',
                                                        },
                                                    }}
                                                    sx={{ fontSize: 14 }}
                                                >
                                                    <MenuItem>
                                                        <input
                                                            accept="application/pdf"
                                                            style={{ display: "none" }}
                                                            id="upload-new-pdf-input"
                                                            type="file"
                                                            onChange={(e) => handlePDFUploadReceipt(e, data)}
                                                        />
                                                        <label htmlFor="upload-new-pdf-input">
                                                            <Typography component="span" sx={{ fontSize: 14 }}>
                                                                Upload New File
                                                            </Typography>
                                                        </label>
                                                    </MenuItem>
                                                    {
                                                        statusName === "Paid" &&
                                                        <MenuItem
                                                            sx={{ fontSize: 14 }}
                                                            onClick={() => handleDeleteReceipt(data)}
                                                        >
                                                            Delete File
                                                        </MenuItem>
                                                    }

                                                </Menu>

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
                                                                "&:hover": {
                                                                    color: 'primary.main',
                                                                    borderColor: 'primary.main'
                                                                },
                                                                height: '32.5px',
                                                                width: { xs: "100%", mobileS: "auto" },
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
                                                                width: { xs: "100%", mobileS: "auto" },
                                                            }}
                                                        >
                                                            <File size={16} style={{ minWidth: '16px', minHeight: '16px' }} />
                                                            <Typography
                                                                variant="body1"
                                                                onClick={() => window.open(`${apiUrl}/${receiptPath}`, "_blank")}
                                                                sx={{
                                                                    fontSize: 14,
                                                                }}
                                                            >
                                                                No file uploaded
                                                            </Typography>
                                                        </Box>
                                                    )
                                                }
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
                                                    width: { xs: "100%", mobileS: "auto" },
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
                                            {
                                                data.Payments &&
                                                <Grid size={{ xs: 6 }}>
                                                    <Tooltip title="View Slip">
                                                        <Button
                                                            variant="contained"
                                                            onClick={() => {
                                                                setSelectedInvoice((prev) => ({
                                                                    ...prev,
                                                                    ...data,
                                                                }));
                                                                setOpenPaymentPopup(true);
                                                            }}
                                                            sx={{ minWidth: "42px", width: '100%', minHeight: '100%' }}
                                                        >
                                                            <Wallet size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
                                                            {
                                                                (width && width > 350) &&
                                                                <Typography variant="textButtonClassic" className="text-btn">
                                                                    View Slip
                                                                </Typography>
                                                            }
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                            }
                                            <Grid size={{ xs: statusName === "Pending Payment" ? 6 : 6 }}>
                                                <Tooltip title="Download PDF">
                                                    <Button
                                                        variant="outlinedGray"
                                                        // onClick={async () => {
                                                        //     setOpenPDF(true);
                                                        //     setSelectedInvoice(data);
                                                        // }}
                                                        onClick={() => window.open(`${apiUrl}/${invoicePDFPath}`, "_blank")}
                                                        sx={{ minWidth: "42px", width: '100%', height: '100%' }}
                                                    >
                                                        <FontAwesomeIcon icon={faFilePdf} style={{ fontSize: 16 }} />
                                                        {
                                                            (width && width > 350) &&
                                                            <Typography variant="textButtonClassic" className="text-btn">
                                                                Download PDF
                                                            </Typography>
                                                        }
                                                    </Button>
                                                </Tooltip>
                                            </Grid>
                                            {
                                                statusName === "Pending Payment" &&
                                                <>
                                                    <Grid size={{ xs: 3 }}>
                                                        <Tooltip title="Edit Invoice">
                                                            <Button
                                                                variant="outlinedGray"
                                                                onClick={() => {
                                                                    setIsEditMode(true);
                                                                    setSelectedInvoice(data);
                                                                    setOpenCreatePopup(true);
                                                                }}
                                                                sx={{ minWidth: "42px", bgcolor: "#FFF", width: '100%', height: '100%' }}
                                                            >
                                                                <Pencil size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
                                                                {
                                                                    (width && width > 350) &&
                                                                    <Typography variant="textButtonClassic" className="text-btn">
                                                                        Edit
                                                                    </Typography>
                                                                }

                                                            </Button>
                                                        </Tooltip>
                                                    </Grid>
                                                    <Grid size={{ xs: 3 }}>
                                                        <Tooltip title="Delete Invoice">
                                                            <Button
                                                                variant="outlinedCancel"
                                                                onClick={() => {
                                                                    setSelectedInvoice((prev) => ({
                                                                        ...prev,
                                                                        ...data,
                                                                    }));

                                                                    setOpenDeletePopup(true);
                                                                }}
                                                                sx={{
                                                                    minWidth: "42px",
                                                                    bgcolor: "#FFF",
                                                                    width: '100%',
                                                                    minHeight: '100%',
                                                                }}
                                                            >
                                                                <Trash2 size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
                                                                {
                                                                    (width && width > 350) &&
                                                                    <Typography variant="textButtonClassic" className="text-btn">
                                                                        Delete
                                                                    </Typography>
                                                                }
                                                            </Button>
                                                        </Tooltip>
                                                    </Grid>
                                                </>
                                            }
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
                    headerAlign: "center",
                    align: "center",
                    renderCell: (params) => {
                        const invoiceNumber = params.row.InvoiceNumber;
                        const notification = params.row.Notifications ?? [];
                        const hasNotificationForUser = notification.some((n: NotificationsInterface) => n.UserID === Number(userID) && !n.IsRead);
                        return (
                            <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "5px" }}>
                                {hasNotificationForUser && <AnimatedBell />}
                                <Typography sx={{ fontSize: 14 }}>{invoiceNumber}</Typography>
                            </Box>
                        );
                    },
                },
                {
                    field: "Date",
                    headerName: "Date",
                    type: "string",
                    flex: 1.8,
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
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {`Billing Period: ${formatToMonthYear(params.row.BillingPeriod)}`}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        color: "text.secondary"
                                    }}
                                >
                                    {`Due Date: ${dateFormat(params.row.DueDate)}`}
                                </Typography>
                            </Box>
                        );
                    },
                },
                {
                    field: "TotalAmount",
                    headerName: "Total Amount",
                    type: "string",
                    flex: 1.2,
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
                                {
                                    params.value?.toLocaleString("th-TH", {
                                        style: "currency",
                                        currency: "THB",
                                    })
                                }
                            </Box>
                        );
                    },
                },
                {
                    field: "Status",
                    headerName: "Status",
                    type: "string",
                    flex: 1.5,
                    renderCell: (item) => {
                        const statusName = item.value.Name || "";
                        const statusKey = item.value.Name as keyof typeof roomStatusConfig;
                        const { color, colorLite, icon } = paymentStatusConfig[statusKey] ?? {
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
                                    <Icon size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
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
                    flex: 1.5,
                    renderCell: (item) => {
                        const data = item.row;
                        const statusName = data.Status.Name;
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
                                    (!receiptPath || receiptPath !== "") &&
                                        (statusName === "Awaiting Receipt" || statusName === "Paid") ?
                                        (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.8,
                                                    width: '100%'
                                                }}
                                            >
                                                <Button
                                                    id="basic-button"
                                                    aria-controls={openButtonMenu ? 'basic-menu' : undefined}
                                                    aria-haspopup="true"
                                                    aria-expanded={openButtonMenu ? 'true' : undefined}
                                                    onClick={handleClickButtonMenu}
                                                    variant="outlinedGray"
                                                    sx={{
                                                        minWidth: '42px'
                                                    }}
                                                >
                                                    <Ellipsis size={16} style={{ minWidth: '16px', minHeight: '16px' }} />
                                                </Button>
                                                <Menu
                                                    id="basic-menu"
                                                    anchorEl={anchorEl}
                                                    open={openButtonMenu}
                                                    onClose={() => setAnchorEl(null)}
                                                    slotProps={{
                                                        list: {
                                                            'aria-labelledby': 'basic-button',
                                                        },
                                                    }}
                                                    sx={{ fontSize: 14 }}
                                                >
                                                    <MenuItem>
                                                        <input
                                                            accept="application/pdf"
                                                            style={{ display: "none" }}
                                                            id="upload-new-pdf-input"
                                                            type="file"
                                                            onChange={(e) => handlePDFUploadReceipt(e, data)}
                                                        />
                                                        <label htmlFor="upload-new-pdf-input">
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Upload size={14} style={{ minWidth: '14px', minHeight: '14px' }} />
                                                                <Typography component="span" sx={{ fontSize: 14 }}>
                                                                    Upload New File
                                                                </Typography>
                                                            </Box>
                                                        </label>
                                                    </MenuItem>
                                                    {
                                                        statusName === "Paid" &&
                                                        <MenuItem
                                                            sx={{ fontSize: 14 }}
                                                            onClick={() => handleDeleteReceipt(data)}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Trash2 size={14} style={{ minWidth: '14px', minHeight: '14px', marginBottom: '2px' }} />
                                                                <Typography sx={{ fontSize: 14 }}>
                                                                    Delete File
                                                                </Typography>
                                                            </Box>
                                                        </MenuItem>
                                                    }
                                                </Menu>

                                                {
                                                    fileName !== "" ? (
                                                        <Tooltip title={fileName}>
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
                                                                    "&:hover": {
                                                                        color: 'primary.main',
                                                                        borderColor: 'primary.main'
                                                                    },
                                                                    height: '32.5px',
                                                                    width: '100px'
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
                                                        </Tooltip>
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
                                                                width: { xs: "100%", mobileS: "auto" },
                                                                height: '32.5px'
                                                            }}
                                                        >
                                                            <File size={16} style={{ minWidth: '16px', minHeight: '16px' }} />
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
                                                                No file uploaded
                                                            </Typography>
                                                        </Box>
                                                    )
                                                }
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
                    flex: 1.8,
                    renderCell: (item) => {
                        const data = item.row;
                        const statusName = data.Status.Name;
                        const invoicePDFPath = data.InvoicePDFPath
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
                                {data.Payments && (
                                    <Tooltip title="View Slip">
                                        <Button
                                            variant="contained"
                                            onClick={() => {
                                                setSelectedInvoice((prev) => ({
                                                    ...prev,
                                                    ...data,
                                                }));
                                                setOpenPaymentPopup(true);
                                            }}
                                            sx={{ minWidth: "42px" }}
                                        >
                                            <Wallet size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
                                        </Button>
                                    </Tooltip>
                                )}

                                <Tooltip title="Download PDF">
                                    <Button
                                        variant="outlinedGray"
                                        // onClick={async () => {
                                        //     setOpenPDF(true);
                                        //     setSelectedInvoice(data);
                                        // }}
                                        onClick={() => window.open(`${apiUrl}/${invoicePDFPath}`, "_blank")}
                                        sx={{ minWidth: "42px" }}
                                    >
                                        <FontAwesomeIcon icon={faFilePdf} style={{ fontSize: 16 }} />
                                    </Button>
                                </Tooltip>

                                {statusName === "Pending Payment" && (
                                    <>
                                        <Tooltip title="Edit Invoice">
                                            <Button
                                                variant="outlinedGray"
                                                onClick={() => {
                                                    setIsEditMode(true);
                                                    setSelectedInvoice(data);
                                                    setOpenCreatePopup(true);
                                                }}
                                                sx={{ minWidth: "42px", bgcolor: "#FFF" }}
                                            >
                                                <Pencil size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title="Delete Invoice">
                                            <Button
                                                variant="outlinedCancel"
                                                onClick={() => {
                                                    setSelectedInvoice((prev) => ({
                                                        ...prev,
                                                        ...data,
                                                    }));

                                                    setOpenDeletePopup(true);
                                                }}
                                                sx={{ minWidth: "42px", bgcolor: "#FFF" }}
                                            >
                                                <Trash2 size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
                                            </Button>
                                        </Tooltip>
                                    </>
                                )}
                            </Box>
                        );
                    },
                },
            ];
        }
    };

    const paymentPopup = () => {
        const paymentData = selectedInvoice?.Payments;
        const statusName = paymentData?.Status?.Name;
        const statusKey = paymentData?.Status?.Name as keyof typeof paymentStatusConfig;
        const { color, colorLite, icon } = paymentStatusConfig[statusKey] ?? {
            color: "#000",
            colorLite: "#000",
            icon: HelpCircle,
        };
        const Icon = icon
        return (
            <Dialog
                open={openPaymentPopup && selectedInvoice?.ID !== 0}
                onClose={() => {
                    setOpenPaymentPopup(false);
                    setSelectedInvoice(null);
                }}
                maxWidth={false}
                sx={{
                    "& .MuiDialog-paper": {
                        maxWidth: { xs: "75vw", md: "50vw" },
                        width: "auto",
                        margin: 0,
                        borderRadius: 0,
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
                            color: "primary.main",
                        }}
                    >
                        <Wallet />
                        <Typography sx={{ fontWeight: 700, fontSize: 22 }}>Payment</Typography>
                        <IconButton
                            aria-label="close"
                            onClick={() => {
                                setOpenPaymentPopup(false);
                                setSelectedInvoice(null);
                            }}
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
                                            <Icon size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
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
                                            {dateFormat(paymentData?.PaymentDate ?? "")}
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
                                            {paymentData?.Amount?.toLocaleString("th-TH", {
                                                style: "currency",
                                                currency: "THB",
                                            })}
                                        </Typography>
                                    </Box>
                                </Card>
                            </Grid>

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
                        </Grid>
                    </Grid>
                </DialogContent>

                {statusName === "Pending Verification" && (
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Zoom in={openPaymentPopup} timeout={400}>
                            <Button
                                onClick={() => {
                                    setOpenConfirmRejected(true);
                                }}
                                variant="outlinedCancel"
                                startIcon={<X size={18} style={{ minWidth: '18px', minHeight: '18px' }} />}
                            >
                                Reject Slip
                            </Button>
                        </Zoom>
                        <Zoom in={openPaymentPopup} timeout={400}>
                            <Button
                                onClick={() => {
                                    handleClickUpdatePayment("Awaiting Receipt");
                                }}
                                variant="contained"
                                startIcon={isButtonActive ?
                                    <Loader size={18} style={{ minWidth: '18px', minHeight: '18px' }} /> :
                                    <Check size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
                                }
                                disabled={isButtonActive}
                            >
                                {isButtonActive ? "Loading..." : "Confirm Payment"}
                            </Button>
                        </Zoom>
                    </DialogActions>
                )}
            </Dialog>
        );
    };

    return (
        <Box className="room-rental-space-page">
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            {/* Delete Confirm */}
            <ConfirmDialog
                open={openDeletePopup}
                setOpenConfirm={setOpenDeletePopup}
                handleFunction={() => handleDeleteInvoice()}
                title="Delete Invoice"
                message="Are you sure you want to delete this invoice? This action cannot be undone."
                buttonActive={isButtonActive}
            />

            {/* Reject Slip Confirm */}
            <ConfirmDialog
                open={openConfirmRejected}
                setOpenConfirm={setOpenConfirmRejected}
                handleFunction={(note) => handleClickUpdatePayment("Rejected", note)}
                title="Confirm Payment Slip Rejection"
                message="Are you sure you want to reject this payment slip? This action cannot be undone."
                showNoteField
                buttonActive={isButtonActive}
            />

            <PDFPopup
                open={openPDF}
                invoice={selectedInvoice}
                onClose={() => {
                    setOpenPDF(false);
                    setSelectedInvoice(null);
                }}
            />

            {/* Create amd Update Popup */}
            <Dialog
                open={isEditMode ? selectedInvoice?.ID === invoiceFormData?.ID : openCreatePopup}
                onClose={() => {
                    setOpenCreatePopup(false);
                    handleClearForm();
                    setErrors({});
                    if (isEditMode) {
                        setSelectedInvoice(null);
                        setIsEditMode(false);
                    } else {
                        setSelectedRoom(null);
                    }
                }}
                slotProps={{
                    paper: {
                        sx: {
                            width: "80%",
                            maxWidth: "1400px",
                        },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        color: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <NotebookPen size={26} />
                    {isEditMode ? "Edit Invoice" : "Create Invoice"}
                    <IconButton
                        aria-label="close"
                        onClick={() => {
                            setOpenCreatePopup(false);
                            handleClearForm();
                            setErrors({});
                            if (isEditMode) {
                                setSelectedInvoice(null);
                                setIsEditMode(false);
                            } else {
                                setSelectedRoom(null);
                            }
                        }}
                        sx={{
                            position: "absolute",
                            right: 8,
                            top: 8,
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ minWidth: 350, pt: "10px !important" }}>
                    <Grid container size={{ xs: 12 }} spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                                Invoice Number
                            </Typography>
                            <TextField
                                fullWidth
                                name="InvoiceNumber"
                                value={invoiceFormData.InvoiceNumber ?? ""}
                                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, InvoiceNumber: e.target.value })}
                                placeholder="Enter invoice number."
                                error={!!errors.InvoiceNumber}
                                helperText={errors.InvoiceNumber}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                                Issue Date
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    name="IssueDate"
                                    value={invoiceFormData.IssueDate ? dayjs(invoiceFormData.IssueDate) : null}
                                    onChange={(newValue) => handleDateChange("IssueDate", newValue)}
                                    maxDate={invoiceFormData.DueDate ? dayjs(invoiceFormData.DueDate) : undefined}
                                    slots={{
                                        openPickerIcon: CalendarMonth,
                                    }}
                                    format="DD/MM/YYYY"
                                    readOnly={isEditMode}
                                    sx={{ width: "100%" }}
                                    slotProps={{
                                        textField: {
                                            error: !!errors.IssueDate,
                                            helperText: errors.IssueDate,
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                                Due Date
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    name="DueDate"
                                    value={invoiceFormData.DueDate ? dayjs(invoiceFormData.DueDate) : null}
                                    onChange={(newValue) => handleDateChange("DueDate", newValue)}
                                    minDate={invoiceFormData.IssueDate ? dayjs(invoiceFormData.IssueDate) : undefined}
                                    slots={{
                                        openPickerIcon: CalendarMonth,
                                    }}
                                    format="DD/MM/YYYY"
                                    sx={{ width: "100%" }}
                                    slotProps={{
                                        textField: {
                                            error: !!errors.DueDate,
                                            helperText: errors.DueDate,
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                                Billing Period
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    name="BillingPeriod"
                                    value={invoiceFormData.BillingPeriod ? dayjs(invoiceFormData.BillingPeriod) : null}
                                    onChange={(newValue) => handleDateChange("BillingPeriod", newValue)}
                                    // maxDate={invoiceFormData.DueDate ? dayjs(invoiceFormData.DueDate) : undefined}
                                    slots={{
                                        openPickerIcon: CalendarMonth,
                                    }}
                                    format="MMM YYYY"
                                    readOnly={isEditMode}
                                    sx={{ width: "100%" }}
                                    slotProps={{
                                        textField: {
                                            error: !!errors.BillingPeriod,
                                            helperText: errors.BillingPeriod,
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        {invoiceItemFormData.map((item, index) => {
                            return (
                                <Grid
                                    container
                                    key={index}
                                    size={{ xs: 12 }}
                                    sx={{
                                        border: "1px solid #c5c5c6",
                                        borderRadius: "10px",
                                        p: 2,
                                    }}
                                    rowSpacing={1}
                                >
                                    <Grid container size={{ xs: 6 }} sx={{ alignItems: "cennter" }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 16 }}>
                                            Item {index + 1}
                                        </Typography>
                                    </Grid>
                                    {invoiceItemFormData.length > 1 && (
                                        <Grid size={{ xs: 6 }} sx={{ textAlign: "end" }}>
                                            <Button
                                                variant="outlinedCancel"
                                                sx={{ minWidth: "0px" }}
                                                onClick={() => handleDecreaseItem(index)}
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        </Grid>
                                    )}
                                    <Grid size={{ xs: 8 }}>
                                        <Typography sx={{ fontSize: 14, fontWeight: 500 }} gutterBottom>Description</Typography>
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            name="Description"
                                            value={item.Description}
                                            onChange={(e) => handleInputInvoiceItemChange(index, e)}
                                            placeholder="Enter description."
                                            error={!!errors.invoiceItems?.[index]?.Description}
                                            helperText={errors.invoiceItems?.[index]?.Description}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 4 }}>
                                        <Typography sx={{ fontSize: 14, fontWeight: 500 }} gutterBottom>Amount</Typography>
                                        <TextField
                                            type="number"
                                            fullWidth
                                            variant="outlined"
                                            name="Amount"
                                            value={item.Amount}
                                            onChange={(e) => handleInputInvoiceItemChange(index, e)}
                                            placeholder="Enter amount."
                                            error={!!errors.invoiceItems?.[index]?.Amount}
                                            helperText={errors.invoiceItems?.[index]?.Amount}
                                            slotProps={{
                                                htmlInput: {
                                                    step: "500",
                                                    min: 0
                                                } as any,
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            );
                        })}

                        <Grid size={{ xs: 12 }} sx={{ textAlign: "end" }}>
                            <Button
                                variant="outlined"
                                startIcon={<CirclePlus size={20} />}
                                onClick={() => handleIncreaseItem()}
                            >
                                Add Item
                            </Button>
                        </Grid>
                        <Divider sx={{ width: "100%" }}></Divider>
                        <Grid container size={{ xs: 12 }} spacing={2} sx={{ px: 3 }}>
                            <Grid size={{ xs: 12, sm: 7 }}>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontWeight: 600,
                                        mb: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <Send size={18} />
                                    Send To :
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 20 }}>
                                    {selectedRoom?.ServiceAreaDocument?.at(-1)?.RequestServiceArea?.User?.CompanyName}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {`Room No. ${selectedRoom?.RoomNumber}, Floor ${selectedRoom?.Floor?.Number}`}
                                </Typography>
                            </Grid>
                            <Grid textAlign={{ xs: "start", sm: "end" }} size={{ xs: 12, sm: 5 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                                    Total Amount
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 700, fontSize: 26, color: "primary.main" }}
                                >
                                    ฿
                                    {invoiceFormData.TotalAmount?.toLocaleString("th-TH", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </Typography>
                            </Grid>
                        </Grid>
                        <Divider sx={{ width: "100%" }}></Divider>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Zoom in={openCreatePopup} timeout={400}>
                        <Button
                            onClick={() => {
                                isEditMode ? handleUpdateInvoice() : handleCreateInvoice();
                            }}
                            variant="contained"
                            disabled={isButtonActive}
                            startIcon={
                                isButtonActive ? (
                                    <Loader size={18} />
                                ) : isEditMode ? (
                                    <Save size={18} />
                                ) : (
                                    <PencilLine size={18} />
                                )
                            }
                        >
                            {isButtonActive ? "Loading..." : isEditMode ? "Save Change" : "Create Invoice"}
                        </Button>
                    </Zoom>
                </DialogActions>
            </Dialog>

            {/* Invoice List Popup */}
            <Dialog
                fullScreen
                open={openInvoicePopup}
                onClose={() => {
                    setOpenInvoicePopup(false);
                    handleClearForm();
                    setInvoices([]);
                    setSelectedRoom(null);
                }}
                slots={{
                    transition: Transition,
                }}
            >
                {paymentPopup()}
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        color: "primary.main",
                        display: 'flex',
                        justifyContent: 'space-between',
                        pr: 8
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <ScrollText size={26} />
                        Invoice List
                    </Box>

                    <Button variant="contained"
                        onClick={() => setOpenCreatePopup(true)}
                        disabled={selectedRoom?.RoomStatus?.status_name === "Available"}
                    >
                        <NotebookPen size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                        <Typography variant="textButtonClassic">Create Invoice</Typography>
                    </Button>
                    <IconButton
                        aria-label="close"
                        onClick={() => {
                            setOpenInvoicePopup(false);
                            setInvoices([]);
                            setSelectedRoom(null);
                        }}
                        sx={{
                            position: "absolute",
                            right: 8,
                            top: 12,
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ minWidth: 350, pt: "10px !important" }}>
                    <Grid container size={{ xs: 12 }} spacing={2}>
                        {!isLoadingData ? (
                            <Grid className="filter-section" size={{ xs: 12 }}>
                                <Card sx={{ width: "100%", borderRadius: 2 }}>
                                    <Grid container sx={{ alignItems: "flex-end", p: 1.5 }} spacing={1}>
                                        <Grid size={{ xs: 12, sm: 8 }}>
                                            <TextField
                                                fullWidth
                                                className="search-box"
                                                variant="outlined"
                                                placeholder="Search"
                                                margin="none"
                                                value={searchTextInvoice}
                                                onChange={(e) => setSearchTextInvoice(e.target.value)}
                                                slotProps={{
                                                    input: {
                                                        startAdornment: (
                                                            <InputAdornment position="start" sx={{ px: 0.5 }}>
                                                                <Search size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                                                            </InputAdornment>
                                                        ),
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 10, sm: 3 }}>
                                            <FormControl fullWidth>
                                                <Select
                                                    value={selectedOption.paymentStatusID}
                                                    onChange={(e) =>
                                                        setSelectedOption((prev) => ({
                                                            ...prev,
                                                            paymentStatusID: Number(e.target.value),
                                                        }))
                                                    }
                                                    displayEmpty
                                                    startAdornment={
                                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                                            <Activity size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                                                        </InputAdornment>
                                                    }
                                                >
                                                    <MenuItem value={0}>{"All Statuses"}</MenuItem>
                                                    {paymentStatuses.map((item, index) => {
                                                        return (
                                                            <MenuItem key={index} value={item.ID}>
                                                                {item.Name}
                                                            </MenuItem>
                                                        );
                                                    })}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid size={{ xs: 2, sm: 1 }}>
                                            <Button
                                                onClick={handleClearFillter}
                                                sx={{
                                                    minWidth: 0,
                                                    width: "100%",
                                                    height: "45px",
                                                    borderRadius: "10px",
                                                    border: "1px solid rgb(109, 110, 112, 0.4)",
                                                    "&:hover": {
                                                        boxShadow: "none",
                                                        borderColor: "primary.main",
                                                        backgroundColor: "transparent",
                                                    },
                                                }}
                                            >
                                                <BrushCleaning size={20} style={{ color: "gray", minWidth: '20px', minHeight: '20px' }} />
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Card>
                            </Grid>
                        ) : (
                            <Skeleton variant="rectangular" width="100%" height={70} sx={{ borderRadius: 2 }} />
                        )}

                        <Grid size={{ xs: 12, md: 12 }} minHeight={"200px"}>
                            {isLoadingInvoice ? (
                                <Skeleton variant="rectangular" width="100%" height={255} sx={{ borderRadius: 2 }} />
                            ) : (
                                <CustomDataGrid
                                    rows={filteredInvoices.sort((a, b) =>
                                        (b.BillingPeriod ?? "").localeCompare(a.BillingPeriod ?? "")
                                    )}
                                    columns={getInvoiceColumns()}
                                    rowCount={invoiceTotal}
                                    page={invoicePage}
                                    limit={invoiceLimit}
                                    onPageChange={setInvoicePage}
                                    onLimitChange={setInvoiceLimit}
                                    noDataText="Invoices information not found."
                                    getRowId={(row) => row.ID}
                                />
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
            </Dialog>

            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    <Grid container className="title-box" direction={"row"} size={{ xs: 12 }} sx={{ gap: 1 }}>
                        <DoorClosed size={26} />
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            Rental Space
                        </Typography>
                    </Grid>

                    {/* Filters Section */}
                    {!isLoadingData ? (
                        <Grid className="filter-section" size={{ xs: 12 }}>
                            <Card sx={{ width: "100%", borderRadius: 2 }}>
                                <Grid container sx={{ alignItems: "flex-end", p: 1.5 }} spacing={1}>
                                    <Grid size={{ xs: 12, sm: 5 }}>
                                        <TextField
                                            fullWidth
                                            className="search-box"
                                            variant="outlined"
                                            placeholder="Search"
                                            margin="none"
                                            value={searchTextRoom}
                                            onChange={(e) => setSearchTextRoom(e.target.value)}
                                            slotProps={{
                                                input: {
                                                    startAdornment: (
                                                        <InputAdornment position="start" sx={{ px: 0.5 }}>
                                                            <Search size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                                                        </InputAdornment>
                                                    ),
                                                },
                                            }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 5, sm: 3 }}>
                                        <FormControl fullWidth>
                                            <Select
                                                value={selectedOption.floorID}
                                                onChange={(e) =>
                                                    setSelectedOption((prev) => ({
                                                        ...prev,
                                                        floorID: Number(e.target.value),
                                                    }))
                                                }
                                                displayEmpty
                                                startAdornment={
                                                    <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                                        <AlignVerticalSpaceAround size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                                                    </InputAdornment>
                                                }
                                            >
                                                <MenuItem value={0}>{"All Floors"}</MenuItem>
                                                {floors.map((item, index) => {
                                                    return (
                                                        <MenuItem key={index} value={item.ID}>
                                                            {`Floor ${item.Number}`}
                                                        </MenuItem>
                                                    );
                                                })}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 5, sm: 3 }}>
                                        <FormControl fullWidth>
                                            <Select
                                                value={selectedOption.roomStatusID}
                                                onChange={(e) =>
                                                    setSelectedOption((prev) => ({
                                                        ...prev,
                                                        roomStatusID: Number(e.target.value),
                                                    }))
                                                }
                                                displayEmpty
                                                startAdornment={
                                                    <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                                        <Activity size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                                                    </InputAdornment>
                                                }
                                            >
                                                <MenuItem value={0}>{"All Statuses"}</MenuItem>
                                                {roomstatuses.map((item, index) => {
                                                    return (
                                                        <MenuItem key={index} value={item.ID}>
                                                            {item.StatusName}
                                                        </MenuItem>
                                                    );
                                                })}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 2, sm: 1 }}>
                                        <Button
                                            onClick={handleClearFillter}
                                            sx={{
                                                minWidth: 0,
                                                width: "100%",
                                                height: "45px",
                                                borderRadius: "10px",
                                                border: "1px solid rgb(109, 110, 112, 0.4)",
                                                "&:hover": {
                                                    boxShadow: "none",
                                                    borderColor: "primary.main",
                                                    backgroundColor: "transparent",
                                                },
                                            }}
                                        >
                                            <BrushCleaning size={20} style={{ color: "gray", minWidth: '20px', minHeight: '20px' }} />
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Card>
                        </Grid>
                    ) : (
                        <Skeleton variant="rectangular" width="100%" height={70} sx={{ borderRadius: 2 }} />
                    )}

                    <Grid size={{ xs: 12, md: 12 }} minHeight={"200px"}>
                        {isLoadingData ? (
                            <Skeleton variant="rectangular" width="100%" height={255} sx={{ borderRadius: 2 }} />
                        ) : (
                            <CustomDataGrid
                                getRowId={(row) =>
                                    `${row.ID}-${row.Invoices?.map((inv: RentalRoomInvoiceInterface) => inv.StatusID).join("-")}`
                                }
                                rows={filteredRooms}
                                columns={getRoomColumns()}
                                rowCount={roomTotal}
                                page={roomPage}
                                limit={roomLimit}
                                onPageChange={setRoomPage}
                                onLimitChange={setRoomLimit}
                                noDataText="Rooms information not found."
                            />
                        )}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

export default RoomRentalSpace;
