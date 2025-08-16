import { apiUrl, GetMaintenanceRequestByID, GetMaintenanceRequestsForUser, GetRequestStatuses, socketUrl, UpdateMaintenanceRequestByID, UpdateNotificationsByRequestID } from "../../services/http";

import React, { useState, useEffect } from "react";
import { Button, Typography, Avatar, Grid, Box, Card, Divider, useTheme, Container, Tabs, Tab, Skeleton, Tooltip, useMediaQuery } from "@mui/material";
import "../AddUser/AddUserForm.css"; // Import the updated CSS
import { GetUserById } from "../../services/http";
import SuccessAlert from "../../components/Alert/SuccessAlert";

import { analyticsService, KEY_PAGES } from "../../services/analyticsService";
import { useInteractionTracker } from "../../hooks/useInteractionTracker";
import { faXmark, faQuestionCircle, faClock, faCheck, faRepeat, faEye, faPencil, faFileLines, faEnvelope, faPhone, faBriefcase } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ShieldUser } from "lucide-react";
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
import RequestStatusStack from "../../components/RequestStatusStack/RequestStatusStack";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import { NotificationsInterface } from "../../interfaces/INotifications";
import handleActionInspection from "../../utils/handleActionInspection";
import ReworkPopup from "../../components/ReworkPopup/ReworkPopup";
import { io } from "socket.io-client";
import { UserInterface } from "../../interfaces/IUser";

