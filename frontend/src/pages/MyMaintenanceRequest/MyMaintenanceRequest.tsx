import { faEye, faFileLines, faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Button, Grid, Typography, useMediaQuery } from '@mui/material'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

import './MyMaintenanceRequest.css'
import { GetMaintenanceRequestsForUser, GetRequestStatuses } from '../../services/http'
import dayjs from 'dayjs'
import { MaintenanceRequestsInterface } from '../../interfaces/IMaintenanceRequests'
import { RequestStatusesInterface } from '../../interfaces/IRequestStatuses'
import CustomDataGrid from '../../components/CustomDataGrid/CustomDataGrid'
import { GridColDef } from '@mui/x-data-grid'
import dateFormat from '../../utils/dateFormat'
import { statusConfig } from '../../constants/statusConfig'
import timeFormat from '../../utils/timeFormat'
import RequestStatusStack from '../../components/RequestStatusStack/RequestStatusStack'
import FilterSection from '../../components/FilterSection/FilterSection'
import theme from '../../styles/Theme'
import { maintenanceTypeConfig } from '../../constants/maintenanceTypeConfig'

function MyMaintenanceRequest() {

    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([])
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([])

    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [searchText, setSearchText] = useState('')
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>([0]);
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null)

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);

    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

    const getColumns = (): GridColDef[] => {
        if (isSmallScreen) {
            return [
                {
                    field: '',
                    headerName: 'รายการแจ้งซ่อมท้้งหมด',
                    flex: 1,
                    renderCell: (params) => {
                        const requestID = String(params.row.ID)
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

                        const date = dateFormat(params.row.CreatedAt || '')

                        const description = params.row.Description
                        const areaID = params.row.Area?.ID
                        const areaDetail = params.row.AreaDetail
                        const roomtype = params.row.Room?.RoomType?.TypeName
                        const roomNum = params.row.Room?.RoomNumber
                        const roomFloor = params.row.Room?.Floor?.Number

                        const typeName = params.row.MaintenanceType?.TypeName || "งานไฟฟ้า"
                        const maintenanceKey = params.row.MaintenanceType?.TypeName as keyof typeof maintenanceTypeConfig;
                        const {
                            color: typeColor,
                            icon: typeIcon,
                        } = maintenanceTypeConfig[maintenanceKey] ?? {
                            color: "#000",
                            colorLite: "#000",
                            icon: faQuestionCircle,
                        };

                        return (
                            <Grid
                                container
                                size={{ xs: 12 }}
                                sx={{ px: 1 }}
                            >
                                <Grid size={{ xs: 7 }}>
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
                                            color: 'text.secondary'
                                        }}
                                    >
                                        {description}
                                    </Typography>
                                    <Box sx={{
                                        borderRadius: 10,
                                        py: 0.5,
                                        display: 'inline-flex',
                                        gap: 1,
                                        color: typeColor,
                                        alignItems: 'center',
                                    }}>
                                        <FontAwesomeIcon icon={typeIcon} />
                                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                            {typeName}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid size={{ xs: 5 }}
                                    container
                                    direction="column"
                                    sx={{
                                        justifyContent: "flex-start",
                                        alignItems: "flex-end",
                                    }}
                                >
                                    <Box sx={{
                                        bgcolor: statusColorLite,
                                        borderRadius: 10,
                                        px: 1.5, py: 0.5,
                                        display: 'flex',
                                        gap: 1,
                                        color: statusColor,
                                        alignItems: 'center'
                                    }}>
                                        <FontAwesomeIcon icon={statusIcon} />
                                        <Typography sx={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: "100%"
                                        }}>{statusName}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography sx={{
                                            fontSize: 13,
                                            pr: 1.5, pt: 0.8,
                                            color: 'text.secondary'
                                        }}>{date}</Typography>
                                    </Box>
                                </Grid>

                                <Grid
                                    size={{ xs: 12 }}
                                    container
                                    direction="column"
                                    sx={{
                                        justifyContent: "flex-start",
                                        alignItems: "flex-end",
                                        gap: 1
                                    }}
                                >
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
                                </Grid>
                            </Grid>
                        );
                    },
                },
            ];
        } else {
            return [
                {
                    field: 'ID',
                    headerName: 'หมายเลข',
                    flex: 0.5,
                    align: 'center',
                    headerAlign: 'center',
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
                                        color: 'text.secondary'
                                    }}
                                >{time}</Typography>
                            </Box>
                        )
                    }
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
                        const { color, icon } = maintenanceTypeConfig[maintenanceKey] ?? { color: "#000", colorLite: "#000", icon: faQuestionCircle };

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
                                        color: 'text.secondary'
                                    }}
                                >
                                    {description}
                                </Typography>
                                <Box sx={{
                                    borderRadius: 10,
                                    py: 0.5,
                                    display: 'inline-flex',
                                    gap: 1,
                                    color: color,
                                    alignItems: 'center',
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
        }
    };

    const getMaintenanceRequests = async (pageNum: number = 1, setTotalFlag = false) => {
        try {
            const userId = localStorage.getItem('userId')
            const statusFormat = selectedStatuses.join(',')
            const res = await GetMaintenanceRequestsForUser(
                statusFormat, 
                pageNum, 
                limit, 
                selectedDate ? selectedDate.format('YYYY-MM-DD') : "", 
                Number(userId));

            if (res) {
                setMaintenanceRequests(res.data);
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
        setSelectedStatuses([])
    }

    const filteredRequests = maintenanceRequests.filter((request) => {
        const requestId = String(request.ID);
        const roomTypeName = request.Room?.RoomType?.TypeName?.toLowerCase() || "";
        const floor = `ชั้น ${request.Room?.Floor?.Number}`;
        const roomNumber = String(request.Room?.RoomNumber).toLowerCase() || "";

        const matchText =
            !searchText ||
            requestId?.includes(searchText) ||
            roomTypeName.includes(searchText.toLowerCase()) ||
            floor.includes(searchText.toLowerCase()) ||
            roomNumber?.includes(searchText.toLowerCase())

        return matchText
    });

    useEffect(() => {
        getMaintenanceRequests(1, true);
        getRequestStatuses()
    }, [])

    useEffect(() => {
        if (requestStatuses) {
            getMaintenanceRequests(page)
        }
    }, [page, limit]);

    useEffect(() => {
        if (requestStatuses) {
            getMaintenanceRequests(1, true);
        }
    }, [selectedStatuses, selectedDate]);

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
                        selectedStatuses={selectedStatuses}
                        setSelectedStatuses={setSelectedStatuses}
                        handleClearFilter={handleClearFillter}
                        requestStatuses={requestStatuses}
                    />
                </Grid>

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
        </div>
    )
}
export default MyMaintenanceRequest