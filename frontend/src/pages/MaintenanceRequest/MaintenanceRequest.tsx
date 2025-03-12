import { Link } from "react-router-dom"
import "./MaintenanceRequest.css"
import { Button, Card, CardContent, Container, FormControl, Grid2, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material"
import { CheckCircle } from "@mui/icons-material"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { useEffect, useState } from "react"
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses"
import { GetRequestStatuses } from "../../services/http"
import { LineChart } from "@mui/x-charts"

import { DataGrid, GridColDef } from '@mui/x-data-grid';

function MaintenanceRequest() {

    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([])

    const columns: GridColDef<(typeof rows)[number]>[] = [
        { field: 'id', headerName: 'ID', width: 90 },
        {
            field: 'ผู้แจ้งซ่อม',
            headerName: 'ผู้แจ้งซ่อม',
            description: 'This column has a value getter and is not sortable.',
            sortable: false,
            width: 160,
            valueGetter: (value, row) => `${row.firstName || ''} ${row.lastName || ''}`,
        },
        {
            field: 'date',
            headerName: 'วันที่',
            type: 'string',
            width: 110,
            editable: true,
        },
        {
            field: 'area',
            headerName: 'บริเวณ',
            type: 'string',
            width: 160,
            editable: true,
        },
        {
            field: 'details',
            headerName: 'รายละเอียด',
            type: 'string',
            width: 250,
            editable: true,
        },
        {
            field: 'status',
            headerName: 'สถานะ',
            type: 'string',
            width: 100,
            editable: true,
        },
    ];

    const rows = [
        {   id: 1, lastName: 'Snow', firstName: 'Jon', 
            date: "25/02/68", area: 'ห้องทำงาน/ห้องประชุม', 
            details: 'แอร์ไม่สามารถใช้งานได้ มีไฟสีแดงสลับกับสีส้มกระพริบเป็นระยะๆ', status: 'สำเร็จ' },
        {   id: 2, lastName: 'Lannister', firstName: 'Cersei', 
            date: "25/02/68", area: 'ห้องทำงาน/ห้องประชุม', 
            details: 'แอร์ไม่สามารถใช้งานได้ มีไฟสีแดงสลับกับสีส้มกระพริบเป็นระยะๆ', status: 'สำเร็จ' },
        {   id: 3, lastName: 'Lannister', firstName: 'Jaime', 
            date: "25/02/68", area: 'ห้องทำงาน/ห้องประชุม', 
            details: 'แอร์ไม่สามารถใช้งานได้ มีไฟสีแดงสลับกับสีส้มกระพริบเป็นระยะๆ', status: 'สำเร็จ'  },
        { id: 4, lastName: 'Stark', firstName: 'Arya', 
            date: "25/02/68", area: 'ห้องทำงาน/ห้องประชุม', 
            details: 'แอร์ไม่สามารถใช้งานได้ มีไฟสีแดงสลับกับสีส้มกระพริบเป็นระยะๆ', status: 'สำเร็จ'  },
        {   id: 5, lastName: 'Targaryen', firstName: 'Daenerys', 
            date: "25/02/68", area: 'ห้องทำงาน/ห้องประชุม', 
            details: 'แอร์ไม่สามารถใช้งานได้ มีไฟสีแดงสลับกับสีส้มกระพริบเป็นระยะๆ', status: 'สำเร็จ'  },
        {   id: 6, lastName: 'Melisandre', firstName: null,     
            date: "25/02/68", area: 'ห้องทำงาน/ห้องประชุม', 
            details: 'แอร์ไม่สามารถใช้งานได้ มีไฟสีแดงสลับกับสีส้มกระพริบเป็นระยะๆ', status: 'สำเร็จ'  },
        {   id: 7, lastName: 'Clifford', firstName: 'Ferrara', 
            date: "25/02/68", area: 'ห้องทำงาน/ห้องประชุม', 
            details: 'แอร์ไม่สามารถใช้งานได้ มีไฟสีแดงสลับกับสีส้มกระพริบเป็นระยะๆ', status: 'สำเร็จ'  },
        {   id: 8, lastName: 'Frances', firstName: 'Rossini',   
            date: "25/02/68", area: 'ห้องทำงาน/ห้องประชุม', 
            details: 'แอร์ไม่สามารถใช้งานได้ มีไฟสีแดงสลับกับสีส้มกระพริบเป็นระยะๆ', status: 'สำเร็จ'  },
        {   id: 9, lastName: 'Roxie', firstName: 'Harvey', 
            date: "25/02/68", area: 'ห้องทำงาน/ห้องประชุม', 
            details: 'แอร์ไม่สามารถใช้งานได้ มีไฟสีแดงสลับกับสีส้มกระพริบเป็นระยะๆ', status: 'สำเร็จ'  },
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

    useEffect(() => {
        getRequestStatuses();
    }, []);

    console.log(requestStatuses)

    return (
        <div className="outsider-maintenance-request">
            <Grid2 container spacing={2}>
                <Grid2 className='title-box' size={{ xs: 10, md: 10 }}>
                    <Typography variant="h6" className="title">
                        รายการแจ้งซ่อม
                    </Typography>
                </Grid2>
                <Grid2 container size={{ xs: 10, md: 2 }} sx={{ justifyContent: "flex-end", }}>
                    <Button variant="contained" sx={{ borderRadius: '4px', bgcolor: '#08aff1' }}>{'เขียนคำร้องแจ้งซ่อม'}</Button>
                </Grid2>
                <Grid2 container size={{ xs: 10, md: 8 }}>
                    {/* Status Section */}
                    <Grid2 container size={{ xs: 10, md: 12 }} spacing={2} className='status-section'>
                        {
                            requestStatuses.map((item, index) => {
                                return (
                                    <Grid2 size={{ xs: 10, md: 4 }} key={index}>
                                        <Card variant="outlined" className="status-card" sx={{ height: 70 }}>
                                            <CardContent>
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
                        rows={rows}
                        columns={columns}
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