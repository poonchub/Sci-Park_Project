import { apiUrl } from "../../services/http";

import React, { useState, useEffect } from "react";
import { Button, Typography, Avatar, Grid, Paper, Box, Card, CardContent, Divider, useTheme, Container, Chip, IconButton } from "@mui/material";
import "../AddUser/AddUserForm.css"; // Import the updated CSS
import { GetUserById } from "../../services/http";
import SuccessAlert from "../../components/Alert/SuccessAlert";
import ErrorAlert from "../../components/Alert/ErrorAlert";
import WarningAlert from "../../components/Alert/WarningAlert";
import { TextField } from "../../components/TextField/TextField";
import { TextArea } from "../../components/TextField/TextArea";
import { MaintenaceImagesInterface } from "../../interfaces/IMaintenaceImages";
import { GetUserInterface } from "../../interfaces/IGetUser";

import { UpdateProfileImage } from "../../services/http/index";
import { analyticsService, KEY_PAGES } from "../../services/analyticsService";
import { useInteractionTracker } from "../../hooks/useInteractionTracker";
import { faUser, faCamera, faEdit, faIdCard, faEnvelope, faPhone, faVenusMars, faBriefcase, faBuilding, faCrown, faShieldAlt, faInfoCircle, faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EditProfile: React.FC = () => {
    const theme = useTheme();
    const [file, setFile] = useState<File | null>(null); // Store single file
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<{ type: string; message: string }[]>([]); // Fetch data when component mounts
    const [user, setUser] = useState<GetUserInterface | null>();
    const [userType, setUserType] = useState<string>("internal");
    const [img, setImg] = useState<MaintenaceImagesInterface | null>();
    const navigate = useNavigate();

    // Initialize interaction tracker
    const { getInteractionCount } = useInteractionTracker({
        pagePath: KEY_PAGES.MY_ACCOUNT,
        onInteractionChange: (count) => {},
    });

    const convertPathsToFiles = async (images: MaintenaceImagesInterface[]): Promise<File[]> => {
        if (images.length === 0) return [];

        const img = images[0]; // ✅ Get only the first file
        const url = apiUrl + "/" + img.FilePath;
        const response = await fetch(url);
        const blob = await response.blob();
        const fileType = blob.type || "image/jpeg";
        const fileName = img.FilePath?.split("/").pop() || `image1.jpg`;

        return [new File([blob], fileName, { type: fileType })]; // ✅ Return array with single file
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            let selectedFiles = Array.from(event.target.files).filter(isValidImage);

            // Check if only 1 file can be selected
            if (selectedFiles.length > 1) {
                selectedFiles = selectedFiles.slice(0, 1);
                alert("You can only select 1 file");
            }

            if (selectedFiles[0]) {
                const file = selectedFiles[0];

                // Display image immediately
                const reader = new FileReader();
                reader.onloadend = () => {
                    setProfileImage(reader.result as string);
                };
                reader.readAsDataURL(file);

                setFile(file); // Store new file in state

                // Call API to update immediately
                const result = await UpdateProfileImage(file);
                if (result && "status" in result && result.status === 200) {
                    setAlerts([{ type: "success", message: "Profile image updated successfully" }]);
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    setAlerts([{ type: "error", message: "Error updating profile image" }]);
                }
            }
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await GetUserById(Number(localStorage.getItem("userId")));
                if (res) {
                    setUser(res);

                    const imagePathArray = [{ ID: 0, FilePath: String(res.ProfilePath) }];

                    // Store image in state if needed
                    setImg(imagePathArray[0]);
                    if (res.IsEmployee == false) {
                        setUserType("external");
                    }

                    const files = await convertPathsToFiles(imagePathArray);
                    if (files.length > 0) {
                        const file = files[0];
                        setFile(file);

                        // Convert file to Base64 to display image
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            setProfileImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                    }
                }
            } catch (error) {
                console.error("Error fetching request statuses:", error);
            }
        };

        fetchData();
    }, []);

    // Analytics tracking
    useEffect(() => {
        const startTime = Date.now();
        let sent = false;

        // ส่ง request ตอนเข้า (duration = 0)
        analyticsService.trackPageVisit({
            user_id: Number(localStorage.getItem("userId")),
            page_path: KEY_PAGES.MY_ACCOUNT,
            page_name: "My Account",
            duration: 0, // ตอนเข้า duration = 0
            is_bounce: false,
        });

        // ฟังก์ชันส่ง analytics ตอนออก
        const sendAnalyticsOnLeave = (isBounce: boolean) => {
            if (sent) {
                return;
            }
            sent = true;
            const duration = Math.floor((Date.now() - startTime) / 1000);
            analyticsService.trackPageVisit({
                user_id: Number(localStorage.getItem("userId")),
                page_path: KEY_PAGES.MY_ACCOUNT,
                page_name: "My Account",
                duration,
                is_bounce: isBounce,
                interaction_count: getInteractionCount(),
            });
        };

        // ออกจากหน้าแบบปิด tab/refresh
        const handleBeforeUnload = () => {
            sendAnalyticsOnLeave(true);
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        // ออกจากหน้าแบบ SPA (React)
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            sendAnalyticsOnLeave(false);
        };
    }, []);

    const isValidImage = (file: File) => {
        return file.type.startsWith("image/");
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <Box className="edit-profile-page">
            {alerts.map(
                (alert, index) =>
                    alert.type === "success" && (
                        <SuccessAlert key={index} message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />
                    )
            )}
            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3} justifyContent="center">
                    <Grid container className="title-box" direction={"row"} size={{ xs: 5 }} sx={{ gap: 1 }}>
                        <Pencil size={26} />
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            Edit Profile
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
                    {/* Profile Image Section */}
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Card
                            elevation={3}
                            sx={{
                                bgcolor: "background.paper",
                                color: "text.primary",
                                borderRadius: 3,
                                boxShadow: 3,
                                p: 3,
                                width: "100%",
                                height: "55%",
                                mb: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                textAlign: "center",
                            }}
                        >
                            <Box sx={{ position: "relative", display: "inline-block", mb: 2 }}>
                                <Avatar
                                    sx={{
                                        width: 180,
                                        height: 180,
                                        border: `4px solid ${theme.palette.primary.main}20`,
                                        boxShadow: 3,
                                    }}
                                    src={profileImage || ""}
                                />
                                <IconButton
                                    component="label"
                                    sx={{
                                        position: "absolute",
                                        bottom: 8,
                                        right: 8,
                                        bgcolor: theme.palette.primary.main,
                                        color: "white",
                                        "&:hover": {
                                            bgcolor: theme.palette.primary.dark,
                                        },
                                        width: 40,
                                        height: 40,
                                    }}
                                >
                                    <FontAwesomeIcon icon={faCamera} size="sm" />
                                    <input type="file" hidden onChange={handleFileChange} />
                                </IconButton>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, justifyContent: "center", marginBottom: 3 }}>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<FontAwesomeIcon icon={faEdit} />}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: "none",
                                        fontWeight: 600,
                                    }}
                                >
                                    Edit Profile Image
                                    <input type="file" hidden onChange={handleFileChange} />
                                </Button>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, justifyContent: "center" }}>
                                <Typography variant="h6" fontWeight={600} color="primary" gutterBottom>
                                    {user?.FirstName} {user?.LastName}
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, justifyContent: "center" }}>
                                <Chip
                                    label={userType === "internal" ? "Internal User" : "External User"}
                                    color={userType === "internal" ? "primary" : "primary"}
                                    icon={<FontAwesomeIcon icon={userType === "internal" ? faIdCard : faBuilding} />}
                                    sx={{ mb: 2 }}
                                />
                            </Box>
                        </Card>
                    </Grid>

                    {/* User Information Section */}
                    <Grid size={{ xs: 12, md: 9 }}>
                        <Card
                            elevation={2}
                            sx={{
                                bgcolor: "background.paper",
                                color: "text.primary",
                                borderRadius: 3,
                                boxShadow: 3,
                                p: 3,
                                width: "100%",
                                px: 2,
                                border: "1px solid",
                                borderColor: "divider",
                            }}
                        >
                            <Typography variant="h6" fontWeight={600} color="primary" gutterBottom sx={{ mb: 3 }}>
                                <FontAwesomeIcon icon={faUser} style={{ marginRight: 8 }} />
                                Personal Information
                            </Typography>

                            {/* Name Fields */}
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <FontAwesomeIcon icon={faUser} size="sm" color={theme.palette.primary.main} />
                                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                                            First Name
                                        </Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        value={String(user?.FirstName || "-")}
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                            },
                                        }}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                bgcolor: "background.default",
                                                color: "text.primary",
                                                "& fieldset": {
                                                    borderColor: "divider",
                                                },
                                            },
                                            input: { color: "text.primary" },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <FontAwesomeIcon icon={faUser} size="sm" color={theme.palette.primary.main} />
                                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                                            Last Name
                                        </Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        value={String(user?.LastName || "-")}
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                            },
                                        }}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                bgcolor: "background.default",
                                                color: "text.primary",
                                                "& fieldset": {
                                                    borderColor: "divider",
                                                },
                                            },
                                            input: { color: "text.primary" },
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            {/* Contact Information */}
                            <Typography variant="h6" fontWeight={600} color="primary" gutterBottom sx={{ mb: 3 }}>
                                <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 8 }} />
                                Contact Information
                            </Typography>

                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <FontAwesomeIcon icon={faVenusMars} size="sm" color={theme.palette.warning.main} />
                                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                                            Gender
                                        </Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        value={user?.Gender?.name || "-"}
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                            },
                                        }}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                bgcolor: "background.default",
                                                color: "text.primary",
                                                "& fieldset": {
                                                    borderColor: "divider",
                                                },
                                            },
                                            input: { color: "text.primary" },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <FontAwesomeIcon icon={faPhone} size="sm" color={theme.palette.success.main} />
                                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                                            Phone Number
                                        </Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        value={user?.Phone || "-"}
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                            },
                                        }}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                bgcolor: "background.default",
                                                color: "text.primary",
                                                "& fieldset": {
                                                    borderColor: "divider",
                                                },
                                            },
                                            input: { color: "text.primary" },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <FontAwesomeIcon icon={faEnvelope} size="sm" color={theme.palette.info.main} />
                                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                                            Email
                                        </Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        value={user?.Email || "-"}
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                            },
                                        }}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                bgcolor: "background.default",
                                                color: "text.primary",
                                                "& fieldset": {
                                                    borderColor: "divider",
                                                },
                                            },
                                            input: { color: "text.primary" },
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            {/* Work Information */}
                            {userType === "internal" && (
                                <>
                                    <Divider sx={{ my: 3 }} />
                                    <Typography variant="h6" fontWeight={600} color="primary" gutterBottom sx={{ mb: 3 }}>
                                        <FontAwesomeIcon icon={faBriefcase} style={{ marginRight: 8 }} />
                                        Work Information
                                    </Typography>

                                    <Grid container spacing={3} sx={{ mb: 3 }}>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                                <FontAwesomeIcon icon={faBriefcase} size="sm" color={theme.palette.warning.main} />
                                                <Typography variant="body2" fontWeight={600} color="text.secondary">
                                                    Position
                                                </Typography>
                                            </Box>
                                            <TextField
                                                fullWidth
                                                value={user?.Role?.Name || "-"}
                                                slotProps={{
                                                    input: {
                                                        readOnly: true,
                                                    },
                                                }}
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        bgcolor: "background.default",
                                                        color: "text.primary",
                                                        "& fieldset": {
                                                            borderColor: "divider",
                                                        },
                                                    },
                                                    input: { color: "text.primary" },
                                                }}
                                            />
                                        </Grid>

                                        {(user?.RoleID === 3 || user?.RoleID === 4) && (
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                                    <FontAwesomeIcon icon={faShieldAlt} size="sm" color={theme.palette.error.main} />
                                                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                                                        Management
                                                    </Typography>
                                                </Box>
                                                <TextField
                                                    fullWidth
                                                    value={String(user?.RequestType?.TypeName)}
                                                    slotProps={{
                                                        input: {
                                                            readOnly: true,
                                                        },
                                                    }}
                                                    sx={{
                                                        "& .MuiOutlinedInput-root": {
                                                            bgcolor: "background.default",
                                                            color: "text.primary",
                                                            "& fieldset": {
                                                                borderColor: "divider",
                                                            },
                                                        },
                                                        input: { color: "text.primary" },
                                                    }}
                                                />
                                            </Grid>
                                        )}

                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                                <FontAwesomeIcon icon={faIdCard} size="sm" color={theme.palette.info.main} />
                                                <Typography variant="body2" fontWeight={600} color="text.secondary">
                                                    Employee ID
                                                </Typography>
                                            </Box>
                                            <TextField
                                                fullWidth
                                                value={String(user?.EmployeeID || "-")}
                                                slotProps={{
                                                    input: {
                                                        readOnly: true,
                                                    },
                                                }}
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        bgcolor: "background.default",
                                                        color: "text.primary",
                                                        "& fieldset": {
                                                            borderColor: "divider",
                                                        },
                                                    },
                                                    input: { color: "text.primary" },
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </>
                            )}

                            {/* Privileges Section */}
                            <Divider sx={{ my: 3 }} />
                            <Typography variant="h6" fontWeight={600} color="primary" gutterBottom sx={{ mb: 3 }}>
                                <FontAwesomeIcon icon={faCrown} style={{ marginRight: 8 }} />
                                Account Privileges
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <FontAwesomeIcon icon={faCrown} size="sm" color={theme.palette.warning.main} />
                                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                                            Privileges
                                        </Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        value={String(user?.UserPackages && user.UserPackages.length > 0 ? user.UserPackages[0].Package?.package_name || "-" : "-")}
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                            },
                                        }}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                bgcolor: "background.default",
                                                color: "text.primary",
                                                "& fieldset": {
                                                    borderColor: "divider",
                                                },
                                            },
                                            input: { color: "text.primary" },
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            {/* External User Information */}
                            {userType === "external" && (
                                <>
                                    <Divider sx={{ my: 3 }} />
                                    <Typography variant="h6" fontWeight={600} color="primary" gutterBottom sx={{ mb: 3 }}>
                                        <FontAwesomeIcon icon={faBuilding} style={{ marginRight: 8 }} />
                                        Company Information
                                    </Typography>

                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                                <FontAwesomeIcon icon={faBuilding} size="sm" color={theme.palette.secondary.main} />
                                                <Typography variant="body2" fontWeight={600} color="text.secondary">
                                                    Company Name
                                                </Typography>
                                            </Box>
                                            <TextField
                                                fullWidth
                                                value={String(user?.CompanyName || "-")}
                                                slotProps={{
                                                    input: {
                                                        readOnly: true,
                                                    },
                                                }}
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        bgcolor: "background.default",
                                                        color: "text.primary",
                                                        "& fieldset": {
                                                            borderColor: "divider",
                                                        },
                                                    },
                                                    input: { color: "text.primary" },
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                                <FontAwesomeIcon icon={faInfoCircle} size="sm" color={theme.palette.info.main} />
                                                <Typography variant="body2" fontWeight={600} color="text.secondary">
                                                    Business Description
                                                </Typography>
                                            </Box>
                                            <TextArea
                                                fullWidth
                                                value={String(user?.BusinessDetail || "-")}
                                                multiline
                                                minRows={3}
                                                maxRows={5}
                                                slotProps={{
                                                    input: {
                                                        readOnly: true,
                                                    },
                                                }}
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        bgcolor: "background.default",
                                                        color: "text.primary",
                                                        "& fieldset": {
                                                            borderColor: "divider",
                                                        },
                                                    },
                                                    input: { color: "text.primary" },
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </>
                            )}
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default EditProfile;
