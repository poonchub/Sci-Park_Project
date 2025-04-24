import { Box, Button, FormControl, Grid2, InputAdornment, MenuItem, Typography } from "@mui/material";
import { TextField } from "../../components/TextField/TextField";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faMagnifyingGlass, faQuestionCircle, faRotateRight, faToolbox, faUserTie, } from "@fortawesome/free-solid-svg-icons";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { UserInterface } from "../../interfaces/IUser";

import { GridColDef } from '@mui/x-data-grid';
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { GetMaintenanceRequests, GetMaintenanceTypes, GetOperators } from "../../services/http";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { Select } from "../../components/Select/Select";

import './AssignWork.css';
import { AreasInterface } from "../../interfaces/IAreas";
import { MaintenanceTypesInteface } from "../../interfaces/IMaintenanceTypes";
import { CalendarMonth } from "@mui/icons-material";
import dateFormat from "../../utils/dateFormat";
import handleAssignWork from "../../utils/handleAssignWork";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import AssignPopup from "../../components/AssignPopup/AssignPopup";
import { maintenanceTypeConfig } from "../../constants/maintenanceTypeConfig";
import { Link } from "react-router-dom";
import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";

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

    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);

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
            flex: 1.6,
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
            flex: 1.4,
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
            headerName: 'การมอบหมายงาน',
            type: 'string',
            flex: 1.2,
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
                            <FontAwesomeIcon icon={faUserTie} />
                            <Typography variant="textButtonClassic" >มอบหมาย</Typography>
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
            flex: 1.2,
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
                            <FontAwesomeIcon icon={faEye} />
                            <Typography variant="textButtonClassic" >ดูรายละเอียด</Typography>
                        </Button>
                    </Link>

                )
            }
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

    const onClickAssign = () => {
        handleAssignWork({
            selectedOperator,
            requestSelected,
            setAlerts,
            refreshRequestData: getMaintenanceRequests,
            setOpenPopupAssign,
        });
    };

    const handleClearFillter = () => {
        setSelectedDate(null);
        setSearchText('');
        setSelectedType(0)
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
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            {/* Assign Popup */}
            <AssignPopup
                open={openPopupAssign}
                onClose={() => setOpenPopupAssign(false)}
                onConfirm={onClickAssign}
                requestSelected={requestSelected}
                selectedOperator={selectedOperator}
                setSelectedOperator={setSelectedOperator}
                operators={operators}
                maintenanceTypeConfig={maintenanceTypeConfig}
            />

            <Grid2
                container
                spacing={3}
            >
                <Grid2 className='title-box' size={{ xs: 10, md: 12 }}>
                    <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                        มอบหมายงานซ่อม
                    </Typography>
                </Grid2>

                {/* Filters Section */}
                <Grid2 container
                    spacing={1}
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
                    <Grid2 size={{ xs: 10, md: 2.5 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                format="DD/MM/YYYY"
                                value={selectedDate}
                                onChange={(newValue) => setSelectedDate(newValue)}
                                slots={{
                                    openPickerIcon: CalendarMonth,
                                }}
                            />
                        </LocalizationProvider>
                    </Grid2>
                    <Grid2 size={{ xs: 10, md: 2.5 }}>
                        <FormControl fullWidth>
                            <Select
                                value={selectedType}
                                onChange={(e) => setSelectedType(Number(e.target.value))}
                                displayEmpty
                                startAdornment={
                                    <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                        <FontAwesomeIcon icon={faToolbox} size="lg" />
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
                    <Grid2 size={{ xs: 10, md: 1 }}>
                        <Button onClick={handleClearFillter}
                            sx={{
                                minWidth: 0,
                                width: '100%',
                                height: '45px',
                                borderRadius: '10px',
                                border: '1px solid rgb(109, 110, 112, 0.4)',
                                "&:hover": {
                                    boxShadow: 'none',
                                    borderColor: 'primary.main',
                                    backgroundColor: 'transparent'
                                },
                            }}
                        ><FontAwesomeIcon icon={faRotateRight} size="lg" style={{ color: 'gray' }} /></Button>
                    </Grid2>
                </Grid2>

                {/* Data Table */}
                <Grid2 size={{ xs: 12, md: 12 }}>
                    <CustomDataGrid
                        rows={filteredRequests}
                        columns={columns}
                        rowCount={total}
                        page={page}
                        limit={limit}
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                        noDataText="ไม่พบงานซ่อมที่ต้องมอบหมาย"
                    />
                </Grid2>
            </Grid2>
        </div>
    )
}
export default AssignWork