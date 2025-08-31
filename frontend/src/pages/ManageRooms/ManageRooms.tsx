

import { Box, Button, Card, FormControl, Grid, InputAdornment, MenuItem, Typography,Container } from "@mui/material";
import {  faRotateRight, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import PublishedWithChangesOutlinedIcon from '@mui/icons-material/PublishedWithChangesOutlined';
import VerticalSplitOutlinedIcon from '@mui/icons-material/VerticalSplitOutlined';
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
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import EditRoomPopup from './EditRoomPopup';
import { analyticsService } from "../../services/analyticsService";



function ManageRooms() {
    const [rooms, setRooms] = useState<RoomsInterface[]>([])
    const [floors, setFloors] = useState<FloorsInterface[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomtypesInterface[]>([]);
    const [roomStatus, setRoomStatus] = useState<RoomStatusInterface[]>([]);
    const [selectRoomType, setSelectRoomType] = useState(0);
    const [selectRoomStatus, setSelectRoomStatus] = useState(0);
    const [selectFloor, setSelectFloors] = useState(0);
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [openPopup, setOpenPopup] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedRoomID, setSelectedRoomID] = useState<number | null>(null);
    const [debouncedSearchText, setDebouncedSearchText] = useState('');
    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);

    // Columns definition
    const columns: GridColDef[] = [
        // {
        //     field: 'ID',
        //     headerName: 'ID',
        //     flex: 0.5,
        // },
        {
            field: 'RoomNumber',
            headerName: 'Room Number',
            type: 'string',
            flex: 1,
            valueGetter: (params: RoomsInterface) => params || '-',  // Default value if EmployeeID is missing
        },
        {
            field: 'RoomType',
            headerName: 'Room Type',
            type: 'string',
            flex: 1,
            valueGetter: (params: RoomsInterface) => params || '-',
        },
        {
            field: 'RoomStatus', // Field name from the data
            headerName: 'Room Status', // Header for the column
            sortable: false,  // Prevent sorting on this column
            flex: 1.2,  // Make the column flexible
            valueGetter: (params: RoomsInterface) => params.RoomStatus || '-', // Default value if RoomStatus is missing
            renderCell: (params) => {
                const statusName = params.row.RoomStatus || "Not Reserved";  // Default to "Not Reserved" if not found
                const statusKey = params.row.RoomStatus as keyof typeof roomStatusConfig;
                const { color, colorLite,  } = roomStatusConfig[statusKey] ?? {
                    color: "#FFF",
                    colorLite: "#000",
                    icon: faCircleXmark,

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
            headerName: 'Room Capacity (persons)',
            type: 'string',
            flex: 1.2,
            valueGetter: (params: RoomsInterface) => params || '-',  // Default value if Role is missing
        },
        {
            field: 'assigned',
            headerName: 'Actions',
            renderCell: (params) => (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center', // Center buttons horizontally
                        alignItems: 'center', // Center buttons vertically
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

    // Search function
    const handleSearch = () => {
        let filteredRoom = rooms;

        // Filter data by search text
        if (searchText !== '') {
            filteredRoom = filteredRoom.filter((room) =>
                (room.RoomNumber && room.RoomNumber.toLowerCase().includes(searchText.toLowerCase())));
        }

        // Filter data by floor if floor is selected
        if (selectFloor !== 0) {
            filteredRoom = filteredRoom.filter((floor) => floor.FloorID === selectFloor);
        }

        // Filter data by room type if room type is selected
        if (selectRoomType !== 0) {
            filteredRoom = filteredRoom.filter((roomtype) => roomtype.RoomTypeID === selectRoomType);
        }

        setRooms(filteredRoom);  // Set filtered results
    };

    const handleOpenPopup = (roomID: number) => {
        setSelectedRoomID(roomID);  // Set selectedRoomID to the room to be edited
        setOpenPopup(true);  // Open Pop-up
    };

    useEffect(() => {
        Listrooms();  // Fetch new user data
        if (rooms === null || []) {
            // When popup is closed, reset search or fetch new data from API
            FecthFloors();  // Fetch floor data
            FecthRoomTypes();  // Fetch room type data
            FecthRoomStatus();  // Fetch room status data

        }

        // Remove analytics tracking from ManageRooms
        // analyticsService.trackKeyPageVisit('MANAGE_ROOMS', 'Manage Rooms');
    }, []);  // This useEffect will run every time selectedUserId changes

    const FecthFloors = async () => {
        try {
            const res = await GetFloors();  // Fetch floor data from API
            if (res) {
                setFloors(res);  // Set fetched floor data
                console.log(res); // Log the fetched data
            }
        } catch (error) {
            console.error("Error fetching floors:", error);
        }
    }
    const FecthRoomTypes = async () => {
        try {
            const res = await GetRoomTypes();  // Fetch room type data from API
            if (res) {
                setRoomTypes(res);  // Set fetched room type data
                console.log(res); // Log the fetched data
            }
        } catch (error) {
            console.error("Error fetching room types:", error);
        }
    }
    const FecthRoomStatus = async () => {
        try {
            const res = await GetRoomStatus();  // Fetch room status data from API
            if (res) {
                setRoomStatus(res);  // Set fetched room status data
                console.log("romstatus", res); // Log the fetched data
            }
        } catch (error) {
            console.error("Error fetching room status:", error);
        }
    }

    // const FecthRoomCapacity = async () => {
    //     try {
    //         const res = await GetRoomCapacity();  // Fetch room capacity data from API
    //         if (res) {
    //             setRoomCapacity(res);  // Set fetched room capacity data
    //             console.log(res); // Log the fetched data
    //         }
    //     } catch (error) {
    //         console.error("Error fetching room capacity:", error);
    //     }
    // }



    const handleClosePopup = () => {
        setOpenPopup(false);  // Close Pop-up
        setSelectedRoomID(null); // Reset selectedRoomID
        setSearchText('');  // Reset search text if needed
        setSelectRoomType(0);  // Reset room type selection
        setSelectRoomStatus(0);  // Reset room status selection
        setSelectFloors(0);  // Reset floor selection
        setPage(0);  // Reset to page 1
        setLimit(10);  // Reset page size to default
        Listrooms();  // Call function to fetch new data
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
                console.log("API response:", res);
                setRooms(res.data);  // Set the fetched users to state
                console.log(res.data); // Log the fetched data
                setTotal(res.total);  // Set the total number of users
            }
            console.log(res);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };





    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchText(searchText);  // When stop typing for 500ms, set debouncedSearchText
        }, 500);  // delay 500ms (or adjust as appropriate)

        return () => clearTimeout(timer);
    }, [searchText]);

    useEffect(() => {
        Listrooms();  // Call the function to fetch users when the component mounts
    }, [selectFloor, selectRoomStatus, selectRoomType, page, limit]);

    useEffect(() => {
        handleSearch();
    }, [debouncedSearchText]);
    useEffect(() => {
        console.log("Rooms data:", rooms);
    }, [rooms]);


    const handleClearFillter = () => {
        setSelectRoomType(0);  // Reset the selected role to 0 (default value)
        setSelectRoomStatus(0);  // Reset the selected package to 0 (default value)
        setSelectFloors(0);  // Reset the selected floor to 0 (default value)
        setSearchText('');  // Clear the search text
        setPage(0);         // Reset to page 1
        Listrooms();  // Call the function to fetch users when the component mounts
    }


    return (
        <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
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
                    <Typography variant="h6" className="title">Manage Rooms</Typography>
                </Grid>


                <Grid container size={{ xs: 10, md: 12 }} spacing={3}>

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
                                placeholder="Search (Room Number)"
                                margin="none"
                                value={searchText}
                                onChange={(e) => {
                                    setSearchText(e.target.value);  // set searchText value
                                    //handleSearch();  // call search function
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
                                    value={selectFloor}
                                    onChange={(e) => {
                                        setSelectFloors(Number(e.target.value));  // update selectrole
                                        handleSearch();  // call filter function
                                    }}
                                    displayEmpty
                                    startAdornment={
                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                            <LayersOutlinedIcon />
                                        </InputAdornment>
                                    }
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value={0}>{'All Floors'}</MenuItem>
                                    {
                                        floors.length > 0 ? floors.map((item, index) => (
                                            <MenuItem key={index} value={item.ID}>{item.ID}</MenuItem>
                                        )) : null
                                    }
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 10, md: 2 }}>
                            <FormControl fullWidth>
                                <Select
                                    value={selectRoomType}
                                    onChange={(e) => {
                                        setSelectRoomType(Number(e.target.value));  // update selectrole
                                        handleSearch();  // call filter function
                                    }}
                                    displayEmpty
                                    startAdornment={
                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                            <VerticalSplitOutlinedIcon />
                                        </InputAdornment>
                                    }
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value={0}>{'All Types'}</MenuItem>
                                    {
                                        roomTypes.length > 0 ? roomTypes.map((item, index) => (
                                            <MenuItem key={index} value={item.ID}>{item.TypeName}</MenuItem>
                                        )) : null
                                    }
                                </Select>
                            </FormControl>
                        </Grid>



                        <Grid size={{ xs: 10, md: 2 }}>
                            <FormControl fullWidth>
                                <Select
                                    value={selectRoomStatus}
                                    onChange={(e) => {
                                        setSelectRoomStatus(Number(e.target.value));  // update selectrole
                                        handleSearch();  // call filter function
                                    }}
                                    displayEmpty
                                    startAdornment={
                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                            <PublishedWithChangesOutlinedIcon />
                                        </InputAdornment>
                                    }
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value={0}>{'All Status'}</MenuItem>
                                    {
                                        roomStatus.length > 0 ? roomStatus.map((item, index) => (
                                            <MenuItem key={index} value={item.ID} style={{ color: 'gray' }}>{item.StatusName} </MenuItem>
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
                        />
                    </Card>
                </Grid>

                {/* Pop-up for editing room */}
                {openPopup && selectedRoomID !== null && (
                    <EditRoomPopup
                        roomID={selectedRoomID}  // Pass the selected room ID to the popup
                        open={openPopup}
                        onClose={handleClosePopup}
                    />
                )}


            </Grid>
        </div>
        </Container>
    );
}

export default ManageRooms;