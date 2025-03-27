import { Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid2, InputAdornment, MenuItem, Typography } from "@mui/material";
import { TextField } from "../../components/TextField/TextField";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faBullseye, faCouch, faFaucet, faMagnifyingGlass, faQuestionCircle, faTv } from "@fortawesome/free-solid-svg-icons";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { UserInterface } from "../../interfaces/IUser";

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { GetMaintenanceRequests, GetMaintenanceTypes, GetOperators } from "../../services/http";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { Select } from "../../components/Select/Select";

import './AssignWork.css';
import { AreasInterface } from "../../interfaces/IAreas";
import { MaintenanceTypesInteface } from "../../interfaces/IMaintenanceTypes";

function AssignWork() {
    const [operators, setOperators] = useState<UserInterface>()

    const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceTypesInteface[]>([])
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([])

    const [searchText, setSearchText] = useState('')
    const [selectedType, setSelectedType] = useState(0)
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null)

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    const [openPopupAssign, setOpenPopupAssign] = useState(false)
    const [requestSelected, setRequestSelected] = useState<MaintenanceRequestsInterface>({})

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
                                maxWidth: "100%" // ✅ ป้องกันขยายเกิน
                            }}
                        >
                            {`${roomtype} ชั้น ${roomFloor} ห้อง ${roomNum}`}
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

    const getMaintenanceRequests = async (status: number, page: number, limit: number, maintenanceType: number, createdAt: string) => {
        try {
            const res = await GetMaintenanceRequests(status, page, limit, maintenanceType, createdAt);
            if (res) {
                setMaintenanceRequests(res.data);
                setTotal(res.total);
            }
        } catch (error) {
            console.error("Error fetching request maintenance requests:", error);
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
        getMaintenanceRequests(2, page, limit, selectedType, selectedDate ? selectedDate.format('YYYY-MM-DD') : "")
        getOperators()
    }, []);

    useEffect(() => {
        getMaintenanceRequests(2, page, limit, selectedType, selectedDate ? selectedDate.format('YYYY-MM-DD') : "")
    }, [page, limit, selectedType, selectedDate])

    return (
        <div className="assign-work-page">

            {/* Assign Popup */}
            <Dialog open={openPopupAssign} onClose={() => setOpenPopupAssign(false)} >
                <DialogTitle>มอบหมายงานซ่อม</DialogTitle>
                <DialogContent sx={{ minWidth: 500 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                        {`${requestSelected.Area?.Name || "-"} ชั้น ${requestSelected.Room?.Floor?.Number || "-"} ห้อง ${requestSelected.Room?.RoomNumber || "-"}`}
                    </Typography>
                    <Typography>
                        {requestSelected.Description || "ไม่มีรายละเอียด"}
                    </Typography>

                    {requestSelected.MaintenanceType?.TypeName && (
                        (() => {
                            const typeName = requestSelected.MaintenanceType?.TypeName || "งานไฟฟ้า"
                            const maintenanceKey = requestSelected.MaintenanceType?.TypeName as keyof typeof maintenanceTypeConfig;
                            const { color, colorLite, icon } = maintenanceTypeConfig[maintenanceKey] ?? { color: "#000", colorLite: "#000", icon: faQuestionCircle };

                            return (
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
                            );
                        })()
                    )}
                </DialogContent>

                <DialogActions>
                    <Button color="primary" onClick={() => setOpenPopupAssign(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            <Grid2 container spacing={3}>
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
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(Number(e.target.value))}
                                    displayEmpty
                                    startAdornment={
                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                            <FontAwesomeIcon icon={faBullseye} size="xl" />
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
                            pageSizeOptions={[5, 10, 20]}
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
                        />
                    </Card>
                </Grid2>
            </Grid2>
        </div>
    )
}
export default AssignWork