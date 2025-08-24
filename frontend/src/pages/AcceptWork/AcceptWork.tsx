import {
    Box,
    Button,
    Card,
    Container,
    Divider,
    FormControl,
    Grid,
    InputAdornment,
    MenuItem,
    Skeleton,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from "@mui/material";
import { TextField } from "../../components/TextField/TextField";
import { useEffect, useRef, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { GridColDef } from "@mui/x-data-grid";
import {
    GetMaintenanceTask,
    GetMaintenanceTaskByID,
    GetMaintenanceTypes,
    GetRequestStatuses,
    GetUserById,
    socketUrl,
} from "../../services/http";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { Select } from "../../components/Select/Select";

import "./AcceptWork.css";
import { MaintenanceTypesInteface } from "../../interfaces/IMaintenanceTypes";
import dateFormat from "../../utils/dateFormat";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import { maintenanceTypeConfig } from "../../constants/maintenanceTypeConfig";
import { useNavigate } from "react-router-dom";
import { MaintenanceTasksInterface } from "../../interfaces/IMaintenanceTasks";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import handleActionAcception from "../../utils/handleActionAcception";
import timeFormat from "../../utils/timeFormat";
import MaintenanceTaskTable from "../../components/MaintenanceTaskTable/MaintenanceTaskTable";
import SubmitPopup from "../../components/SubmitPopup/SubmitPopup";
import handleSubmitWork from "../../utils/handleSubmitWork";
import { CalendarMonth } from "@mui/icons-material";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";
import { useMediaQuery } from "@mui/system";
import theme from "../../styles/Theme";

import { io } from "socket.io-client";
import CustomTabPanel from "../../components/CustomTabPanel/CustomTabPanel";
import { NotificationsInterface } from "../../interfaces/INotifications";
import { faClock } from "@fortawesome/free-regular-svg-icons";

import { Base64 } from "js-base64";
import AnimatedBell from "../../components/AnimatedIcons/AnimatedBell";
import { UserInterface } from "../../interfaces/IUser";
import { Briefcase, BrushCleaning, Check, Clock, Eye, HardHat, HelpCircle, Search, Send, X } from "lucide-react";
import { handleUpdateNotification } from "../../utils/handleUpdateNotification";

export function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        "aria-controls": `simple-tabpanel-${index}`,
    };
}

