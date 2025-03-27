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

import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import MailOutlineOutlinedIcon from '@mui/icons-material/MailOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined';
import SuccessAlert from "../../components/Alert/SuccessAlert";
import ErrorAlert from "../../components/Alert/ErrorAlert";
import WarningAlert from "../../components/Alert/WarningAlert";

function CreateMaintenanceRequestPage() {
    const [user, setUser] = useState<UserInterface>()

    const [areas, setAreas] = useState<AreasInterface[]>([])
    const [rooms, setRooms] = useState<RoomsInterface[]>([])
    const [roomTypes, setRoomTypes] = useState<RoomtypesInterface[]>([])
    const [floors, setFloors] = useState<FloorsInterface[]>([])
    const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceTypesInteface[]>([])

    const [selectedRoomtype, setSelectedRoomtype] = useState(0)
    const [selectedFloor, setSelectedFloor] = useState(0)
    // const [isAllTime, setIsAllTime] = useState(true)

    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);

    const [formData, setFormData] = useState<MaintenanceRequestsInterface>({
        Description: "",
        StartTime: "",
        EndTime: "",
        RoomID: 0,
        AreaID: 1,
        MaintenanceTypeID: 0,
    });

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
        const { name, value } = event.target as { name: string; value: string }; // 👈 กำหนด type ของ target
        setFormData((prev) => ({
            ...(prev ?? {}),
            [name]: value, // 👈 รับรองว่าเป็น string แน่นอน
        }));
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;
        setFormData((prev) => ({
            ...(prev ?? {}),
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async () => {
        formData.UserID = user?.ID
        formData.RequestStatusID = 1
        formData.StartTime = `0001-01-01T${formData.StartTime}:00Z`
        formData.EndTime = `0001-01-01T${formData.EndTime}:00Z`

        try {
            const resRequest = await CreateMaintenanceRequest(formData)
            if (resRequest) {
                const formDataFile = new FormData();
                formDataFile.append("userID", String(user?.ID));
                formDataFile.append("requestID", resRequest.data.ID);

                // เพิ่มไฟล์ทั้งหมดลงใน formData
                for (let i = 0; i < files.length; i++) {
                    formDataFile.append("files", files[i]); // ใช้ key "file" ให้ตรงกับ API
                }

                for (let pair of formDataFile.entries()) {
                    console.log("📤 FormData:", pair[0], pair[1]);
                }

                const resImage = await CreateMaintenanceImages(formDataFile)
                if (resImage) {
                    setAlerts([...alerts, { type: 'success', message: "Maintenance request sumitted successfully" }]);
                    setTimeout(() => {
                        location.href = "/maintenance-request";
                    }, 1800)
                }
                else {
                    setAlerts([...alerts, { type: 'error', message: resImage?.Error || "failed!" }]);
                }
            } else {
                setAlerts([...alerts, { type: 'error', message: resRequest?.Error || "failed!" }]);
            }
        } catch (error) {

        }
    }

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

    const handleResetData = () => {
        setFormData({
            Description: "",
            StartTime: "",
            EndTime: "",
            RoomID: 0,
            AreaID: 1,
            MaintenanceTypeID: 0,
        })
        setSelectedFloor(0)
        setSelectedRoomtype(0)
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
                    <Link to="/maintenance-request">
                        <Button variant="outlined">ย้อนกลับ</Button>
                    </Link>
                </Grid2>

                {/* Form Card Section */}
                <Card className="status-card" sx={{ width: '100%' }}>
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
                                                        <FormControlLabel key={index} value={item.ID} control={<Radio />} label={item.Name} />
                                                    )
                                                })
                                            }

                                        </RadioGroup>
                                    </FormControl>
                                </Grid2>

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
                                                    checked

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
                                                inputProps={{ step: 600 }}
                                            />
                                        </Grid2>
                                    </Grid2>
                                </Grid2>
                            </Grid2>

                            {/* Right Section (User Info & Upload) */}
                            <Grid2 container size={{ xs: 6, md: 6 }} spacing={3}>

                                <Grid2 size={{ xs: 6, md: 12 }}>
                                    <Typography variant="body1" className="title-field">ผู้เขียนคำร้อง</Typography>
                                    <TextField fullWidth variant="outlined" value={`${user?.FirstName} ${user?.LastName}`} />
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
                                                        <InputAdornment position="start">
                                                            <PhoneOutlinedIcon />
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
                                                        <InputAdornment position="start">
                                                            <MailOutlineOutlinedIcon />
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
                                            <EditOutlinedIcon />
                                            {"แก้ไข"}
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
                                <Button onClick={handleResetData}>รีเซ็ตข้อมูล</Button>
                                <Button variant="contained" sx={{ px: 4, py: 1 }} onClick={handleSubmit}>
                                    <IosShareOutlinedIcon />
                                    {"ส่งคำร้องแจ้งซ่อม"}
                                </Button>
                            </Grid2>
                        </Grid2>
                    </CardContent>
                </Card>
            </Grid2>
        </div>
    )
}
export default CreateMaintenanceRequestPage