import { Link } from "react-router-dom"
import "./MaintenanceRequest.css"
import { Box, Button, Card, CardContent, FormControl, Grid2, InputAdornment, MenuItem, Typography } from "@mui/material"
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
import { faHourglassHalf, faCheck, faArrowsSpin, faFlagCheckered, faBan, faExclamation, faQuestionCircle, faBullseye, faMagnifyingGlass, IconDefinition, faXmark } from "@fortawesome/free-solid-svg-icons";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog"
import dayjs from "dayjs"
import { SearchOff } from "@mui/icons-material"
import ApexChart from "../../components/ApexChart/ApexChart"
import AlertGroup from "../../components/AlertGroup/AlertGroup"
import dateFormat from "../../utils/dateFormat"
import handleAction from "../../utils/handleAction"

function MaintenanceRequest() {
    const [user, setUser] = useState<UserInterface>()

    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([])
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([])

    const [countRequestStatus, setCountRequestStatus] = useState<Record<string, number>>()
    const [searchText, setSearchText] = useState('')
    const [selectedStatus, setSelectedStatus] = useState(0)
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null)

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);

    const [openConfirmApproved, setOpenConfirmApproved] = useState<boolean>(false);
    const [openConfirmRejected, setOpenConfirmRejected] = useState<boolean>(false);
    const [requestSelected, setRequestSelected] = useState(0)

    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);

    const statusConfig: Record<string, { color: string; colorLite: string; icon: IconDefinition }> = {
        "Pending": { color: "#FFC107", colorLite: "rgb(254, 255, 184)", icon: faHourglassHalf },
        "Approved": { color: "#28A745", colorLite: "rgb(203, 255, 215)", icon: faCheck },
        "Rejected": { color: "#DC3545", colorLite: "rgb(255, 211, 216)", icon: faBan },
        "In Progress": { color: "#007BFF", colorLite: "rgb(159, 205, 255)", icon: faArrowsSpin },
        "Completed": { color: "#6F42C1", colorLite: "rgb(207, 181, 255)", icon: faFlagCheckered },
        "Failed": { color: "#6C757D", colorLite: "rgb(239, 247, 255)", icon: faExclamation }
    };

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
                            onClick={() => {
                                setOpenConfirmApproved(true)
                                setRequestSelected(Number(item.id))
                            }}
                            sx={{
                                bgcolor: '#08aff1',
                                color: '#fff',
                                fontSize: '14px',
                                border: '1px solid #08aff1',
                                mr: 0.6,
                                "&:hover": {
                                    borderColor: 'transparent'
                                }
                            }}
                        >
                            อนุมัติ
                        </Button>
                        <Button
                            // variant="outlined"
                            onClick={() => {
                                setOpenConfirmRejected(true)
                                setRequestSelected(Number(item.id))
                            }}
                            sx={{
                                color: '#f00',
                                fontSize: '14px',
                                border: '1px solid',
                                py: 0.75,
                                px: 0.5,
                                minWidth: 25
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
            }
        } catch (error) {
            console.error("Error fetching request maintenance requests:", error);
        }
    };

    const handleClick = (statusID: number, message: string) => {
        handleAction(statusID, message, {
            userID: user?.ID,
            requestSelected,
            setAlerts,
            refreshRequestData: getMaintenanceRequests,
            setOpenConfirmApproved,
            setOpenConfirmRejected,
        });
    };

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
        const countStatus = maintenanceRequests.reduce<Record<string, number>>((acc, item) => {
            const status = item.RequestStatus?.Name || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        setCountRequestStatus(countStatus)
    }, [maintenanceRequests])

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
                <Grid2 className='title-box' size={{ xs: 10, md: 10 }}>
                    <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                        รายการแจ้งซ่อม
                    </Typography>
                </Grid2>
                <Grid2 container size={{ xs: 10, md: 2 }} sx={{ justifyContent: "flex-end", }}>
                    <Link to="/create-maintenance-request">
                        <Button variant="contained" sx={{
                            borderRadius: '4px',
                            bgcolor: '#08A0DC',
                            "&:hover": {
                                backgroundColor: "#08A0DC"
                            },
                        }}>เขียนคำร้องแจ้งซ่อม</Button>
                    </Link>
                </Grid2>
                <Grid2 container size={{ xs: 10, md: 7 }} spacing={3}>

                    {/* Status Section */}
                    <Grid2 container size={{ xs: 10, md: 12 }} spacing={3} className='status-section'>
                        {
                            requestStatuses.map((item, index) => {
                                const statusKey = item.Name as keyof typeof statusConfig;
                                const { color, icon } = statusConfig[statusKey] ?? { color: "#000", icon: faQuestionCircle };

                                return (
                                    <Grid2 size={{ xs: 10, md: 4 }} key={index}>
                                        <Card className="status-card" sx={{ height: "auto", borderRadius: 2, px: 2.5, py: 2 }}>
                                            <CardContent className="status-card-content">
                                                <Grid2 size={{ xs: 10, md: 12 }}>
                                                    <Typography variant="body1" sx={{
                                                        fontWeight: 500,
                                                        fontSize: 16
                                                    }}>{item.Name}</Typography>
                                                    <Typography variant="body1" sx={{
                                                        fontWeight: 600,
                                                        fontSize: 20
                                                    }}>{`${countRequestStatus?.[item.Name || "Unknown"] ?? 0} รายการ`}</Typography>
                                                </Grid2>
                                                <Grid2 size={{ xs: 10, md: 8 }} sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Box sx={{
                                                        borderRadius: '50%',
                                                        bgcolor: color,
                                                        border: 1,
                                                        aspectRatio: '1/1',
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        width: 55,
                                                        color: '#fff'
                                                    }}>
                                                        <FontAwesomeIcon icon={icon} size="2xl" />
                                                    </Box>
                                                </Grid2>
                                            </CardContent>
                                        </Card>
                                    </Grid2>
                                )
                            })
                        }
                    </Grid2>

                    {/* Filters Section */}
                    <Grid2 container
                        spacing={2}
                        className='filter-section'
                        size={{ xs: 10, md: 12 }}
                        sx={{
                            alignItems: "flex-end",
                            height: 'auto'
                        }}>
                        <Grid2 size={{ xs: 10, md: 6 }}>
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
                    </Grid2>
                </Grid2>

                {/* Chart Section */}
                <Grid2 size={{ xs: 10, md: 5 }} >
                    <Card sx={{ bgcolor: "secondary.main", borderRadius: 2, py: 2, px: 3 }}>
                        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>รายการแจ้งซ่อม</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: 24, color: '#F26522' }}>{`${total} รายการ`}</Typography>
                        <ApexChart data={maintenanceRequests} height={160} />
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
                        />
                    </Card>
                </Grid2>
            </Grid2>
        </div>
    )
}
export default MaintenanceRequest