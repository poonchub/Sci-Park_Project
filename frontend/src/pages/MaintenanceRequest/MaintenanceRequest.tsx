import { Link } from "react-router-dom"
import "./MaintenanceRequest.css"
import { Card, CardContent, Container, FormControl, Grid2, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material"
import { CheckCircle } from "@mui/icons-material"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"

function MaintenanceRequest() {

    const status = [
        { statusName: "ซ่อมสำเร็จ" },
        { statusName: "รอการอนุมัติ" },
        { statusName: "กำลังดำเนินการ" },
        { statusName: "ไม่ผ่านการอนุมัติ" },
    ]

    return (
        <div className="outsider-maintenance-request">
            <Grid2 container spacing={3}>
                <Grid2 className='title-box' size={{ xs: 10, md: 12 }}>
                    <Typography variant="h6" className="title">
                        รายการแจ้งซ่อม
                    </Typography>
                </Grid2>
                <Grid2 container size={{ xs: 10, md: 8 }}>
                    {/* Status Section */}
                    <Grid2 container size={{ xs: 10, md: 12 }} spacing={2} className='status-section'>
                        {
                            status.map((item, index) => {
                                return (
                                    <Grid2 size={{ xs: 10, md: 3 }} key={index}>
                                        <Card variant="outlined" className="status-card">
                                            <CardContent>
                                                <Typography variant="h6" color="textPrimary">{item.statusName}</Typography>
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
                                        status.map((item, index) => {
                                            return (
                                                <MenuItem key={index} value={index+1}>{item.statusName}</MenuItem>
                                            )
                                        })
                                    }
                                </Select>
                            </FormControl>
                        </Grid2>
                    </Grid2>
                </Grid2>
                <Grid2 size={{ xs: 10, md: 4 }} sx={{ bgcolor: "#212121" }}>

                </Grid2>
            </Grid2>
        </div>
    )
}
export default MaintenanceRequest