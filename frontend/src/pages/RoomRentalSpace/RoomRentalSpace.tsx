import { Box } from "@mui/system";
import { ChangeEvent, useEffect, useState } from "react";
import { InvoiceInterface } from "../../interfaces/IInvoices";
import { RoomtypesInterface } from "../../interfaces/IRoomTypes";
import { RoomsInterface } from "../../interfaces/IRooms";
import { CreateInvoice, CreateInvoiceItems, GetFloors, GetRoomRentalSpaceByOption, GetRoomStatus } from "../../services/http";
import { FloorsInterface } from "../../interfaces/IFloors";
import { RoomStatusInterface } from "../../interfaces/IRoomStatus";
import {
    Button,
    Card,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Skeleton,
    Tooltip,
    Typography,
    useMediaQuery,
    Zoom,
} from "@mui/material";
import { BrushCleaning, CirclePlus, CircleX, DoorClosed, ScrollText, Trash2 } from "lucide-react";
import { TextField } from "../../components/TextField/TextField";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faMagnifyingGlass, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { Select } from "../../components/Select/Select";
import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";
import { GridColDef } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import theme from "../../styles/Theme";
import { roomStatusConfig } from "../../constants/roomStatusConfig";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { InvoiceItemInterface } from "../../interfaces/IInvoiceItems";
import dayjs from "dayjs";
import { CalendarMonth, Close } from "@mui/icons-material";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import { handleDownloadInvoice } from "../../utils/handleDownloadInvoice";

