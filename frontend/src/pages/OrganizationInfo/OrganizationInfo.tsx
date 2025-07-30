import { useEffect, useRef, useState } from "react"
import { OrganizationInfoInterface } from "../../interfaces/IOrganizationInfo"
import { apiUrl, GetOrganizationInfo, UpdateOrganizationInfo } from "../../services/http"
import { Avatar, Box, Button, Card, CardMedia, Collapse, Container, Fab, Grid, IconButton, Stack, Typography, Zoom } from "@mui/material"
import { TextField } from "../../components/TextField/TextField"
import "./OrganizationInfo.css"
import { Building2, Save } from "lucide-react"
import { MaterialUISwitch } from "../../components/MaterialUISwitch/MaterialUISwitch"
import AlertGroup from "../../components/AlertGroup/AlertGroup"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faImage, faPencil } from "@fortawesome/free-solid-svg-icons"

function OrganizationInfo() {
    const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfoInterface>({})
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitButtonActive, setIsSubmitButtonActive] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getOrganizationInfo = async () => {
        try {
            const res = await GetOrganizationInfo()
            if (res) {
                setOrganizationInfo(res)
            }
        } catch (error) {
            console.error("Error fetching organization info:", error);
        }
    }

    const handleUserDataChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;

        setOrganizationInfo((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const validateData = () => {
        const newErrors: { [key: string]: string } = {};

        // NameTH
        if (!organizationInfo?.NameTH?.trim()) {
            newErrors.NameTH = "Please enter the organization name (TH).";
        }

        // NameEN
        if (!organizationInfo?.NameEN?.trim()) {
            newErrors.NameEN = "Please enter the organization name (EN).";
        }

        // Slogan (optional but check empty string)
        if (organizationInfo?.Slogan?.trim() === "") {
            newErrors.Slogan = "Please enter a slogan.";
        }

        // Description
        if (!organizationInfo?.Description?.trim()) {
            newErrors.Description = "Please enter a description.";
        }

        // Address
        if (!organizationInfo?.Address?.trim()) {
            newErrors.Address = "Please enter an address.";
        }

        // FacebookUrl (optional but validate if provided)
        if (organizationInfo?.FacebookUrl?.trim()) {
            const facebookPattern = /^(https?:\/\/)?(www\.)?facebook\.com\/.+$/;
            if (!facebookPattern.test(organizationInfo.FacebookUrl.trim())) {
                newErrors.FacebookUrl = "Invalid Facebook URL.";
            }
        }

        // Phone
        if (!organizationInfo?.Phone?.trim()) {
            newErrors.Phone = "Please enter your phone number.";
        } else {
            // ฟังก์ชันล้างค่าก่อนตรวจสอบ
            const normalizePhone = (raw: string): string => {
                return raw
                    .replace(/ต่อ.*$/i, '')
                    .replace(/[^\d]/g, '')
                    .trim();
            };

            const cleanedPhone = normalizePhone(organizationInfo.Phone);

            const phonePattern = /^0\d{8,9}$/; // ต้องขึ้นต้นด้วย 0 และมีทั้งหมด 9–10 ตัวเลข

            if (!phonePattern.test(cleanedPhone)) {
                newErrors.Phone = "Phone number must start with 0 and have 9–10 digits.";
            }
        }

        // Email
        if (!organizationInfo?.Email?.trim()) {
            newErrors.Email = "Please enter your email.";
        } else {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(organizationInfo.Email.trim())) {
                newErrors.Email = "Invalid email format.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdateOrganizationInfo = async () => {
        setIsSubmitButtonActive(true);
        if (!validateData()) {
            setIsSubmitButtonActive(false);
            return;
        }

        if (!logoFile && organizationInfo.LogoPath?.trim() === '') {
            handleSetAlert("warning", "No images uploaded");
            setIsSubmitButtonActive(false);
            return;
        }

        try {
            const formData = new FormData();

            for (const [key, value] of Object.entries(organizationInfo)) {
                if (value !== undefined && value !== null) {
                    formData.append(key, value);
                }
            }

            if (logoFile) {
                formData.append("files", logoFile);
            }

            const res = await UpdateOrganizationInfo(formData, organizationInfo.ID || 0);
            console.log("res", res)
            if (!res) {
                handleSetAlert("error", res.message || "Failed to update user");
                setIsSubmitButtonActive(false);
                return;
            }

            handleSetAlert("success", "Organization information updated successfully.");
            setTimeout(() => {
                // getOrganizationInfo()
                setIsSubmitButtonActive(false);
                window.location.reload();
            }, 1800);

        } catch (error) {
            console.error("🚨 Error submitting request:", error);
            handleSetAlert("error", "An unexpected error occurred");
            setIsSubmitButtonActive(false);
        }
    }

    const handleSetAlert = (type: "success" | "error" | "warning", message: string) => {
        setAlerts((prevAlerts) => [...prevAlerts, { type, message }]);
    };

    const isValidImage = (file: File) => file.type.startsWith("image/");

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!isValidImage(file)) {
            setAlerts((prev) => [
                ...prev,
                { type: "warning", message: "Please select a valid image file." }
            ]);
            return;
        }

        setLogoFile(file);
    };

    useEffect(() => {
        getOrganizationInfo()
    }, [])

    return (
        <div className='organization-info-page'>

            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    {/* Header Section */}
                    <Grid
                        container
                        className="title-box"
                        direction={'row'}
                        size={{ xs: 4 }}
                        sx={{ gap: 1 }}
                    >
                        <Building2 size={26} />
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            Organization Info
                        </Typography>
                    </Grid>

                    <Grid
                        container
                        className="title-box"
                        size={{ xs: 8 }}
                        sx={{
                            justifyContent: 'flex-end'
                        }}
                    >
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Typography sx={{ fontWeight: 500 }}>
                                {isEditMode ? "Editing Enabled" : "View Only"}
                            </Typography>
                            <MaterialUISwitch sx={{ m: 1 }}
                                onChange={(event) =>
                                    setIsEditMode(event.target.checked)
                                }
                            />
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Card sx={{ width: "100%", borderRadius: 2, p: 4 }}>
                            <Grid container size={{ xs: 12 }} spacing={2.5}>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body1" className="title-field">
                                        Logo
                                    </Typography>
                                    <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                                        <CardMedia
                                            component="img"
                                            image={
                                                logoFile ? (
                                                    URL.createObjectURL(logoFile)
                                                ) : (
                                                    `${apiUrl}/${organizationInfo.LogoPath}?t=${Date.now()}`
                                                )
                                            }
                                            sx={{
                                                width: {
                                                    lg: 400
                                                },
                                                height: "auto",
                                                backgroundColor: '#FFF',
                                                boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
                                                p: 2,
                                                borderRadius: 2
                                            }}
                                        />

                                        <input
                                            accept="image/png, image/jpeg, image/jpg"
                                            type="file"
                                            multiple={false}
                                            ref={fileInputRef}
                                            hidden
                                            onChange={handleFileChange}
                                        />

                                        <Zoom in={isEditMode} timeout={300} unmountOnExit>
                                            <Fab
                                                variant="extended"
                                                size="small"
                                                sx={{
                                                    position: "absolute",
                                                    bottom: 10,
                                                    right: 10,
                                                    boxShadow: "0 0px 6px 0 rgba(0, 0, 0, 0.2)",
                                                    borderRadius: 10,
                                                    border: "1px solid rgba(255, 255, 255, 0.18)",
                                                }}
                                                color="primary"
                                                onClick={() => {
                                                    fileInputRef.current?.click();
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faPencil} size="lg" />
                                            </Fab>
                                        </Zoom>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="body1" className="title-field">
                                        Thai Name
                                    </Typography>
                                    <TextField
                                        name="NameTH"
                                        fullWidth
                                        variant="outlined"
                                        value={organizationInfo.NameTH ?? ""}
                                        onChange={handleUserDataChange}
                                        error={!!errors.NameTH}
                                        helperText={errors.NameTH}
                                        slotProps={{
                                            input: {
                                                readOnly: !isEditMode,
                                                // startAdornment: (
                                                //     <InputAdornment position="start" sx={{ mr: 1.6 }}>
                                                //         <FontAwesomeIcon icon={faPhone} size="lg" />
                                                //     </InputAdornment>
                                                // ),
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="body1" className="title-field">
                                        English Name 
                                    </Typography>
                                    <TextField
                                        name="NameEN"
                                        fullWidth
                                        variant="outlined"
                                        value={organizationInfo.NameEN ?? ""}
                                        onChange={handleUserDataChange}
                                        error={!!errors.NameEN}
                                        helperText={errors.NameEN}
                                        slotProps={{
                                            input: {
                                                readOnly: !isEditMode,
                                                // startAdornment: (
                                                //     <InputAdornment position="start" sx={{ mr: 1.6 }}>
                                                //         <FontAwesomeIcon icon={faPhone} size="lg" />
                                                //     </InputAdornment>
                                                // ),
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="body1" className="title-field">
                                        Slogan
                                    </Typography>
                                    <TextField
                                        name="Slogan"
                                        multiline
                                        rows={4}
                                        fullWidth
                                        variant="outlined"
                                        value={organizationInfo.Slogan ?? ""}
                                        onChange={handleUserDataChange}
                                        error={!!errors.Slogan}
                                        helperText={errors.Slogan}
                                        slotProps={{
                                            input: {
                                                readOnly: !isEditMode,
                                                className: "custom-input",
                                                // startAdornment: (
                                                //     <InputAdornment position="start" sx={{ mr: 1.6 }}>
                                                //         <FontAwesomeIcon icon={faPhone} size="lg" />
                                                //     </InputAdornment>
                                                // ),
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="body1" className="title-field">
                                        Description
                                    </Typography>
                                    <TextField
                                        name="Description"
                                        multiline
                                        rows={4}
                                        fullWidth
                                        variant="outlined"
                                        value={organizationInfo.Description ?? ""}
                                        onChange={handleUserDataChange}
                                        error={!!errors.Description}
                                        helperText={errors.Description}
                                        slotProps={{
                                            input: {
                                                readOnly: !isEditMode,
                                                className: "custom-input",
                                                // startAdornment: (
                                                //     <InputAdornment position="start" sx={{ mr: 1.6 }}>
                                                //         <FontAwesomeIcon icon={faPhone} size="lg" />
                                                //     </InputAdornment>
                                                // ),
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="body1" className="title-field">
                                        Phone
                                    </Typography>
                                    <TextField
                                        name="Phone"
                                        fullWidth
                                        variant="outlined"
                                        value={organizationInfo.Phone ?? ""}
                                        onChange={handleUserDataChange}
                                        error={!!errors.Phone}
                                        helperText={errors.Phone}
                                        slotProps={{
                                            input: {
                                                readOnly: !isEditMode,
                                                // startAdornment: (
                                                //     <InputAdornment position="start" sx={{ mr: 1.6 }}>
                                                //         <FontAwesomeIcon icon={faPhone} size="lg" />
                                                //     </InputAdornment>
                                                // ),
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="body1" className="title-field">
                                        Email
                                    </Typography>
                                    <TextField
                                        name="Email"
                                        fullWidth
                                        variant="outlined"
                                        value={organizationInfo.Email ?? ""}
                                        onChange={handleUserDataChange}
                                        error={!!errors.Email}
                                        helperText={errors.Email}
                                        slotProps={{
                                            input: {
                                                readOnly: !isEditMode,
                                                // startAdornment: (
                                                //     <InputAdornment position="start" sx={{ mr: 1.6 }}>
                                                //         <FontAwesomeIcon icon={faPhone} size="lg" />
                                                //     </InputAdornment>
                                                // ),
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="body1" className="title-field">
                                        Facebook
                                    </Typography>
                                    <TextField
                                        name="FacebookUrl"
                                        fullWidth
                                        variant="outlined"
                                        value={organizationInfo.FacebookUrl ?? ""}
                                        onChange={handleUserDataChange}
                                        error={!!errors.FacebookUrl}
                                        helperText={errors.FacebookUrl}
                                        slotProps={{
                                            input: {
                                                readOnly: !isEditMode,
                                                // startAdornment: (
                                                //     <InputAdornment position="start" sx={{ mr: 1.6 }}>
                                                //         <FontAwesomeIcon icon={faPhone} size="lg" />
                                                //     </InputAdornment>
                                                // ),
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="body1" className="title-field">
                                        Address
                                    </Typography>
                                    <TextField
                                        name="Address"
                                        multiline
                                        rows={4}
                                        fullWidth
                                        variant="outlined"
                                        value={organizationInfo.Address ?? ""}
                                        onChange={handleUserDataChange}
                                        error={!!errors.Address}
                                        helperText={errors.Address}
                                        slotProps={{
                                            input: {
                                                readOnly: !isEditMode,
                                                className: "custom-input",
                                                // startAdornment: (
                                                //     <InputAdornment position="start" sx={{ mr: 1.6 }}>
                                                //         <FontAwesomeIcon icon={faPhone} size="lg" />
                                                //     </InputAdornment>
                                                // ),
                                            },
                                        }}
                                    />
                                </Grid>


                                <Grid
                                    container
                                    size={{ xs: 12 }}
                                    justifyContent={'end'}
                                >
                                    <Zoom in={isEditMode} timeout={300} unmountOnExit>
                                        <Button
                                            variant="contained"
                                            startIcon={<Save size={18} strokeWidth={2} />}
                                            onClick={handleUpdateOrganizationInfo}
                                            disabled={isSubmitButtonActive}
                                        >
                                            Save
                                        </Button>
                                    </Zoom>

                                </Grid>
                            </Grid>
                        </Card>
                    </Grid>
                </Grid>


            </Container>
        </div>
    )
}

export default OrganizationInfo