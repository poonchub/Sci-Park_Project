import { Link } from "react-router-dom"
import "./MaintenanceRequest.css"
import { Box, Button, Card, FormControl, Grid2, InputAdornment, MenuItem, Typography } from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { useEffect, useState } from "react"
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses"

import { GetMaintenanceRequests, GetRequestStatuses, GetUserById } from "../../services/http"

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests"
import { UserInterface } from "../../interfaces/IUser"
import { TextField } from "../../components/TextField/TextField"
import { Select } from "../../components/Select/Select"
import { DatePicker } from "../../components/DatePicker/DatePicker"
import { AreasInterface } from "../../interfaces/IAreas"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faBullseye, faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog"
import dayjs from "dayjs"
import { CalendarMonth, SearchOff } from "@mui/icons-material"
import AlertGroup from "../../components/AlertGroup/AlertGroup"
import dateFormat from "../../utils/dateFormat"
import handleAction from "../../utils/handleAction"
import { statusConfig } from "../../constants/statusConfig"
import ApexLineChart from "../../components/ApexLineChart/ApexLineChart"
import RequestStatusCards from "../../components/RequestStatusCards/RequestStatusCards"

function MaintenanceRequest() {
    const [user, setUser] = useState<UserInterface>()

    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([])
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([])

    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [searchText, setSearchText] = useState('')
    const [selectedStatus, setSelectedStatus] = useState(0)
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null)

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);

    const [openConfirmApproved, setOpenConfirmApproved] = useState<boolean>(false);
    const [openConfirmRejected, setOpenConfirmRejected] = useState<boolean>(false);
    const [selectedRequest, setSelectedRequest] = useState(0)

    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);

    const columns: GridColDef<(typeof maintenanceRequests)[number]>[] = [
        {
            field: 'ID',
            headerName: 'ID',
            flex: 0.5
        },
        {
            field: 'User',
            headerName: 'ผู้แจ้งซ่อม',
            description: 'This column has a value getter and is not sortable.',
            sortable: false,
            flex: 1.2,
            valueGetter: (params: UserInterface) => `${params.FirstName || ''} ${params.LastName || ''}`,
        },
        {
            field: 'CreatedAt',
            headerName: 'วันที่',
            type: 'string',
            flex: 1,
            // editable: true,
            valueGetter: (params) => dateFormat(params),
        },
        {
            field: 'Area',
            headerName: 'บริเวณที่แจ้งซ่อม',
            type: 'string',
            flex: 1.2,
            // editable: true,
            valueGetter: (params: AreasInterface) => params.Name,
        },
        {
            field: 'Description',
            headerName: 'รายละเอียด',
            type: 'string',
            flex: 1.8,
            // editable: true,
            renderCell: (params) => {
                const areaID = params.row.Area?.ID
                const AreaDetail = params.row.AreaDetail
                const roomtype = params.row.Room?.RoomType?.TypeName
                const roomNum = params.row.Room?.RoomNumber
                const roomFloor = params.row.Room?.Floor?.Number
                return (
                    <Box sx={{
                        display: 'flex',
                        height: '100%',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>
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
                                    `${AreaDetail}`
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
                            {params.row.Description}
                        </Typography>
                    </Box>
                )
            },
        },
        {
            field: 'RequestStatus',
            headerName: 'สถานะ',
            type: 'string',
            flex: 1.2,
            // editable: true,
            renderCell: (params) => {
                const statusName = params.row.RequestStatus?.Name || "Pending"
                const statusKey = params.row.RequestStatus?.Name as keyof typeof statusConfig;
                const { color, colorLite, icon } = statusConfig[statusKey] ?? { color: "#000", colorLite: "#000", icon: faQuestionCircle };

                return (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
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
            field: 'Approved',
            headerName: 'จัดการ',
            type: 'string',
            flex: 1.4,
            // editable: true,
            renderCell: (item) => {
                return item.row.RequestStatus?.Name === 'Pending' ? (
                    <Box>
                        <Button
                            variant="containedBlue"
                            onClick={() => {
                                setOpenConfirmApproved(true)
                                setSelectedRequest(Number(item.id))
                            }}
                            sx={{ mr: 0.5 }}
                        >
                            อนุมัติ
                        </Button>
                        <Button
                            variant="outlinedCancel"
                            onClick={() => {
                                setOpenConfirmRejected(true)
                                setSelectedRequest(Number(item.id))
                            }}
                            sx={{
                                minWidth: '0px',
                                px: '6px',
                            }}
                        >
                            <FontAwesomeIcon icon={faXmark} size="xl" />
                        </Button>
                    </Box>
                ) : (
                    <></>
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
                            ตรวจสอบ
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
            const res = await GetMaintenanceRequests(selectedStatus, page, limit, 0, selectedDate ? selectedDate.format('YYYY-MM-DD') : "");
            if (res) {
                setMaintenanceRequests(res.data);
                setTotal(res.total);

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

    const handleClick = (statusID: number, message: string) => {
        handleAction(statusID, message, {
            userID: user?.ID,
            selectedRequest,
            setAlerts,
            refreshRequestData: getMaintenanceRequests,
            setOpenConfirmApproved,
            setOpenConfirmRejected,
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
        const areaName = request.Area?.Name?.toLowerCase() || "";

        const matchText =
            !searchText ||
            requestId === Number(searchText) ||
            firstName.includes(searchText.toLowerCase()) ||
            lastName.includes(searchText.toLowerCase()) ||
            areaName.includes(searchText.toLowerCase());

        // คืนค่าเฉพาะรายการที่ตรงกับทุกเงื่อนไข
        return matchText
    });

    useEffect(() => {
        getRequestStatuses();
        getMaintenanceRequests()
        getUser()
    }, []);

    useEffect(() => {
        getMaintenanceRequests()
    }, [page, limit, selectedStatus, selectedDate])

    return (
        <div className="maintenance-request-page">
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            {/* Approved Confirm */}
            <ConfirmDialog
                open={openConfirmApproved}
                setOpenConfirm={setOpenConfirmApproved}
                handleFunction={() => handleClick(2, "Approval successful")}
                title="ยืนยันการอนุมัติงานแจ้งซ่อม"
                message="คุณแน่ใจหรือไม่ว่าต้องการอนุมัติงานแจ้งซ่อมนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
            />

            {/* Rejected Confirm */}
            <ConfirmDialog
                open={openConfirmRejected}
                setOpenConfirm={setOpenConfirmRejected}
                handleFunction={() => handleClick(3, "Rejection successful")}
                title="ยืนยันการปฏิเสธงานแจ้งซ่อม"
                message="คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธงานแจ้งซ่อมนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
            />

            <Grid2 container spacing={3}>

                {/* Header Section */}
                <Grid2 className='title-box' size={{ xs: 10, md: 10 }}>
                    <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                        รายการแจ้งซ่อม
                    </Typography>
                </Grid2>
                <Grid2 container size={{ xs: 10, md: 2 }} sx={{ justifyContent: "flex-end", }}>
                    <Link to="/create-maintenance-request">
                        <Button variant="containedBlue" >เขียนคำร้องแจ้งซ่อม</Button>
                    </Link>
                </Grid2>
                <Grid2 container size={{ xs: 10, md: 7 }} spacing={3}>

                    {/* Status Section */}
                    <RequestStatusCards statusCounts={statusCounts || {}} />

                    {/* Filters Section */}
                    <Grid2 container
                        spacing={2}
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
                                                <FontAwesomeIcon icon={faMagnifyingGlass} size="xl" />
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
                                            <FontAwesomeIcon icon={faBullseye} size="xl" />
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
                                    height: '45px',
                                    borderRadius: '10px',
                                    border: '1px solid rgb(109, 110, 112, 0.4)',
                                    "&:hover": {
                                        boxShadow: 'none'
                                        
                                    },
                                }}
                            >ล้าง</Button>
                        </Grid2>
                    </Grid2>
                </Grid2>

                {/* Chart Section */}
                <Grid2 size={{ xs: 10, md: 5 }} >
                    <Card sx={{ bgcolor: "secondary.main", borderRadius: 2, py: 2, px: 3 }}>
                        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>รายการแจ้งซ่อม</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: 24, color: '#F26522' }}>{`${total} รายการ`}</Typography>
                        <ApexLineChart data={maintenanceRequests} height={160} selectedDate={selectedDate} />
                    </Card>
                </Grid2>

                {/* Data Table */}
                <Grid2 size={{ xs: 12, md: 12 }}>
                    <Card sx={{ width: "100%", borderRadius: 2 }}>
                        <DataGrid
                            rows={filteredRequests}
                            columns={columns}
                            pageSizeOptions={[5, 10, 20, 50]}
                            getRowId={(row) => String(row.ID)}
                            paginationMode="server"
                            initialState={{
                                pagination: {
                                    paginationModel: { page, pageSize: limit },
                                },
                            }}
                            rowCount={total}
                            checkboxSelection
                            disableRowSelectionOnClick
                            onPaginationModelChange={(params) => {
                                setPage(params.page + 1);
                                setLimit(params.pageSize);
                            }}
                            disableColumnResize={false}
                            sx={{
                                width: "100%",
                                borderRadius: 2,
                                "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
                                    outline: "none",
                                    boxShadow: "none",
                                },
                            }}
                            slots={{
                                noRowsOverlay: () => (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '100%',
                                            color: 'gray',
                                        }}
                                    >
                                        <SearchOff sx={{ fontSize: 50, color: 'gray' }} />
                                        <Typography variant="body1" sx={{ mt: 1 }}>
                                            ไม่พบข้อมูลงานแจ้งซ่อม
                                        </Typography>
                                    </Box>
                                ),
                            }}
                            slotProps={{
                                baseCheckbox: {
                                    sx: {
                                        color: 'gray',
                                        '&.Mui-checked': {
                                            color: '#F26522',
                                        },
                                    },
                                },
                            }}
                        />
                    </Card>
                </Grid2>
            </Grid2>
        </div>
    )
}
export default MaintenanceRequest