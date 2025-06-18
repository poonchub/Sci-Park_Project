import React, { useEffect, useState } from "react";
import "./CreateMaintenanceRequest.css"

import { Box, Button, Card, CardContent, Checkbox, Container, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid, InputAdornment, MenuItem, Radio, RadioGroup, SelectChangeEvent, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { CreateMaintenanceImages, CreateMaintenanceRequest, CreateNotification, GetAreas, GetFloors, GetMaintenanceTypes, GetRequestStatuses, GetRooms, GetRoomTypes, GetUserById, UpdateUserbyID } from "../../services/http";
import { AreasInterface } from "../../interfaces/IAreas";
import { RoomtypesInterface } from "../../interfaces/IRoomTypes";
import { RoomsInterface } from "../../interfaces/IRooms";
import { FloorsInterface } from "../../interfaces/IFloors";
import { MaintenanceTypesInteface } from "../../interfaces/IMaintenanceTypes";
import { UserInterface } from "../../interfaces/IUser";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { Select } from "../../components/Select/Select";
import { TextField } from "../../components/TextField/TextField";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faEnvelope, faFloppyDisk, faPencil, faPhone, faRotateRight, faUndo, faUpload, faUserTie } from "@fortawesome/free-solid-svg-icons";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import ImageUploader from "../../components/ImageUploader/ImageUploader";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";
import RequestStepper from "../../components/RequestStepper/RequestStepper";
import { NotificationsInterface } from "../../interfaces/INotifications";

