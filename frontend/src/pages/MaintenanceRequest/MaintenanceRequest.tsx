import { Link } from "react-router-dom"
import "./MaintenanceRequest.css"
import { Box, Button, Card, CardContent, FormControl, Grid2, InputAdornment, MenuItem, Typography } from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { useEffect, useState } from "react"
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses"
import { GetMaintenanceRequests, GetRequestStatuses } from "../../services/http"
import { LineChart } from "@mui/x-charts"

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests"
import { UserInterface } from "../../interfaces/IUser"
import { TextField } from "../../components/TextField/TextField"
import { Select } from "../../components/Select/Select"
import { DatePicker } from "../../components/DatePicker/DatePicker"
import { AreasInterface } from "../../interfaces/IAreas"

import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHourglassHalf, faCheck, faArrowsSpin, faFlagCheckered, faBan, faExclamation, faQuestionCircle, faBullseye, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

function MaintenanceRequest() {

    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([])
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([])

    const [countRequestStatus, setCountRequestStatus] = useState<Record<string, number>>()
    const [selectedStatus, setSelectedStatus] = useState(0)

    const statusConfig = {
        "Pending": { color: "#FFC107", icon: faHourglassHalf },
        "Approved": { color: "#28A745", icon: faCheck },
        "Rejected": { color: "#DC3545", icon: faBan },
        "In Progress": { color: "#007BFF", icon: faArrowsSpin },
        "Completed": { color: "#6F42C1", icon: faFlagCheckered },
        "Failed": { color: "#6C757D", icon: faExclamation }
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
            flex: 1.4,
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
            flex: 2,
            // editable: true,
        },
        {
            field: 'RequestStatus',
            headerName: 'สถานะ',
            type: 'string',
            flex: 1.2,
            // editable: true,
            renderCell: (params) => (
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%'
                }}>
                    <Box sx={{
                        bgcolor: '#08aff1',
                        borderRadius: 10,
                        px: 1.5,
                        py: 0.5,
                        display: 'flex',
                        gap: 1,
                        color: '#fff'
                    }}>
                        <CheckCircleOutlineOutlinedIcon />
                        <Typography>
                            {params.row.RequestStatus?.Name || "-"}
                        </Typography>
                    </Box>

                </Box>
            ),
        },
        {
            field: 'Approve',
            headerName: 'จัดการ',
            type: 'string',
            flex: 1.4,
            // editable: true,
            renderCell: () => (
                <Box>
                    <Button
                        size="small"
                        sx={{ bgcolor: '#08aff1', color: '#fff', fontSize: '14px' }}
                    >
                        อนุมัติ
                    </Button>
                    <Button
                        size="small"
                        sx={{ color: '#f00', fontSize: '14px', border: '1px solid' }}
                    >
                        <ClearOutlinedIcon />
                    </Button>
                </Box>

            ),
        },
        {
            field: 'Check',
            headerName: 'action',
            type: 'string',
            flex: 1,
            // editable: true,
            renderCell: () => (
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                >
                    ตรวจสอบ
                </Button>
            ),
        },

    ];

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
            const res = await GetMaintenanceRequests();
            if (res) {
                setMaintenanceRequests(res);
            }
        } catch (error) {
            console.error("Error fetching request maintenance requests:", error);
        }
    };

    const dateFormat = (date: string) => {
        return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`
    }

    const filteredRequest = maintenanceRequests.filter((request) => {
        return (
            selectedStatus !== 0 ? request.RequestStatusID === selectedStatus : request
        );
    });

    useEffect(() => {
        getRequestStatuses();
        getMaintenanceRequests()
    }, []);

    useEffect(() => {
        const countStatus = maintenanceRequests.reduce<Record<string, number>>((acc, item) => {
            const status = item.RequestStatus?.Name || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        setCountRequestStatus(countStatus)
    }, [maintenanceRequests])

    return (
        <div className="maintenance-request">
            <Grid2 container spacing={3}>
                <Grid2 className='title-box' size={{ xs: 10, md: 10 }}>
                    <Typography variant="h5" className="title" sx={{ fontWeight: 700}}>
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
                                            <Grid2 size={{ xs: 10, md: 12 }}>
                                                <CardContent className="status-card-content">
                                                    <Typography variant="body1" sx={{
                                                        fontWeight: 500,
                                                        fontSize: 16
                                                    }}>{item.Name}</Typography>
                                                    <Typography variant="body1" sx={{
                                                        fontWeight: 600,
                                                        fontSize: 20
                                                    }}>{`${countRequestStatus?.[item.Name || "Unknown"] ?? 0} รายการ`}</Typography>
                                                </CardContent>
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
                                                    width: 55, // กำหนดขนาดตามต้องการ
                                                    color: '#fff'
                                                }}>
                                                    <FontAwesomeIcon icon={icon} size="2xl" />
                                                </Box>
                                            </Grid2>
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
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start" sx={{ px: 0.5 }}>
                                                <FontAwesomeIcon icon={faMagnifyingGlass} size="xl"/>
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
                                // renderInput={(params) => <TextField {...params} />}
                                />
                            </LocalizationProvider>
                        </Grid2>
                        <Grid2 size={{ xs: 10, md: 3 }}>
                            <FormControl fullWidth>
                                {/* <InputLabel id="demo-simple-select-label">Age</InputLabel> */}
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
                    <Card sx={{ bgcolor: "#212121", borderRadius: 2, py: 2, px: 3 }}>
                        <Typography variant="body1" color="#ffffff">
                            รายการแจ้งซ่อม
                        </Typography>
                        <LineChart
                            xAxis={[{
                                scaleType: 'point',
                                data: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                                tickLabelStyle: { fill: '#ffffff' },
                            }]}
                            yAxis={[{
                                tickLabelStyle: { fill: '#ffffff' },
                            }]}
                            series={[
                                {
                                    data: [12, 15, 8, 20, 18],
                                    // color: '#08aff1',
                                    area: true,
                                    baseline: 'min',

                                },
                            ]}
                            height={215}
                        />
                    </Card>

                </Grid2>
                {/* Data Table */}
                <Grid2 size={{ xs: 12, md: 12 }}>
                    <Card sx={{ height: "100%", width: "100%" }}>
                        <DataGrid
                            rows={filteredRequest}
                            columns={columns}
                            getRowId={(row) => String(row.ID)}
                            initialState={{
                                pagination: {
                                    paginationModel: {
                                        pageSize: 5,
                                    },
                                },
                            }}
                            pageSizeOptions={[10]}
                            checkboxSelection
                            disableRowSelectionOnClick
                            sx={{ width: "100%" }}
                        />
                    </Card>
                </Grid2>
            </Grid2>
        </div>
    )
}
export default MaintenanceRequest