import { useNavigate } from "react-router-dom";
import "./AllMaintenanceRequest.css";
import { Box, Button, Container, Divider, Grid, Skeleton, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { useEffect, useState } from "react";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";

import {
    GetMaintenanceRequestByID,
    GetMaintenanceRequestsForAdmin,
    GetNotificationsByRequestAndUser,
    GetOperators,
    GetRequestStatuses,
    GetUserById,
    socketUrl,
    UpdateNotificationByID,
} from "../../services/http";

import { GridColDef } from "@mui/x-data-grid";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { UserInterface } from "../../interfaces/IUser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faXmark, faEye, faCheck } from "@fortawesome/free-solid-svg-icons";
import { faClock, faUser } from "@fortawesome/free-regular-svg-icons";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import dayjs, { Dayjs } from "dayjs";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import dateFormat from "../../utils/dateFormat";
import { statusConfig } from "../../constants/statusConfig";
import RequestStatusCards from "../../components/RequestStatusCards/RequestStatusCards";
import handleActionApproval from "../../utils/handleActionApproval";
import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";
import timeFormat from "../../utils/timeFormat";
import { isAdmin, isManager } from "../../routes";
import ApprovePopup from "../../components/ApprovePopup/ApprovePopup";
import { maintenanceTypeConfig } from "../../constants/maintenanceTypeConfig";
import FilterSection from "../../components/FilterSection/FilterSection";
import RequestStatusStackForAdmin from "../../components/RequestStatusStackForAdmin/RequestStatusStackForAdmin";
import theme from "../../styles/Theme";

import { io } from "socket.io-client";
import { NotificationsInterface } from "../../interfaces/INotifications";

import { Base64 } from "js-base64";
import AnimatedBell from "../../components/AnimatedIcons/AnimatedBell";

function AllMaintenanceRequest() {
    const [user, setUser] = useState<UserInterface>();
    const [operators, setOperators] = useState<UserInterface[]>([]);
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([]);
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([]);

    const [statusCounts, setStatusCounts] = useState<Record<string, number>>();
    const [searchText, setSearchText] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>([0]);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
    const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequestsInterface>({});
    const [selectedOperator, setSelectedOperator] = useState(0);

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);
    // const [totalAll, setTotalAll] = useState(0);
    // const [counts, setCounts] = useState();

    const [openPopupApproved, setOpenPopupApproved] = useState(false);
    const [openConfirmRejected, setOpenConfirmRejected] = useState<boolean>(false);

    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

    const [isButtonActive, setIsButtonActive] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const navigate = useNavigate();

    const getColumns = (): GridColDef[] => {
        if (isSmallScreen) {
            return [
                {
                    field: "All Maintenance Requests",
                    headerName: "All Maintenance Requests",
                    flex: 1,
                    renderCell: (params) => {
                        const data = params.row;
                        const showButtonApprove = params.row.RequestStatus?.Name === "Pending" && (isManager || isAdmin);

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

                        const requester = params.row.User;
                        const requesterName = `${requester?.FirstName || ""} ${requester?.LastName || ""} (${requester?.EmployeeID})`;

                        const notification = params.row.Notifications ?? [];
                        const hasNotificationForUser = notification.some((n: NotificationsInterface) => n.UserID === user?.ID && !n.IsRead);

                        const cardItem = document.querySelector(".card-item-container") as HTMLElement;
                        let width;
                        if (cardItem) {
                            width = cardItem.offsetWidth;
                        }

                        return (
                            <Grid container size={{ xs: 12 }} sx={{ px: 1 }} className="card-item-container">
                                <Grid size={{ xs: 7 }}>
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
                                            {areaID === 2 ? `${areaDetail}` : `${roomtype} - Floor ${roomFloor}, Room No. ${roomNum}`}
                                        </Typography>
                                    </Box>
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
                                            my: 0.8,
                                        }}
                                    >
                                        {description}
                                    </Typography>
                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.4, my: 1 }}>
                                        <FontAwesomeIcon icon={faUser} style={{ width: "12px", height: "12px", paddingBottom: "4px" }} />
                                        <Typography
                                            sx={{
                                                fontSize: 13,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {requesterName}
                                        </Typography>
                                    </Box>
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
                                        {showButtonApprove ? (
                                            <Grid container spacing={0.8} size={{ xs: 12 }}>
                                                <Grid size={{ xs: 5 }}>
                                                    <Tooltip title={"Approve"}>
                                                        <Button
                                                            variant="containedBlue"
                                                            onClick={() => {
                                                                setOpenPopupApproved(true);
                                                                setSelectedRequest(data);
                                                            }}
                                                            fullWidth
                                                        >
                                                            <FontAwesomeIcon icon={faCheck} size="lg" />
                                                            <Typography variant="textButtonClassic" className="text-btn">
                                                                Approve
                                                            </Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                                <Grid size={{ xs: 5 }}>
                                                    <Tooltip title={"Reject"}>
                                                        <Button
                                                            variant="containedCancel"
                                                            onClick={() => {
                                                                setOpenConfirmRejected(true);
                                                                setSelectedRequest(data);
                                                            }}
                                                            fullWidth
                                                        >
                                                            <FontAwesomeIcon icon={faXmark} size="lg" />
                                                            <Typography variant="textButtonClassic" className="text-btn">
                                                                Reject
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
                    align: "center",
                    headerAlign: "center",
                    renderCell: (params) => {
                        const requestID = params.row.ID;
                        const notification = params.row.Notifications ?? [];
                        const hasNotificationForUser = notification.some((n: NotificationsInterface) => n.UserID === user?.ID && !n.IsRead);
                        return (
                            <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "5px" }}>
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
                    field: "Requester",
                    headerName: "Requester",
                    description: "This column has a value getter and is not sortable.",
                    sortable: false,
                    flex: 1.2,
                    renderCell: (params) => {
                        const user = params.row.User;
                        const name = `${user.FirstName || ""} ${user.LastName || ""}`;
                        const employeeID = user.EmployeeID;
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
                    field: "Actions",
                    headerName: "Actions",
                    type: "string",
                    flex: 1.5,
                    renderCell: (item) => {
                        const data = item.row;
                        const showButtonApprove = item.row.RequestStatus?.Name === "Pending" && (isManager || isAdmin);
                        return (
                            <Box
                                className="container-btn"
                                sx={{
                                    display: "flex",
                                    gap: 0.8,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    height: '100%'
                                }}
                            >
                                {showButtonApprove ? (
                                    <>
                                        <Tooltip title={"Approve"}>
                                            <Button
                                                className="btn-approve"
                                                variant="containedBlue"
                                                onClick={() => {
                                                    setOpenPopupApproved(true);
                                                    setSelectedRequest(data);
                                                }}
                                                sx={{
                                                    minWidth: "42px",
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faCheck} size="lg" />
                                                <Typography variant="textButtonClassic" className="text-btn">
                                                    Approve
                                                </Typography>
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title={"Reject"}>
                                            <Button
                                                className="btn-reject"
                                                variant="containedCancel"
                                                onClick={() => {
                                                    setOpenConfirmRejected(true);
                                                    setSelectedRequest(data);
                                                }}
                                                sx={{
                                                    minWidth: "42px",
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faXmark} size="lg" />
                                                <Typography variant="textButtonClassic" className="text-btn">
                                                    Reject
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

    const getOperators = async () => {
        try {
            const res = await GetOperators();
            if (res) {
                setOperators(res);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
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

    const getMaintenanceRequests = async (pageNum: number = 1, setTotalFlag = false) => {
        try {
            const reqType = user?.RequestType?.TypeName || "";
            const statusFormat = selectedStatuses.join(",");
            const res = await GetMaintenanceRequestsForAdmin(
                statusFormat,
                pageNum,
                limit,
                0,
                selectedDate ? selectedDate.format("YYYY-MM") : "",
                reqType
            );

            if (res) {
                setMaintenanceRequests(res.data);
                // setCounts(res.counts);

                // const totalCount = res.counts.reduce((sum: number, item: { count: number }) => sum + item.count, 0);
                // setTotalAll(totalCount);

                if (setTotalFlag) setTotal(res.total);

                const formatted = res.statusCounts.reduce((acc: any, item: any) => {
                    acc[item.status_name] = item.count;
                    return acc;
                }, {});
                setStatusCounts(formatted);
            }
        } catch (error) {
            console.error("Error fetching maintenance requests:", error);
        }
    };

    const getNewMaintenanceRequest = async (ID: number) => {
        try {
            const res = await GetMaintenanceRequestByID(ID);
            if (res) {
                setMaintenanceRequests((prev) => [res, ...prev]);
                setTotal((prev) => prev + 1);
            }
        } catch (error) {
            console.error("Error fetching maintenance request:", error);
        }
    };

    const getUpdateMaintenanceRequest = async (ID: number) => {
        try {
            const res = await GetMaintenanceRequestByID(ID);
            if (res) {
                setMaintenanceRequests((prev) => prev.map((item) => (item.ID === res.ID ? res : item)));
            }
        } catch (error) {
            console.error("Error fetching update maintenance:", error);
        }
    };

    const handleClickApprove = (statusName: "Approved" | "Unsuccessful", actionType: "approve" | "reject", note?: string) => {
        const statusID = requestStatuses?.find((item) => item.Name === statusName)?.ID || 0;
        setIsButtonActive(true);
        handleActionApproval(statusID, {
            userID: user?.ID,
            selectedRequest,
            selectedOperator,
            setSelectedOperator,
            setAlerts,
            setOpenPopupApproved,
            setOpenConfirmRejected,
            actionType,
            note,
        });
        setIsButtonActive(false);
    };

    const handleClearFillter = () => {
        setSelectedDate(null);
        setSearchText("");
        setSelectedStatuses([0]);
    };

    const handleUpdateNotification = async (request_id?: number, user_id?: number) => {
        try {
            const resNotification = await GetNotificationsByRequestAndUser(request_id, user_id);
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

    const handleClickCheck = (data: MaintenanceRequestsInterface) => {
        if (data) {
            const encodedId = Base64.encode(String(data.ID));
            const requestID = data?.ID;
            const userID = user?.ID;

            handleUpdateNotification(requestID, userID);
            navigate(`/maintenance/check-requests?request_id=${encodeURIComponent(encodedId)}`);
        }
    };

    const filteredRequests = maintenanceRequests.filter((request) => {
        const requestId = request.ID ? Number(request.ID) : null;
        const firstName = request.User?.FirstName?.toLowerCase() || "";
        const lastName = request.User?.LastName?.toLowerCase() || "";
        const roomType = (request.Room?.RoomType?.TypeName ?? "").toLowerCase() || "";

        const matchText =
            !searchText ||
            requestId === Number(searchText) ||
            firstName.includes(searchText.toLowerCase()) ||
            lastName.includes(searchText.toLowerCase()) ||
            roomType.includes(searchText.toLowerCase());

        // คืนค่าเฉพาะรายการที่ตรงกับทุกเงื่อนไข
        return matchText;
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await Promise.all([getUser(), getRequestStatuses(), getOperators()]);
                setIsLoadingData(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (user && requestStatuses) {
            getMaintenanceRequests(page);
        }
    }, [page, limit]);

    useEffect(() => {
        if (user && requestStatuses) {
            getMaintenanceRequests(1, true);
        }
    }, [user, selectedStatuses, selectedDate]);

    useEffect(() => {
        const socket = io(socketUrl);

        socket.on("maintenance_created", (data) => {
            console.log("📦 New maintenance request:", data);
            getNewMaintenanceRequest(data.ID);
        });

        socket.on("maintenance_updated", (data) => {
            console.log("🔄 Maintenance request updated:", data);
            getUpdateMaintenanceRequest(data.ID);
        });

        return () => {
            socket.off("maintenance_created");
            socket.off("maintenance_updated");
        };
    }, []);

    return (
        <Box className="all-maintenance-request-page">
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            {/* Approve Popup */}
            <ApprovePopup
                open={openPopupApproved}
                onClose={() => setOpenPopupApproved(false)}
                onConfirm={() => handleClickApprove("Approved", "approve")}
                requestSelected={selectedRequest}
                selectedOperator={selectedOperator}
                setSelectedOperator={setSelectedOperator}
                operators={operators}
                maintenanceTypeConfig={maintenanceTypeConfig}
                buttonActive={isButtonActive}
            />

            {/* Rejected Confirm */}
            <ConfirmDialog
                open={openConfirmRejected}
                setOpenConfirm={setOpenConfirmRejected}
                handleFunction={(note) => handleClickApprove("Unsuccessful", "reject", note)}
                title="Confirm Maintenance Request Rejection"
                message="Are you sure you want to reject this maintenance request? This action cannot be undone."
                showNoteField
                buttonActive={isButtonActive}
            />

            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    {/* Header Section */}
                    <Grid className="title-box" size={{ xs: 12, md: 12 }}>
                        <Typography
                            variant="h5"
                            className="title"
                            sx={{
                                fontWeight: 700,
                            }}
                        >
                            Maintenance Request List
                        </Typography>
                    </Grid>

                    {!isLoadingData && statusCounts ? (
                        <>
                            <Grid container size={{ md: 12, lg: 12 }} spacing={3}>
                                {/* Status Section */}
                                <RequestStatusCards statusCounts={statusCounts || {}} />

                                <RequestStatusStackForAdmin statusCounts={statusCounts || {}} />

                                {/* Filters Section size lg */}
                                <FilterSection
                                    // display={{ xs: "none", md: "none", lg: "flex" }}
                                    searchText={searchText}
                                    setSearchText={setSearchText}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                    selectedStatuses={selectedStatuses}
                                    setSelectedStatuses={setSelectedStatuses}
                                    handleClearFilter={handleClearFillter}
                                    requestStatuses={requestStatuses}
                                />
                            </Grid>
                            {/* Chart Section */}
                            {/* <Grid size={{ xs: 12, lg: 5 }}>
                                <Card
                                    sx={{
                                        bgcolor: "secondary.main",
                                        borderRadius: 2,
                                        py: 2,
                                        px: 3,
                                        height: "100%",
                                    }}
                                >
                                    <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>
                                        รายการแจ้งซ่อม
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: 24,
                                            color: "#F26522",
                                        }}
                                    >{`${totalAll} รายการ`}</Typography>
                                    <ApexLineChart height={160} selectedDate={selectedDate} counts={counts} />
                                </Card>
                            </Grid> */}
                        </>
                    ) : (
                        <Skeleton variant="rectangular" width="100%" height={320} sx={{ borderRadius: 2 }} />
                    )}

                    {/* Filters Section size md */}
                    {/* <FilterSection
                        display={{ xs: "flex", lg: "none" }}
                        searchText={searchText}
                        setSearchText={setSearchText}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        selectedStatuses={selectedStatuses}
                        setSelectedStatuses={setSelectedStatuses}
                        handleClearFilter={handleClearFillter}
                        requestStatuses={requestStatuses}
                    /> */}

                    {/* Data Table */}
                    <Grid size={{ xs: 12, md: 12 }}>
                        {!isLoadingData && statusCounts ? (
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
                        ) : (
                            <Skeleton variant="rectangular" width="100%" height={220} sx={{ borderRadius: 2 }} />
                        )}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
export default AllMaintenanceRequest;
