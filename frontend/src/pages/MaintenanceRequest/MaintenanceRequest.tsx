import { Link } from "react-router-dom"
import "./MaintenanceRequest.css"
import { Box, Button, Card, CardContent, FormControl, Grid2, MenuItem, Typography } from "@mui/material"
import { CheckCircle } from "@mui/icons-material"
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

function MaintenanceRequest() {

    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([])
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([])

    const columns: GridColDef<(typeof maintenanceRequests)[number]>[] = [
        { field: 'ID', headerName: 'ID', width: 90 },
        {
            field: 'User',
            headerName: 'ผู้แจ้งซ่อม',
            description: 'This column has a value getter and is not sortable.',
            sortable: false,
            width: 160,
            valueGetter: (params: UserInterface) => `${params.FirstName || ''} ${params.LastName || ''}`,
        },
        {
            field: 'CreatedAt',
            headerName: 'วันที่',
            type: 'string',
            width: 150,
            // editable: true,
            valueGetter: (params) => dateFormat(params),
        },
        {
            field: 'Area',
            headerName: 'บริเวณที่แจ้งซ่อม',
            type: 'string',
            width: 200,
            // editable: true,
            valueGetter: (params: AreasInterface) => params.Name,
        },
        {
            field: 'Description',
            headerName: 'รายละเอียด',
            type: 'string',
            width: 200,
            // editable: true,
        },
        {
            field: 'RequestStatus',
            headerName: 'สถานะ',
            type: 'string',
            width: 200,
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
            width: 200,
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
            width: 200,
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

    useEffect(() => {
        getRequestStatuses();
        getMaintenanceRequests()
    }, []);

    console.log(maintenanceRequests)

    return (
        <div className="maintenance-request">
            <Grid2 container spacing={2}>
                <Grid2 className='title-box' size={{ xs: 10, md: 10 }}>
                    <Typography variant="h6" className="title">
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
                <Grid2 container size={{ xs: 10, md: 8 }}>
                    {/* Status Section */}
                    <Grid2 container size={{ xs: 10, md: 12 }} spacing={2} className='status-section'>
                        {
                            requestStatuses.map((item, index) => {
                                return (
                                    <Grid2 size={{ xs: 10, md: 4 }} key={index}>
                                        <Card className="status-card" sx={{ height: 70 }}>
                                            <CardContent className="status-card-content">
                                                <Typography variant="body1" color="textPrimary">{item.Name}</Typography>
                                                <div className="status-item success">
                                                    <CheckCircle /> <span>3 รายการ</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Grid2>
                                )
                            })
                        }
                    </Grid2>
                    {/* Filters Section */}
                    <Grid2 container size={{ xs: 10, md: 12 }} spacing={2} className='filter-section'>
                        <Grid2 size={{ xs: 10, md: 6 }}>
                            <TextField
                                fullWidth
                                className="search-box"
                                variant="outlined"
                                placeholder="ค้นหา"
                                margin="none"
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 10, md: 3 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                // renderInput={(params) => <TextField {...params} />}
                                />
                            </LocalizationProvider>
                        </Grid2>
                        <Grid2 size={{ xs: 10, md: 3 }}>
                            <FormControl fullWidth>
                                {/* <InputLabel id="demo-simple-select-label">Age</InputLabel> */}
                                <Select
                                    // labelId="demo-simple-select-label"
                                    // id="demo-simple-select"
                                    // value={age}
                                    // label="Age"
                                    // onChange={handleChange}
                                    defaultValue={1}
                                >
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
                <Grid2 size={{ xs: 10, md: 4 }} sx={{ bgcolor: "#212121", borderRadius: 1, py: 2, px: 3 }}>
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
                        height={170}
                    />
                </Grid2>
                {/* Data Table */}
                <Grid2 size={{ xs: 12, md: 12 }}>
                    <DataGrid
                        rows={maintenanceRequests}
                        columns={columns}
                        getRowId={(row) => String(row.ID)}
                        initialState={{
                            pagination: {
                                paginationModel: {
                                    pageSize: 5,
                                },
                            },
                        }}
                        pageSizeOptions={[5]}
                        checkboxSelection
                        disableRowSelectionOnClick
                    />
                </Grid2>
            </Grid2>
        </div>
    )
}
export default MaintenanceRequest