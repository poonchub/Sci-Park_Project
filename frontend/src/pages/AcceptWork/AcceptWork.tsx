import { Box, Button, Card, Divider, FormControl, Grid, InputAdornment, MenuItem, Skeleton, Tab, Tabs, Typography } from "@mui/material";
import { TextField } from "../../components/TextField/TextField";
import { useEffect, useRef, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheck,
    faEye,
    faMagnifyingGlass,
    faPaperPlane,
    faQuestionCircle,
    faRotateRight,
    faToolbox,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { GridColDef } from "@mui/x-data-grid";
import {
    GetMaintenanceTask,
    GetMaintenanceTaskByID,
    GetMaintenanceTypes,
    GetNotificationsByTaskAndUser,
    GetRequestStatuses,
    socketUrl,
    UpdateNotificationByID,
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

function a11yProps(index: number) {
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
                        const maintenanceKey = requests?.MaintenanceType?.TypeName as keyof typeof maintenanceTypeConfig;
                        const { color, icon } = maintenanceTypeConfig[maintenanceKey] ?? { color: "#000", colorLite: "#000", icon: faQuestionCircle };

                        const isApproved = params.row.RequestStatus?.Name === "Approved";
                        const isRework = params.row.RequestStatus?.Name === "Rework Requested";
                        const isInProgress = params.row.RequestStatus?.Name === "In Progress";
                        const isWaitingForReview = params.row.RequestStatus?.Name === "Waiting For Review";

                        const cardItem = document.querySelector(".card-row-container") as HTMLElement;
                        let width;
                        if (cardItem) {
                            width = cardItem.offsetWidth;
                        }

                        return (
                            <Grid container size={{ xs: 12 }} sx={{ px: 1 }} className="card-row-container">
                                <Grid size={{ xs: 7 }}>
                                    <Typography
                                        sx={{
                                            fontSize: 16,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: "100%",
                                        }}
                                    >
                                        {areaID === 2 ? `${areaDetail}` : `${roomtype} - Floor ${roomFloor}, Room No. ${roomNum}`}
                                    </Typography>
                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.4, my: 0.8 }}>
                                        <FontAwesomeIcon icon={faClock} style={{ width: "12px", height: "12px", paddingBottom: "4px" }} />
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
                                        <FontAwesomeIcon icon={icon} />
                                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{typeName}</Typography>
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
                                                        <Button
                                                            variant="containedBlue"
                                                            onClick={() => {
                                                                setOpenConfirmAccepted(true);
                                                                setSelectedTask(data);
                                                            }}
                                                            fullWidth
                                                        >
                                                            <FontAwesomeIcon icon={faCheck} />
                                                            <Typography variant="textButtonClassic">Start</Typography>
                                                        </Button>
                                                    </Grid>
                                                    <Grid size={{ xs: 5 }}>
                                                        <Button
                                                            variant="containedCancel"
                                                            onClick={() => {
                                                                setOpenConfirmCancelled(true);
                                                                setSelectedTask(data);
                                                            }}
                                                            fullWidth
                                                        >
                                                            <FontAwesomeIcon icon={faXmark} size="xl" />
                                                            <Typography variant="textButtonClassic">Cancel</Typography>
                                                        </Button>
                                                    </Grid>
                                                </>
                                            ) : isInProgress ? (
                                                <>
                                                    <Grid size={{ xs: 5 }}>
                                                        <Button
                                                            variant="containedBlue"
                                                            onClick={() => {
                                                                setOpenPopupSubmit(true);
                                                                setSelectedTask(data);
                                                            }}
                                                            fullWidth
                                                        >
                                                            <FontAwesomeIcon icon={faPaperPlane} />
                                                            <Typography variant="textButtonClassic">Submit</Typography>
                                                        </Button>
                                                    </Grid>
                                                    <Grid size={{ xs: 5 }}>
                                                        <Button
                                                            variant="containedCancel"
                                                            onClick={() => {
                                                                setOpenConfirmCancelled(true);
                                                                setSelectedTask(data);
                                                            }}
                                                            fullWidth
                                                        >
                                                            <FontAwesomeIcon icon={faXmark} size="xl" />
                                                            <Typography variant="textButtonClassic">Cancel</Typography>
                                                        </Button>
                                                    </Grid>
                                                </>
                                            ) : (
                                                <></>
                                            )}
                                            {isWaitingForReview ? (
                                                <Grid size={{ xs: 12 }}>
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
                                                        <FontAwesomeIcon icon={faEye} size="lg" />
                                                        <Typography variant="textButtonClassic" className="text-btn">
                                                            Details
                                                        </Typography>
                                                    </Button>
                                                </Grid>
                                            ) : (
                                                <Grid size={{ xs: 2 }}>
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
                                                        <FontAwesomeIcon icon={faEye} size="lg" />
                                                        {width && width > 530 && (
                                                            <Typography variant="textButtonClassic" className="text-btn">
                                                                Details
                                                            </Typography>
                                                        )}
                                                    </Button>
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
                        return params.row.MaintenanceRequest?.ID;
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
                        const maintenanceKey = requests?.MaintenanceType?.TypeName as keyof typeof maintenanceTypeConfig;
                        const { color, icon } = maintenanceTypeConfig[maintenanceKey] ?? { color: "#000", colorLite: "#000", icon: faQuestionCircle };

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
                                    {areaID === 2 ? `${areaDetail}` : `${roomtype} - Floor ${roomFloor}, Room No. ${roomNum}`}
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
                                    <FontAwesomeIcon icon={icon} />
                                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{typeName}</Typography>
                                </Box>
                            </Box>
                        );
                    },
                },
                {
                    field: "UpdatedAt",
                    headerName: valueTab === 0 ? "Date Assigned" : valueTab === 1 ? "Start Date" : valueTab === 2 ? "Date Submitted" : "",
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
                        const inspection = params.row.MaintenanceRequest?.Inspection;
                        const user = inspection?.User;
                        const name = `${user?.FirstName} ${user?.LastName}`;
                        const date = dateFormat(inspection?.CreatedAt || "");
                        const time = timeFormat(inspection?.CreatedAt || "");
                        return inspection ? (
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
                        <Button
                            className="btn-accept"
                            variant="containedBlue"
                            onClick={() => {
                                setOpenConfirmAccepted(true);
                                setSelectedTask(data);
                            }}
                            sx={{ minWidth: "42px" }}
                        >
                            <FontAwesomeIcon icon={faCheck} size="lg" />
                            <Typography variant="textButtonClassic" className="text-btn">
                                Start
                            </Typography>
                        </Button>
                        <Button
                            className="btn-reject"
                            variant="containedCancel"
                            onClick={() => {
                                setOpenConfirmCancelled(true);
                                setSelectedTask(data);
                            }}
                            sx={{ minWidth: "42px" }}
                        >
                            <FontAwesomeIcon icon={faXmark} size="lg" />
                            <Typography variant="textButtonClassic" className="text-btn">
                                Cancel
                            </Typography>
                        </Button>
                    </>
                )}

                {showSubmit && (
                    <>
                        <Button
                            className="btn-submit"
                            variant="containedBlue"
                            onClick={() => {
                                setOpenPopupSubmit(true);
                                setSelectedTask(data);
                            }}
                            sx={{ minWidth: "42px" }}
                        >
                            <FontAwesomeIcon icon={faPaperPlane} />
                            <Typography variant="textButtonClassic" className="text-btn">
                                Submit
                            </Typography>
                        </Button>
                        <Button
                            className="btn-reject"
                            variant="containedCancel"
                            onClick={() => {
                                setOpenConfirmCancelled(true);
                                setSelectedTask(data);
                            }}
                            sx={{ minWidth: "42px" }}
                        >
                            <FontAwesomeIcon icon={faXmark} size="lg" />
                            <Typography variant="textButtonClassic" className="text-btn">
                                Cancel
                            </Typography>
                        </Button>
                    </>
                )}

                <Button
                    className="btn-detail"
                    variant="outlinedGray"
                    onClick={() => handleClickCheck(data)}
                    sx={{
                        minWidth: "42px",
                        width: !(showSubmit || showAcceptReject) ? "100%" : "",
                    }}
                >
                    <FontAwesomeIcon icon={faEye} size="lg" />
                    {!(showSubmit || showAcceptReject) ? (
                        <Typography variant="textButtonClassic">Details</Typography>
                    ) : (
                        <Typography variant="textButtonClassic" className="text-btn">
                            Details
                        </Typography>
                    )}
                </Button>
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

            const statusIDs = statusNames.map((name) => requestStatuses?.find((item) => item.Name === name)?.ID).filter(Boolean);

            if (statusIDs.length === 0) return;

            const statusFormat = statusIDs.join(",");

            const res = await GetMaintenanceTask(statusFormat, page, limit, selectedType, selectedDate ? selectedDate.format("YYYY-MM") : "");

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

    const handleClickAcceptWork = (statusName: "In Progress" | "Unsuccessful", actionType: "accept" | "cancel", note?: string) => {
        const statusID = requestStatuses?.find((item) => item.Name === statusName)?.ID || 0;

        handleActionAcception(statusID, {
            selectedTask,
            setAlerts,
            setOpenConfirmAccepted,
            setOpenConfirmCancelled,
            actionType,
            note,
        });
    };

    const onClickSubmit = () => {
        if (!selectedTask) {
            setAlerts((prev) => [...prev, { type: "error", message: "The selected maintenance task information was not found." }]);
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

    const handleUpdateNotification = async (task_id?: number, user_id?: number) => {
        try {
            const resNotification = await GetNotificationsByTaskAndUser(task_id, user_id);
            if (!resNotification || resNotification.error) console.error("Error fetching notification.");

            const notificationData: NotificationsInterface = {
                IsRead: true,
            };
            const notificationID = resNotification.data.ID;
            if (!resNotification.data.IsRead) {
                const resUpdated = await UpdateNotificationByID(notificationData, notificationID);
                if (resUpdated) {
                    console.log("✅ Notification updated successfully.");
                }
            } else {
                return;
            }
        } catch (error) {
            console.error("❌ Error updating maintenance request:", error);
        }
    };

    const handleClickCheck = (data: MaintenanceTasksInterface) => {
        if (data) {
            const encodedId = Base64.encode(String(data.RequestID));
            const taskID = data?.ID;
            const userID = Number(localStorage.getItem("userId"));

            handleUpdateNotification(taskID, userID);
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
                await Promise.all([getMaintenanceTypes(), getRequestStatuses()]);
                setIsLoadingInitialData(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        getMaintenanceTasks();
    }, [requestStatuses]);

    useEffect(() => {
        getMaintenanceTasks();
    }, [page, limit, selectedType, selectedDate, valueTab]);

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
            <ConfirmDialog
                open={openConfirmAccepted}
                setOpenConfirm={setOpenConfirmAccepted}
                handleFunction={() => handleClickAcceptWork("In Progress", "accept")}
                title="Confirm Maintenance Request Processing"
                message="Are you sure you want to proceed with this maintenance request? This action cannot be undone."
                buttonActive={isBottonActive}
            />

            {/* Cancelled Confirm */}
            <ConfirmDialog
                open={openConfirmCancelled}
                setOpenConfirm={setOpenConfirmCancelled}
                handleFunction={(note) => handleClickAcceptWork("Unsuccessful", "cancel", note)}
                title="Confirm Maintenance Cancellation"
                message="Are you sure you want to cancel this maintenance request? This action cannot be undone.ด้"
                showNoteField
                buttonActive={isBottonActive}
            />

            <Grid container spacing={3}>
                <Grid className="title-box" size={{ xs: 10, md: 12 }}>
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
                                                        <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 5, sm: 3 }}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            views={['year', 'month']}
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
                                                    <FontAwesomeIcon icon={faToolbox} size="lg" />
                                                </InputAdornment>
                                            }
                                        >
                                            <MenuItem value={0}>{"All Maintenance Types"}</MenuItem>
                                            {maintenanceTypes.map((item, index) => {
                                                return (
                                                    <MenuItem key={index} value={index + 1}>
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
                                        <FontAwesomeIcon icon={faRotateRight} size="lg" style={{ color: "gray" }} />
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
                        <Tabs value={valueTab} onChange={handleChange} variant="scrollable" allowScrollButtonsMobile>
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
                            onPageChange={(p) => setPage(p + 1)}
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
                            onPageChange={(p) => setPage(p + 1)}
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
                            onPageChange={(p) => setPage(p + 1)}
                            onLimitChange={setLimit}
                            noData={"No completed tasks found."}
                            isLoading={isLoadingData}
                            columnVisibilityModel={columnVisibilityModel}
                        />
                    </CustomTabPanel>
                </Grid>
            </Grid>
        </Box>
    );
}
export default AcceptWork;
