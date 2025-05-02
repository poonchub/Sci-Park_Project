import { Link } from "react-router-dom"
import "./AllMaintenanceRequest.css"
import { Box, Button, Card, FormControl, Grid2, InputAdornment, MenuItem, Typography } from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { useEffect, useState } from "react"
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses"

import { GetMaintenanceRequestsForAdmin, GetOperators, GetRequestStatuses, GetUserById } from "../../services/http"

import { GridColDef } from '@mui/x-data-grid';
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests"
import { UserInterface } from "../../interfaces/IUser"
import { TextField } from "../../components/TextField/TextField"
import { Select } from "../../components/Select/Select"
import { DatePicker } from "../../components/DatePicker/DatePicker"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faMagnifyingGlass, faXmark, faChartSimple, faRotateRight, faCheckDouble, faEye, faCheckCircle, faBan } from "@fortawesome/free-solid-svg-icons";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog"
import dayjs from "dayjs"
import { CalendarMonth } from "@mui/icons-material"
import AlertGroup from "../../components/AlertGroup/AlertGroup"
import dateFormat from "../../utils/dateFormat"
import { statusConfig } from "../../constants/statusConfig"
import ApexLineChart from "../../components/ApexLineChart/ApexLineChart"
import RequestStatusCards from "../../components/RequestStatusCards/RequestStatusCards"
import handleActionApproval from "../../utils/handleActionApproval"
import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid"
import timeFormat from "../../utils/timeFormat"
import { isAdmin, isManager } from "../../routes"
import ApprovePopup from "../../components/ApprovePopup/ApprovePopup"
import { maintenanceTypeConfig } from "../../constants/maintenanceTypeConfig"

