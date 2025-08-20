import React, { useEffect, useState } from "react";
import "./CreateMaintenanceRequest.css";

import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Container,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    Grid,
    InputAdornment,
    MenuItem,
    Radio,
    RadioGroup,
    SelectChangeEvent,
    Skeleton,
    Typography,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import {
    CreateMaintenanceImages,
    CreateMaintenanceRequest,
    CreateNotification,
    GetAreas,
    GetFloors,
    GetMaintenanceTypes,
    GetRequestStatuses,
    GetRooms,
    GetRoomTypes,
    GetUserById,
    UpdateUserbyID,
} from "../../services/http";
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
import {
    faAngleLeft,
    faEnvelope,
    faFloppyDisk,
    faPencil,
    faPhone,
    faRotateRight,
    faUndo,
    faUpload,
    faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import ImageUploader from "../../components/ImageUploader/ImageUploader";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";
import RequestStepper from "../../components/RequestStepper/RequestStepper";
import { NotificationsInterface } from "../../interfaces/INotifications";
import { analyticsService, KEY_PAGES } from "../../services/analyticsService";
import dayjs from "dayjs";
import { LocalizationProvider, PickersActionBar } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { MobileTimePicker } from "../../components/MobileTimePicker/MobileTimePicker";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TimePickerField from "../../components/TimePickerField/TimePickerField";
import { Mail, NotebookPen, Pencil, Phone, RotateCcw, Save, Undo2, Upload, UserRound } from "lucide-react";

function CreateMaintenanceRequestPage() {
    const [user, setUser] = useState<UserInterface>();

    const [areas, setAreas] = useState<AreasInterface[]>([]);
    const [rooms, setRooms] = useState<RoomsInterface[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomtypesInterface[]>([]);
    const [floors, setFloors] = useState<FloorsInterface[]>([]);
    const [maintenanceTypes, setMaintenanceTypes] = useState<
        MaintenanceTypesInteface[]
    >([]);
    const [requestStatuses, setRequestStatuses] = useState<
        RequestStatusesInterface[]
    >([]);

    const [selectedRoomtype, setSelectedRoomtype] = useState(0);
    const [selectedFloor, setSelectedFloor] = useState(0);

    const [alerts, setAlerts] = useState<
        { type: "warning" | "error" | "success"; message: string }[]
    >([]);

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const [isSubmitButtonActive, setIsSubmitButtonActive] = useState(false);
    const [isEditButtonActive, setIsEditButtonActive] = useState(false);

    const [formData, setFormData] = useState<MaintenanceRequestsInterface>({
        AreaDetail: "",
        IsAnytimeAvailable: true,
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

    const navigate = useNavigate();

    const [isLoadingData, setIsLoadingData] = useState(true);

    const getUser = async () => {
        try {
            const res = await GetUserById(
                Number(localStorage.getItem("userId"))
            );
            if (res) {
                // Remove password from user data for security
                const { Password, ...userWithoutPassword } = res;
                setUser(userWithoutPassword);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    const getAreas = async () => {
        try {
            const res = await GetAreas();
            if (res) {
                setAreas(res);
            }
        } catch (error) {
            console.error("Error fetching areas:", error);
        }
    };

    const getRooms = async () => {
        try {
            const res = await GetRooms();
            if (res) {
                setRooms(res);
            }
        } catch (error) {
            console.error("Error fetching rooms:", error);
        }
    };

    const getRoomTypes = async () => {
        try {
            const res = await GetRoomTypes();
            if (res) {
                setRoomTypes(res);
            }
        } catch (error) {
            console.error("Error fetching room types:", error);
        }
    };

    const getFloors = async () => {
        try {
            const res = await GetFloors();
            if (res) {
                setFloors(res);
            }
        } catch (error) {
            console.error("Error fetching floors:", error);
        }
    };

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

        if (name == "MaintenanceTypeID") {
            setFormData((prev) => ({
                ...prev,
                ["OtherTypeDetail"]: "",
            }));
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;

        const numberFields = ["AreaID", "RoomID", "MaintenanceTypeID"];

        setFormData((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : numberFields.includes(name)
                      ? Number(value)
                      : value,
        }));
    };

    const handleUserDataChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value, type, checked } = event.target;

        setUser((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleUpdateUser = async () => {
        setIsEditButtonActive(true);
        if (!user?.ID) {
            handleSetAlert("error", "User not found");
            setIsEditButtonActive(false);
            return;
        }

        if (!validateUserData()) {
            setIsEditButtonActive(false);
            return;
        }

        try {
            const data = { ...user, UserID: user.ID };
            const resUser = await UpdateUserbyID(data);

            if (resUser.status === "error") {
                handleSetAlert(
                    "error",
                    resUser.message || "Failed to update user"
                );
                setIsEditButtonActive(false);
                return;
            }

            handleSetAlert("success", resUser.message);
            setOnEdit(false);
            setIsEditButtonActive(false);
        } catch (error) {
            console.error("🚨 Error update user:", error);
            handleSetAlert("error", "An unexpected error occurred");
            setIsEditButtonActive(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        setIsSubmitButtonActive(true);
        event.preventDefault();
        if (!validateForm()) {
            setIsSubmitButtonActive(false);
            return;
        }

        if (!user?.ID) {
            handleSetAlert("error", "User not found");
            setIsSubmitButtonActive(false);
            return;
        }

        if (files.length === 0) {
            handleSetAlert("warning", "No images uploaded");
            setIsSubmitButtonActive(false);
            return;
        }

        const requestPayload = {
            ...formData,
            AreaID: Number(formData.AreaID),
            UserID: user.ID,
            StartTime: formData.IsAnytimeAvailable
                ? undefined
                : `0001-01-01T${formData.StartTime}:00Z`,
            EndTime: formData.IsAnytimeAvailable
                ? undefined
                : `0001-01-01T${formData.EndTime}:00Z`,
        };

        try {
            const resRequest = await CreateMaintenanceRequest(requestPayload);
            if (!resRequest) {
                handleSetAlert(
                    "error",
                    resRequest?.Error || "Failed to create request"
                );
                setIsSubmitButtonActive(false);
                return;
            }

            if (files.length > 0) {
                const formDataFile = new FormData();
                formDataFile.append("userID", String(user.ID));
                formDataFile.append("requestID", resRequest.data.ID);

                files.forEach((file) => formDataFile.append("files", file));

                const resImage = await CreateMaintenanceImages(formDataFile);
                if (!resImage) {
                    handleSetAlert(
                        "error",
                        resImage?.Error || "Failed to upload images"
                    );
                    setIsSubmitButtonActive(false);
                    return;
                }
            }

            const notificationData: NotificationsInterface = {
                RequestID: resRequest.data.ID,
            };

            const resNotification = await CreateNotification(notificationData);
            if (!resNotification) {
                handleSetAlert(
                    "error",
                    resNotification?.Error || "Failed to create notification"
                );
                return;
            }

            handleSetAlert(
                "success",
                "Maintenance request submitted successfully"
            );
            setTimeout(() => {
                navigate("/my-account");
            }, 1800);
        } catch (error) {
            console.error("🚨 Error submitting request:", error);
            handleSetAlert("error", "An unexpected error occurred");
            setIsSubmitButtonActive(false);
        }
    };

    const handleSetAlert = (
        type: "success" | "error" | "warning",
        message: string
    ) => {
        setAlerts((prevAlerts) => [...prevAlerts, { type, message }]);
    };

    const handleSelectedFilter = (value: number, selectName: string) => {
        if (selectName === "roomtype") {
            formData.RoomID = 0;
            setSelectedFloor(0);
            setSelectedRoomtype(value);
        } else if (selectName === "floorNumber") {
            formData.RoomID = 0;
            setSelectedFloor(value);
        }
    };

    const handleResetData = (ignore: string = "") => {
        setFormData({
            Description: "",
            IsAnytimeAvailable: true,
            StartTime: "",
            EndTime: "",
            OtherTypeDetail: "",
            RoomID: 0,
            AreaID: ignore === "AreaID" ? formData.AreaID : 1,
            MaintenanceTypeID: 0,
        });
        setSelectedFloor(0);
        setSelectedRoomtype(0);
        setFiles([]);
    };

    const validateUserData = () => {
        const newErrors: { [key: string]: string } = {};

        if (!user?.Email?.trim()) {
            newErrors.Email = "Please enter your email.";
        } else {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(user.Email.trim())) {
                newErrors.Email = "Invalid email format.";
            }
        }

        if (!user?.Phone?.trim()) {
            newErrors.Phone = "Please enter your phone number.";
        } else {
            const phonePattern = /^0[0-9]{9}$/;
            if (!phonePattern.test(user.Phone.trim())) {
                newErrors.Phone =
                    "Phone number must be 10 digits starting with 0.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        const otherAreaID =
            areas?.find((item) => item.Name === "Other Areas")?.ID || 0;

        if (!formData.AreaID) {
            newErrors.AreaID = "Please select a maintenance area.";
        } else if (
            formData.AreaID == otherAreaID &&
            !formData.AreaDetail?.trim()
        ) {
            newErrors.AreaDetail = "Please specify additional area details.";
        } else if (formData.AreaID !== otherAreaID && selectedRoomtype == 0) {
            newErrors.RoomTypeID = "Please select a room type.";
        } else if (formData.AreaID !== otherAreaID && selectedFloor == 0) {
            newErrors.FloorID = "Please select a floor or location.";
        } else if (formData.AreaID !== otherAreaID && !formData.RoomID) {
            newErrors.RoomID = "Please select a room number.";
        } else if (!formData.MaintenanceTypeID) {
            newErrors.MaintenanceTypeID = "Please select a maintenance type.";
        } else if (
            formData.MaintenanceTypeID === 6 &&
            !formData.OtherTypeDetail?.trim()
        ) {
            newErrors.OtherTypeDetail =
                "Please specify the additional maintenance type.";
        } else if (!formData.Description?.trim()) {
            newErrors.Description =
                "Please provide a description of the problem.";
        } else if (!formData.IsAnytimeAvailable) {
            if (!formData.StartTime)
                newErrors.StartTime = "Please specify the start time.";
            if (!formData.EndTime)
                newErrors.EndTime = "Please specify the end time.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const filteredRooms = rooms.filter((room) => {
        return (
            room.FloorID === selectedFloor &&
            room.RoomTypeID === selectedRoomtype
        );
    });

    const handleBack = () => {
        localStorage.removeItem("requestID");
        navigate(-1);
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await Promise.all([
                    getUser(),
                    getAreas(),
                    getRooms(),
                    getRoomTypes(),
                    getFloors(),
                    getMaintenanceTypes(),
                    getRequestStatuses(),
                ]);
                setIsLoadingData(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();

        // Remove analytics tracking from CreateMaintenanceRequest
        // analyticsService.trackKeyPageVisit(KEY_PAGES.CREATE_MAINTENANCE_REQUEST, 'Create Maintenance Request');
    }, []);

    useEffect(() => {
        handleResetData("AreaID");
        setErrors({});
    }, [formData.AreaID]);

    useEffect(() => {
        if (formData.IsAnytimeAvailable === true) {
            setFormData({
                ...formData,
                StartTime: "",
                EndTime: "",
            });
        }
    }, [formData.IsAnytimeAvailable]);

    return (
        <Box className="create-maintenance-request-page">
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    {/* Header Section */}
                    <Grid
                        container
                        className="title-box"
                        direction={"row"}
                        size={{ xs: 5 }}
                        sx={{ gap: 1 }}
                    >
                        <NotebookPen size={26} />
                        <Typography
                            variant="h5"
                            className="title"
                            sx={{ fontWeight: 700 }}
                        >
                            Create Maintenance Request
                        </Typography>
                    </Grid>
                    <Grid container size={{ xs: 7, md: 7 }} sx={{ justifyContent: "flex-end" }}>
                        <Box>
                            <Button variant="outlined" onClick={handleBack}>
                                <FontAwesomeIcon icon={faAngleLeft} size="lg" />
                                <Typography variant="textButtonClassic">Back</Typography>
                            </Button>
                        </Box>
                    </Grid>

                    {/* Stepper showing request progress */}
                    <Grid size={{ xs: 12, md: 12 }}>
                        {isLoadingData ? (
                            <Skeleton
                                variant="rectangular"
                                width="100%"
                                height={120}
                                sx={{ borderRadius: 2 }}
                            />
                        ) : (
                            <RequestStepper
                                requestStatuses={requestStatuses}
                                requestStatusID={0}
                            />
                        )}
                    </Grid>

                    {/* Form Card Section */}
                    {isLoadingData ? (
                        <Skeleton
                            variant="rectangular"
                            width="100%"
                            height={500}
                            sx={{ borderRadius: 2 }}
                        />
                    ) : (
                        <Card
                            className="status-card"
                            sx={{ width: "100%", borderRadius: 2 }}
                        >
                            <CardContent>
                                <Grid
                                    container
                                    component="form"
                                    spacing={{
                                        xs: 3,
                                        md: 8,
                                    }}
                                    sx={{
                                        px: {
                                            xs: 2,
                                            md: 6,
                                        },
                                        py: {
                                            xs: 1,
                                            md: 4,
                                        },
                                        alignItems: "flex-start",
                                    }}
                                    onSubmit={handleSubmit}
                                >
                                    {/* Left Section (Form Inputs) */}
                                    <Grid
                                        container
                                        size={{ xs: 12, lg: 6 }}
                                        spacing={3}
                                    >
                                        {/* Area Selection */}
                                        <Grid size={{ xs: 12, md: 12 }}>
                                            <Typography
                                                variant="body1"
                                                className="title-field"
                                            >
                                                Maintenance Area
                                            </Typography>
                                            <FormControl>
                                                <RadioGroup
                                                    row
                                                    name="AreaID"
                                                    value={formData.AreaID}
                                                    onChange={handleInputChange}
                                                >
                                                    {areas.map(
                                                        (item, index) => {
                                                            return (
                                                                <FormControlLabel
                                                                    key={index}
                                                                    value={
                                                                        item.ID
                                                                    }
                                                                    control={
                                                                        <Radio
                                                                            sx={{
                                                                                color: "#6D6E70",
                                                                            }}
                                                                        />
                                                                    }
                                                                    label={
                                                                        item.Name
                                                                    }
                                                                />
                                                            );
                                                        }
                                                    )}
                                                </RadioGroup>
                                            </FormControl>
                                        </Grid>

                                        {formData.AreaID == 2 ? (
                                            <>
                                                {/* Area Detail Input */}
                                                <Grid size={{ xs: 12, md: 12 }}>
                                                    <TextField
                                                        multiline
                                                        rows={2}
                                                        fullWidth
                                                        variant="outlined"
                                                        name="AreaDetail"
                                                        value={
                                                            formData.AreaDetail
                                                        }
                                                        onChange={
                                                            handleInputChange
                                                        }
                                                        placeholder="Enter area for maintenance."
                                                        error={
                                                            !!errors.AreaDetail
                                                        }
                                                        helperText={
                                                            errors.AreaDetail
                                                        }
                                                        slotProps={{
                                                            input: {
                                                                className:
                                                                    "custom-input",
                                                            },
                                                        }}
                                                    />
                                                </Grid>
                                            </>
                                        ) : (
                                            <>
                                                {/* Room Type Selection */}
                                                <Grid size={{ xs: 12, md: 12 }}>
                                                    <Typography
                                                        variant="body1"
                                                        className="title-field"
                                                    >
                                                        Room Type
                                                    </Typography>
                                                    <FormControl
                                                        fullWidth
                                                        error={
                                                            !!errors.RoomTypeID
                                                        }
                                                    >
                                                        <Select
                                                            name="RoomTypeID"
                                                            displayEmpty
                                                            defaultValue={0}
                                                            value={
                                                                selectedRoomtype
                                                            }
                                                            onChange={(e) =>
                                                                handleSelectedFilter(
                                                                    Number(
                                                                        e.target
                                                                            .value
                                                                    ),
                                                                    "roomtype"
                                                                )
                                                            }
                                                        >
                                                            <MenuItem value={0}>
                                                                <em>
                                                                    {
                                                                        "-- Select Room Type --"
                                                                    }
                                                                </em>
                                                            </MenuItem>
                                                            {roomTypes.map(
                                                                (
                                                                    item,
                                                                    index
                                                                ) => {
                                                                    return (
                                                                        <MenuItem
                                                                            key={
                                                                                index
                                                                            }
                                                                            value={
                                                                                item.ID
                                                                            }
                                                                        >
                                                                            {
                                                                                item.TypeName
                                                                            }
                                                                        </MenuItem>
                                                                    );
                                                                }
                                                            )}
                                                        </Select>
                                                        {errors.RoomTypeID && (
                                                            <FormHelperText>
                                                                {
                                                                    errors.RoomTypeID
                                                                }
                                                            </FormHelperText>
                                                        )}
                                                    </FormControl>
                                                </Grid>

                                                {/* Floor Number Selection */}
                                                <Grid size={{ xs: 6, md: 6 }}>
                                                    <Typography
                                                        variant="body1"
                                                        className="title-field"
                                                    >
                                                        Location / Floor
                                                    </Typography>
                                                    <FormControl
                                                        fullWidth
                                                        error={!!errors.FloorID}
                                                    >
                                                        <Select
                                                            name="FloorNumber"
                                                            displayEmpty
                                                            defaultValue={""}
                                                            value={
                                                                selectedRoomtype ===
                                                                0
                                                                    ? 0
                                                                    : selectedFloor
                                                            }
                                                            disabled={
                                                                selectedRoomtype ===
                                                                0
                                                            }
                                                            onChange={(e) =>
                                                                handleSelectedFilter(
                                                                    Number(
                                                                        e.target
                                                                            .value
                                                                    ),
                                                                    "floorNumber"
                                                                )
                                                            }
                                                        >
                                                            <MenuItem value={0}>
                                                                <em>
                                                                    {
                                                                        "-- Select Location or Floor --"
                                                                    }
                                                                </em>
                                                            </MenuItem>
                                                            {floors.map(
                                                                (
                                                                    item,
                                                                    index
                                                                ) => {
                                                                    return (
                                                                        <MenuItem
                                                                            key={
                                                                                index
                                                                            }
                                                                            value={
                                                                                item.ID
                                                                            }
                                                                        >{`Floor ${item.Number}`}</MenuItem>
                                                                    );
                                                                }
                                                            )}
                                                        </Select>
                                                        {errors.FloorID && (
                                                            <FormHelperText>
                                                                {errors.FloorID}
                                                            </FormHelperText>
                                                        )}
                                                    </FormControl>
                                                </Grid>

                                                {/* Room Number Selection */}
                                                <Grid size={{ xs: 6, md: 6 }}>
                                                    <Typography
                                                        variant="body1"
                                                        className="title-field"
                                                    >
                                                        Room Number
                                                    </Typography>
                                                    <FormControl
                                                        fullWidth
                                                        error={!!errors.RoomID}
                                                    >
                                                        <Select
                                                            name="RoomID"
                                                            value={
                                                                selectedFloor ===
                                                                    0 ||
                                                                selectedRoomtype ===
                                                                    0
                                                                    ? 0
                                                                    : String(
                                                                          formData.RoomID
                                                                      )
                                                            }
                                                            onChange={
                                                                handleSelectChange
                                                            }
                                                            displayEmpty
                                                            disabled={
                                                                selectedFloor ===
                                                                    0 ||
                                                                selectedRoomtype ===
                                                                    0
                                                            }
                                                        >
                                                            <MenuItem value={0}>
                                                                <em>
                                                                    {
                                                                        "-- Select Room Number --"
                                                                    }
                                                                </em>
                                                            </MenuItem>
                                                            {filteredRooms.map(
                                                                (
                                                                    item,
                                                                    index
                                                                ) => {
                                                                    return (
                                                                        <MenuItem
                                                                            key={
                                                                                index
                                                                            }
                                                                            value={
                                                                                item.ID
                                                                            }
                                                                        >
                                                                            {
                                                                                item.RoomNumber
                                                                            }
                                                                        </MenuItem>
                                                                    );
                                                                }
                                                            )}
                                                        </Select>
                                                        {errors.RoomID && (
                                                            <FormHelperText>
                                                                {errors.RoomID}
                                                            </FormHelperText>
                                                        )}
                                                    </FormControl>
                                                </Grid>
                                            </>
                                        )}

                                        {/* Maintenance Type Selection */}
                                        <Grid size={{ xs: 12, md: 12 }}>
                                            <Typography
                                                variant="body1"
                                                className="title-field"
                                            >
                                                Maintenance Type
                                            </Typography>
                                            <FormControl
                                                fullWidth
                                                error={
                                                    !!errors.MaintenanceTypeID
                                                }
                                            >
                                                <Select
                                                    name="MaintenanceTypeID"
                                                    value={Number(
                                                        formData.MaintenanceTypeID
                                                    )}
                                                    onChange={
                                                        handleSelectChange
                                                    }
                                                    displayEmpty
                                                >
                                                    <MenuItem value={0}>
                                                        <em>
                                                            {
                                                                "-- Select Maintenance Type --"
                                                            }
                                                        </em>
                                                    </MenuItem>
                                                    {maintenanceTypes.map(
                                                        (item, index) => {
                                                            return (
                                                                <MenuItem
                                                                    key={index}
                                                                    value={
                                                                        item.ID
                                                                    }
                                                                >
                                                                    {
                                                                        item.TypeName
                                                                    }
                                                                </MenuItem>
                                                            );
                                                        }
                                                    )}
                                                </Select>
                                                {errors.MaintenanceTypeID && (
                                                    <FormHelperText>
                                                        {
                                                            errors.MaintenanceTypeID
                                                        }
                                                    </FormHelperText>
                                                )}
                                            </FormControl>
                                            {formData.MaintenanceTypeID == 6 ? (
                                                <>
                                                    {/* OtherType Detail Input */}
                                                    <Grid
                                                        size={{
                                                            xs: 12,
                                                            md: 12,
                                                        }}
                                                    >
                                                        <TextField
                                                            multiline
                                                            rows={2}
                                                            fullWidth
                                                            variant="outlined"
                                                            name="OtherTypeDetail"
                                                            value={
                                                                formData.OtherTypeDetail
                                                            }
                                                            onChange={
                                                                handleInputChange
                                                            }
                                                            placeholder="Enter maintenance type."
                                                            error={
                                                                !!errors.OtherTypeDetail
                                                            }
                                                            helperText={
                                                                errors.OtherTypeDetail
                                                            }
                                                            slotProps={{
                                                                input: {
                                                                    className:
                                                                        "custom-input",
                                                                },
                                                            }}
                                                            sx={{ mt: 1 }}
                                                        />
                                                    </Grid>
                                                </>
                                            ) : (
                                                <></>
                                            )}
                                        </Grid>

                                        {/* Description Input */}
                                        <Grid size={{ xs: 12, md: 12 }}>
                                            <Typography
                                                variant="body1"
                                                className="title-field"
                                            >
                                                Description
                                            </Typography>
                                            <TextField
                                                multiline
                                                rows={4}
                                                fullWidth
                                                variant="outlined"
                                                name="Description"
                                                value={formData.Description}
                                                onChange={handleInputChange}
                                                placeholder="Enter maintenance description."
                                                error={!!errors.Description}
                                                helperText={errors.Description}
                                                slotProps={{
                                                    input: {
                                                        className:
                                                            "custom-input",
                                                    },
                                                }}
                                            />
                                        </Grid>

                                        {/* Time Input */}
                                        <Grid
                                            container
                                            size={{ xs: 12, md: 12 }}
                                            spacing={0}
                                        >
                                            <Typography
                                                variant="body1"
                                                className="title-field"
                                            >
                                                Available Time Slots
                                            </Typography>

                                            <Grid
                                                size={{ xs: 12, md: 12 }}
                                                marginBottom={1.5}
                                            >
                                                <FormGroup>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                name="IsAnytimeAvailable"
                                                                checked={
                                                                    formData.IsAnytimeAvailable
                                                                }
                                                                onChange={
                                                                    handleInputChange
                                                                }
                                                                sx={{
                                                                    color: "#6D6E70",
                                                                }}
                                                            />
                                                        }
                                                        label="Any time"
                                                    />
                                                </FormGroup>
                                            </Grid>

                                            <Grid
                                                container
                                                size={{ xs: 12, md: 12 }}
                                                sx={{
                                                    justifyContent:
                                                        "space-between",
                                                }}
                                            >
                                                <Grid
                                                    size={{ xs: 5.5, md: 5.5 }}
                                                >
                                                    <TimePickerField
                                                        name="StartTime"
                                                        label="Start Time"
                                                        value={
                                                            formData.StartTime ??
                                                            ""
                                                        }
                                                        onChange={(value) =>
                                                            setFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    StartTime:
                                                                        value,
                                                                })
                                                            )
                                                        }
                                                        disabled={
                                                            formData.IsAnytimeAvailable
                                                        }
                                                        error={
                                                            !!errors.StartTime
                                                        }
                                                        helperText={
                                                            errors.StartTime
                                                        }
                                                        maxTime={
                                                            formData.EndTime
                                                        }
                                                    />
                                                </Grid>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        alignItems: "center",
                                                        display: "flex",
                                                    }}
                                                >
                                                    to
                                                </Typography>
                                                <Grid
                                                    size={{ xs: 5.5, md: 5.5 }}
                                                >
                                                    <TimePickerField
                                                        name="EndTime"
                                                        label="End Time"
                                                        value={
                                                            formData.EndTime ??
                                                            ""
                                                        }
                                                        onChange={(value) =>
                                                            setFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    EndTime:
                                                                        value,
                                                                })
                                                            )
                                                        }
                                                        disabled={
                                                            formData.IsAnytimeAvailable
                                                        }
                                                        error={!!errors.EndTime}
                                                        helperText={
                                                            errors.EndTime
                                                        }
                                                        minTime={
                                                            formData.StartTime
                                                        }
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Grid>

                                    {/* Right Section (User Info & Upload) */}
                                    <Grid
                                        container
                                        size={{ xs: 12, lg: 6 }}
                                        spacing={3}
                                    >
                                        <Grid size={{ xs: 12, md: 12 }}>
                                            <Typography
                                                variant="body1"
                                                className="title-field"
                                            >
                                                Request Creator
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                value={`${user?.EmployeeID} ${user?.FirstName} ${user?.LastName}`}
                                                slotProps={{
                                                    input: {
                                                        readOnly: true,
                                                        startAdornment: (
                                                            <InputAdornment
                                                                position="start"
                                                                sx={{ mr: 1.6 }}
                                                            >
                                                                <UserRound size={18}/>
                                                            </InputAdornment>
                                                        ),
                                                    },
                                                }}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 12 }}>
                                            <Typography
                                                variant="body1"
                                                className="title-field"
                                            >
                                                Contact Information
                                            </Typography>
                                            <Grid container spacing={1}>
                                                <TextField
                                                    name="Phone"
                                                    fullWidth
                                                    variant="outlined"
                                                    value={
                                                        user ? user.Phone : ""
                                                    }
                                                    onChange={
                                                        handleUserDataChange
                                                    }
                                                    error={!!errors.Phone}
                                                    helperText={errors.Phone}
                                                    readOnly={!onEdit}
                                                    slotProps={{
                                                        input: {
                                                            startAdornment: (
                                                                <InputAdornment
                                                                    position="start"
                                                                    sx={{
                                                                        mr: 1.6,
                                                                    }}
                                                                >
                                                                    <Phone size={18}/>
                                                                </InputAdornment>
                                                            ),
                                                        },
                                                    }}
                                                />
                                                <TextField
                                                    name="Email"
                                                    fullWidth
                                                    variant="outlined"
                                                    value={
                                                        user ? user.Email : ""
                                                    }
                                                    onChange={
                                                        handleUserDataChange
                                                    }
                                                    error={!!errors.Email}
                                                    helperText={errors.Email}
                                                    readOnly={!onEdit}
                                                    slotProps={{
                                                        input: {
                                                            startAdornment: (
                                                                <InputAdornment
                                                                    position="start"
                                                                    sx={{
                                                                        mr: 1.6,
                                                                    }}
                                                                >
                                                                    <Mail size={18}/>
                                                                </InputAdornment>
                                                            ),
                                                        },
                                                    }}
                                                />
                                            </Grid>
                                            <Grid
                                                container
                                                size={{ xs: 12, md: 12 }}
                                                sx={{
                                                    justifyContent: "flex-end",
                                                    mt: 1,
                                                }}
                                            >
                                                {!onEdit ? (
                                                    <Button
                                                        variant="outlined"
                                                        onClick={() =>
                                                            setOnEdit(!onEdit)
                                                        }
                                                    >
                                                        <Pencil size={18}/>
                                                        <Typography variant="textButtonClassic">
                                                            Edit Info
                                                        </Typography>
                                                    </Button>
                                                ) : (
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            gap: 1,
                                                        }}
                                                    >
                                                        <Button
                                                            variant="outlinedGray"
                                                            onClick={() => {
                                                                getUser;
                                                                setOnEdit(
                                                                    false
                                                                );
                                                            }}
                                                        >
                                                            <Undo2 size={18}/>
                                                            <Typography variant="textButtonClassic">
                                                                Cancel
                                                            </Typography>
                                                        </Button>
                                                        <Button
                                                            variant="contained"
                                                            onClick={
                                                                handleUpdateUser
                                                            }
                                                            disabled={
                                                                isEditButtonActive
                                                            }
                                                        >
                                                            <Save size={18}/>
                                                            <Typography variant="textButtonClassic">
                                                                Save
                                                            </Typography>
                                                        </Button>
                                                    </Box>
                                                )}
                                            </Grid>
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 12 }}>
                                            <Box display={"flex"}>
                                                <Typography
                                                    variant="body1"
                                                    className="title-field"
                                                >
                                                    Request Images
                                                </Typography>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        ml: 0.5,
                                                        color: "gray",
                                                    }}
                                                >
                                                    (maximum 3 files)
                                                </Typography>
                                            </Box>

                                            <ImageUploader
                                                value={files}
                                                onChange={setFiles}
                                                setAlerts={setAlerts}
                                                maxFiles={3}
                                                buttonText="Click to select image files"
                                            />
                                        </Grid>
                                    </Grid>

                                    {/* Buttom Section */}
                                    <Grid
                                        container
                                        size={{ xs: 12, md: 12 }}
                                        spacing={2}
                                        sx={{ justifyContent: "flex-end" }}
                                    >
                                        <Box sx={{ gap: 1, display: "flex" }}>
                                            <Button
                                                variant="outlinedGray"
                                                sx={{ minHeight: "37px" }}
                                                onClick={() =>
                                                    handleResetData()
                                                }
                                            >
                                                <RotateCcw size={18}/>
                                                <Typography variant="textButtonClassic">
                                                    Reset Data
                                                </Typography>
                                            </Button>
                                            <Button
                                                variant="contained"
                                                sx={{ px: 4, py: 1 }}
                                                type="submit"
                                                disabled={isSubmitButtonActive}
                                            >
                                                <Upload size={18}/>
                                                <Typography variant="textButtonClassic">
                                                    Submit Request
                                                </Typography>
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Container>
        </Box>
    );
}
export default CreateMaintenanceRequestPage;
