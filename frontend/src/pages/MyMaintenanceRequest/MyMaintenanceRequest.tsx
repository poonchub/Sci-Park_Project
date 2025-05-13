import { faChartSimple, faEye, faFileLines, faMagnifyingGlass, faQuestionCircle, faRotateRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Avatar, Box, Button, Card, FormControl, Grid, InputAdornment, LinearProgress, MenuItem, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import RequestStatusCards from '../../components/RequestStatusCards/RequestStatusCards'
import { useEffect, useState } from 'react'

import './MyMaintenanceRequest.css'
import { GetMaintenanceRequestsForUser, GetRequestStatuses } from '../../services/http'
import dayjs from 'dayjs'
import { MaintenanceRequestsInterface } from '../../interfaces/IMaintenanceRequests'
import { TextField } from '../../components/TextField/TextField'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '../../components/DatePicker/DatePicker'
import { CalendarMonth } from '@mui/icons-material'
import { Select } from '../../components/Select/Select'
import { RequestStatusesInterface } from '../../interfaces/IRequestStatuses'
import CustomDataGrid from '../../components/CustomDataGrid/CustomDataGrid'
import { GridColDef } from '@mui/x-data-grid'
import dateFormat from '../../utils/dateFormat'
import { AreasInterface } from '../../interfaces/IAreas'
import { statusConfig } from '../../constants/statusConfig'
import timeFormat from '../../utils/timeFormat'
import RequestStatusStack from '../../components/RequestStatusStack/RequestStatusStack'
import FilterSection from '../../components/FilterSection/FilterSection'

function MyMaintenanceRequest() {

    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([])
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([])

    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [searchText, setSearchText] = useState('')
    const [selectedStatus, setSelectedStatus] = useState(0)
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null)

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);

    const columns: GridColDef<(typeof maintenanceRequests)[number]>[] = [
        {
            field: 'ID',
            headerName: 'ID',
            flex: 0.5
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
            field: 'Check',
            headerName: '',
            type: 'string',
            flex: 1,
            // editable: true,
            renderCell: (item) => {
                const requestID = String(item.row.ID)
                return (
                    <Link to="/maintenance/check-requests" >
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

    const getMaintenanceRequests = async () => {
        try {
            const userId = localStorage.getItem('userId')
            const res = await GetMaintenanceRequestsForUser(selectedStatus, page, limit, selectedDate ? selectedDate.format('YYYY-MM-DD') : "", Number(userId));
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
        getMaintenanceRequests()
        getRequestStatuses()
    }, [])

    useEffect(() => {
        getMaintenanceRequests()
    }, [page, limit, selectedStatus, selectedDate])

    return (
        <div className="my-maintenance-request-page">
            <Grid container spacing={3}>
                {/* Header Section */}
                <Grid className='title-box' size={{ xs: 5, sm: 5 }}>
                    <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                        การแจ้งซ่อมของฉัน
                    </Typography>
                </Grid>

                <Grid container size={{ xs: 7, sm: 7 }} sx={{ justifyContent: "flex-end", }}>
                    <Link to="/maintenance/create-maintenance-request">
                        <Button variant="containedBlue" >
                            <FontAwesomeIcon icon={faFileLines} size="lg" />
                            <Typography variant="textButtonClassic" >เขียนคำร้อง</Typography>
                        </Button>
                    </Link>
                </Grid>

                <Grid container size={{ xs: 12, md: 12 }} spacing={2}>

                    {/* Count Status Section */}
                    <Grid container
                        spacing={1}
                        className='filter-section'
                        size={{ xs: 12, md: 12 }}
                        sx={{
                            height: 'auto'
                        }}
                    >
                        <RequestStatusStack statusCounts={statusCounts} />
                    </Grid>

                    {/* Filters Section */}
                    <FilterSection
                        searchText={searchText}
                        setSearchText={setSearchText}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                        handleClearFilter={handleClearFillter}
                        requestStatuses={requestStatuses}
                    />
                </Grid>

                {/* Data Table */}
                <Grid size={{ xs: 12, md: 12 }}>
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
                </Grid>
            </Grid>
        </div>
    )
}
export default MyMaintenanceRequest