import { Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid2, InputAdornment, MenuItem, Typography } from "@mui/material";
import { TextField } from "../../components/TextField/TextField";
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faBullseye, faCouch, faFaucet, faMagnifyingGlass, faQuestionCircle, faTv, faUser } from "@fortawesome/free-solid-svg-icons";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { UserInterface } from "../../interfaces/IUser";

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { CreateMaintenanceTask, GetMaintenanceRequests, GetMaintenanceTypes, GetOperators, UpdateMaintenanceRequestByID } from "../../services/http";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { Select } from "../../components/Select/Select";

import './AssignWork.css';
import { AreasInterface } from "../../interfaces/IAreas";
import { MaintenanceTypesInteface } from "../../interfaces/IMaintenanceTypes";
import { MaintenanceTasksInterface } from "../../interfaces/IMaintenanceTasks";
import SuccessAlert from "../../components/Alert/SuccessAlert";
import ErrorAlert from "../../components/Alert/ErrorAlert";
import WarningAlert from "../../components/Alert/WarningAlert";
import { SearchOff } from "@mui/icons-material";

function AssignWork() {
    const [operators, setOperators] = useState<UserInterface[]>([])

    const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceTypesInteface[]>([])
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([])

    const [searchText, setSearchText] = useState('')
    const [selectedType, setSelectedType] = useState(0)
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null)
    const [selectedOperator, setSelectedOperator] = useState(0)

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);

    const [openPopupAssign, setOpenPopupAssign] = useState(false)
    const [requestSelected, setRequestSelected] = useState<MaintenanceRequestsInterface>({})

    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);

    const maintenanceTypeConfig = {
        "งานไฟฟ้า": { color: "#FFA500", colorLite: "rgb(255, 241, 217)", icon: faBolt },
        "งานเครื่องใช้ไฟฟ้า": { color: "#6F42C1", colorLite: "rgb(213, 191, 255)", icon: faTv },
        "งานเฟอร์นิเจอร์": { color: "#8B4513", colorLite: "rgb(255, 221, 196)", icon: faCouch },
        "งานประปา": { color: "rgb(0, 162, 255)", colorLite: "rgb(205, 242, 255)", icon: faFaucet },
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
            field: 'MaintenanceType',
            headerName: 'ประเภทงานซ่อม',
            type: 'string',
            flex: 1.2,
            // editable: true,
            renderCell: (params) => {
                const typeName = params.row.MaintenanceType?.TypeName || "งานไฟฟ้า"
                const maintenanceKey = params.row.MaintenanceType?.TypeName as keyof typeof maintenanceTypeConfig;
                const { color, colorLite, icon } = maintenanceTypeConfig[maintenanceKey] ?? { color: "#000", colorLite: "#000", icon: faQuestionCircle };

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
                                {typeName}
                            </Typography>
                        </Box>

                    </Box>
                )
            },
        },
        {
            field: 'Assigned',
            headerName: 'จัดการ',
            type: 'string',
            flex: 1.4,
            // editable: true,
            renderCell: (item) => {
                console.log(item.row)
                return item.row.RequestStatus?.Name === 'Approved' ? (
                    <Box>
                        <Button
                            onClick={() => {
                                setOpenPopupAssign(true)
                                setRequestSelected(item.row)
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
                            มอบหมายงาน
                        </Button>
                    </Box>
                ) : (
                    <></>
                )
            },
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

    const getMaintenanceRequests = async () => {
        try {
            const res = await GetMaintenanceRequests(2, page, limit, selectedType, selectedDate ? selectedDate.format('YYYY-MM-DD') : "");
            if (res) {
                setMaintenanceRequests(res.data);
                setTotal(res.total);
            }
        } catch (error) {
            console.error("Error fetching request maintenance requests:", error);
        }
    };

    const handleAssignWork = async () => {
        if (!selectedOperator || !requestSelected?.ID) {
            setAlerts((prev) => [...prev, { type: 'error', message: "Invalid data" }]);
            return;
        }

        try {
            const task: MaintenanceTasksInterface = {
                UserID: selectedOperator,
                RequestID: requestSelected.ID
            };

            const request: MaintenanceRequestsInterface = {
                RequestStatusID: 4
            };

            const resAssign = await CreateMaintenanceTask(task);
            if (!resAssign || resAssign.error) throw new Error(resAssign?.error || "Failed to assign work");

            const resRequest = await UpdateMaintenanceRequestByID(request, requestSelected.ID);
            if (!resRequest || resRequest.error) throw new Error(resRequest?.error || "Failed to update request");

            setAlerts((prev) => [...prev, { type: 'success', message: 'Assignment completed' }]);

            setTimeout(() => {
                getMaintenanceRequests()
                setOpenPopupAssign(false)
            }, 1200)

        } catch (error) {
            console.error("API Error:", error);
            const errMessage = (error as Error).message || "Unknown error!";
            setAlerts((prev) => [...prev, { type: 'error', message: errMessage }]);
        }
    };

    const dateFormat = (date: string) => {
        return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`
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
        getMaintenanceTypes();
        getMaintenanceRequests()
        getOperators()
    }, []);

    useEffect(() => {
        getMaintenanceRequests()
    }, [page, limit, selectedType, selectedDate])

    return (
        <div className="assign-work-page">
            {/* Show Alerts */}
            {alerts.map((alert, index) => {
                return (
                    <React.Fragment key={index}>
                        {alert.type === 'success' && (
                            <SuccessAlert
                                message={alert.message}
                                onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
                                index={Number(index)}
                                totalAlerts={alerts.length}
                            />
                        )}
                        {alert.type === 'error' && (
                            <ErrorAlert
                                message={alert.message}
                                onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
                                index={index}
                                totalAlerts={alerts.length}
                            />
                        )}
                        {alert.type === 'warning' && (
                            <WarningAlert
                                message={alert.message}
                                onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
                                index={index}
                                totalAlerts={alerts.length}
                            />
                        )}
                    </React.Fragment>
                );
            })}

            {/* Assign Popup */}
            <Dialog
                open={openPopupAssign}
                onClose={() => setOpenPopupAssign(false)}
                sx={{ zIndex: 999 }}
            >
                <DialogTitle>มอบหมายงานซ่อม</DialogTitle>
                <DialogContent sx={{ minWidth: 500 }}>
                    <Grid2 container size={{ xs: 10, md: 12 }} spacing={1}>
                        <Grid2 size={{ xs: 10, md: 12 }}>
                            <Typography sx={{ fontWeight: 600 }}>
                                {`${requestSelected.Area?.Name || "-"} ชั้น ${requestSelected.Room?.Floor?.Number || "-"} ห้อง ${requestSelected.Room?.RoomNumber || "-"}`}
                            </Typography>
                            <Typography>
                                {requestSelected.Description || "ไม่มีรายละเอียด"}
                            </Typography>
                        </Grid2>
                        {
                            requestSelected.MaintenanceType?.TypeName && ((() => {
                                const typeName = requestSelected.MaintenanceType?.TypeName || "งานไฟฟ้า"
                                const maintenanceKey = requestSelected.MaintenanceType?.TypeName as keyof typeof maintenanceTypeConfig;
                                const { color, colorLite, icon } = maintenanceTypeConfig[maintenanceKey] ?? { color: "#000", colorLite: "#000", icon: faQuestionCircle };

                                return (
                                    <Grid2
                                        sx={{
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
                                            {typeName}
                                        </Typography>
                                    </Grid2>
                                );
                            })()
                            )
                        }
                        <Grid2 size={{ xs: 10, md: 12 }}>
                            <Typography variant="body1" >ผู้รับผิดชอบงาน</Typography>
                            <Select
                                value={selectedOperator}
                                onChange={(e) => setSelectedOperator(Number(e.target.value))}
                                displayEmpty
                                startAdornment={
                                    <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                        <FontAwesomeIcon icon={faUser} size="lg" />
                                    </InputAdornment>
                                }
                            >
                                <MenuItem value={0}><em>{'-- เลือกผู้ดำเนินการ --'}</em></MenuItem>
                                {
                                    operators.map((item, index) => {
                                        return (
                                            <MenuItem key={index} value={index + 1}>{`${item.ID} ${item.FirstName} ${item.LastName}`}</MenuItem>
                                        )
                                    })
                                }
                            </Select>
                        </Grid2>
                    </Grid2>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPopupAssign(false)}>
                        ยกเลิก
                    </Button>
                    <Button variant="contained" onClick={handleAssignWork}>
                        ยืนยัน
                    </Button>
                </DialogActions>
            </Dialog>

            <Grid2 
                container 
                spacing={3} 
                sx={{ 
                    // height: '100%',
                }}
            >
                <Grid2 className='title-box' size={{ xs: 10, md: 12 }}>
                    <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                        มอบหมายงานซ่อม
                    </Typography>
                </Grid2>
                <Grid2 container size={{ xs: 10, md: 12 }} spacing={3}>

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
                                />
                            </LocalizationProvider>
                        </Grid2>
                        <Grid2 size={{ xs: 10, md: 3 }}>
                            <FormControl fullWidth>
                                <Select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(Number(e.target.value))}
                                    displayEmpty
                                    startAdornment={
                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                            <FontAwesomeIcon icon={faBullseye} size="lg" />
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value={0}>{'ทุกประเภทงาน'}</MenuItem>
                                    {
                                        maintenanceTypes.map((item, index) => {
                                            return (
                                                <MenuItem key={index} value={index + 1}>{item.TypeName}</MenuItem>
                                            )
                                        })
                                    }
                                </Select>
                            </FormControl>
                        </Grid2>
                    </Grid2>
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
                            rowCount={total}
                            checkboxSelection
                            disableRowSelectionOnClick
                            disableColumnResize={false}
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
                                            ไม่พบงานซ่อมที่ต้องมอบหมาย
                                        </Typography>
                                    </Box>
                                ),
                            }}
                            initialState={{
                                pagination: {
                                    paginationModel: { page, pageSize: limit },
                                },
                            }}
                            onPaginationModelChange={(params) => {
                                setPage(params.page + 1);
                                setLimit(params.pageSize);
                            }}
                            sx={{
                                width: "100%",
                                borderRadius: 2,
                            }}
                        />
                    </Card>
                </Grid2>
            </Grid2>
        </div>
    )
}
export default AssignWork