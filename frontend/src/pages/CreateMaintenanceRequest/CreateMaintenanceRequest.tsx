import React, { useEffect, useState } from "react";
import "./CreateMaintenanceRequest.css"

import { Button, Card, CardContent, Checkbox, FormControl, FormControlLabel, FormGroup, Grid2, InputAdornment, MenuItem, Radio, RadioGroup, SelectChangeEvent, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { CreateMaintenanceImages, CreateMaintenanceRequest, GetAreas, GetFloors, GetMaintenanceTypes, GetRooms, GetRoomTypes, GetUser } from "../../services/http";
import { AreasInterface } from "../../interfaces/IAreas";
import { RoomtypesInterface } from "../../interfaces/IRoomTypes";
import { RoomsInterface } from "../../interfaces/IRooms";
import { FloorsInterface } from "../../interfaces/IFloors";
import { MaintenanceTypesInteface } from "../../interfaces/IMaintenanceTypes";
import { UserInterface } from "../../interfaces/IUser";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { Select } from "../../components/Select/Select";
import { TextField } from "../../components/TextField/TextField";

import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined';
import SuccessAlert from "../../components/Alert/SuccessAlert";
import ErrorAlert from "../../components/Alert/ErrorAlert";
import WarningAlert from "../../components/Alert/WarningAlert";
import StepperComponent from "../../components/Stepper/Stepper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faEnvelope, faPencil, faPhone, faUser} from "@fortawesome/free-solid-svg-icons";

function CreateMaintenanceRequestPage() {
    const [user, setUser] = useState<UserInterface>()

    const [areas, setAreas] = useState<AreasInterface[]>([])
    const [rooms, setRooms] = useState<RoomsInterface[]>([])
    const [roomTypes, setRoomTypes] = useState<RoomtypesInterface[]>([])
    const [floors, setFloors] = useState<FloorsInterface[]>([])
    const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceTypesInteface[]>([])

    const [selectedRoomtype, setSelectedRoomtype] = useState(0)
    const [selectedFloor, setSelectedFloor] = useState(0)

    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);

    const [formData, setFormData] = useState<MaintenanceRequestsInterface>({
        AreaDetail: "",
        IsAnytimeAvailable: false,
        Description: "",
        StartTime: "",
        EndTime: "",
        RoomID: 0,
        AreaID: 1,
        MaintenanceTypeID: 0,
    });

    const steps = ["Creating Request", "Pending", "Approved", "In Progress", "Completed"];

    const [onEdit, setOnEdit] = useState(false);

    const [files, setFiles] = useState<File[]>([]);

    const isValidImage = (file: File) => {
        return file.type.startsWith("image/");
    };

    const getUser = async () => {
        try {
            const res = await GetUser();
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

    const handleSelectChange = (event: SelectChangeEvent<unknown>) => {
        const { name, value } = event.target as { name: string; value: string };

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async () => {
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
            console.log(requestPayload)
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

                console.log("📤 FormData:", Array.from(formDataFile.entries()));

                const resImage = await CreateMaintenanceImages(formDataFile);
                if (!resImage) {
                    handleSetAlert('error', resImage?.Error || "Failed to upload images");
                    return;
                }
            }

            handleSetAlert('success', "Maintenance request submitted successfully");
            setTimeout(() => {
                location.href = "/maintenance-request";
            }, 1800);

        } catch (error) {
            console.error("🚨 Error submitting request:", error);
            handleSetAlert('error', "An unexpected error occurred");
        }
    };

    const handleSetAlert = (type: 'success' | 'error' | 'warning', message: string) => {
        setAlerts((prevAlerts) => [...prevAlerts, { type, message }]);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        let droppedFiles = Array.from(event.dataTransfer.files).filter(isValidImage);

        if (droppedFiles.length > 3) {
            droppedFiles = droppedFiles.slice(0, 3);
            setAlerts([...alerts, { type: 'warning', message: "You can upload up tp 3 files." }]);
        }

        setFiles(droppedFiles);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            let selectedFiles = Array.from(event.target.files).filter(isValidImage);

            if (selectedFiles.length > 3) {
                selectedFiles = selectedFiles.slice(0, 3);
                setAlerts([...alerts, { type: 'warning', message: "You can upload up tp 3 files." }]);
            }

            setFiles(selectedFiles);
        }
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
            RoomID: 0,
            AreaID: ignore === 'AreaID' ? formData.AreaID : 1,
            MaintenanceTypeID: 0,
        })
        setSelectedFloor(0)
        setSelectedRoomtype(0)
        setFiles([])
    }

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
    }, [])

    useEffect(() => {
        handleResetData('AreaID')
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
        <div className="create-maintenance-request-page">
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

            {/* Header Section */}
            <Grid2 container spacing={2}>
                <Grid2 className='title-box' size={{ xs: 10, md: 10 }}>
                    <Typography variant="h6" className="title">
                        เขียนคำร้องแจ้งซ่อม
                    </Typography>
                </Grid2>
                <Grid2 container size={{ xs: 10, md: 2 }} sx={{ justifyContent: "flex-end" }}>
                    <Link to="/maintenance-request" style={{ textAlign: 'center' }}>
                        <Button variant="outlined">
                            <FontAwesomeIcon icon={faAngleLeft} size="lg"/>
                            <Typography sx={{ fontSize: 14, ml: 0.6 }}>ย้อนกลับ</Typography>
                        </Button>
                    </Link>
                </Grid2>

                <Card className="status-card" sx={{ width: '100%', borderRadius: 2 }}>
                    <CardContent sx={{ p: '16px 24px' }}>
                        <StepperComponent activeStep={0} steps={steps}/>
                    </CardContent>
                </Card>

                {/* Form Card Section */}
                <Card className="status-card" sx={{ width: '100%', borderRadius: 2 }}>
                    <CardContent>
                        <Grid2 container
                            component="form"
                            spacing={8}
                            sx={{ px: 6, py: 4, alignItems: "flex-start" }}
                            onSubmit={handleSubmit}
                        >
                            {/* Left Section (Form Inputs) */}
                            <Grid2 container size={{ xs: 6, md: 6 }} spacing={3}>
                                {/* Area Selection */}
                                <Grid2 size={{ xs: 6, md: 12 }}>
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
                                </Grid2>

                                {
                                    formData.AreaID == 2 ? (
                                        <>
                                            {/* Area Detail Input */}
                                            <Grid2 size={{ xs: 6, md: 12 }}>
                                                <TextField
                                                    multiline
                                                    rows={2}
                                                    fullWidth
                                                    variant="outlined"
                                                    name="AreaDetail"
                                                    value={formData.AreaDetail}
                                                    onChange={handleInputChange}
                                                    placeholder="ระบุบริเวณที่ต้องการแจ้งซ่อม"
                                                    slotProps={{
                                                        input: {
                                                            className: "custom-input"
                                                        }
                                                    }}
                                                />
                                            </Grid2>
                                        </>
                                    ) : (
                                        <>
                                            {/* Room Type Selection */}
                                            <Grid2 size={{ xs: 6, md: 12 }}>
                                                <Typography variant="body1" className="title-field">ประเภทห้อง</Typography>
                                                <FormControl fullWidth>
                                                    <Select
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
                                                </FormControl>
                                            </Grid2>

                                            {/* Floor Number Selection */}
                                            <Grid2 size={{ xs: 6, md: 6 }}>
                                                <Typography variant="body1" className="title-field">ตำแหน่ง/ชั้น</Typography>
                                                <FormControl fullWidth>
                                                    <Select
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
                                                </FormControl>
                                            </Grid2>

                                            {/* Room Number Selection */}
                                            <Grid2 size={{ xs: 6, md: 6 }}>
                                                <Typography variant="body1" className="title-field">หมายเลขห้อง</Typography>
                                                <FormControl fullWidth>
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
                                                </FormControl>
                                            </Grid2>
                                        </>
                                    )
                                }

                                {/* Maintenance Type Selection */}
                                <Grid2 size={{ xs: 6, md: 12 }}>
                                    <Typography variant="body1" className="title-field">ประเภทปัญหา</Typography>
                                    <FormControl fullWidth>
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
                                    </FormControl>
                                </Grid2>

                                {/* Description Input */}
                                <Grid2 size={{ xs: 6, md: 12 }}>
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
                                        slotProps={{
                                            input: {
                                                className: "custom-input"
                                            }
                                        }}
                                    />
                                </Grid2>

                                {/* Time Input */}
                                <Grid2 container size={{ xs: 6, md: 12 }} spacing={0}>
                                    <Typography variant="body1" className="title-field">ช่วงเวลาที่รับบริการได้</Typography>

                                    <Grid2 size={{ xs: 6, md: 12 }}>
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
                                    </Grid2>

                                    <Grid2 container size={{ xs: 6, md: 12 }} sx={{
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}>
                                        <Grid2 size={{ xs: 6, md: 5.5 }}>
                                            <TextField
                                                name="StartTime"
                                                type="time"
                                                fullWidth
                                                value={formData.StartTime}
                                                onChange={handleInputChange}
                                                disabled={formData.IsAnytimeAvailable}
                                            />
                                        </Grid2>
                                        <Typography variant="body1">ถึง</Typography>
                                        <Grid2 size={{ xs: 6, md: 5.5 }}>
                                            <TextField
                                                name="EndTime"
                                                type="time"
                                                fullWidth
                                                value={formData.EndTime}
                                                onChange={handleInputChange}
                                                disabled={formData.IsAnytimeAvailable}
                                            />
                                        </Grid2>
                                    </Grid2>
                                </Grid2>
                            </Grid2>

                            {/* Right Section (User Info & Upload) */}
                            <Grid2 container size={{ xs: 6, md: 6 }} spacing={3}>

                                <Grid2 size={{ xs: 6, md: 12 }}>
                                    <Typography variant="body1" className="title-field">ผู้เขียนคำร้อง</Typography>
                                    <TextField 
                                        fullWidth 
                                        variant="outlined" 
                                        value={`${user?.FirstName} ${user?.LastName}`} 
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start" sx={{ mr: 1.6}}>
                                                        <FontAwesomeIcon icon={faUser} size="lg"/>
                                                    </InputAdornment>
                                                ),
                                            }
                                        }}
                                    />
                                </Grid2>

                                <Grid2 size={{ xs: 6, md: 12 }}>
                                    <Typography variant="body1" className="title-field">ข้อมูลการติดต่อ</Typography>
                                    <Grid2 container spacing={1}>

                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            disabled={!onEdit}
                                            value={user ? user.Phone : ''}
                                            slotProps={{
                                                input: {
                                                    startAdornment: (
                                                        <InputAdornment position="start" sx={{ mr: 1.6}}>
                                                            <FontAwesomeIcon icon={faPhone} size="lg"/>
                                                        </InputAdornment>
                                                    ),
                                                }
                                            }}
                                        />
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            disabled={!onEdit}
                                            value={user ? user.Email : ''}
                                            slotProps={{
                                                input: {
                                                    startAdornment: (
                                                        <InputAdornment position="start" sx={{ mr: 1.6}}>
                                                            <FontAwesomeIcon icon={faEnvelope} size="lg" />
                                                        </InputAdornment>
                                                    ),
                                                }
                                            }}
                                        />
                                    </Grid2>
                                    <Grid2 container size={{ xs: 6, md: 12 }} sx={{ justifyContent: "flex-end", mt: 1 }}>
                                        <Button
                                            variant="contained"

                                            onClick={() => setOnEdit(!onEdit)}
                                            sx={{
                                                background: "#08aff1",
                                                display: onEdit ? 'none' : '',
                                                "&:hover": {
                                                    backgroundColor: "#08A0DC"
                                                }
                                            }}>
                                            <FontAwesomeIcon icon={faPencil} size="lg"/>
                                            <Typography sx={{ fontSize: 14, ml: 0.6 }}>แก้ไข</Typography>
                                        </Button>
                                    </Grid2>
                                </Grid2>

                                <Grid2 size={{ xs: 6, md: 12 }}>
                                    <Typography variant="body1" className="title-field">ภาพประกอบ</Typography>
                                    {/* Preview Images */}
                                    <Grid2 container spacing={2} sx={{ mt: 2 }}>
                                        {files.map((file, index) => {
                                            const imageUrl = URL.createObjectURL(file);
                                            return (
                                                <Grid2 key={index} size={{ xs: 6, md: 4 }}>
                                                    <img src={imageUrl} alt={`preview-${index}`} width="100%" style={{ borderRadius: 8 }} />
                                                </Grid2>
                                            );
                                        })}
                                    </Grid2>

                                    {/* Drop Zone */}
                                    <Grid2
                                        size={{ xs: 6, md: 12 }}
                                        sx={{
                                            border: "2px dashed #0094DE",
                                            borderRadius: 2,
                                            p: 1.8,
                                            textAlign: "center",
                                            cursor: "pointer",
                                            backgroundColor: "#F4FBFF",
                                        }}
                                        onDragOver={(event) => event.preventDefault()}
                                        onDrop={handleDrop}
                                    >
                                        <Typography>ลากและวางไฟล์ที่นี่ หรือ</Typography>
                                        <Button variant="contained" component="label">
                                            คลิกเลือกไฟล์
                                            <input
                                                accept="image/*"
                                                type="file"
                                                multiple
                                                hidden
                                                onChange={handleFileChange}
                                            />
                                        </Button>
                                    </Grid2>
                                </Grid2>
                            </Grid2>

                            {/* Buttom Section */}
                            <Grid2 container size={{ xs: 6, md: 12 }} spacing={2} sx={{ justifyContent: "flex-end", mt: 1 }}>
                                <Button onClick={() => handleResetData()}>รีเซ็ตข้อมูล</Button>
                                <Button variant="contained" sx={{ px: 4, py: 1 }} onClick={handleSubmit}>
                                    <IosShareOutlinedIcon />
                                    {"ส่งคำร้องแจ้งซ่อม"}
                                </Button>
                            </Grid2>
                        </Grid2>
                    </CardContent>
                </Card>
            </Grid2>
        </div >
    )
}
export default CreateMaintenanceRequestPage