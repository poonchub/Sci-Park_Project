import { apiUrl } from "../../services/http";

import React, { useState, useEffect, useRef } from "react";
import {
    Button,
    Typography,
    Avatar,
    Grid,
    Box,
    Card,
    Divider,
    useTheme,
    Container,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Zoom,
    Stack,
} from "@mui/material";
import "../AddUser/AddUserForm.css"; // Import the updated CSS
import { GetUserById } from "../../services/http";
import SuccessAlert from "../../components/Alert/SuccessAlert";
import ErrorAlert from "../../components/Alert/ErrorAlert";
import { TextField } from "../../components/TextField/TextField";
import { TextArea } from "../../components/TextField/TextArea";
import { MaintenaceImagesInterface } from "../../interfaces/IMaintenaceImages";
import { GetUserInterface } from "../../interfaces/IGetUser";

import { UpdateProfileImage, UpdateUserSignature } from "../../services/http/index";
import { analyticsService, KEY_PAGES } from "../../services/analyticsService";
import { useInteractionTracker } from "../../hooks/useInteractionTracker";
import { faUser, faCamera, faEdit, faIdCard, faEnvelope, faPhone, faVenusMars, faBriefcase, faBuilding, faCrown, faShieldAlt, faInfoCircle, faAngleLeft, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { MaterialUISwitch } from "../../components/MaterialUISwitch/MaterialUISwitch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Close } from "@mui/icons-material";
import SignatureCanvas from "react-signature-canvas";
import PrivacyPolicyPopup from "../../components/PrivacyPolicyPopup/PrivacyPolicyPopup";

const EditProfile: React.FC = () => {
    const theme = useTheme();
    const [file, setFile] = useState<File | null>(null); // Store single file
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<{ type: string; message: string }[]>([]); // Fetch data when component mounts
    const [user, setUser] = useState<GetUserInterface | null>();
    const [userType, setUserType] = useState<string>("internal");
    const [img, setImg] = useState<MaintenaceImagesInterface | null>();
    const navigate = useNavigate();
    const [openPopup, setOpenPopup] = useState(false);
    const [openPrivacyPolicy, setOpenPrivacyPolicy] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState<'th' | 'en'>('th');
    const [isButtonActive, setIsButtonActive] = useState(false);
    const [isEditMode, setIsEditMode] = useState(true);
    const sigRef = useRef<SignatureCanvas>(null);
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const [isSignatureBlurred, setIsSignatureBlurred] = useState(true);

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

    const loadSignatureImage = async (signaturePath: string) => {
        try {
            console.log("Loading signature from path:", signaturePath);
            const url = apiUrl + "/" + signaturePath;
            console.log("Full URL:", url);
            
            const response = await fetch(url);
            console.log("Response status:", response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            console.log("Blob size:", blob.size);
            
            // Convert blob to base64 for display
            const reader = new FileReader();
            reader.onloadend = () => {
                console.log("Signature image loaded successfully");
                setSignatureImage(reader.result as string);
            };
            reader.onerror = () => {
                console.error("Error reading signature file");
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error("Error loading signature image:", error);
        }
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

                    // Load signature image if available
                    console.log("User data:", res);
                    console.log("SignaturePath:", res.SignaturePath);
                    if (res.SignaturePath) {
                        console.log("Signature path exists, loading signature...");
                        await loadSignatureImage(res.SignaturePath);
                    } else {
                        console.log("No signature path found");
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
        navigate("/my-account");
    };

    const handleEditModeToggle = () => {
        if (isEditMode) {
            // If currently in edit mode, navigate back to My Account
            navigate("/my-account");
        } else {
            // If in view mode, enable edit mode
            setIsEditMode(true);
        }
    };

    const handleClear = () => {
        sigRef.current?.clear();
        setSignatureFile(null);
    };

    const handleOpenSignaturePopup = () => {
        setOpenPrivacyPolicy(true);
    };

    const handlePrivacyPolicyAccept = () => {
        setOpenPrivacyPolicy(false);
        setOpenPopup(true);
    };

    const handlePrivacyPolicyDecline = () => {
        setOpenPrivacyPolicy(false);
    };

    const handlePrivacyPolicyClose = () => {
        setOpenPrivacyPolicy(false);
    };

    const handleSignatureImageClick = () => {
        setIsSignatureBlurred(!isSignatureBlurred);
    };

    const handleSave = async () => {
        if (sigRef.current?.isEmpty()) {
            alert("กรุณาลงลายเซ็นก่อน");
            return;
        }
        
        try {
            // Get the canvas element directly
            const canvas = sigRef.current?.getCanvas();
            if (!canvas) {
                setAlerts([{ type: "error", message: "Failed to get signature canvas" }]);
                return;
            }

            // Create a new canvas with white background
            const newCanvas = document.createElement('canvas');
            const ctx = newCanvas.getContext('2d');
            if (!ctx) {
                setAlerts([{ type: "error", message: "Failed to create canvas context" }]);
                return;
            }

            // Set canvas size
            newCanvas.width = canvas.width;
            newCanvas.height = canvas.height;

            // Fill with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

            // Draw the signature on top
            ctx.drawImage(canvas, 0, 0);

            // Convert to blob
            newCanvas.toBlob(async (blob) => {
                if (!blob) {
                    setAlerts([{ type: "error", message: "Failed to convert signature to image" }]);
                    return;
                }

                // Create file from blob
                const file = new File([blob], "signature.jpg", { type: "image/jpeg" });
                setSignatureFile(file);

                // Save signature to backend
                if (user?.ID) {
                    const result = await UpdateUserSignature({
                        UserID: user.ID,
                        Signature_Image: file
                    });

                    if (result.status === "success") {
                        setAlerts([{ type: "success", message: "Signature saved successfully" }]);
                        setOpenPopup(false);
                        
                        // Refresh user data to show updated signature
                        try {
                            const updatedUser = await GetUserById(Number(localStorage.getItem("userId")));
                            if (updatedUser) {
                                setUser(updatedUser);
                                // Load the new signature image
                                if (updatedUser.SignaturePath) {
                                    await loadSignatureImage(updatedUser.SignaturePath);
                                }
                            }
                        } catch (error) {
                            console.error("Error refreshing user data:", error);
                        }
                    } else {
                        setAlerts([{ type: "error", message: result.message }]);
                    }
                }
            }, 'image/jpeg', 0.9);

        } catch (error) {
            console.error("Error saving signature:", error);
            setAlerts([{ type: "error", message: "Failed to save signature. Please try again." }]);
        }
    };

    console.log("Rendering EditProfile, signatureImage:", signatureImage);
    return (
        <Box className="edit-profile-page">
            {alerts.map(
                (alert, index) =>
                    alert.type === "success" ? (
                        <SuccessAlert key={index} message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />
                    ) : alert.type === "error" ? (
                        <ErrorAlert key={index} message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />
                    ) : null
            )}

            <PrivacyPolicyPopup
                open={openPrivacyPolicy}
                onAccept={handlePrivacyPolicyAccept}
                onDecline={handlePrivacyPolicyDecline}
                onClose={handlePrivacyPolicyClose}
                language={currentLanguage}
                onLanguageChange={setCurrentLanguage}
            />

            <Dialog open={openPopup} onClose={() => setOpenPopup(false)}>
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        color: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    {/* <ScrollText size={26} /> */}
                    Create Signature
                    <IconButton
                        aria-label="close"
                        onClick={() => setOpenPopup(false)}
                        sx={{
                            position: "absolute",
                            right: 8,
                            top: 8,
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ minWidth: 350, pt: "10px !important" }}>
                    <Grid container size={{ xs: 12 }} spacing={2} sx={{ display: "flex", justifyContent: "center" }}>
                        <SignatureCanvas
                            ref={sigRef}
                            penColor="black"
                            canvasProps={{
                                width: 400,
                                height: 300,
                                style: { border: "2px solid #000", borderRadius: "8px" },
                            }}
                        />
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Zoom in={openPopup} timeout={400}>
                        <Button onClick={handleClear}>Clear</Button>
                    </Zoom>
                    <Zoom in={openPopup} timeout={400}>
                        <Button
                            onClick={handleSave}
                            variant="contained"
                            disabled={isButtonActive}
                            // startIcon={<CircleX size={18} />}
                        >
                            Save
                        </Button>
                    </Zoom>
                </DialogActions>
            </Dialog>
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
                                height: "auto",
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
                            
                            {/* Display existing signature if available */}
                            {signatureImage && (
                                <Box sx={{ mt: 2, textAlign: "center" }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Current Signature:
                                    </Typography>
                                    <Box
                                        sx={{
                                            position: "relative",
                                            display: "inline-block",
                                            cursor: "pointer",
                                        }}
                                        onClick={handleSignatureImageClick}
                                    >
                                        <img 
                                            src={signatureImage} 
                                            alt="User Signature" 
                                            style={{ 
                                                maxWidth: "100%", 
                                                maxHeight: "100px",
                                                filter: isSignatureBlurred ? "blur(3px)" : "none",
                                                transition: "filter 0.3s ease",
                                            }} 
                                        />
                                        {isSignatureBlurred && (
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    left: "50%",
                                                    transform: "translate(-50%, -50%)",
                                                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                                                    borderRadius: "50%",
                                                    width: "40px",
                                                    height: "40px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "white",
                                                }}
                                            >
                                                <FontAwesomeIcon 
                                                    icon={faEyeSlash} 
                                                    size="lg"
                                                    style={{ color: "white" }}
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            )}
                            
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, justifyContent: "center", marginTop: 2 }}>
                                <Button 
                                    variant="outlined" 
                                    onClick={handleOpenSignaturePopup}
                                    startIcon={<FontAwesomeIcon icon={faEdit} />}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: "none",
                                        fontWeight: 600,
                                    }}
                                >
                                    {user?.SignaturePath ? "Edit Signature" : "Create Signature"}
                                </Button>
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
