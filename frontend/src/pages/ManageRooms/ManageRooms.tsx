

import { Box, Button, Card, FormControl, Grid2, InputAdornment, MenuItem, Typography } from "@mui/material";
import {  faRotateRight, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLayerGroup ,faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from "react";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { ListSetRooms, GetRoomTypes, GetRoomStatus, GetFloors } from "../../services/http";  // Import ListUsers service 
import { RoomsInterface } from "../../interfaces/IRooms";
import { FloorsInterface } from "../../interfaces/IFloors";
import { RoomtypesInterface } from "../../interfaces/IRoomTypes";
import { RoomStatusInterface } from "../../interfaces/IRoomStatus";
import { SearchOff } from "@mui/icons-material";
import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import InfoAlert from '../../components/Alert/InfoAlert';
import { roomStatusConfig } from "../../constants/roomStatusConfig";  // Import the room status configuration



function ManageRooms() {
    const [rooms, setRooms] = useState<RoomsInterface[]>([])
    const [floors, setFloors] = useState<FloorsInterface[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomtypesInterface[]>([]);
    const [roomStatus, setRoomStatus] = useState<RoomStatusInterface[]>([]);
    const [selectRoomType, setSelectRoomType] = useState(0);
    const [selectRoomStatus, setSelectRoomStatus] = useState(0);
    const [selectFloor, setSelectFloors] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [openPopup, setOpenPopup] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);

    // Columns definition
    const columns: GridColDef[] = [
        {
            field: 'ID',
            headerName: 'ID',
            flex: 0.5,
        },
        {
            field: 'RoomNumber',
            headerName: 'เลขที่ห้อง',
            type: 'string',
            flex: 1,
            valueGetter: (params: RoomsInterface) => params || '-',  // Default value if EmployeeID is missing
        },
        {
            field: 'RoomType',
            headerName: 'ประเภทห้อง',
            type: 'string',
            flex: 1,
            valueGetter: (params: RoomsInterface) => params || '-',
        },
        {
            field: 'RoomStatus', // Field name from the data
            headerName: 'สถานะห้อง', // Header for the column
            sortable: false,  // Prevent sorting on this column
            flex: 1.2,  // Make the column flexible
            valueGetter: (params: RoomsInterface) => params.RoomStatus || '-', // Default value if RoomStatus is missing
            renderCell: (params) => {
                const statusName = params.row.RoomStatus || "Not Reserved";  // Default to "Not Reserved" if not found
                const statusKey = params.row.RoomStatus as keyof typeof roomStatusConfig;
                const { color, colorLite, icon } = roomStatusConfig[statusKey] ?? { 
                    color: "#000", 
                    colorLite: "#000", 
                    icon: faCircleXmark 
                };
            
                return (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',  // Vertically center the content
                        justifyContent: 'left', // Horizontally center the content
                        height: '100%'  // Ensure the cell height is fully utilized
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
                );
            },
            
        },
        
        {
            field: 'Capacity',
            headerName: 'ความจุห้อง (คน)',
            type: 'string',
            flex: 1.2,
            valueGetter: (params: RoomsInterface) => params || '-',  // Default value if Role is missing
        },
        {
            field: 'assigned',
            headerName: 'จัดการ',
            renderCell: (params) => (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center', // จัดตำแหน่งปุ่มในแนวนอนให้ตรงกลาง
                        alignItems: 'center', // จัดตำแหน่งปุ่มในแนวตั้งให้ตรงกลาง
                        height: '100%', // ให้ Box ขยายเต็มความสูงของช่อง
                    }}
                >
                    <Button
                        onClick={() => handleOpenPopup(params.row.ID)}
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
                        แก้ไข
                    </Button>
                </Box>
            ),
        }

    ];

    // ฟังก์ชันค้นหาข้อมูล
    const handleSearch = () => {
        let filteredRoom = rooms;

        // การกรองข้อมูลจากคำค้นหาผ่าน searchText
        if (searchText !== '') {
            filteredRoom = filteredRoom.filter((room) =>
                (room.RoomNumber && room.RoomNumber.toLowerCase().includes(searchText.toLowerCase())));
        }

        // การกรองข้อมูลตามตำแหน่ง (role) หากเลือกตำแหน่ง
        if (selectFloor !== 0) {
            filteredRoom = filteredRoom.filter((floor) => floor.FloorID === selectFloor);
        }

        // การกรองข้อมูลตามสิทธิพิเศษ (package) หากเลือกสิทธิพิเศษ
        if (selectRoomType !== 0) {
            filteredRoom = filteredRoom.filter((roomtype) => roomtype.RoomTypeID === selectRoomType);
        }

        setRooms(filteredRoom);  // กำหนดผลลัพธ์ที่กรองแล้ว
    };

    const handleOpenPopup = (userId: number) => {
        setSelectedUserId(userId);
        setOpenPopup(true);
    };

    useEffect(() => {
        Listrooms();  // ดึงข้อมูลผู้ใช้งานใหม่
        if (rooms === null || []) {
            // เมื่อปิด pop-up, รีเซ็ตการค้นหาหรือดึงข้อมูลใหม่จาก API
            FecthFloors();  // ดึงข้อมูลชั้น
            FecthRoomTypes();  // ดึงข้อมูลประเภทห้อง
            FecthRoomStatus();  // ดึงข้อมูลสถานะห้อง

        }
    }, [selectedUserId]);  // useEffect นี้จะทำงานทุกครั้งที่ selectedUserId เปลี่ยน

    const FecthFloors = async () => {
        try {
            const res = await GetFloors();  // ดึงข้อมูลชั้นจาก API
            if (res) {
                setFloors(res);  // กำหนดข้อมูลชั้นที่ดึงมา
                console.log(res); // Log the fetched data
            }
        } catch (error) {
            console.error("Error fetching floors:", error);
        }
    }
    const FecthRoomTypes = async () => {
        try {
            const res = await GetRoomTypes();  // ดึงข้อมูลประเภทห้องจาก API
            if (res) {
                setRoomTypes(res);  // กำหนดข้อมูลประเภทห้องที่ดึงมา
                console.log(res); // Log the fetched data
            }
        } catch (error) {
            console.error("Error fetching room types:", error);
        }
    }
    const FecthRoomStatus = async () => {
        try {
            const res = await GetRoomStatus();  // ดึงข้อมูลสถานะห้องจาก API
            if (res) {
                setRoomStatus(res);  // กำหนดข้อมูลสถานะห้องที่ดึงมา
                console.log(res); // Log the fetched data
            }
        } catch (error) {
            console.error("Error fetching room status:", error);
        }
    }




    const handleClosePopup = () => {
        setOpenPopup(false);
        setSelectedUserId(null); // รีเซ็ต selectedUserId เมื่อปิด pop-up
        setSearchText('');  // รีเซ็ตข้อความการค้นหาหากต้องการ
        setPage(1);         // รีเซ็ตไปยังหน้าที่ 1
        console.log(alerts); // Log message when popup is closed
    };

    // Fetch users from the API
    const Listrooms = async () => {
        try {
            const res = await ListSetRooms({
                floor: selectFloor,
                roomType: selectRoomType,
                page: page,
                limit: limit,
                roomStatus: selectRoomStatus,
            });  // Call the API to get users data
            if (res) {
                setRooms(res.data);  // Set the fetched users to state
                console.log(res.data); // Log the fetched data
                setTotal(res.total);  // Set the total number of users
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };



    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchText(searchText);  // เมื่อหยุดพิมพ์ 500ms จะตั้งค่า debouncedSearchText
        }, 500);  // delay 500ms (หรือสามารถปรับให้เหมาะสม)

        return () => clearTimeout(timer);
    }, [searchText]);

    useEffect(() => {
        Listrooms();  // Call the function to fetch users when the component mounts
    }, [selectFloor, selectRoomStatus, selectRoomType, page, limit]);

    useEffect(() => {
        handleSearch();
    }, [debouncedSearchText]);

    const handleClearFillter = () => {
        setSelectRoomType(0);  // Reset the selected role to 0 (default value)
        setSelectRoomStatus(0);  // Reset the selected package to 0 (default value)
        setSelectFloors(0);  // Reset the selected floor to 0 (default value)
        setSearchText('');  // Clear the search text
        setPage(1);         // Reset to page 1
        Listrooms();  // Call the function to fetch users when the component mounts
    }


    return (
        <div className="manage-users-page">
            {alerts.map((alert, index) => (
                <React.Fragment key={index}>
                    {alert.type === 'success' && (
                        <SuccessAlert message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />
                    )}
                    {alert.type === 'error' && (
                        <ErrorAlert message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />
                    )}
                    {alert.type === 'warning' && (
                        <WarningAlert message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />
                    )}
                    {alert.type === 'info' && (
                        <InfoAlert message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />
                    )}
                </React.Fragment>
            ))}

            <Grid2 container spacing={3}>
                <Grid2 className='title-box' size={{ xs: 10, md: 12 }}>
                    <Typography variant="h6" className="title">จัดการห้อง</Typography>
                </Grid2>


                <Grid2 container size={{ xs: 10, md: 12 }} spacing={3}>

                    <Grid2 container
                        spacing={2}
                        className='filter-section'
                        size={{ xs: 10, md: 12 }}
                        sx={{ alignItems: "flex-end", height: 'auto' }}>
                        <Grid2 size={{ xs: 10, md: 5 }}>
                            <TextField
                                fullWidth
                                className="search-box"
                                variant="outlined"
                                placeholder="ค้นหา (เลขที่ห้อง)"
                                margin="none"
                                value={searchText}
                                onChange={(e) => {
                                    setSearchText(e.target.value);  // set ค่าของ searchText
                                    //handleSearch();  // เรียกฟังก์ชันค้นหา
                                }}
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

                        <Grid2 size={{ xs: 10, md: 2 }}>
                            <FormControl fullWidth>
                                <Select
                                    value={selectFloor}
                                    onChange={(e) => {
                                        setSelectFloors(Number(e.target.value));  // อัปเดต selectrole
                                        handleSearch();  // เรียกฟังก์ชันกรองข้อมูล
                                    }}
                                    displayEmpty
                                    startAdornment={
                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                            <FontAwesomeIcon icon={faLayerGroup} size="xl" />
                                        </InputAdornment>
                                    }
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value={0}>{'ทุกชั้น'}</MenuItem>
                                    {
                                        floors.length > 0 ? floors.map((item, index) => (
                                            <MenuItem key={index} value={item.ID}>{item.ID}</MenuItem>
                                        )) : null
                                    }
                                </Select>
                            </FormControl>
                        </Grid2>

                        <Grid2 size={{ xs: 10, md: 2 }}>
                            <FormControl fullWidth>
                                <Select
                                    value={selectRoomType}
                                    onChange={(e) => {
                                        setSelectRoomType(Number(e.target.value));  // อัปเดต selectrole
                                        handleSearch();  // เรียกฟังก์ชันกรองข้อมูล
                                    }}
                                    displayEmpty
                                    startAdornment={
                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                            <FontAwesomeIcon icon={faMagnifyingGlass} size="xl" />
                                        </InputAdornment>
                                    }
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value={0}>{'ทุกประเภท'}</MenuItem>
                                    {
                                        roomTypes.length > 0 ? roomTypes.map((item, index) => (
                                            <MenuItem key={index} value={item.ID}>{item.TypeName}</MenuItem>
                                        )) : null
                                    }
                                </Select>
                            </FormControl>
                        </Grid2>

                        

                        <Grid2 size={{ xs: 10, md: 2 }}>
                            <FormControl fullWidth>
                                <Select
                                    value={selectRoomStatus}
                                    onChange={(e) => {
                                        setSelectRoomStatus(Number(e.target.value));  // อัปเดต selectrole
                                        handleSearch();  // เรียกฟังก์ชันกรองข้อมูล
                                    }}
                                    displayEmpty
                                    startAdornment={
                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                            <FontAwesomeIcon icon={faMagnifyingGlass} size="xl" />
                                        </InputAdornment>
                                    }
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value={0}>{'ทุกสถานะ'}</MenuItem>
                                    {
                                        roomStatus.length > 0 ? roomStatus.map((item, index) => (
                                            <MenuItem key={index} value={item.ID}>{item.StatusName}</MenuItem>
                                        )) : null
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
                </Grid2>

                <Grid2 size={{ xs: 12, md: 12 }}>
                    <Card sx={{ width: "100%", borderRadius: 2 }}>
                        <DataGrid
                            rows={rooms}  // Use the users data fetched from the API
                            columns={columns}  // Columns to display in the data grid
                            pageSizeOptions={[5, 10, 20]}  // Options for page size
                            getRowId={(row) => String(row.ID)}  // Set the row ID to be the unique 'ID' value
                            paginationMode="server"  // Enable server-side pagination
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
                                            ไม่มีรายละเอียดที่ตรงกับคำค้นหา
                                        </Typography>
                                    </Box>
                                ),
                            }}
                            initialState={{
                                pagination: {
                                    paginationModel: { page, pageSize: limit },
                                },
                            }}
                            rowCount={total}  // Set the total number of rows
                            checkboxSelection
                            disableRowSelectionOnClick
                            onPaginationModelChange={(params) => {
                                setPage(params.page + 1);  // Set the page based on pagination changes
                                setLimit(params.pageSize);  // Set the page size based on pagination changes
                            }}
                            disableColumnResize={false}
                            sx={{
                                width: "100%",
                                borderRadius: 2,
                            }}

                        />
                    </Card>
                </Grid2>

                {/* Pop-up */}


            </Grid2>
        </div>
    );
}

export default ManageRooms;