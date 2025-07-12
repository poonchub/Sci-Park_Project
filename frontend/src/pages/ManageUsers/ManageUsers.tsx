import { Box, Button, Card, FormControl, Grid, InputAdornment, MenuItem, Typography } from "@mui/material";
import { faMagnifyingGlass,faRotateRight } from "@fortawesome/free-solid-svg-icons";
import LocalActivityOutlinedIcon from '@mui/icons-material/LocalActivityOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import React, { useEffect, useState } from "react";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { ListUsers, ListPackages, ListRoles } from "../../services/http";  // Import ListUsers service 
import { UserInterface } from "../../interfaces/IUser";
import { PackagesInterface } from "../../interfaces/IPackages";
import { RolesInterface } from "../../interfaces/IRoles";
import { SearchOff } from "@mui/icons-material";
import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import InfoAlert from '../../components/Alert/InfoAlert';
import EditUserPopup from "./EditUserPopup";
import './ManageUsers.css';

function ManageUsers() {
    const [users, setUsers] = useState<UserInterface[]>([]);
    const [packages, setPackages] = useState<PackagesInterface[]>([]);
    const [selectpackage, setSelectPackage] = useState(0);
    const [roles, setRoles] = useState<RolesInterface[]>([]);
    const [selectrole, setSelectRole] = useState(0);
    const [isEmployee, setIsEmployee] = useState<boolean | undefined>(undefined);
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
            field: 'EmployeeID',
            headerName: 'Employee ID',
            type: 'string',
            flex: 1,
            valueGetter: (params: UserInterface) => params || '-',  // Default value if EmployeeID is missing
        },
        {
            field: 'UserNameCombined',
            headerName: 'User',
            sortable: false,
            flex: 1.2,
            valueGetter: (params: UserInterface) => params || '-', // Use UserNameCombined from JSON
        },
        {
            field: 'Email',
            headerName: 'Email',
            type: 'string',
            flex: 1,
            valueGetter: (params: UserInterface) => params || '-',
        },
        {
            field: 'Role',
            headerName: 'Position',
            type: 'string',
            flex: 1.2,
            valueGetter: (params: UserInterface) => params || '-',  // Default value if Role is missing
        },
        {
            field: 'PackageName',
            headerName: 'Privileges',
            type: 'string',
            flex: 1.2,
            valueGetter: (params: PackagesInterface) => params || '-',
        },
        {
            field: 'assigned',
            headerName: 'Manage',
            renderCell: (params) => (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center', // Center button horizontally
                        alignItems: 'center', // Center button vertically
                        height: '100%', // Make Box expand to full height of cell
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
                        Edit
                    </Button>
                </Box>
            ),
        }

    ];

    const handleClearFillter = () => {
        window.location.reload();

    }

    // Search function
    const handleSearch = () => {
        let filteredUsers = users;


        // Filter data from search text
        if (searchText !== '') {
            filteredUsers = filteredUsers.filter((user) =>
                (user.UserNameCombined && user.UserNameCombined.toLowerCase().includes(searchText.toLowerCase())) ||
                (user.EmployeeID && user.EmployeeID.toLowerCase().includes(searchText.toLowerCase())) ||
                (user.Email && user.Email.toLowerCase().includes(searchText.toLowerCase()))
            );
        }

        // Filter data by position (role) if position is selected
        if (selectrole !== 0) {
            filteredUsers = filteredUsers.filter((user) => user.RoleID === selectrole);
        }

        // Filter data by privileges (package) if privileges are selected
        if (selectpackage !== 0) {
            filteredUsers = filteredUsers.filter((user) => user.UserPackageID === selectpackage);
        }

        setUsers(filteredUsers);  // Set filtered results
    };

    const handleOpenPopup = (userId: number) => {
        setSelectedUserId(userId);
        setOpenPopup(true);
    };

    useEffect(() => {
        if (selectedUserId === null) {
            // When popup is closed, reset search or fetch new data from API
            getUsers();  // Fetch new user data
        }
    }, [selectedUserId]);  // This useEffect will run every time selectedUserId changes

    const handleClosePopup = () => {
        setOpenPopup(false);
        setSelectPackage(0);  // Reset selectpackage when popup is closed
        setSelectRole(0);  // Reset selectrole when popup is closed
        
        setSelectedUserId(null); // Reset selectedUserId when popup is closed
        setSearchText('');  // Reset search text if needed
        setPage(1);         // Reset to page 1

    };

    // Fetch users from the API
    const getUsers = async () => {
        try {
            const res = await ListUsers({
                roleID: selectrole,
                packageID: selectpackage,
                page: page,
                limit: limit,
                isemployee: isEmployee,
            });  // Call the API to get users data
            if (res) {
                setUsers(res.data);  // Set the fetched users to state
                setTotal(res.total);  // Set the total number of users
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const getPackages = async () => {
        try {
            const res = await ListPackages();  // Call the API to get packages data
            if (res) {
                setPackages(res);  // Set the fetched packages to state
            }
        } catch (error) {
            console.error("Error fetching package:", error);
        }
    };

    const getRoles = async () => {
        try {
            const res = await ListRoles();  // Call the API to get roles data
            if (res) {
                setRoles(res);  // Set the fetched roles to state
            }
        } catch (error) {
            console.error("Error fetching role:", error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchText(searchText);  // When typing stops for 500ms, set debouncedSearchText
        }, 500);  // delay 500ms (or can be adjusted as needed)

        return () => clearTimeout(timer);
    }, [searchText]);

    useEffect(() => {
        getUsers();  // Fetch data when page loads
        getPackages();
        getRoles();
    }, [selectrole, selectpackage, isEmployee, page, limit]);

    useEffect(() => {
        handleSearch();
    }, [debouncedSearchText]);


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

            <Grid container spacing={3}>
                <Grid className='title-box' size={{ xs: 10, md: 12 }}>
                    <Typography variant="h6" className="title">Manage Users</Typography>
                </Grid>

                {selectedUserId !== null && (
                    <EditUserPopup
                        userId={selectedUserId}
                        open={openPopup}
                        onClose={handleClosePopup}

                    />
                )}


                <Grid container size={{ xs: 10, md: 12 }} spacing={3}>
                    {/* Filters Section */}
                    <Grid container
                        spacing={2}
                        className='filter-section'
                        size={{ xs: 10, md: 12 }}
                        sx={{ alignItems: "flex-end", height: 'auto' }}>
                        <Grid size={{ xs: 10, md: 5 }}>
                            <TextField
                                fullWidth
                                className="search-box"
                                variant="outlined"
                                placeholder="Search (Employee ID or Username or Email)"
                                margin="none"
                                value={searchText}
                                onChange={(e) => {
                                    setSearchText(e.target.value);  // set searchText value
                                    handleSearch();  // call search function
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
                        </Grid>

                        <Grid size={{ xs: 10, md: 2 }}>
                            <FormControl fullWidth>
                                <Select
                                    value={selectrole}
                                    onChange={(e) => {
                                        setSelectRole(Number(e.target.value));  // Update selectrole
                                        handleSearch();  // Call filter function
                                    }}
                                    displayEmpty
                                    startAdornment={
                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                            <PeopleOutlinedIcon/>
                                        </InputAdornment>
                                    }
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value={0}>{'All Positions'}</MenuItem>
                                    {
                                        roles.length > 0 ? roles.map((item, index) => (
                                            <MenuItem key={index} value={item.ID}>{item.Name}</MenuItem>
                                        )) : null
                                    }
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 10, md: 2 }}>
                            <FormControl fullWidth>
                                <Select
                                    value={isEmployee}  // กำหนดค่า isEmployee ที่เลือก
                                    onChange={(e) => {
                                        // Convert value to boolean or undefined
                                        setIsEmployee(e.target.value === 'undefined' ? undefined : e.target.value === 'true');
                                        handleSearch();  // Call filter function
                                    }}
                                    displayEmpty
                                    startAdornment={
                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                            <BadgeOutlinedIcon/>
                                        </InputAdornment>
                                    }
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value="undefined">{'All'}</MenuItem>  {/* No selection option */}
                                    <MenuItem value="true">{'Employee'}</MenuItem>  {/* Employee option */}
                                    <MenuItem value="false">{'Non-Employee'}</MenuItem>  {/* Non-employee option */}
                                </Select>
                            </FormControl>
                        </Grid>

 




                        <Grid size={{ xs: 10, md: 2 }}>
                            <FormControl fullWidth>
                                <Select
                                    value={selectpackage}
                                    onChange={(e) => {
                                        setSelectPackage(Number(e.target.value));  // Update selectpackage
                                        handleSearch();  // Call filter function
                                    }}
                                    displayEmpty
                                    startAdornment={
                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                            <LocalActivityOutlinedIcon/>
                                        </InputAdornment>
                                    }
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value={0}>{'All Privileges'}</MenuItem>
                                    {
                                        packages.length > 0 ? packages.map((item, index) => (
                                            <MenuItem key={index} value={item.ID}>{item.PackageName}</MenuItem>
                                        )) : null
                                    }
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 10, md: 1 }}>
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
                        </Grid>

                    </Grid>
                </Grid>

                <Grid size={{ xs: 12, md: 12 }}>
                    <Card sx={{ width: "100%", borderRadius: 2 }}>
                        <DataGrid
                            rows={users}  // Use the users data fetched from the API
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
                                            No details match your search
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
                </Grid>

                {/* Pop-up */}
                {selectedUserId !== null && (
                    <EditUserPopup
                        userId={selectedUserId}
                        open={openPopup}
                        onClose={handleClosePopup}
                    />
                )}

            </Grid>
        </div>
    );
}

export default ManageUsers;