function CreateMaintenanceRequestPage() {
    const [user, setUser] = useState<UserInterface>()

    const [areas, setAreas] = useState<AreasInterface[]>([])
    const [rooms, setRooms] = useState<RoomsInterface[]>([])
    const [roomTypes, setRoomTypes] = useState<RoomtypesInterface[]>([])
    const [floors, setFloors] = useState<FloorsInterface[]>([])
    const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceTypesInteface[]>([])
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([]);

    const [selectedRoomtype, setSelectedRoomtype] = useState(0)
    const [selectedFloor, setSelectedFloor] = useState(0)

    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const [formData, setFormData] = useState<MaintenanceRequestsInterface>({
        AreaDetail: "",
        IsAnytimeAvailable: false,
        Description: "",
        StartTime: "",
        EndTime: "",
        OtherTypeDetail: "",
        RoomID: 0,
        AreaID: 1,
        MaintenanceTypeID: 0,
    });

    const [onEdit, setOnEdit] = useState(false);

    const [files, setFiles] = useState<File[]>([]);

    const getUser = async () => {
        try {
            const res = await GetUserById(Number(localStorage.getItem("userId")));
            if (res) {
                setUser(res);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    }

    const getAreas = async () => {
        try {
            const res = await GetAreas();
            if (res) {
                setAreas(res);
            }
        } catch (error) {
            console.error("Error fetching areas:", error);
        }
    }

    const getRooms = async () => {
        try {
            const res = await GetRooms();
            if (res) {
                setRooms(res);
            }
        } catch (error) {
            console.error("Error fetching rooms:", error);
        }
    }

    const getRoomTypes = async () => {
        try {
            const res = await GetRoomTypes();
            if (res) {
                setRoomTypes(res);
            }
        } catch (error) {
            console.error("Error fetching room types:", error);
        }
    }

    const getFloors = async () => {
        try {
            const res = await GetFloors();
            if (res) {
                setFloors(res);
            }
        } catch (error) {
            console.error("Error fetching floors:", error);
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
    }

    // Fetch all statuses for the stepper
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

    const handleSelectChange = (event: SelectChangeEvent<unknown>) => {
        const { name, value } = event.target as { name: string; value: string };

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name == 'MaintenanceTypeID') {
            setFormData((prev) => ({
                ...prev,
                ['OtherTypeDetail']: '',
            }));
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleUserDataChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;

        setUser((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleUpdateUser = async () => {
        if (!user?.ID) {
            handleSetAlert('error', "User not found");
            return;
        }

        if (!validateUserData()) return;

        try {
            const data = {...user, UserID: user.ID}
            const resUser = await UpdateUserbyID(data);

            if (resUser.status === 'error') {
                handleSetAlert('error', resUser.message || "Failed to update user");
                return;
            }

            handleSetAlert('success', resUser.message);
            setOnEdit(false)
        } catch (error) {
            console.error("🚨 Error update user:", error);
            handleSetAlert('error', "An unexpected error occurred");
        }

    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateForm()) return;

        if (!user?.ID) {
            handleSetAlert('error', "User not found");
            return;
        }

        if (files.length === 0) {
            handleSetAlert('warning', "No images uploaded");
            return;
        }

        const requestPayload = {
            ...formData,
            AreaID: Number(formData.AreaID),
            UserID: user.ID,
            StartTime: formData.IsAnytimeAvailable ? undefined : `0001-01-01T${formData.StartTime}:00Z`,
            EndTime: formData.IsAnytimeAvailable ? undefined : `0001-01-01T${formData.EndTime}:00Z`,
        };

        try {
            const resRequest = await CreateMaintenanceRequest(requestPayload);
            if (!resRequest) {
                handleSetAlert('error', resRequest?.Error || "Failed to create request");
                return;
            }

            if (files.length > 0) {
                const formDataFile = new FormData();
                formDataFile.append("userID", String(user.ID));
                formDataFile.append("requestID", resRequest.data.ID);

                files.forEach(file => formDataFile.append("files", file));

                const resImage = await CreateMaintenanceImages(formDataFile);
                if (!resImage) {
                    handleSetAlert('error', resImage?.Error || "Failed to upload images");
                    return;
                }
            }

            const notificationData: NotificationsInterface = {
                RequestID: resRequest.data.ID
            }

            const resNotification = await CreateNotification(notificationData);
            if (!resNotification) {
                handleSetAlert('error', resNotification?.Error || "Failed to create notification");
                return;
            }

            handleSetAlert('success', "Maintenance request submitted successfully");
            setTimeout(() => {
                location.href = "/maintenance/my-maintenance-request";
            }, 1800);

        } catch (error) {
            console.error("🚨 Error submitting request:", error);
            handleSetAlert('error', "An unexpected error occurred");
        }
    };

    const handleSetAlert = (type: 'success' | 'error' | 'warning', message: string) => {
        setAlerts((prevAlerts) => [...prevAlerts, { type, message }]);
    };

    const handleSelectedFilter = (value: number, selectName: string) => {
        if (selectName === 'roomtype') {
            formData.RoomID = 0;
            setSelectedFloor(0);
            setSelectedRoomtype(value);

        } else if (selectName === 'floorNumber') {
            formData.RoomID = 0;
            setSelectedFloor(value);
        }
    }

    const handleResetData = (ignore: string = '') => {
        setFormData({
            Description: "",
            IsAnytimeAvailable: false,
            StartTime: "",
            EndTime: "",
            OtherTypeDetail: "",
            RoomID: 0,
            AreaID: ignore === 'AreaID' ? formData.AreaID : 1,
            MaintenanceTypeID: 0,
        })
        setSelectedFloor(0)
        setSelectedRoomtype(0)
        setFiles([])
    }

    const validateUserData = () => {
        const newErrors: { [key: string]: string } = {};

        if (!user?.Email?.trim()) {
            newErrors.Email = "กรุณาป้อนอีเมล";
        } else {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(user.Email.trim())) {
                newErrors.Email = "รูปแบบอีเมลไม่ถูกต้อง";
            }
        }

        if (!user?.Phone?.trim()) {
            newErrors.Phone = "กรุณาป้อนหมายเลขโทรศัพท์";
        } else {
            const phonePattern = /^0[0-9]{9}$/;
            if (!phonePattern.test(user.Phone.trim())) {
                newErrors.Phone = "กรุณากรอกหมายเลขโทรศัพท์ให้ถูกต้อง 10 หลัก";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        const otherAreaID = areas?.find(item => item.Name === 'บริเวณอื่น ๆ')?.ID || 0;

        if (!formData.AreaID) {
            newErrors.AreaID = "กรุณาเลือกบริเวณที่ต้องการแจ้งซ่อม";
        }
        else if (formData.AreaID == otherAreaID && !formData.AreaDetail?.trim()) {
            newErrors.AreaDetail = "กรุณาระบุบริเวณเพิ่มเติม";
        }
        else if (formData.AreaID !== otherAreaID && selectedRoomtype == 0) {
            newErrors.RoomTypeID = "กรุณาระบุประเภทห้อง";
        }
        else if (formData.AreaID !== otherAreaID && selectedFloor == 0) {
            newErrors.FloorID = "กรุณาระบุตำแหน่งหรือชั้น";
        }
        else if (formData.AreaID !== otherAreaID && !formData.RoomID) {
            newErrors.RoomID = "กรุณาเลือกหมายเลขห้อง";
        }
        else if (!formData.MaintenanceTypeID) {
            newErrors.MaintenanceTypeID = "กรุณาเลือกประเภทปัญหา";
        }
        else if (formData.MaintenanceTypeID === 6 && !formData.OtherTypeDetail?.trim()) {
            newErrors.OtherTypeDetail = "กรุณาระบุประเภทปัญหาเพิ่มเติม";
        }
        else if (!formData.Description?.trim()) {
            newErrors.Description = "กรุณาระบุรายละเอียด";
        }
        else if (!formData.IsAnytimeAvailable) {
            if (!formData.StartTime) newErrors.StartTime = "กรุณาระบุเวลาเริ่ม";
            if (!formData.EndTime) newErrors.EndTime = "กรุณาระบุเวลาสิ้นสุด";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const filteredRooms = rooms.filter((room) => {
        return (
            room.FloorID === selectedFloor && room.RoomTypeID === selectedRoomtype
        );
    });

    useEffect(() => {
        getUser()
        getAreas()
        getRooms()
        getRoomTypes()
        getFloors()
        getMaintenanceTypes()
        getRequestStatuses()
    }, [])

    useEffect(() => {
        handleResetData('AreaID')
        setErrors({})
    }, [formData.AreaID])

    useEffect(() => {
        if (formData.IsAnytimeAvailable === true) {
            setFormData({
                ...formData,
                StartTime: '',
                EndTime: ''
            })
        }
    }, [formData.IsAnytimeAvailable])

    return (
        <Box className="create-maintenance-request-page">
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            <Container maxWidth={'xl'} sx={{ padding: '0px 0px !important' }}>
                <Grid container spacing={2}>

                    {/* Header Section */}
                    <Grid className='title-box' size={{ sm: 5, md: 5 }}>
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            เขียนคำร้องแจ้งซ่อม
                        </Typography>
                    </Grid>
                    <Grid container size={{ sm: 7, md: 7 }} sx={{ justifyContent: "flex-end" }}>
                        <Link to="/maintenance/my-maintenance-request" style={{ textAlign: 'center' }}>
                            <Button variant="outlined" >
                                <FontAwesomeIcon icon={faAngleLeft} size="lg" />
                                <Typography sx={{ fontSize: 14, ml: 0.6 }}>ย้อนกลับ</Typography>
                            </Button>
                        </Link>
                    </Grid>

                    {/* Stepper showing request progress */}
                    <Grid size={{ xs: 12, md: 12 }}>
                        <RequestStepper
                            requestStatuses={requestStatuses}
                            requestStatusID={0}
                        />
                    </Grid>

                    {/* Form Card Section */}
                    <Card className="status-card" sx={{ width: '100%', borderRadius: 2 }}>
                        <CardContent>
                            <Grid container
                                component="form"
                                spacing={{
                                    xs: 3,
                                    md: 8
                                }}
                                sx={{
                                    px: {
                                        xs: 2,
                                        md: 6
                                    },
                                    py: {
                                        xs: 1,
                                        md: 4
                                    },
                                    alignItems: "flex-start"
                                }}
                                onSubmit={handleSubmit}
                            >
                                {/* Left Section (Form Inputs) */}
                                <Grid container size={{ xs: 12, md: 6 }} spacing={3}>

                                    {/* Area Selection */}
                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <Typography variant="body1" className="title-field">บริเวณที่ต้องการแจ้งซ่อม</Typography>
                                        <FormControl>
                                            <RadioGroup
                                                row
                                                name="AreaID"
                                                value={formData.AreaID}
                                                onChange={handleInputChange}
                                            >
                                                {
                                                    areas.map((item, index) => {
                                                        return (
                                                            <FormControlLabel
                                                                key={index}
                                                                value={item.ID}
                                                                control={
                                                                    <Radio sx={{ color: '#6D6E70' }} />
                                                                }
                                                                label={item.Name}
                                                            />
                                                        )
                                                    })
                                                }

                                            </RadioGroup>
                                        </FormControl>
                                    </Grid>

                                    {
                                        formData.AreaID == 2 ? (
                                            <>
                                                {/* Area Detail Input */}
                                                <Grid size={{ xs: 12, md: 12 }}>
                                                    <TextField
                                                        multiline
                                                        rows={2}
                                                        fullWidth
                                                        variant="outlined"
                                                        name="AreaDetail"
                                                        value={formData.AreaDetail}
                                                        onChange={handleInputChange}
                                                        placeholder="ระบุบริเวณที่ต้องการแจ้งซ่อม"
                                                        error={!!errors.AreaDetail}
                                                        helperText={errors.AreaDetail}
                                                        slotProps={{
                                                            input: {
                                                                className: "custom-input"
                                                            }
                                                        }}
                                                    />
                                                </Grid>
                                            </>
                                        ) : (
                                            <>
                                                {/* Room Type Selection */}
                                                <Grid size={{ xs: 12, md: 12 }}>
                                                    <Typography variant="body1" className="title-field">ประเภทห้อง</Typography>
                                                    <FormControl fullWidth error={!!errors.RoomTypeID}>
                                                        <Select
                                                            name="RoomTypeID"
                                                            displayEmpty
                                                            defaultValue={0}
                                                            value={selectedRoomtype}
                                                            onChange={(e) => handleSelectedFilter(Number(e.target.value), 'roomtype')}
                                                        >
                                                            <MenuItem value={0}>
                                                                <em>{'-- เลือกประเภทห้อง --'}</em>
                                                            </MenuItem>
                                                            {
                                                                roomTypes.map((item, index) => {
                                                                    return (
                                                                        <MenuItem key={index} value={item.ID}>{item.TypeName}</MenuItem>
                                                                    )
                                                                })
                                                            }
                                                        </Select>
                                                        {errors.RoomTypeID && <FormHelperText>{errors.RoomTypeID}</FormHelperText>}
                                                    </FormControl>
                                                </Grid>

                                                {/* Floor Number Selection */}
                                                <Grid size={{ xs: 6, md: 6 }}>
                                                    <Typography variant="body1" className="title-field">ตำแหน่ง/ชั้น</Typography>
                                                    <FormControl fullWidth error={!!errors.FloorID}>
                                                        <Select
                                                            name="FloorNumber"
                                                            displayEmpty
                                                            defaultValue={""}
                                                            value={selectedRoomtype === 0 ? 0 : selectedFloor}
                                                            disabled={selectedRoomtype === 0}
                                                            onChange={(e) => handleSelectedFilter(Number(e.target.value), 'floorNumber')}
                                                        >
                                                            <MenuItem value={0}>
                                                                <em>{'-- เลือกตำแหน่งหรือชั้น --'}</em>
                                                            </MenuItem>
                                                            {
                                                                floors.map((item, index) => {
                                                                    return (
                                                                        <MenuItem key={index} value={item.ID}>{`ชั้น ${item.Number}`}</MenuItem>
                                                                    )
                                                                })
                                                            }
                                                        </Select>
                                                        {errors.FloorID && <FormHelperText>{errors.FloorID}</FormHelperText>}
                                                    </FormControl>
                                                </Grid>

                                                {/* Room Number Selection */}
                                                <Grid size={{ xs: 6, md: 6 }} >
                                                    <Typography variant="body1" className="title-field">หมายเลขห้อง</Typography>
                                                    <FormControl fullWidth error={!!errors.RoomID}>
                                                        <Select
                                                            name="RoomID"
                                                            value={selectedFloor === 0 || selectedRoomtype === 0 ? 0 : String(formData.RoomID)}
                                                            onChange={handleSelectChange}
                                                            displayEmpty
                                                            disabled={selectedFloor === 0 || selectedRoomtype === 0}
                                                        >
                                                            <MenuItem value={0}>
                                                                <em>{'-- เลือกหมายเลขห้อง --'}</em>
                                                            </MenuItem>
                                                            {
                                                                filteredRooms.map((item, index) => {
                                                                    return (
                                                                        <MenuItem key={index} value={item.ID}>{item.RoomNumber}</MenuItem>
                                                                    )
                                                                })
                                                            }
                                                        </Select>
                                                        {errors.RoomID && <FormHelperText>{errors.RoomID}</FormHelperText>}
                                                    </FormControl>
                                                </Grid>
                                            </>
                                        )
                                    }

                                    {/* Maintenance Type Selection */}
                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <Typography variant="body1" className="title-field">ประเภทปัญหา</Typography>
                                        <FormControl fullWidth error={!!errors.MaintenanceTypeID}>
                                            <Select
                                                name="MaintenanceTypeID"
                                                value={Number(formData.MaintenanceTypeID)}
                                                onChange={handleSelectChange}
                                                displayEmpty
                                            >
                                                <MenuItem value={0}>
                                                    <em>{'-- เลือกประเภทปัญหา --'}</em>
                                                </MenuItem>
                                                {
                                                    maintenanceTypes.map((item, index) => {
                                                        return (
                                                            <MenuItem key={index} value={item.ID}>{item.TypeName}</MenuItem>
                                                        )
                                                    })
                                                }
                                            </Select>
                                            {errors.MaintenanceTypeID && <FormHelperText>{errors.MaintenanceTypeID}</FormHelperText>}
                                        </FormControl>
                                        {
                                            formData.MaintenanceTypeID == 6 ? (
                                                <>
                                                    {/* OtherType Detail Input */}
                                                    <Grid size={{ xs: 12, md: 12 }}>
                                                        <TextField
                                                            multiline
                                                            rows={2}
                                                            fullWidth
                                                            variant="outlined"
                                                            name="OtherTypeDetail"
                                                            value={formData.OtherTypeDetail}
                                                            onChange={handleInputChange}
                                                            placeholder="ระบุประเภทปัญหา"
                                                            error={!!errors.OtherTypeDetail}
                                                            helperText={errors.OtherTypeDetail}
                                                            slotProps={{
                                                                input: {
                                                                    className: "custom-input"
                                                                }
                                                            }}
                                                            sx={{ mt: 1 }}
                                                        />
                                                    </Grid>
                                                </>
                                            ) : (
                                                <></>
                                            )
                                        }
                                    </Grid>

                                    {/* Description Input */}
                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <Typography variant="body1" className="title-field">รายละเอียด</Typography>
                                        <TextField
                                            multiline
                                            rows={4}
                                            fullWidth
                                            variant="outlined"
                                            name="Description"
                                            value={formData.Description}
                                            onChange={handleInputChange}
                                            placeholder="ระบุรายละเอียดงานแจ้งซ่อม"
                                            error={!!errors.Description}
                                            helperText={errors.Description}
                                            slotProps={{
                                                input: {
                                                    className: "custom-input"
                                                }
                                            }}
                                        />
                                    </Grid>

                                    {/* Time Input */}
                                    <Grid container size={{ xs: 12, md: 12 }} spacing={0}>
                                        <Typography variant="body1" className="title-field">ช่วงเวลาที่รับบริการได้</Typography>

                                        <Grid size={{ xs: 12, md: 12 }}>
                                            <FormGroup>
                                                <FormControlLabel
                                                    control={<Checkbox
                                                        name="IsAnytimeAvailable"
                                                        checked={formData.IsAnytimeAvailable}
                                                        onChange={handleInputChange}
                                                        sx={{ color: '#6D6E70' }}
                                                    />}
                                                    label="ทุกช่วงเวลา"
                                                />
                                            </FormGroup>
                                        </Grid>

                                        <Grid container size={{ xs: 12, md: 12 }} sx={{
                                            justifyContent: "space-between",
                                            // alignItems: "center",
                                        }}>
                                            <Grid size={{ xs: 5.5, md: 5.5 }}>
                                                <TextField
                                                    name="StartTime"
                                                    type="time"
                                                    fullWidth
                                                    value={formData.StartTime}
                                                    onChange={handleInputChange}
                                                    disabled={formData.IsAnytimeAvailable}
                                                    error={!!errors.StartTime}
                                                    helperText={errors.StartTime}
                                                />
                                            </Grid>
                                            <Typography variant="body1" sx={{ alignItems: 'center', display: 'flex' }}>ถึง</Typography>
                                            <Grid size={{ xs: 5.5, md: 5.5 }}>
                                                <TextField
                                                    name="EndTime"
                                                    type="time"
                                                    fullWidth
                                                    value={formData.EndTime}
                                                    onChange={handleInputChange}
                                                    disabled={formData.IsAnytimeAvailable}
                                                    error={!!errors.EndTime}
                                                    helperText={errors.EndTime}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>

                                {/* Right Section (User Info & Upload) */}
                                <Grid container size={{ xs: 12, md: 6 }} spacing={3}>

                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <Typography variant="body1" className="title-field">ผู้เขียนคำร้อง</Typography>
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            value={`${user?.EmployeeID} ${user?.FirstName} ${user?.LastName}`}
                                            slotProps={{
                                                input: {
                                                    readOnly: true,
                                                    startAdornment: (
                                                        <InputAdornment position="start" sx={{ mr: 1.6 }}>
                                                            <FontAwesomeIcon icon={faUserTie} size="lg" />
                                                        </InputAdornment>
                                                    ),
                                                }
                                            }}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <Typography variant="body1" className="title-field">ข้อมูลการติดต่อ</Typography>
                                        <Grid container spacing={1}>
                                            <TextField
                                                name="Phone"
                                                fullWidth
                                                variant="outlined"
                                                value={user ? user.Phone : ''}
                                                onChange={handleUserDataChange}
                                                error={!!errors.Phone}
                                                helperText={errors.Phone}
                                                slotProps={{
                                                    input: {
                                                        readOnly: !onEdit,
                                                        startAdornment: (
                                                            <InputAdornment position="start" sx={{ mr: 1.6 }}>
                                                                <FontAwesomeIcon icon={faPhone} size="lg" />
                                                            </InputAdornment>
                                                        ),
                                                    }
                                                }}
                                            />
                                            <TextField
                                                name="Email"
                                                fullWidth
                                                variant="outlined"
                                                value={user ? user.Email : ''}
                                                onChange={handleUserDataChange}
                                                error={!!errors.Email}
                                                helperText={errors.Email}
                                                slotProps={{
                                                    input: {
                                                        readOnly: !onEdit,
                                                        startAdornment: (
                                                            <InputAdornment position="start" sx={{ mr: 1.6 }}>
                                                                <FontAwesomeIcon icon={faEnvelope} size="lg" />
                                                            </InputAdornment>
                                                        ),
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid container size={{ xs: 12, md: 12 }} sx={{ justifyContent: "flex-end", mt: 1 }}>
                                            {
                                                !onEdit ? (
                                                    <Button
                                                        variant="containedBlue"
                                                        onClick={() => setOnEdit(!onEdit)}
                                                    >
                                                        <FontAwesomeIcon icon={faPencil} />
                                                        <Typography variant="textButtonClassic" >แก้ไขข้อมูล</Typography>
                                                    </Button>
                                                ) : (
                                                    <Box sx={{ display: 'flex', gap: 1}}>
                                                        <Button
                                                            variant="outlined"
                                                            onClick={()=> {
                                                                getUser; 
                                                                setOnEdit(false);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={	faUndo} />
                                                            <Typography variant="textButtonClassic" >ยกเลิก</Typography>
                                                        </Button>
                                                        <Button
                                                            variant="contained"
                                                            onClick={handleUpdateUser}
                                                        >
                                                            <FontAwesomeIcon icon={faFloppyDisk} />
                                                            <Typography variant="textButtonClassic" >บันทึก</Typography>
                                                        </Button>
                                                    </Box>
                                                )
                                            }
                                        </Grid>
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <Box display={'flex'}>
                                            <Typography variant="body1" className="title-field">ภาพประกอบการแจ้งซ่อม</Typography>
                                            <Typography variant="body1"
                                                sx={{
                                                    ml: 0.5,
                                                    color: 'gray'
                                                }}
                                            >(สูงสุด 3 ไฟล์)</Typography>
                                        </Box>

                                        <ImageUploader
                                            value={files}
                                            onChange={setFiles}
                                            setAlerts={setAlerts}
                                            maxFiles={3}
                                        />
                                    </Grid>
                                </Grid>

                                {/* Buttom Section */}
                                <Grid container size={{ xs: 12, md: 12 }} spacing={2} sx={{ justifyContent: "flex-end" }}>
                                    <Box sx={{ gap: 1, display: 'flex' }}>
                                        <Button
                                            variant="outlined"
                                            sx={{ minHeight: '37px' }}
                                            onClick={() => handleResetData()}
                                        >
                                            <FontAwesomeIcon icon={faRotateRight} />
                                            <Typography variant="textButtonClassic" >รีเซ็ตข้อมูล</Typography>
                                        </Button>
                                        <Button
                                            variant="contained"
                                            sx={{ px: 4, py: 1 }}
                                            type="submit"
                                        >
                                            <FontAwesomeIcon icon={faUpload} />
                                            <Typography variant="textButtonClassic" >ส่งคำร้อง</Typography>
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Container>
        </Box >
    )
}
export default CreateMaintenanceRequestPage