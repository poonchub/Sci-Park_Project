

import { Box, Button, Card, FormControl, Grid2, InputAdornment, MenuItem, Typography } from "@mui/material";
import { faAward, faUserTie, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { ListSetRooms } from "../../services/http";  // Import ListUsers service 
import { RoomsInterface } from "../../interfaces/IRooms";
import { SearchOff } from "@mui/icons-material";
import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import InfoAlert from '../../components/Alert/InfoAlert';


function ManageRooms() {
    const [rooms, setRooms] = useState<RoomsInterface[]>([])
    const [selectRoomType, setSelectRoomType] = useState(0);
    const [selectRoomStatus, setSelectRoomStatus] = useState(0);
    const [selectFloor, setSelectFloors] = useState(0); 
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
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
            field: 'RoomStatus',
            headerName: 'สถานะห้อง',
            sortable: false,
            flex: 1.2,
            valueGetter: (params: RoomsInterface) => params || '-', // ใช้ UserNameCombined จาก JSON
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
                    {/* <Button
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
                    </Button> */}
                </Box>
            ),
        }
        
    ];

    // // ฟังก์ชันค้นหาข้อมูล
    // const handleSearch = () => {
    //     let filteredUsers = users;

    //     // การกรองข้อมูลจากคำค้นหาผ่าน searchText
    //     if (searchText !== '') {
    //         filteredUsers = filteredUsers.filter((user) =>
    //             (user.UserNameCombined && user.UserNameCombined.toLowerCase().includes(searchText.toLowerCase())) ||
    //             (user.EmployeeID && user.EmployeeID.toLowerCase().includes(searchText.toLowerCase())) ||
    //             (user.Email && user.Email.toLowerCase().includes(searchText.toLowerCase()))
    //         );
    //     }

    //     // การกรองข้อมูลตามตำแหน่ง (role) หากเลือกตำแหน่ง
    //     if (selectrole !== 0) {
    //         filteredUsers = filteredUsers.filter((user) => user.RoleID === selectrole);
    //     }

    //     // การกรองข้อมูลตามสิทธิพิเศษ (package) หากเลือกสิทธิพิเศษ
    //     if (selectpackage !== 0) {
    //         filteredUsers = filteredUsers.filter((user) => user.UserPackageID === selectpackage);
    //     }

    //     setUsers(filteredUsers);  // กำหนดผลลัพธ์ที่กรองแล้ว
    // };

    // const handleOpenPopup = (userId: number) => {
    //     setSelectedUserId(userId);
    //     setOpenPopup(true);
    //   };
    
      useEffect(() => {
        if (selectedUserId === null) {
          // เมื่อปิด pop-up, รีเซ็ตการค้นหาหรือดึงข้อมูลใหม่จาก API
          Listrooms();  // ดึงข้อมูลผู้ใช้งานใหม่
        }
      }, [selectedUserId]);  // useEffect นี้จะทำงานทุกครั้งที่ selectedUserId เปลี่ยน
      
      const handleClosePopup = () => {
        // setOpenPopup(false);
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

    // useEffect(() => {
    //     handleSearch();
    // }, [debouncedSearchText]);


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
                    Filters Section
                    <Grid2 container
                        spacing={2}
                        className='filter-section'
                        size={{ xs: 10, md: 12 }}
                        sx={{ alignItems: "flex-end", height: 'auto' }}>
                        <Grid2 size={{ xs: 10, md: 6 }}>
                            <TextField
                                fullWidth
                                className="search-box"
                                variant="outlined"
                                placeholder="ค้นหา (รหัสพนักงาน หรือ ชื่อผู้ใช้งาน หรือ อีเมล)"
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