function AllMaintenanceRequest() {
    const [user, setUser] = useState<UserInterface>()
    const [operators, setOperators] = useState<UserInterface[]>([])
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([])
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([])

    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [searchText, setSearchText] = useState('')
    const [selectedStatus, setSelectedStatus] = useState(0)
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequestsInterface>({})
    const [selectedOperator, setSelectedOperator] = useState(0)

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);
    const [monthlyCounts, setMonthlyCounts] = useState()

    const [openPopupApproved, setOpenPopupApproved] = useState(false)
    const [openConfirmRejected, setOpenConfirmRejected] = useState<boolean>(false);

    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);

    const columns: GridColDef<(typeof maintenanceRequests)[number]>[] = [
        {
            field: 'ID',
            headerName: 'หมายเลข',
            flex: 0.5
        },
        {
            field: 'User',
            headerName: 'ผู้แจ้งซ่อม',
            description: 'This column has a value getter and is not sortable.',
            sortable: false,
            flex: 1.2,
            valueGetter: (params: UserInterface) => `${params.EmployeeID} ${params.FirstName || ''} ${params.LastName || ''} `,
        },
        {
            field: 'CreatedAt',
            headerName: 'วันที่แจ้งซ่อม',
            type: 'string',
            flex: 1,
            // editable: true,
            renderCell: (params) => {
                const date = dateFormat(params.row.CreatedAt || '')
                const time = timeFormat(params.row.CreatedAt || '')
                return (
                    <Box >
                        <Typography
                            sx={{
                                fontSize: 14,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%"
                            }}
                        >{date}</Typography>
                        <Typography
                            sx={{
                                fontSize: 14,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                                color: 'gray'
                            }}
                        >{time}</Typography>
                    </Box>
                )
            }
        },
        {
            field: 'RequestStatus',
            headerName: 'สถานะ',
            type: 'string',
            flex: 1,
            // editable: true,
            renderCell: (params) => {
                const statusName = params.row.RequestStatus?.Name || "Pending"
                const statusKey = params.row.RequestStatus?.Name as keyof typeof statusConfig;
                const { color, colorLite, icon } = statusConfig[statusKey] ?? { 
                    color: "#000", 
                    colorLite: "#000", 
                    icon: faQuestionCircle 
                };

                return (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        height: '100%'
                    }}>
                        <Box sx={{
                            bgcolor: colorLite,
                            borderRadius: 10,
                            px: 1.5,
                            py: 0.5,
                            display: 'flex',
                            gap: 1,
                            color: color,
                            alignItems: 'center',
                        }}>
                            <FontAwesomeIcon icon={icon} />
                            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                {statusName}
                            </Typography>
                        </Box>

                    </Box>
                )
            },
        },
        {
            field: 'Description',
            headerName: 'รายละเอียด',
            type: 'string',
            flex: 1.8,
            // editable: true,
            renderCell: (params) => {
                const description = params.row.Description
                const areaID = params.row.Area?.ID
                const areaDetail = params.row.AreaDetail
                const roomtype = params.row.Room?.RoomType?.TypeName
                const roomNum = params.row.Room?.RoomNumber
                const roomFloor = params.row.Room?.Floor?.Number

                const typeName = params.row.MaintenanceType?.TypeName || "งานไฟฟ้า"
                const maintenanceKey = params.row.MaintenanceType?.TypeName as keyof typeof maintenanceTypeConfig;
                const { color, colorLite, icon } = maintenanceTypeConfig[maintenanceKey] ?? { color: "#000", colorLite: "#000", icon: faQuestionCircle };

                return (
                    <Box >
                        <Typography
                            sx={{
                                fontSize: 14,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%"
                            }}
                        >
                            {
                                areaID === 2 ? (
                                    `${areaDetail}`
                                ) : (
                                    `${roomtype} ชั้น ${roomFloor} ห้อง ${roomNum}`
                                )
                            }
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: 14,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                                color: '#6D6E70'
                            }}
                        >
                            {description}
                        </Typography>
                        <Box sx={{
                            bgcolor: colorLite,
                            borderRadius: 10,
                            px: 1.5,
                            py: 0.5,
                            display: 'inline-flex',
                            gap: 1,
                            color: color,
                            alignItems: 'center',
                            mt: 1
                        }}>
                            <FontAwesomeIcon icon={icon} />
                            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                {typeName}
                            </Typography>
                        </Box>
                    </Box>
                )
            },
        },
        {
            field: 'Approved',
            headerName: 'การอนุมัติงาน',
            type: 'string',
            flex: 1,
            // editable: true,
            renderCell: (item) => {
                return item.row.RequestStatus?.Name === 'Pending' && (isManager || isAdmin) ? (
                    <Box>
                        <Button
                            variant="containedBlue"
                            onClick={() => {
                                setOpenPopupApproved(true)
                                setSelectedRequest(item.row)
                            }}
                            sx={{ mr: 0.8 }}
                        >
                            <FontAwesomeIcon icon={faCheckDouble} />
                            <Typography variant="textButtonClassic" >อนุมัติ</Typography>
                        </Button>
                        <Button
                            variant="outlinedCancel"
                            onClick={() => {
                                setOpenConfirmRejected(true)
                                setSelectedRequest(item.row)
                            }}
                            sx={{
                                minWidth: '0px',
                                px: '6px',
                            }}
                        >
                            <FontAwesomeIcon icon={faXmark} size="xl" />
                        </Button>
                    </Box>
                ) : item.row.RequestStatus?.Name === 'Unsuccessful' ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', px: 1 }}>
                        <FontAwesomeIcon icon={faBan} style={{ color: '#dc3545' }} />
                        <Typography variant="textButtonClassic" >ถูกปฎิเสธ</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', px: 1 }}>
                        <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#28a745' }} />
                        <Typography variant="textButtonClassic" >ผ่านการอนุมัติแล้ว</Typography>
                    </Box>
                )
            },
        },
        {
            field: 'Check',
            headerName: '',
            type: 'string',
            flex: 1,
            // editable: true,
            renderCell: (item) => {
                const requestID = String(item.row.ID)
                return (
                    <Link to="/check-requests" >
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => localStorage.setItem('requestID', requestID)}
                        >
                            <FontAwesomeIcon icon={faEye} />
                            <Typography variant="textButtonClassic" >ดูรายละเอียด</Typography>
                        </Button>
                    </Link>

                )
            }
        },
    ];

    const getUser = async () => {
        try {
            const res = await GetUserById(Number(localStorage.getItem('userId')));
            if (res) {
                setUser(res);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    }

    const getOperators = async () => {
        try {
            const res = await GetOperators();
            if (res) {
                setOperators(res);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    }

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

    const getMaintenanceRequests = async () => {
        try {
            const reqType = user?.RequestType?.TypeName || ''
            const res = await GetMaintenanceRequestsForAdmin(selectedStatus, page, limit, 0, selectedDate ? selectedDate.format('YYYY-MM-DD') : "", reqType);
            if (res) {
                setMaintenanceRequests(res.data);
                setTotal(res.total);
                setMonthlyCounts(res.monthlyCounts)

                // ใช้ reduce เพื่อจัดรูปแบบข้อมูล statusCounts
                const formattedStatusCounts = res.statusCounts.reduce((acc: any, item: any) => {
                    acc[item.status_name] = item.count;
                    return acc;
                }, {} as Record<string, number>);

                setStatusCounts(formattedStatusCounts);
            }
        } catch (error) {
            console.error("Error fetching request maintenance requests:", error);
        }
    };

    const handleClickApprove = (
        statusName: "Approved" | "Unsuccessful", 
        actionType: "approve" | "reject",
        note?: string
    ) => {
        const statusID = requestStatuses?.find(item => item.Name === statusName)?.ID || 0;
        handleActionApproval(statusID, {
            userID: user?.ID,
            selectedRequest,
            selectedOperator,
            setAlerts,
            refreshRequestData: getMaintenanceRequests,
            setOpenPopupApproved,
            setOpenConfirmRejected,
            actionType,
            note
        });
    };

    const handleClearFillter = () => {
        setSelectedDate(null);
        setSearchText('');
        setSelectedStatus(0)
    }

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
        return matchText
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await Promise.all([getUser(), getRequestStatuses(), getOperators()]);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (user && requestStatuses) {
            getMaintenanceRequests();
        }
    }, [user, page, limit, selectedStatus, selectedDate])

    return (
        <div className="all-maintenance-request-page">
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
                handleFunction={(note) => handleClickApprove("Unsuccessful", "reject", note)}
                title="ยืนยันการปฏิเสธงานแจ้งซ่อม"
                message="คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธงานแจ้งซ่อมนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
                showNoteField
            />

            <Grid2 container spacing={3}>

                {/* Header Section */}
                <Grid2 className='title-box' size={{ xs: 12, md: 12 }}>
                    <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                        รายการแจ้งซ่อม
                    </Typography>
                </Grid2>
                <Grid2 container size={{ xs: 10, md: 7 }} spacing={3}>

                    {/* Status Section */}
                    <RequestStatusCards statusCounts={statusCounts || {}} />

                    {/* Filters Section */}
                    <Grid2 container
                        spacing={1}
                        className='filter-section'
                        size={{ xs: 10, md: 12 }}
                        sx={{
                            alignItems: "flex-end",
                            height: 'auto'
                        }}>
                        <Grid2 size={{ xs: 10, md: 5 }}>
                            <TextField
                                fullWidth
                                className="search-box"
                                variant="outlined"
                                placeholder="ค้นหา"
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
                                    }
                                }}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 10, md: 3 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    value={selectedDate}
                                    onChange={(newValue) => setSelectedDate(newValue)}
                                    slots={{
                                        openPickerIcon: CalendarMonth,
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid2>
                        <Grid2 size={{ xs: 10, md: 3 }}>
                            <FormControl fullWidth>
                                <Select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(Number(e.target.value))}
                                    displayEmpty
                                    startAdornment={
                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                            <FontAwesomeIcon icon={faChartSimple} size="lg" />
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value={0}>{'ทุกสถานะ'}</MenuItem>
                                    {
                                        requestStatuses.map((item, index) => {
                                            return (
                                                <MenuItem key={index} value={index + 1}>{item.Name}</MenuItem>
                                            )
                                        })
                                    }
                                </Select>
                            </FormControl>
                        </Grid2>
                        <Grid2 size={{ xs: 10, md: 1 }}>
                            <Button onClick={handleClearFillter}
                                sx={{
                                    minWidth: 0,
                                    width: '100%',
                                    height: '45px',
                                    borderRadius: '10px',
                                    border: '1px solid rgb(109, 110, 112, 0.4)',
                                    "&:hover": {
                                        boxShadow: 'none',
                                        borderColor: 'primary.main',
                                        backgroundColor: 'transparent'
                                    },
                                }}
                            ><FontAwesomeIcon icon={faRotateRight} size="lg" style={{ color: 'gray' }} /></Button>
                        </Grid2>
                    </Grid2>
                </Grid2>

                {/* Chart Section */}
                <Grid2 size={{ xs: 10, md: 5 }} >
                    <Card sx={{ bgcolor: "secondary.main", borderRadius: 2, py: 2, px: 3, height: '100%' }}>
                        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>รายการแจ้งซ่อม</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: 24, color: '#F26522' }}>{`${total} รายการ`}</Typography>
                        <ApexLineChart data={maintenanceRequests} height={160} selectedDate={selectedDate} />
                    </Card>
                </Grid2>

                {/* Data Table */}
                <Grid2 size={{ xs: 12, md: 12 }}>
                    <CustomDataGrid
                        rows={filteredRequests}
                        columns={columns}
                        rowCount={total}
                        page={page}
                        limit={limit}
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                        noDataText="ไม่พบข้อมูลงานแจ้งซ่อม"
                    />
                </Grid2>
            </Grid2>
        </div>
    )
}
export default AllMaintenanceRequest;