const MyAccount: React.FC = () => {
    const theme = useTheme();
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [user, setUser] = useState<UserInterface | null>();
    const [valueTab, setValueTab] = useState(0);
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([]);
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequestsInterface>({});

    const [statusCounts, setStatusCounts] = useState<Record<string, number>>();
    const [searchText, setSearchText] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>([0]);
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);

    const [isLoadingData, setIsLoadingData] = useState(true);

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
    const [isBottonActive, setIsBottonActive] = useState(false);

    const [openConfirmInspection, setOpenConfirmInspection] = useState<boolean>(false);
    const [openConfirmRework, setOpenConfirmRework] = useState<boolean>(false);
    const [openConfirmCancelled, setOpenConfirmCancelled] = useState<boolean>(false);

    const [requestfiles, setRequestFiles] = useState<File[]>([]);

    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);

    const navigate = useNavigate();

    // Initialize interaction tracker
    const { getInteractionCount } = useInteractionTracker({
        pagePath: KEY_PAGES.MY_ACCOUNT,
        onInteractionChange: () => {},
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
                            icon: faQuestionCircle,
                        };

                        const dateTime = `${dateFormat(params.row.CreatedAt || "")} ${timeFormat(params.row.CreatedAt || "")}`;

                        const description = params.row.Description;
                        const areaID = params.row.Area?.ID;
                        const areaDetail = params.row.AreaDetail;
                        const roomtype = params.row.Room?.RoomType?.TypeName;
                        const roomNum = params.row.Room?.RoomNumber;
                        const roomFloor = params.row.Room?.Floor?.Number;

                        const typeName = params.row.MaintenanceType?.TypeName || "Electrical Work";
                        const maintenanceKey = params.row.MaintenanceType?.TypeName as keyof typeof maintenanceTypeConfig;
                        const { color: typeColor, icon: typeIcon } = maintenanceTypeConfig[maintenanceKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: faQuestionCircle,
                        };

                        const showButtonConfirm = params.row.RequestStatus?.Name === "Waiting For Review";
                        const showButtonCancel = params.row.RequestStatus?.Name === "Pending";

                        const cardItem = document.querySelector(".card-item-container") as HTMLElement;
                        let width;
                        if (cardItem) {
                            width = cardItem.offsetWidth;
                        }

                        return (
                            <Grid container size={{ xs: 12 }} sx={{ px: 1 }} className="card-item-container">
                                <Grid size={{ xs: 7 }}>
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
                                    <Box
                                        sx={{
                                            color: "text.secondary",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.4,
                                            my: 0.8,
                                        }}
                                    >
                                        <FontAwesomeIcon
                                            icon={faClock}
                                            style={{
                                                width: "12px",
                                                height: "12px",
                                                paddingBottom: "4px",
                                            }}
                                        />
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
                                        <FontAwesomeIcon icon={typeIcon} />
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

                                <Grid size={{ xs: 5 }} container direction="column">
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
                                        <FontAwesomeIcon icon={statusIcon} />
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
                                                            variant="containedBlue"
                                                            onClick={() => {
                                                                setOpenConfirmInspection(true);
                                                                setSelectedRequest(data);
                                                            }}
                                                            fullWidth
                                                        >
                                                            <FontAwesomeIcon icon={faCheck} size="lg" />
                                                            <Typography variant="textButtonClassic" className="text-btn">
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
                                                            <FontAwesomeIcon icon={faRepeat} size="lg" />
                                                            <Typography variant="textButtonClassic" className="text-btn">
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
                                                            <FontAwesomeIcon icon={faEye} size="lg" />
                                                            {width && width > 530 && (
                                                                <Typography variant="textButtonClassic" className="text-btn">
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
                                                            variant="containedCancel"
                                                            onClick={() => {
                                                                setOpenConfirmCancelled(true);
                                                                setSelectedRequest(data);
                                                            }}
                                                            fullWidth
                                                        >
                                                            <FontAwesomeIcon icon={faXmark} size="lg" />
                                                            <Typography variant="textButtonClassic" className="text-btn">
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
                                                            <FontAwesomeIcon icon={faEye} size="lg" />
                                                            {width && width > 250 && (
                                                                <Typography variant="textButtonClassic" className="text-btn">
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
                                                    <FontAwesomeIcon icon={faEye} size="lg" />
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
                        const maintenanceKey = params.row.MaintenanceType?.TypeName as keyof typeof maintenanceTypeConfig;
                        const { color, icon } = maintenanceTypeConfig[maintenanceKey] ?? {
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
                                                variant="containedBlue"
                                                onClick={() => {
                                                    setOpenConfirmInspection(true);
                                                    setSelectedRequest(data);
                                                }}
                                                sx={{
                                                    minWidth: "42px",
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faCheck} size="lg" />
                                                <Typography variant="textButtonClassic" className="text-btn">
                                                    Confirm
                                                </Typography>
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title={"Rework"}>
                                            <Button
                                                className="btn-rework"
                                                variant="outlined"
                                                onClick={() => {
                                                    setOpenConfirmRework(true);
                                                    setSelectedRequest(data);
                                                }}
                                                sx={{
                                                    minWidth: "42px",
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faRepeat} size="lg" />
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
                                                <FontAwesomeIcon icon={faEye} size="lg" />
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
                                                variant="containedCancel"
                                                onClick={() => {
                                                    setOpenConfirmCancelled(true);
                                                    setSelectedRequest(data);
                                                }}
                                                sx={{
                                                    minWidth: "42px",
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faXmark} size="lg" />
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
                                                <FontAwesomeIcon icon={faEye} size="lg" />
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
                                            <FontAwesomeIcon icon={faEye} size="lg" />
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

    const getMaintenanceRequests = async (pageNum: number = 1, setTotalFlag = false) => {
        try {
            const userId = localStorage.getItem("userId");
            const statusFormat = selectedStatuses.join(",");
            const res = await GetMaintenanceRequestsForUser(statusFormat, pageNum, limit, selectedDate ? selectedDate.format("YYYY-MM-DD") : "", Number(userId));

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
            // Error handling for maintenance requests
        }
    };

    const getRequestStatuses = async () => {
        try {
            const res = await GetRequestStatuses();
            if (res) {
                setRequestStatuses(res);
            }
        } catch (error) {
            // Error handling for request statuses
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
            // Error handling for user data
        }
    };

    const getUpdateMaintenanceRequest = async (ID: number) => {
        try {
            const res = await GetMaintenanceRequestByID(ID);
            if (res) {
                setMaintenanceRequests((prev) => prev.map((item) => (item.ID === res.ID ? res : item)));
            }
        } catch (error) {
            // Error handling for maintenance request update
        }
    };

    const handleClickCheck = (data: MaintenanceRequestsInterface) => {
        if (data) {
            const encodedId = Base64.encode(String(data.ID));
            navigate(`/maintenance/check-requests?request_id=${encodeURIComponent(encodedId)}`);
        }
    };

    const handleClickInspection = (statusName: "Completed" | "Rework Requested", actionType: "confirm" | "rework", note?: string) => {
        setIsBottonActive(true);
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
        setIsBottonActive(false);
    };

    const handleClickCancel = async () => {
        try {
            setIsBottonActive(true);
            const statusID = requestStatuses?.find((item) => item.Name === "Unsuccessful")?.ID || 0;

            const request: MaintenanceRequestsInterface = {
                RequestStatusID: statusID,
            };

            const resRequest = await UpdateMaintenanceRequestByID(request, selectedRequest?.ID);
            if (!resRequest || resRequest.error) throw new Error(resRequest?.error || "Failed to update request status.");

            const notificationDataUpdate: NotificationsInterface = {
                IsRead: true,
            };
            const resUpdateNotification = await UpdateNotificationsByRequestID(notificationDataUpdate, selectedRequest.ID);
            if (!resUpdateNotification || resUpdateNotification.error) throw new Error(resUpdateNotification?.error || "Failed to update notification.");

            setTimeout(() => {
                setAlerts((prev) => [
                    ...prev,
                    {
                        type: "success",
                        message: "Request cancelled successfully",
                    },
                ]);

                setOpenConfirmCancelled(false);
                setIsBottonActive(false);
            }, 500);
        } catch (error) {
            const errMessage = (error as Error).message || "Unknown error!";
            setAlerts((prev) => [...prev, { type: "error", message: errMessage }]);
            setIsBottonActive(false);
        }
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
            // Error handling for initial data fetch
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
        if (requestStatuses) {
            getMaintenanceRequests(1, true);
        }
    }, [selectedStatuses, selectedDate]);

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

    useEffect(() => {
        const socket = io(socketUrl);

        socket.on("maintenance_updated", (data) => {
            getUpdateMaintenanceRequest(data.ID);
        });

        return () => {
            socket.off("maintenance_updated");
        };
    }, []);

    return (
        <Box className="my-accout-page">
            {alerts.map(
                (alert, index) =>
                    alert.type === "success" && (
                        <SuccessAlert key={index} message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />
                    )
            )}

            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            {/* Inspection Confirm */}
            <ConfirmDialog
                open={openConfirmInspection}
                setOpenConfirm={setOpenConfirmInspection}
                handleFunction={() => handleClickInspection("Completed", "confirm")}
                title="Confirm Maintenance Inspection"
                message="Are you sure you want to confirm the inspection of this maintenance request? This action cannot be undone."
                buttonActive={isBottonActive}
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
                buttonActive={isBottonActive}
            />



            <Container maxWidth={false} sx={{ padding: "0px 0px !important", width: "100%" }}>
                <Grid container spacing={3} sx={{ width: "100% !important", padding: "0px 24px !important" }}>
                    <Grid container className="title-box" direction={"row"} size={{ xs: 5 }} sx={{ gap: 1 }}>
                        <ShieldUser size={26} />
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            My Account
                        </Typography>
                    </Grid>

                    <Grid container size={{ xs: 7, sm: 7 }} sx={{ justifyContent: "flex-end" }}>
                        <Link to="/my-account/edit-profile">
                            <Button variant="containedBlue">
                                <FontAwesomeIcon icon={faPencil} size="lg" />
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
                                    <Grid container size={{ xs: 12 }} columnSpacing={10} rowSpacing={1.2} sx={{ mt: 2 }}>
                                        <Grid>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                                <FontAwesomeIcon icon={faBriefcase} size="sm" color={theme.palette.warning.main} />
                                                <Typography
                                                    sx={{
                                                        fontSize: 16,
                                                        fontWeight: 600,
                                                        color: `${theme.palette.primary.main} !important`,
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
                                                <FontAwesomeIcon icon={faEnvelope} size="sm" color={theme.palette.info.main} />
                                                <Typography
                                                    sx={{
                                                        fontSize: 16,
                                                        fontWeight: 600,
                                                        color: `${theme.palette.primary.main} !important`,
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
                                                <FontAwesomeIcon icon={faPhone} size="sm" color={theme.palette.success.main} />
                                                <Typography
                                                    sx={{
                                                        fontSize: 16,
                                                        fontWeight: 600,
                                                        color: `${theme.palette.primary.main} !important`,
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
                        <Grid size={{ xs: 6 }}>
                            <Tabs value={valueTab} onChange={handleChange} variant="scrollable" allowScrollButtonsMobile>
                                <Tab label="Maintenance Request" {...a11yProps(0)} />
                                <Tab label="Room Booking" {...a11yProps(1)} />
                                <Tab label="Payment" {...a11yProps(2)} />
                            </Tabs>
                        </Grid>
                        <Grid container size={{ xs: 6 }} sx={{ justifyContent: "flex-end" }}>
                            <Link to="/maintenance/create-maintenance-request">
                                <Button variant="contained">
                                    <FontAwesomeIcon icon={faFileLines} size="lg" />
                                    <Typography variant="textButtonClassic">Create Request</Typography>
                                </Button>
                            </Link>
                        </Grid>
                    </Grid>

                                        <CustomTabPanel value={valueTab} index={0}>
                                <Grid container size={{ xs: 12 }} spacing={2}>
                                    {/* Count Status Section */}
                                    {!statusCounts ? (
                                        <Skeleton variant="rectangular" width="100%" height={50} sx={{ borderRadius: 2 }} />
                                    ) : (
                                        <Grid
                                            container
                                            spacing={1}
                                            className="filter-section"
                                            size={{ xs: 12 }}
                                            sx={{
                                                height: "auto",
                                            }}
                                        >
                                            <RequestStatusStack statusCounts={statusCounts || {}} />
                                        </Grid>
                                    )}

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
                                        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
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
                            <CustomTabPanel value={valueTab} index={2}></CustomTabPanel>
                        </Grid>
            </Container>
        </Box>
    );
};

export default MyAccount;