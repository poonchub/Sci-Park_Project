import { Link } from "react-router-dom";
import "./AllMaintenanceRequest.css";
import {
    Box,
    Button,
    Card,
    Container,
    Grid,
    Typography,
    useMediaQuery,
} from "@mui/material";
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
import {
    faQuestionCircle,
    faXmark,
    faCheckDouble,
    faEye,
} from "@fortawesome/free-solid-svg-icons";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import dayjs, { Dayjs } from "dayjs";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import dateFormat from "../../utils/dateFormat";
import { statusConfig } from "../../constants/statusConfig";
import ApexLineChart from "../../components/ApexLineChart/ApexLineChart";
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

function AllMaintenanceRequest() {
    const [user, setUser] = useState<UserInterface>();
    const [operators, setOperators] = useState<UserInterface[]>([]);
    const [requestStatuses, setRequestStatuses] = useState<
        RequestStatusesInterface[]
    >([]);
    const [maintenanceRequests, setMaintenanceRequests] = useState<
        MaintenanceRequestsInterface[]
    >([]);

    const [statusCounts, setStatusCounts] = useState<Record<string, number>>(
        {}
    );
    const [searchText, setSearchText] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>([0]);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
    const [selectedRequest, setSelectedRequest] =
        useState<MaintenanceRequestsInterface>({});
    const [selectedOperator, setSelectedOperator] = useState(0);

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);
    const [totalAll, setTotalAll] = useState(0);
    const [counts, setCounts] = useState();

    const [openPopupApproved, setOpenPopupApproved] = useState(false);
    const [openConfirmRejected, setOpenConfirmRejected] =
        useState<boolean>(false);

    const [alerts, setAlerts] = useState<
        { type: "warning" | "error" | "success"; message: string }[]
    >([]);

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

    const getColumns = (): GridColDef[] => {
        if (isSmallScreen) {
            return [
                {
                    field: "",
                    headerName: "รายการแจ้งซ่อมท้้งหมด",
                    flex: 1,
                    renderCell: (params) => {
                        const requestID = String(params.row.ID);
                        const statusName =
                            params.row.RequestStatus?.Name || "Pending";
                        const statusKey = params.row.RequestStatus
                            ?.Name as keyof typeof statusConfig;
                        const {
                            color: statusColor,
                            colorLite: statusColorLite,
                            icon: statusIcon,
                        } = statusConfig[statusKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: faQuestionCircle,
                        };

                        const date = dateFormat(params.row.CreatedAt || "");

                        const description = params.row.Description;
                        const areaID = params.row.Area?.ID;
                        const areaDetail = params.row.AreaDetail;
                        const roomtype = params.row.Room?.RoomType?.TypeName;
                        const roomNum = params.row.Room?.RoomNumber;
                        const roomFloor = params.row.Room?.Floor?.Number;

                        const typeName =
                            params.row.MaintenanceType?.TypeName || "งานไฟฟ้า";
                        const maintenanceKey = params.row.MaintenanceType
                            ?.TypeName as keyof typeof maintenanceTypeConfig;
                        const { color: typeColor, icon: typeIcon } =
                            maintenanceTypeConfig[maintenanceKey] ?? {
                                color: "#000",
                                colorLite: "#000",
                                icon: faQuestionCircle,
                            };

                        return (
                            <Grid container size={{ xs: 12 }} sx={{ px: 1 }}>
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
                                        {areaID === 2
                                            ? `${areaDetail}`
                                            : `${roomtype} ชั้น ${roomFloor} ห้อง ${roomNum}`}
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

                                <Grid
                                    size={{ xs: 5 }}
                                    container
                                    direction="column"
                                    sx={{
                                        justifyContent: "flex-start",
                                        alignItems: "flex-end",
                                    }}
                                >
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
                                    <Box>
                                        <Typography
                                            sx={{
                                                fontSize: 13,
                                                pr: 1.5,
                                                pt: 0.8,
                                                color: "text.secondary",
                                            }}
                                        >
                                            {date}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid
                                    size={{ xs: 12 }}
                                    container
                                    direction="column"
                                    sx={{
                                        justifyContent: "flex-start",
                                        alignItems: "flex-end",
                                        gap: 1,
                                    }}
                                >
                                    <Link to="/maintenance/check-requests">
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            onClick={() =>
                                                localStorage.setItem(
                                                    "requestID",
                                                    requestID
                                                )
                                            }
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                            <Typography variant="textButtonClassic">
                                                ดูรายละเอียด
                                            </Typography>
                                        </Button>
                                    </Link>

                                    {/* {
                                        params.row.RequestStatus?.Name === 'Pending' && (isManager || isAdmin) ? (
                                            <Box>
                                                <Button
                                                    variant="outlinedCancel"
                                                    onClick={() => {
                                                        setOpenConfirmRejected(true)
                                                        setSelectedRequest(params.row)
                                                    }}
                                                    sx={{
                                                        minWidth: '0px',
                                                        px: '6px',
                                                        mr: 0.8
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faXmark} size="xl" />
                                                </Button>

                                                <Button
                                                    variant="containedBlue"
                                                    onClick={() => {
                                                        setOpenPopupApproved(true)
                                                        setSelectedRequest(params.row)
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faCheckDouble} />
                                                    <Typography variant="textButtonClassic" >อนุมัติ</Typography>
                                                </Button>
                                            </Box>
                                        ) : (
                                            <></>
                                        )
                                    } */}
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
                    headerName: "หมายเลข",
                    flex: 0.5,
                    align: "center",
                    headerAlign: "center",
                },
                {
                    field: "User",
                    headerName: "ผู้แจ้งซ่อม",
                    description:
                        "This column has a value getter and is not sortable.",
                    sortable: false,
                    flex: 1.2,
                    valueGetter: (params: UserInterface) =>
                        `${params.EmployeeID} ${params.FirstName || ""} ${params.LastName || ""} `,
                },
                {
                    field: "CreatedAt",
                    headerName: "วันที่แจ้งซ่อม",
                    type: "string",
                    flex: 1,
                    // editable: true,
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
                    field: "Description",
                    headerName: "รายละเอียด",
                    type: "string",
                    flex: 1.8,
                    // editable: true,
                    renderCell: (params) => {
                        const description = params.row.Description;
                        const areaID = params.row.Area?.ID;
                        const areaDetail = params.row.AreaDetail;
                        const roomtype = params.row.Room?.RoomType?.TypeName;
                        const roomNum = params.row.Room?.RoomNumber;
                        const roomFloor = params.row.Room?.Floor?.Number;

                        const typeName =
                            params.row.MaintenanceType?.TypeName || "งานไฟฟ้า";
                        const maintenanceKey = params.row.MaintenanceType
                            ?.TypeName as keyof typeof maintenanceTypeConfig;
                        const { color, icon } = maintenanceTypeConfig[
                            maintenanceKey
                        ] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: faQuestionCircle,
                        };

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
                                        : `${roomtype} ชั้น ${roomFloor} ห้อง ${roomNum}`}
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
                                    <Typography
                                        sx={{ fontSize: 14, fontWeight: 600 }}
                                    >
                                        {typeName}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    },
                },
                {
                    field: "RequestStatus",
                    headerName: "สถานะ",
                    type: "string",
                    flex: 1,
                    // editable: true,
                    renderCell: (params) => {
                        const statusName =
                            params.row.RequestStatus?.Name || "Pending";
                        const statusKey = params.row.RequestStatus
                            ?.Name as keyof typeof statusConfig;
                        const { color, colorLite, icon } = statusConfig[
                            statusKey
                        ] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: faQuestionCircle,
                        };

                        return (
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "flex-start",
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
                                    }}
                                >
                                    <FontAwesomeIcon icon={icon} />
                                    <Typography
                                        sx={{ fontSize: 14, fontWeight: 600 }}
                                    >
                                        {statusName}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    },
                },
                {
                    field: "Approved",
                    headerName: "การอนุมัติงาน",
                    type: "string",
                    flex: 1,
                    // editable: true,
                    renderCell: (item) => {
                        return item.row.RequestStatus?.Name === "Pending" &&
                            (isManager || isAdmin) ? (
                            <Box
                                className="container-btn"
                                sx={{
                                    display: "flex",
                                    gap: 0.8,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Button
                                    className="btn-approve"
                                    variant="containedBlue"
                                    onClick={() => {
                                        setOpenPopupApproved(true);
                                        setSelectedRequest(item.row);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faCheckDouble} />
                                    <Typography variant="textButtonClassic">
                                        อนุมัติ
                                    </Typography>
                                </Button>
                                <Button
                                    className="btn-reject"
                                    variant="outlinedCancel"
                                    onClick={() => {
                                        setOpenConfirmRejected(true);
                                        setSelectedRequest(item.row);
                                    }}
                                    sx={{
                                        minWidth: "0px",
                                        px: "6px",
                                    }}
                                >
                                    <FontAwesomeIcon icon={faXmark} size="xl" />
                                </Button>
                            </Box>
                        ) : (
                            <></>
                        );
                    },
                },
                {
                    field: "Check",
                    headerName: "",
                    type: "string",
                    flex: 1,
                    // editable: true,
                    renderCell: (item) => {
                        const data = item.row;
                        const encodedId = Base64.encode(data.ID);
                        return (
                            <Link to={`/maintenance/check-requests?id=${encodeURIComponent(encodedId)}`}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    onClick={() => {
                                        handleClickCheck(data);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faEye} />
                                    <Typography variant="textButtonClassic">
                                        ดูรายละเอียด
                                    </Typography>
                                </Button>
                            </Link>
                        );
                    },
                },
            ];
        }
    };

    const getUser = async () => {
        try {
            const res = await GetUserById(
                Number(localStorage.getItem("userId"))
            );
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

    const getMaintenanceRequests = async (
        pageNum: number = 1,
        setTotalFlag = false
    ) => {
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
                setCounts(res.counts);

                const totalCount = res.counts.reduce(
                    (sum: number, item: { count: number }) => sum + item.count,
                    0
                );
                setTotalAll(totalCount);

                if (setTotalFlag) setTotal(res.total);

                const formatted = res.statusCounts.reduce(
                    (acc: any, item: any) => {
                        acc[item.status_name] = item.count;
                        return acc;
                    },
                    {}
                );
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
                setMaintenanceRequests((prev) =>
                    prev.map((item) => (item.ID === res.ID ? res : item))
                );
            }
        } catch (error) {
            console.error("Error fetching update maintenance:", error);
        }
    };

    const handleClickApprove = (
        statusName: "Approved" | "Unsuccessful",
        actionType: "approve" | "reject",
        note?: string
    ) => {
        const statusID =
            requestStatuses?.find((item) => item.Name === statusName)?.ID || 0;
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
    };

    const handleClearFillter = () => {
        setSelectedDate(null);
        setSearchText("");
        setSelectedStatuses([]);
    };

    const handleUpdateNotification = async (request_id?: number, user_id?: number) => {
        try {
            const resNotification = await GetNotificationsByRequestAndUser(request_id, user_id)
            if (!resNotification || resNotification.error) console.error("Error fetching notification")

            const notificationData: NotificationsInterface = {
                IsRead: true,
            };
            const notificationID = resNotification.data.ID
            if (!resNotification.data.IsRead) {
                const resUpdated = await UpdateNotificationByID(notificationData, notificationID);
                if (resUpdated) {
                    console.log("✅ Notification updated successfully.");
                }
            }
            else {
                return
            }
        } catch (error) {
            console.error("❌ Error updating maintenance request:", error);
        }
    };

    const handleClickCheck = (data: MaintenanceRequestsInterface) => {
        if (data){
            const requestID = data?.ID
            const userID = user?.ID
            handleUpdateNotification(requestID, userID)
        }
    };

    const filteredRequests = maintenanceRequests.filter((request) => {
        const requestId = request.ID ? Number(request.ID) : null;
        const firstName = request.User?.FirstName?.toLowerCase() || "";
        const lastName = request.User?.LastName?.toLowerCase() || "";
        const roomType =
            (request.Room?.RoomType?.TypeName ?? "").toLowerCase() || "";

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
                await Promise.all([
                    getUser(),
                    getRequestStatuses(),
                    getOperators(),
                ]);
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
            />

            {/* Rejected Confirm */}
            <ConfirmDialog
                open={openConfirmRejected}
                setOpenConfirm={setOpenConfirmRejected}
                handleFunction={(note) =>
                    handleClickApprove("Unsuccessful", "reject", note)
                }
                title="ยืนยันการปฏิเสธงานแจ้งซ่อม"
                message="คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธงานแจ้งซ่อมนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
                showNoteField
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
                                fontSize: {},
                            }}
                        >
                            รายการแจ้งซ่อม
                        </Typography>
                    </Grid>
                    <Grid container size={{ md: 12, lg: 7 }} spacing={3}>
                        {/* Status Section */}
                        <RequestStatusCards statusCounts={statusCounts || {}} />

                        <RequestStatusStackForAdmin
                            statusCounts={statusCounts || {}}
                        />

                        {/* Filters Section size lg */}
                        <FilterSection
                            display={{ xs: "none", md: "none", lg: "flex" }}
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
                    <Grid size={{ xs: 12, lg: 5 }}>
                        <Card
                            sx={{
                                bgcolor: "secondary.main",
                                borderRadius: 2,
                                py: 2,
                                px: 3,
                                height: "100%",
                            }}
                        >
                            <Typography
                                variant="body1"
                                color="text.primary"
                                sx={{ fontWeight: 600 }}
                            >
                                รายการแจ้งซ่อม
                            </Typography>
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: 24,
                                    color: "#F26522",
                                }}
                            >{`${totalAll} รายการ`}</Typography>
                            <ApexLineChart
                                height={160}
                                selectedDate={selectedDate}
                                counts={counts}
                            />
                        </Card>
                    </Grid>

                    {/* Filters Section size md */}
                    <FilterSection
                        display={{ xs: "flex", lg: "none" }}
                        searchText={searchText}
                        setSearchText={setSearchText}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        selectedStatuses={selectedStatuses}
                        setSelectedStatuses={setSelectedStatuses}
                        handleClearFilter={handleClearFillter}
                        requestStatuses={requestStatuses}
                    />

                    {/* Data Table */}
                    <Grid size={{ xs: 12, md: 12 }}>
                        <CustomDataGrid
                            rows={filteredRequests}
                            columns={getColumns()}
                            rowCount={total}
                            page={page}
                            limit={limit}
                            onPageChange={setPage}
                            onLimitChange={setLimit}
                            noDataText="ไม่พบข้อมูลงานแจ้งซ่อม"
                        />
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
export default AllMaintenanceRequest;
