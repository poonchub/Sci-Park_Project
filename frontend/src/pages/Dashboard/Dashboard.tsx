import { useEffect, useState } from 'react'
import AlertGroup from '../../components/AlertGroup/AlertGroup';
import { Box, Button, Card, Grid, Typography } from '@mui/material';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import handleAction from '../../utils/handleActionApproval';
import { GetMaintenanceTypes, GetUserById, ListMaintenanceRequests } from '../../services/http';
import { UserInterface } from '../../interfaces/IUser';
import { MaintenanceRequestsInterface } from '../../interfaces/IMaintenanceRequests';

import "./DashBoard.css"
import ApexLineChart from '../../components/ApexLineChart/ApexLineChart';
import RequestStatusCards from '../../components/RequestStatusCards/RequestStatusCards';
import ApexDonutChart from '../../components/MaintenanceTypeDonutChart/MaintenanceTypeDonutChart';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '../../components/DatePicker/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarMonth, SearchOff } from '@mui/icons-material';
import { MaintenanceTypesInteface } from '../../interfaces/IMaintenanceTypes';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import dateFormat from '../../utils/dateFormat';
import { AreasInterface } from '../../interfaces/IAreas';
import { statusConfig } from '../../constants/statusConfig';
import { faQuestionCircle, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import RequestStatusStackForAdmin from '../../components/RequestStatusStackForAdmin/RequestStatusStackForAdmin';

function Dashboard() {

    const [user, setUser] = useState<UserInterface>()
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([])
    const [filteredRequest, setFilteredRequest] = useState<MaintenanceRequestsInterface[]>([])
    const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceTypesInteface[]>([])
    const [groupedData, setGroupedData] = useState<
        Record<string, { total: number; completed: number; completedPercentage: number }>
    >({});


    const [countRequestStatus, setCountRequestStatus] = useState<Record<string, number>>()
    const [completedPercentage, setCompletedPercentage] = useState<number>(0);

    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
    const [openConfirmApproved, setOpenConfirmApproved] = useState<boolean>(false);
    const [openConfirmRejected, setOpenConfirmRejected] = useState<boolean>(false);

    const [selectedRequest, setSelectedRequest] = useState(0)
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());

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

    const getMaintenanceRequests = async () => {
        try {
            const res = await ListMaintenanceRequests();
            if (res) {
                setMaintenanceRequests(res);
            }
        } catch (error) {
            console.error("Error fetching request maintenance requests:", error);
        }
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

    useEffect(() => {
        getMaintenanceRequests()
        getUser()
        getMaintenanceTypes()
    }, []);

    useEffect(() => {
        getMaintenanceRequests()
    }, [selectedDate])

    useEffect(() => {
        if (!maintenanceRequests?.length || !maintenanceTypes?.length) return;

        let dataToUse = maintenanceRequests;

        if (selectedDate && dayjs(selectedDate).isValid()) {
            dataToUse = maintenanceRequests.filter((req) => {
                const createdAt = dayjs(req.CreatedAt);
                return (
                    createdAt.month() === selectedDate.month() &&
                    createdAt.year() === selectedDate.year()
                );
            });
        }

        setFilteredRequest(dataToUse);

        const countStatus = dataToUse.reduce<Record<string, number>>((acc, item) => {
            const status = item.RequestStatus?.Name || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        setCountRequestStatus(countStatus);

        const total = dataToUse.length;
        const completedCount = dataToUse.filter(item => item.RequestStatus?.Name === "Completed").length;

        const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        setCompletedPercentage(percentage);

        // ✅ สร้าง group เริ่มต้นจาก maintenanceTypes ทั้งหมด
        const grouped: Record<string, { total: number; completed: number; completedPercentage: number }> = {};

        maintenanceTypes.forEach((type) => {
            const typeName = type.TypeName;

            if (!typeName) return;

            grouped[typeName] = {
                total: 0,
                completed: 0,
                completedPercentage: 0,
            };
        });


        // ✅ update ค่าจาก dataToUse ที่ตรงกับประเภทนั้น ๆ
        dataToUse.forEach((req) => {
            const typeName = req.MaintenanceType?.TypeName || "";
            const isCompleted = req.RequestStatus?.Name === "Completed";

            if (!grouped[typeName]) {
                // fallback ถ้า type ไม่อยู่ใน maintenanceTypes
                grouped[typeName] = { total: 0, completed: 0, completedPercentage: 0 };
            }

            grouped[typeName].total += 1;
            if (isCompleted) grouped[typeName].completed += 1;

            grouped[typeName].completedPercentage =
                (grouped[typeName].completed / grouped[typeName].total) * 100;
        });

        setGroupedData(grouped);
    }, [maintenanceRequests, selectedDate, maintenanceTypes]);

    

    return (
        <Box className="dashboard-page" sx={{ p: 3 }}>
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            {/* Approved Confirm */}
            {/* <ConfirmDialog
                open={openConfirmApproved}
                setOpenConfirm={setOpenConfirmApproved}
                handleFunction={() => handleClick(2, "Approval successful")}
                title="ยืนยันการอนุมัติงานแจ้งซ่อม"
                message="คุณแน่ใจหรือไม่ว่าต้องการอนุมัติงานแจ้งซ่อมนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
            /> */}

            {/* Rejected Confirm */}
            {/* <ConfirmDialog
                open={openConfirmRejected}
                setOpenConfirm={setOpenConfirmRejected}
                handleFunction={() => handleClick(3, "Rejection successful")}
                title="ยืนยันการปฏิเสธงานแจ้งซ่อม"
                message="คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธงานแจ้งซ่อมนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
            /> */}

            <Grid container spacing={3}>

                {/* Header Section */}
                <Grid className='title-box' size={{ xs: 12, md: 12 }}>
                    <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                        แดชบอร์ด
                    </Typography>
                </Grid>

                <Grid container size={{ md: 12, lg: 8 }} spacing={3}>
                    {/* Status Section */}
                    <RequestStatusCards 
                        statusCounts={countRequestStatus || {}} 
                    />

                    <RequestStatusStackForAdmin statusCounts={countRequestStatus || {}} />

                    {/* Chart Line Section */}
                    <Grid size={{ xs: 12, md: 12 }} >
                        <Card sx={{
                            bgcolor: "secondary.main",
                            borderRadius: 2,
                            py: 2,
                            px: 3,
                            height: '100%',
                            justifyContent: 'space-between',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <Grid container
                                size={{ xs: 12, md: 12 }}
                                sx={{
                                    alignItems: 'center'
                                }}
                            >
                                <Grid size={{ xs: 7.5, md: 9 }} >
                                    <Typography variant="subtitle1" color="text.main" fontWeight={600}>
                                        รายการแจ้งซ่อมรายเดือน
                                    </Typography>
                                    <Typography variant="h4" fontWeight={800} color="primary">
                                        {`${filteredRequest.length} รายการ`}
                                    </Typography>
                                </Grid>
                                <Grid container size={{ xs: 4.5, md: 3 }} 
                                    sx={{ 
                                        justifyContent: 'flex-end',
                                        mb: 1
                                    }}
                                >
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            views={['year', 'month']}
                                            value={selectedDate}
                                            onChange={(newValue) => newValue && setSelectedDate(newValue)}
                                            slots={{
                                                openPickerIcon: CalendarMonth,
                                            }}
                                            format="MM/YYYY"
                                            sx={{ minWidth: "100px", maxWidth: "200px" }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                            </Grid>
                            <ApexLineChart data={filteredRequest} height={250} selectedDate={selectedDate} />
                        </Card>
                    </Grid>
                </Grid>

                {/* Chart Donut Section */}
                <Grid size={{ xs: 12, lg: 4 }} >
                    <ApexDonutChart data={groupedData} completed={completedPercentage} />
                </Grid>

                {/* Data Table */}
                <Grid size={{ xs: 12, md: 12 }}>
                    <Card sx={{ width: "100%", borderRadius: 2 }}>
                        
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}
export default Dashboard;