function RoomRentalSpace() {
    const [rooms, setRooms] = useState<RoomsInterface[]>([]);
    const [invoices, setInvoices] = useState<InvoiceInterface[]>([]);
    const [floors, setFloors] = useState<FloorsInterface[]>([]);
    const [roomstatuses, setRoomStatuses] = useState<RoomStatusInterface[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<RoomsInterface>();
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);

    const [searchText, setSearchText] = useState("");
    const [selectedOption, setSelectedOption] = useState({
        floorID: 0,
        roomStatusID: 0,
    });

    const today = dayjs();
    const issueDate = today.toISOString();
    const dueDate = today.date(15).toISOString();
    const billingPeriod = today.subtract(1, "month").endOf("month").toISOString();
    const [invoiceFormData, setInvoiceFormData] = useState<InvoiceInterface>({
        IssueDate: issueDate,
        DueDate: dueDate,
        BillingPeriod: billingPeriod,
        TotalAmount: 0,
        CreaterID: 0,
        RoomID: 0,
    });
    const [invoiceItemFormData, setInvoiceItemFormData] = useState<InvoiceItemInterface[]>([
        {
            Description: "ค่าใช้บริการพื้นที่",
            Amount: 0.00,
            InvoiceID: 0,
        },
        {
            Description: "ค่าใช้บริการไฟฟ้า",
            Amount: 0.00,
            InvoiceID: 0,
        },
    ]);

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);

    const [openCreatePopup, setOpenCreatePopup] = useState(false);
    const [openInvoicePopup, setOpenInvoicePopup] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isButtonActive, setIsButtonActive] = useState(false);

    const getRooms = async () => {
        try {
            const resRooms = await GetRoomRentalSpaceByOption(page, limit, selectedOption.floorID, selectedOption.roomStatusID);
            if (resRooms) {
                setTotal(resRooms.total);
                setRooms(resRooms.data);
            }
        } catch (error) {
            console.error("Error fetching rooms:", error);
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

    const handleClearFillter = () => {
        setSelectedOption({
            floorID: 0,
            roomStatusID: 0,
        });
    };

    const handleIncreaseItem = () => {
        setInvoiceItemFormData([
            ...invoiceItemFormData,
            {
                Description: "",
                Amount: 0,
                InvoiceID: 0,
            },
        ]);
    };

    const handleDecreaseItem = (index: number) => {
        setInvoiceItemFormData(invoiceItemFormData.filter((_, i) => i !== index));
    };

    const handleDateChange = (field: string, value: dayjs.Dayjs | null) => {
        setInvoiceFormData((prev) => ({
            ...prev,
            [field]: value ? value.toISOString() : "",
        }));
    };

    const handleInputInvoiceItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target as HTMLInputElement;

        const { name, value, type } = target;
        const checked = type === "checkbox" ? target.checked : undefined;

        const numberFields = ["Amount", "UnitPrice"];

        setInvoiceItemFormData((prev) => {
            const newData = [...prev];
            newData[index] = {
                ...newData[index],
                [name]: type === "checkbox" ? checked : numberFields.includes(name) ? (value === "" ? "" : Number(value)) : value,
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
        const userID = Number(localStorage.getItem("userId"));
        if (!userID) {
            handleSetAlert("error", "UserID not found");
            setIsButtonActive(false);
            return;
        } else {
            invoiceFormData.CreaterID = userID;
        }

        if (!selectedRoom) {
            handleSetAlert("error", "Room not found");
            setIsButtonActive(false);
            return;
        } else {
            invoiceFormData.RoomID = selectedRoom.ID;
        }

        try {
            console.log("invoiceFormData: ", invoiceFormData);
            console.log("selectedRoom: ", selectedRoom);
            // const resInvoice = await CreateInvoice(invoiceFormData);
            // if (!resInvoice) {
            //     console.error("🚨 Error creating invoice:", resInvoice);
            //     handleSetAlert("error", resInvoice?.Error || "Failed to create invoice");
            //     setIsButtonActive(false);
            //     return;
            // }

            // const updatedItems = invoiceItemFormData.map((item) => ({
            //     ...item,
            //     InvoiceID: resInvoice.data.ID,
            // }));

            // const results = await Promise.all(
            //     updatedItems.map((item) =>
            //         CreateInvoiceItems(item).catch((err) => {
            //             return { error: err, item };
            //         })
            //     )
            // );

            // const failedItems = results.filter((r: any) => r?.error);
            // if (failedItems.length > 0) {
            //     console.warn("⚠️ Some invoice items failed:", failedItems);
            // } else {
            //     handleSetAlert("success", "Invoice created successfully!");
            // }

            // handleDownloadInvoice(resInvoice.data.ID);

            // setTimeout(() => {
            //     setIsButtonActive(false);
            //     setOpenCreatePopup(false);
            // }, 1800);
        } catch (error) {
            console.error("🚨 Error creating invoice:", error);
            handleSetAlert("error", "An unexpected error occurred");
            setIsButtonActive(false);
        }
    };

    const handleSetAlert = (type: "success" | "error" | "warning", message: string) => {
        setAlerts((prevAlerts) => [...prevAlerts, { type, message }]);
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await Promise.all([getRooms(), getFloors(), getRoomStatuses()]);
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
    }, [page, limit]);

    useEffect(() => {
        getRooms();
    }, [selectedOption]);

    const filteredRooms = rooms.filter((item) => {
        const roomNumber = item.RoomNumber;

        const matchText = !searchText || roomNumber?.includes(searchText.toLocaleLowerCase());

        return matchText;
    });

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

    const navigate = useNavigate();

    const getColumns = (): GridColDef[] => {
        if (isSmallScreen) {
            return [
                {
                    field: "All Maintenance Requests",
                    headerName: "All Maintenance Requests",
                    flex: 1,
                    renderCell: (params) => {
                        return <Grid container size={{ xs: 12 }} sx={{ px: 1 }} className="card-item-container"></Grid>;
                    },
                },
            ];
        } else {
            return [
                {
                    field: "ID",
                    headerName: "No.",
                    flex: 0.5,
                    headerAlign: "center",
                    renderCell: (params) => (
                        <Box
                            sx={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            {params.value}
                        </Box>
                    ),
                },
                {
                    field: "RoomNumber",
                    headerName: "Room Number",
                    type: "string",
                    flex: 1,
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
                                {params.value}
                            </Box>
                        );
                    },
                },
                {
                    field: "Floor",
                    headerName: "Floor",
                    type: "string",
                    flex: 0.8,
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
                                {`Floor ${params.value.Number}`}
                            </Box>
                        );
                    },
                },
                {
                    field: "RoomStatus",
                    headerName: "Status",
                    type: "string",
                    flex: 1,
                    renderCell: (item) => {
                        const statusName = item.value.status_name || "";
                        const statusKey = item.value.status_name as keyof typeof roomStatusConfig;
                        const { color, colorLite, icon } = roomStatusConfig[statusKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: faQuestionCircle,
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
                                        variant="outlined"
                                        onClick={() => {
                                            setOpenCreatePopup(true);
                                            setSelectedRoom(data);
                                        }}
                                        sx={{
                                            minWidth: "42px",
                                            bgcolor: "#FFFFFF",
                                        }}
                                    >
                                        <ScrollText size={18} />
                                        {/* <Typography variant="textButtonClassic" className="text-btn">
                                            Create Invoice
                                        </Typography> */}
                                    </Button>
                                </Tooltip>
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
                                        <FontAwesomeIcon icon={faEye} size="lg" />
                                        {/* <Typography variant="textButtonClassic" className="text-btn">
                                            Invoice List
                                        </Typography> */}
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
        <Box className="room-rental-space-page">
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            <Dialog
                open={openCreatePopup}
                onClose={() => setOpenCreatePopup(false)}
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
                    <ScrollText size={26} />
                    Create Invoice
                    <IconButton
                        aria-label="close"
                        onClick={() => setOpenCreatePopup(false)}
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
                        <Grid size={{ xs: 6 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    name="IssueDate"
                                    label="Issue Date"
                                    value={invoiceFormData.IssueDate ? dayjs(invoiceFormData.IssueDate) : null}
                                    onChange={(newValue) => handleDateChange("IssueDate", newValue)}
                                    maxDate={invoiceFormData.DueDate ? dayjs(invoiceFormData.DueDate) : undefined}
                                    slots={{
                                        openPickerIcon: CalendarMonth,
                                    }}
                                    format="DD/MM/YYYY"
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
                        <Grid size={{ xs: 6 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    name="DueDate"
                                    label="Due Date"
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
                        <Grid size={{ xs: 6 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    name="BillingPeriod"
                                    label="Billing Period"
                                    value={invoiceFormData.BillingPeriod ? dayjs(invoiceFormData.BillingPeriod) : null}
                                    onChange={(newValue) => handleDateChange("BillingPeriod", newValue)}
                                    // maxDate={invoiceFormData.DueDate ? dayjs(invoiceFormData.DueDate) : undefined}
                                    slots={{
                                        openPickerIcon: CalendarMonth,
                                    }}
                                    format="MMM YYYY"
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
                                    rowSpacing={1.4}
                                >
                                    <Grid container size={{ xs: 6 }} sx={{ alignItems: 'cennter' }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 16 }}>
                                            Invoice Item {index + 1}
                                        </Typography>
                                    </Grid>
                                    {invoiceItemFormData.length > 1 && (
                                        <Grid size={{ xs: 6 }} sx={{ textAlign: "end" }}>
                                            <Button variant="outlinedCancel" sx={{ minWidth: "0px" }} onClick={() => handleDecreaseItem(index)}>
                                                <Trash2 size={18} />
                                            </Button>
                                        </Grid>
                                    )}
                                    <Grid size={{ xs: 8 }}>
                                        <TextField
                                            label="Description"
                                            fullWidth
                                            variant="outlined"
                                            name="Description"
                                            value={item.Description}
                                            onChange={(e) => handleInputInvoiceItemChange(index, e)}
                                            placeholder="Enter description."
                                            error={!!errors.Description}
                                            helperText={errors.Description}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 4 }}>
                                        <TextField
                                            label="Amount"
                                            type="number"
                                            fullWidth
                                            variant="outlined"
                                            name="Amount"
                                            value={item.Amount}
                                            onChange={(e) => handleInputInvoiceItemChange(index, e)}
                                            placeholder="Enter amount."
                                            error={!!errors.Amount}
                                            helperText={errors.Amount}
                                            slotProps={{
                                                htmlInput: {
                                                    step: "500",
                                                } as any,
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            );
                        })}

                        <Grid size={{ xs: 12 }} sx={{ textAlign: "end" }}>
                            <Button variant="outlined" startIcon={<CirclePlus size={20} />} onClick={() => handleIncreaseItem()}>
                                Add Item
                            </Button>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                                Total Amount
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: 22 }}>
                                ฿
                                {invoiceFormData.TotalAmount?.toLocaleString("th-TH", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Zoom in={openCreatePopup} timeout={400}>
                        <Button
                            onClick={handleCreateInvoice}
                            variant="contained"
                            disabled={isButtonActive}
                            // startIcon={<CircleX size={18} />}
                        >
                            Create Invoice
                        </Button>
                    </Zoom>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openInvoicePopup}
                onClose={() => setOpenInvoicePopup(false)}
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
                    <ScrollText size={26} />
                    Invoice List
                    <IconButton
                        aria-label="close"
                        onClick={() => setOpenInvoicePopup(false)}
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
                    <Grid container size={{ xs: 12 }} spacing={2}></Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Zoom in={openInvoicePopup} timeout={400}>
                        <Button
                            // onClick={handleCreateInvoice}
                            variant="contained"
                            disabled={isButtonActive}
                            // startIcon={<CircleX size={18} />}
                        >
                            Create Invoice
                        </Button>
                    </Zoom>
                </DialogActions>
            </Dialog>

            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    <Grid container className="title-box" direction={"row"} size={{ xs: 5, sm: 5 }} sx={{ gap: 1 }}>
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
                                            value={searchText}
                                            onChange={(e) => setSearchText(e.target.value)}
                                            slotProps={{
                                                input: {
                                                    startAdornment: (
                                                        <InputAdornment position="start" sx={{ px: 0.5 }}>
                                                            <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
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
                                                onChange={(e) => setSelectedOption((prev) => ({ ...prev, floorID: Number(e.target.value) }))}
                                                displayEmpty
                                                startAdornment={
                                                    <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                                        {/* <FontAwesomeIcon icon={faToolbox} size="lg" /> */}
                                                    </InputAdornment>
                                                }
                                            >
                                                <MenuItem value={0}>{"All Floors"}</MenuItem>
                                                {floors.map((item, index) => {
                                                    return (
                                                        <MenuItem key={index} value={index + 1}>
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
                                                onChange={(e) => setSelectedOption((prev) => ({ ...prev, roomStatusID: Number(e.target.value) }))}
                                                displayEmpty
                                                startAdornment={
                                                    <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                                        {/* <FontAwesomeIcon icon={faToolbox} size="lg" /> */}
                                                    </InputAdornment>
                                                }
                                            >
                                                <MenuItem value={0}>{"All Statuses"}</MenuItem>
                                                {roomstatuses.map((item, index) => {
                                                    return (
                                                        <MenuItem key={index} value={index + 1}>
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
                                            <BrushCleaning size={22} strokeWidth={2.2} style={{ color: "gray" }} />
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
                            <Skeleton variant="rectangular" width="100%" height={215} sx={{ borderRadius: 2 }} />
                        ) : (
                            <CustomDataGrid
                                rows={filteredRooms}
                                columns={getColumns()}
                                rowCount={total}
                                page={page}
                                limit={limit}
                                onPageChange={setPage}
                                onLimitChange={setLimit}
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