function AcceptWork() {
    const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceTypesInteface[]>([]);
    const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTasksInterface[]>([]);
    const [selectedTask, setSelectedTask] = useState<MaintenanceTasksInterface>();
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([]);
    const [user, setUser] = useState<UserInterface>();

    const [searchText, setSearchText] = useState("");
    const [selectedType, setSelectedType] = useState(0);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>();

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    const [openConfirmAccepted, setOpenConfirmAccepted] = useState<boolean>(false);
    const [openConfirmCancelled, setOpenConfirmCancelled] = useState<boolean>(false);
    const [openPopupSubmit, setOpenPopupSubmit] = useState(false);

    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [files, setFiles] = useState<File[]>([]);

    const [valueTab, setValueTab] = useState(0);

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

    const valueTabRef = useRef(valueTab);

    const [isBottonActive, _setIsBottonActive] = useState(false);

    const navigate = useNavigate();

    const columnVisibilityModel = {
        Requester: valueTab !== 2,
        Inspection: valueTab === 2,
    };

    const getColumns = (): GridColDef[] => {
        if (isSmallScreen) {
            return [
                {
                    field: "All Maintenance Requests",
                    headerName: "All Maintenance Requests",
                    flex: 1,
                    renderCell: (params) => {
                        const data = params.row;
                        const requests = params.row.MaintenanceRequest;

                        const dateTime = `${dateFormat(params.row.CreatedAt || "")} ${timeFormat(params.row.CreatedAt || "")}`;

                        const areaID = requests?.Area?.ID;
                        const areaDetail = requests?.AreaDetail;
                        const roomtype = requests?.Room?.RoomType?.TypeName;
                        const roomNum = requests?.Room?.RoomNumber;
                        const roomFloor = requests?.Room?.Floor?.Number;
                        const description = requests?.Description;

                        const typeName = requests?.MaintenanceType?.TypeName || "Electrical Work";
                        const maintenanceKey = requests?.MaintenanceType
                            ?.TypeName as keyof typeof maintenanceTypeConfig;
                        const { color, icon } = maintenanceTypeConfig[maintenanceKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: HelpCircle,
                        };

                        const TypeIcon = icon

                        const isApproved = params.row.RequestStatus?.Name === "Approved";
                        const isRework = params.row.RequestStatus?.Name === "Rework Requested";
                        const isInProgress = params.row.RequestStatus?.Name === "In Progress";
                        const isWaitingForReview = params.row.RequestStatus?.Name === "Waiting For Review";

                        const notification = params.row.Notifications ?? [];
                        const hasNotificationForUser = notification.some(
                            (n: NotificationsInterface) => n.UserID === user?.ID && !n.IsRead
                        );

                        const cardItem = document.querySelector(".card-row-container") as HTMLElement;
                        let width;
                        if (cardItem) {
                            width = cardItem.offsetWidth;
                        }

                        return (
                            <Grid container size={{ xs: 12 }} sx={{ px: 1 }} className="card-row-container">
                                <Grid size={{ xs: 7 }}>
                                    <Box
                                        sx={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "5px",
                                            width: "100%",
                                        }}
                                    >
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
                                            {areaID === 2
                                                ? `${areaDetail}`
                                                : `${roomtype} - Floor ${roomFloor}, Room No. ${roomNum}`}
                                        </Typography>
                                    </Box>

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
                                        <TypeIcon size={18} style={{ minWidth: "18px", minHeight: "18px", paddingBottom: "2px" }} />
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
                                            {isApproved || isRework ? (
                                                <>
                                                    <Grid size={{ xs: 5 }}>
                                                        <Tooltip title={"Start"}>
                                                            <Button
                                                                variant="contained"
                                                                onClick={() => {
                                                                    handleClickAcceptWork("In Progress", "accept", undefined, data)
                                                                }}
                                                                fullWidth
                                                            >
                                                                <Check size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                                                <Typography variant="textButtonClassic">
                                                                    Start
                                                                </Typography>
                                                            </Button>
                                                        </Tooltip>
                                                    </Grid>
                                                    <Grid size={{ xs: 5 }}>
                                                        <Tooltip title={"Cancel"}>
                                                            <Button
                                                                variant="outlinedCancel"
                                                                onClick={() => {
                                                                    setOpenConfirmCancelled(true);
                                                                    setSelectedTask(data);
                                                                }}
                                                                fullWidth
                                                            >
                                                                <X size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                                                <Typography variant="textButtonClassic">
                                                                    Cancel
                                                                </Typography>
                                                            </Button>
                                                        </Tooltip>
                                                    </Grid>
                                                </>
                                            ) : isInProgress ? (
                                                <>
                                                    <Grid size={{ xs: 5 }}>
                                                        <Tooltip title={"Submit"}>
                                                            <Button
                                                                variant="contained"
                                                                onClick={() => {
                                                                    setOpenPopupSubmit(true);
                                                                    setSelectedTask(data);
                                                                }}
                                                                fullWidth
                                                            >
                                                                <Send size={16} style={{ minWidth: "16px", minHeight: "16px" }}/>
                                                                <Typography variant="textButtonClassic">
                                                                    Submit
                                                                </Typography>
                                                            </Button>
                                                        </Tooltip>
                                                    </Grid>
                                                    <Grid size={{ xs: 5 }}>
                                                        <Tooltip title={"Cancel"}>
                                                            <Button
                                                                variant="outlinedCancel"
                                                                onClick={() => {
                                                                    setOpenConfirmCancelled(true);
                                                                    setSelectedTask(data);
                                                                }}
                                                                fullWidth
                                                            >
                                                                <X size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                                                <Typography variant="textButtonClassic">
                                                                    Cancel
                                                                </Typography>
                                                            </Button>
                                                        </Tooltip>
                                                    </Grid>
                                                </>
                                            ) : (
                                                <></>
                                            )}
                                            {isWaitingForReview ? (
                                                <Grid size={{ xs: 12 }}>
                                                    <Tooltip title={"Details"}>
                                                        <Button
                                                            variant="outlinedGray"
                                                            onClick={() => {
                                                                handleClickCheck(data);
                                                            }}
                                                            sx={{
                                                                minWidth: "42px",
                                                                width: "100%",
                                                            }}
                                                            fullWidth
                                                        >
                                                            <Eye size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                                            <Typography
                                                                variant="textButtonClassic"
                                                                className="text-btn"
                                                            >
                                                                Details
                                                            </Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                            ) : (
                                                <Grid size={{ xs: 2 }}>
                                                    <Tooltip title={"Details"}>
                                                        <Button
                                                            variant="outlinedGray"
                                                            onClick={() => {
                                                                handleClickCheck(data);
                                                            }}
                                                            sx={{
                                                                minWidth: "42px",
                                                                width: "100%",
                                                            }}
                                                            fullWidth
                                                        >
                                                            <Eye size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
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
                                            )}
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
                    field: "ID",
                    headerName: "No.",
                    flex: 0.5,
                    align: "center",
                    headerAlign: "center",
                    renderCell: (params) => {
                        const requestID = params.row.MaintenanceRequest.ID;
                        const notification = params.row.Notifications ?? [];
                        const hasNotificationForUser = notification.some(
                            (n: NotificationsInterface) => n.UserID === user?.ID && !n.IsRead
                        );
                        return (
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "100%",
                                    gap: "5px",
                                }}
                            >
                                {hasNotificationForUser && <AnimatedBell />}
                                <Typography>{requestID}</Typography>
                            </Box>
                        );
                    },
                },
                {
                    field: "Title",
                    headerName: "Title",
                    type: "string",
                    flex: 1.6,
                    renderCell: (params) => {
                        const requests = params.row.MaintenanceRequest;
                        const areaID = requests?.Area?.ID;
                        const areaDetail = requests?.AreaDetail;
                        const roomtype = requests?.Room?.RoomType?.TypeName;
                        const roomNum = requests?.Room?.RoomNumber;
                        const roomFloor = requests?.Room?.Floor?.Number;

                        const typeName = requests?.MaintenanceType?.TypeName || "Electrical Work";
                        const maintenanceKey = requests?.MaintenanceType
                            ?.TypeName as keyof typeof maintenanceTypeConfig;
                        const { color, icon } = maintenanceTypeConfig[maintenanceKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: HelpCircle,
                        };

                        const Icon = icon

                        return (
                            <Box>
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
                                    {requests?.Description}
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
                    field: "UpdatedAt",
                    headerName:
                        valueTab === 0
                            ? "Date Assigned"
                            : valueTab === 1
                              ? "Start Date"
                              : valueTab === 2
                                ? "Date Submitted"
                                : "",
                    type: "string",
                    flex: 1,
                    renderCell: (params) => {
                        const date = dateFormat(params.row.CreatedAt || "");
                        const time = timeFormat(params.row.CreatedAt || "");
                        return (
                            <Box>
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
                    field: "Requester",
                    headerName: "Requester",
                    description: "This column has a value getter and is not sortable.",
                    sortable: false,
                    flex: 1.2,
                    renderCell: (params) => {
                        const user = params.row.MaintenanceRequest.User;
                        const name = `${user.FirstName || ""} ${user.LastName || ""}`;
                        const employeeID = user.EmployeeID;
                        return (
                            <Box>
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                    }}
                                >
                                    {name}
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
                                    {employeeID}
                                </Typography>
                            </Box>
                        );
                    },
                },
                {
                    field: "Inspection",
                    headerName: "Inspected By",
                    type: "string",
                    flex: 1.6,
                    renderCell: (params) => {
                        const task = params.row;
                        const inspection = params.row.MaintenanceRequest?.Inspection.at(-1);
                        const user = inspection?.User;
                        const name = `${user?.FirstName} ${user?.LastName}`;
                        const date = dateFormat(inspection?.CreatedAt || "");
                        const time = timeFormat(inspection?.CreatedAt || "");

                        return inspection && inspection.RequestStatus.Name !== "Rework Requested" ? (
                            <Box>
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                    }}
                                >
                                    {name}
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
                                >{`${date}, ${time}`}</Typography>
                            </Box>
                        ) : (
                            <Typography
                                sx={{
                                    fontSize: 14,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: "100%",
                                }}
                            >
                                {task.RequestStatus.Name}
                            </Typography>
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
                        const statusName = item.row.RequestStatus?.Name;

                        return (
                            <Box
                                className="container-btn"
                                sx={{
                                    display: "flex",
                                    gap: 0.8,
                                    flexWrap: "wrap",
                                }}
                            >
                                {renderActionButtons(data, statusName)}
                            </Box>
                        );
                    },
                },
            ];
        }
    };

    const renderActionButtons = (data: any, statusName: string) => {
        const showSubmit = statusName === "In Progress";
        const showAcceptReject = statusName === "Approved" || statusName === "Rework Requested";

        return (
            <>
                {showAcceptReject && (
                    <>
                        <Tooltip title={"Start"}>
                            <Button
                                className="btn-accept"
                                variant="contained"
                                onClick={() => {
                                    handleClickAcceptWork("In Progress", "accept", undefined, data)
                                }}
                                sx={{ minWidth: "42px" }}
                            >
                                <Check size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                <Typography variant="textButtonClassic" className="text-btn">
                                    Start
                                </Typography>
                            </Button>
                        </Tooltip>
                        <Tooltip title={"Cancel"}>
                            <Button
                                className="btn-reject"
                                variant="outlinedCancel"
                                onClick={() => {
                                    setOpenConfirmCancelled(true);
                                    setSelectedTask(data);
                                }}
                                sx={{ minWidth: "42px" }}
                            >
                                <X size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                <Typography variant="textButtonClassic" className="text-btn">
                                    Cancel
                                </Typography>
                            </Button>
                        </Tooltip>
                    </>
                )}

                {showSubmit && (
                    <>
                        <Tooltip title={"Submit"}>
                            <Button
                                className="btn-submit"
                                variant="contained"
                                onClick={() => {
                                    setOpenPopupSubmit(true);
                                    setSelectedTask(data);
                                }}
                                sx={{ minWidth: "42px" }}
                            >
                                <Send size={16} style={{ minWidth: "16px", minHeight: "16px" }}/>
                                <Typography variant="textButtonClassic" className="text-btn">
                                    Submit
                                </Typography>
                            </Button>
                        </Tooltip>
                        <Tooltip title={"Cancel"}>
                            <Button
                                className="btn-reject"
                                variant="outlinedCancel"
                                onClick={() => {
                                    setOpenConfirmCancelled(true);
                                    setSelectedTask(data);
                                }}
                                sx={{ minWidth: "42px" }}
                            >
                                <X size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                <Typography variant="textButtonClassic" className="text-btn">
                                    Cancel
                                </Typography>
                            </Button>
                        </Tooltip>
                    </>
                )}

                <Tooltip title={"Details"}>
                    <Button
                        className="btn-detail"
                        variant="outlinedGray"
                        onClick={() => handleClickCheck(data)}
                        sx={{
                            minWidth: "42px",
                            width: !(showSubmit || showAcceptReject) ? "100%" : "",
                        }}
                    >
                        <Eye size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                        {!(showSubmit || showAcceptReject) ? (
                            <Typography variant="textButtonClassic">Details</Typography>
                        ) : (
                            <Typography variant="textButtonClassic" className="text-btn">
                                Details
                            </Typography>
                        )}
                    </Button>
                </Tooltip>
            </>
        );
    };

    const getMaintenanceTypes = async () => {
        try {
            const res = await GetMaintenanceTypes();
            if (res) {
                setMaintenanceTypes(res);
            }
        } catch (error) {
            console.error("Error fetching maintenance types:", error);
        }
    };

    const getMaintenanceTasks = async () => {
        try {
            setIsLoadingData(true);

            const statusNames =
                valueTab === 0
                    ? ["Approved", "Rework Requested"]
                    : valueTab === 1
                      ? ["In Progress"]
                      : valueTab === 2
                        ? ["Waiting For Review", "Completed"]
                        : [""];

            const statusIDs = statusNames
                .map((name) => requestStatuses?.find((item) => item.Name === name)?.ID)
                .filter(Boolean);

            if (statusIDs.length === 0) return;

            const statusFormat = statusIDs.join(",");

            const res = await GetMaintenanceTask(
                statusFormat,
                page,
                limit,
                selectedType,
                selectedDate ? selectedDate.format("YYYY-MM") : ""
            );

            if (res) {
                setMaintenanceTasks(res.data);
                setTotal(res.total);
                setIsLoadingData(false);
            }
        } catch (error) {
            console.error("Error fetching maintenance tasks:", error);
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

    const getNewMaintenanceTask = async (ID: number) => {
        try {
            const res = await GetMaintenanceTaskByID(ID);
            console.log("res: ", res)
            if (res) {
                setMaintenanceTasks((prev) => [res, ...prev]);
                setTotal((prev) => prev + 1);
            }
        } catch (error) {
            console.error("Error fetching maintenance request:", error);
        }
    };

    const getUpdatedMaintenanceTask = async (data: MaintenanceTasksInterface) => {
        try {
            const res = await GetMaintenanceTaskByID(data.ID || 0);
            if (res) {
                const statusName = res.RequestStatus.Name;

                if (
                    statusName === "Waiting For Review" ||
                    statusName === "In Progress" ||
                    statusName === "Unsuccessful" ||
                    statusName === "Rework Requested"
                ) {
                    setMaintenanceTasks((prev) => prev.filter((task) => task.ID !== data.ID));
                    setTotal((prev) => (prev > 0 ? prev - 1 : 0));
                } else {
                    setMaintenanceTasks((prev) => prev.map((item) => (item.ID === res.ID ? res : item)));
                }

                if (statusName === "Rework Requested" && valueTabRef.current === 0) {
                    setMaintenanceTasks((prev) => [res, ...prev]);
                    setTotal((prev) => prev + 1);
                }
            }
        } catch (error) {
            console.error("Error fetching maintenance request:", error);
        }
    };

    const getUser = async () => {
        try {
            const res = await GetUserById(Number(localStorage.getItem("userId")));
            if (res) {
                setUser(res);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    const handleClickAcceptWork = (
        statusName: "In Progress" | "Unsuccessful",
        actionType: "accept" | "cancel",
        note?: string,
        data?: MaintenanceTasksInterface,
    ) => {
        const statusID = requestStatuses?.find((item) => item.Name === statusName)?.ID || 0;

        handleActionAcception(statusID, {
            selectedTask: data ?? selectedTask,
            setAlerts,
            setOpenConfirmCancelled,
            actionType,
            note,
        });
    };

    const onClickSubmit = () => {
        if (!selectedTask) {
            setAlerts((prev) => [
                ...prev,
                {
                    type: "error",
                    message: "The selected maintenance task information was not found.",
                },
            ]);
            return;
        }
        const statusID = requestStatuses?.find((item) => item.Name === "Waiting For Review")?.ID || 0;

        handleSubmitWork(statusID, {
            selectedTask,
            setAlerts,
            setOpenPopupSubmit,
            files,
            setFiles,
        });
    };

    const handleClearFillter = () => {
        setSelectedDate(null);
        setSearchText("");
        setSelectedType(0);
    };

    const handleClickCheck = (data: MaintenanceTasksInterface) => {
        if (data) {
            const encodedId = Base64.encode(String(data.RequestID));
            const taskID = data?.ID;
            const userID = Number(localStorage.getItem("userId"));

            handleUpdateNotification(userID, true, undefined, taskID, undefined);
            navigate(`/maintenance/check-requests?request_id=${encodeURIComponent(encodedId)}`);
        }
    };

    const filteredTasks = maintenanceTasks.filter((item) => {
        const request = item.MaintenanceRequest;
        const requestId = request?.ID ? Number(request.ID) : null;
        const firstName = request?.User?.FirstName?.toLowerCase() || "";
        const lastName = request?.User?.LastName?.toLowerCase() || "";

        const matchText =
            !searchText ||
            requestId === Number(searchText) ||
            firstName.includes(searchText.toLowerCase()) ||
            lastName.includes(searchText.toLowerCase());

        // คืนค่าเฉพาะรายการที่ตรงกับทุกเงื่อนไข
        return matchText;
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await Promise.all([getMaintenanceTypes(), getRequestStatuses(), getUser()]);
                setIsLoadingInitialData(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (user && requestStatuses) {
            getMaintenanceTasks();
        }
    }, [page, limit, valueTab]);

    useEffect(() => {
        if (user && requestStatuses) {
            getMaintenanceTasks();
        }
    }, [user, selectedType, selectedDate]);

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValueTab(newValue);
    };

    useEffect(() => {
        const socket = io(socketUrl);
        const userId = Number(localStorage.getItem("userId"));

        socket.on("task_created", (data) => {
            if (data.UserID === userId && valueTabRef.current === 0) {
                getNewMaintenanceTask(data.ID);
            }
        });

        socket.on("task_updated", (data) => {
            if (data.UserID === userId) {
                getUpdatedMaintenanceTask(data);
            }
        });

        return () => {
            socket.off("task_created");
            socket.off("task_updated");
        };
    }, []);

    useEffect(() => {
        valueTabRef.current = valueTab;
    }, [valueTab]);

    return (
        <Box className="accept-work-page">
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            {/* Submit Popup */}
            <SubmitPopup
                open={openPopupSubmit}
                onClose={() => setOpenPopupSubmit(false)}
                onConfirm={onClickSubmit}
                setAlerts={setAlerts}
                files={files}
                onChange={setFiles}
            />

            {/* Accepted Confirm */}
            {/* <ConfirmDialog
                open={openConfirmAccepted}
                setOpenConfirm={setOpenConfirmAccepted}
                handleFunction={() => }
                title="Confirm Maintenance Request Processing"
                message="Are you sure you want to start this maintenance request? This action cannot be undone."
                buttonActive={isBottonActive}
            /> */}

            {/* Cancelled Confirm */}
            <ConfirmDialog
                open={openConfirmCancelled}
                setOpenConfirm={setOpenConfirmCancelled}
                handleFunction={(note) => handleClickAcceptWork("Unsuccessful", "cancel", note)}
                title="Confirm Maintenance Cancellation"
                message="Are you sure you want to cancel this maintenance request? This action cannot be undone."
                showNoteField
                buttonActive={isBottonActive}
            />

            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    <Grid container className="title-box" direction={"row"} size={{ xs: 10, md: 12 }} sx={{ gap: 1 }}>
                        <HardHat size={26} />
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            My Work
                        </Typography>
                    </Grid>

                    {/* Filters Section */}
                    {!isLoadingInitialData ? (
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
                                                            <Search size={20} style={{ minWidth: '20px', minHeight: '20px' }}/>
                                                        </InputAdornment>
                                                    ),
                                                },
                                            }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 5, sm: 3 }}>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                views={["year", "month"]}
                                                format="MM/YYYY"
                                                value={selectedDate}
                                                onChange={(value, _) => {
                                                    if (dayjs.isDayjs(value)) {
                                                        setSelectedDate(value);
                                                    } else {
                                                        setSelectedDate(null);
                                                    }
                                                }}
                                                slots={{
                                                    openPickerIcon: CalendarMonth,
                                                }}
                                                sx={{ width: "100%" }}
                                            />
                                        </LocalizationProvider>
                                    </Grid>
                                    <Grid size={{ xs: 5, sm: 3 }}>
                                        <FormControl fullWidth>
                                            <Select
                                                value={selectedType}
                                                onChange={(e) => setSelectedType(Number(e.target.value))}
                                                displayEmpty
                                                startAdornment={
                                                    <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                                        <Briefcase size={20} style={{ minWidth: '20px', minHeight: '20px' }}/>
                                                    </InputAdornment>
                                                }
                                            >
                                                <MenuItem value={0}>{"All Maintenance Types"}</MenuItem>
                                                {maintenanceTypes.map((item, index) => {
                                                    return (
                                                        <MenuItem key={index} value={item.ID}>
                                                            {item.TypeName}
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

                    {/* Data Table */}
                    <Grid container size={{ xs: 12, md: 12 }} spacing={2.2}>
                        <Grid size={{ xs: 12, md: 12 }}>
                            <Tabs
                                value={valueTab}
                                onChange={handleChange}
                                variant="scrollable"
                                allowScrollButtonsMobile
                            >
                                <Tab label="Pending" {...a11yProps(0)} />
                                <Tab label="In Progress" {...a11yProps(1)} />
                                <Tab label="Completed" {...a11yProps(2)} />
                            </Tabs>
                        </Grid>
                        <CustomTabPanel value={valueTab} index={0}>
                            <MaintenanceTaskTable
                                title="Pending"
                                rows={filteredTasks}
                                columns={getColumns()}
                                rowCount={total}
                                page={page}
                                limit={limit}
                                onPageChange={setPage}
                                onLimitChange={setLimit}
                                noData={"No pending tasks found."}
                                isLoading={isLoadingData}
                                columnVisibilityModel={columnVisibilityModel}
                            />
                        </CustomTabPanel>
                        <CustomTabPanel value={valueTab} index={1}>
                            <MaintenanceTaskTable
                                title="In Progress"
                                rows={filteredTasks}
                                columns={getColumns()}
                                rowCount={total}
                                page={page}
                                limit={limit}
                                onPageChange={setPage}
                                onLimitChange={setLimit}
                                noData={"No tasks in progress found."}
                                isLoading={isLoadingData}
                                columnVisibilityModel={columnVisibilityModel}
                            />
                        </CustomTabPanel>
                        <CustomTabPanel value={valueTab} index={2}>
                            <MaintenanceTaskTable
                                title="Completed"
                                rows={filteredTasks}
                                columns={getColumns()}
                                rowCount={total}
                                page={page}
                                limit={limit}
                                onPageChange={setPage}
                                onLimitChange={setLimit}
                                noData={"No completed tasks found."}
                                isLoading={isLoadingData}
                                columnVisibilityModel={columnVisibilityModel}
                            />
                        </CustomTabPanel>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
export default AcceptWork;
