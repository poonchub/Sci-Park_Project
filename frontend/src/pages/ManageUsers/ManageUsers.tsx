import { Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid2, InputAdornment, MenuItem, Typography, Select } from "@mui/material";
import { faAward, faUserTie, faMagnifyingGlass, faQuestionCircle, faTv } from "@fortawesome/free-solid-svg-icons";
import { TextField } from "../../components/TextField/TextField";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { ListUsers, ListPackages, ListRoles } from "../../services/http";  // Import ListUsers service 
import { UserInterface } from "../../interfaces/IUser";
import { PackagesInterface } from "../../interfaces/IPackages";
import { RolesInterface } from "../../interfaces/IRoles";
import './ManageUsers.css';

function ManageUsers() {
    const [users, setUsers] = useState<UserInterface[]>([]);
    const [packages, setPackages] = useState<PackagesInterface[]>([]);
    const [selectpackage, setSelectPackage] = useState(0);
    const [roles, setRoles] = useState<RolesInterface[]>([]);
    const [selectrole, setSelectRole] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');

    // Columns definition
    const columns: GridColDef[] = [
        {
            field: 'ID',
            headerName: 'ID',
            flex: 0.5,
        },
        {
            field: 'EmployeeID',
            headerName: 'รหัสพนักงาน',
            type: 'string',
            flex: 1,
            valueGetter: (params: UserInterface) => params || '-',  // Default value if EmployeeID is missing
        },
        {
            field: 'UserNameCombined',
            headerName: 'ผู้ใช้งาน',
            sortable: false,
            flex: 1.2,
            valueGetter: (params: UserInterface) => params || '-', // ใช้ UserNameCombined จาก JSON
        },
        {
            field: 'Email',
            headerName: 'อีเมล',
            type: 'string',
            flex: 1,
            valueGetter: (params: UserInterface) => params || '-',
        },
        {
            field: 'Role',
            headerName: 'ตำแหน่ง',
            type: 'string',
            flex: 1.2,
            valueGetter: (params: UserInterface) => params || '-',  // Default value if Role is missing
        },
        {
            field: 'PackageName',
            headerName: 'สิทธิพิเศษ',
            type: 'string',
            flex: 1.2,
            valueGetter: (params: PackagesInterface) => params || '-',
        },
    ];

    // ฟังก์ชันค้นหาข้อมูล
    const handleSearch = () => {
        if (searchText === '') {
            getUsers();  // ดึงข้อมูลทั้งหมดหากไม่มีการกรอกคำค้นหา
        } else {
            const filteredUsers = users.filter((user) =>
                (user.UserNameCombined && user.UserNameCombined.toLowerCase().includes(searchText.toLowerCase())) ||
                (user.EmployeeID && user.EmployeeID.toLowerCase().includes(searchText.toLowerCase())) ||
                (user.Email && user.Email.toLowerCase().includes(searchText.toLowerCase()))
            );
            setUsers(filteredUsers);  // กำหนดผลลัพธ์ที่ค้นหาแล้ว
        }
    };

    // Fetch users from the API
    const getUsers = async () => {
        try {
            const res = await ListUsers();  // Call the API to get users data
            if (res) {
                setUsers(res);  // Set the fetched users to state
                setTotal(res.length);  // Set the total number of users
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const getPackages = async () => {
        try {
            const res = await ListPackages();  // Call the API to get users data
            if (res) {
                setPackages(res);  // Set the fetched users to state
                console.log(res);
            }
        } catch (error) {
            console.error("Error fetching package:", error);
        }
    };

    const getRoles = async () => {
        try {
            const res = await ListRoles();  // Call the API to get users data
            if (res) {
                setRoles(res);  // Set the fetched users to state
                console.log(res);

            }
        } catch (error) {
            console.error("Error fetching role:", error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchText(searchText);  // เมื่อหยุดพิมพ์ 500ms จะตั้งค่า debouncedSearchText
        }, 500);  // delay 500ms (หรือสามารถปรับให้เหมาะสม)

        // cleanup function to clear timeout if the user types again before the delay
        return () => clearTimeout(timer);
    }, [searchText]);

    useEffect(() => {
        getUsers();  // ดึงข้อมูลเมื่อหน้าโหลด
        getPackages();
        getRoles();
    }, []);

    // เมื่อ debouncedSearchText เปลี่ยนแปลง จะเริ่มค้นหาทันที
    useEffect(() => {
        handleSearch();
    }, [debouncedSearchText]);


    return (
        <div className="manage-users-page">
            <Grid2 container spacing={3}>
                <Grid2 className='title-box' size={{ xs: 10, md: 12 }}>
                    <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                        จัดการผู้ใช้งาน
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
                                onChange={(e) => {
                                    setSearchText(e.target.value);  // set ค่าของ searchText
                                    handleSearch();  // เรียกฟังก์ชันค้นหา
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


                        <Grid2 size={{ xs: 10, md: 3 }}>
                            <FormControl fullWidth>
                                <Select
                                    value={selectrole}
                                    onChange={(e) => setSelectRole(Number(e.target.value))}
                                    displayEmpty
                                    startAdornment={
                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                            <FontAwesomeIcon icon={faUserTie} size="xl" />
                                        </InputAdornment>
                                    }
                                    sx={{ borderRadius: 2 }}  // เพิ่ม borderRadius ที่นี่
                                >
                                    <MenuItem value={0}>{'ทุกตำแหน่ง'}</MenuItem>
                                    {
                                        roles.length > 0 ? roles.map((item, index) => (
                                            <MenuItem key={index} value={index + 1}>{item.Name}</MenuItem>
                                        )) : null
                                    }
                                </Select>
                            </FormControl>
                        </Grid2>

                        <Grid2 size={{ xs: 10, md: 3 }}>
                            <FormControl fullWidth>
                                <Select
                                    value={selectpackage}
                                    onChange={(e) => setSelectPackage(Number(e.target.value))}
                                    displayEmpty
                                    startAdornment={
                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                            <FontAwesomeIcon icon={faAward} size="xl" />
                                        </InputAdornment>
                                    }
                                    sx={{ borderRadius: 2 }}  // เพิ่ม borderRadius ที่นี่
                                    
                                >
                                    <MenuItem value={0}>{'ทุกสิทธิพิเศษ'}</MenuItem>
                                    {
                                        packages.length > 0 ? packages.map((item, index) => (
                                            <MenuItem key={index} value={index + 1}>{item.PackageName}</MenuItem>
                                        )) : null
                                    }
                                </Select>
                            </FormControl>
                        </Grid2>

                    </Grid2>
                </Grid2>



                <Grid2 size={{ xs: 12, md: 12 }}>
                    <Card sx={{ width: "100%", borderRadius: 2 }}>
                        <DataGrid
                            rows={users}  // Use the users data fetched from the API
                            columns={columns}  // Columns to display in the data grid
                            pageSizeOptions={[5, 10, 20]}  // Options for page size
                            getRowId={(row) => String(row.ID)}  // Set the row ID to be the unique 'ID' value
                            paginationMode="server"  // Enable server-side pagination
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
            </Grid2>
        </div>
    );
}

export default ManageUsers;
