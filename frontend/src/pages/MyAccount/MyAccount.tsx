import { apiUrl } from '../../services/http';

import React, { useState, useEffect } from 'react';
import { Button, Typography, Avatar, Grid } from '@mui/material';
import '../AddUser/AddUserForm.css';  // Import the updated CSS
import { GetUserById } from '../../services/http';
import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import { TextField } from "../../components/TextField/TextField";
import { TextArea } from '../../components/TextField/TextArea';
import {MaintenaceImagesInterface} from '../../interfaces/IMaintenaceImages'
import { GetUserInterface } from '../../interfaces/IGetUser';

import { UpdateProfileImage } from '../../services/http/index'
import { analyticsService, KEY_PAGES } from '../../services/analyticsService';
import { useInteractionTracker } from '../../hooks/useInteractionTracker';


const MyAccount: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);  // Store single file
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);// Fetch data when component mounts
    const [user, setUser] = useState<GetUserInterface | null>();
    const [userType, setUserType] = useState<string>('internal');
    const [img,setImg] = useState<MaintenaceImagesInterface | null>()

    // Initialize interaction tracker
    const { getInteractionCount } = useInteractionTracker({
        pagePath: KEY_PAGES.MY_ACCOUNT,
        onInteractionChange: (count) => {
            console.log(`[INTERACTION DEBUG] MyAccount - Interaction count updated: ${count}`);
        }
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
            console.log(result)
            if (result && 'status' in result && result.status === 200) {
                setAlerts([{ type: "success", message: "Profile image updated successfully" }]);
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
                if(res.IsEmployee == false){
                    setUserType("external")
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
            if (user) {
        console.log("User updated:", user);
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

    console.log('[ANALYTICS DEBUG] MyAccount.tsx useEffect triggered - Component mounted');

    // ส่ง request ตอนเข้า (duration = 0)
    analyticsService.trackPageVisit({
        user_id: Number(localStorage.getItem('userId')),
        page_path: KEY_PAGES.MY_ACCOUNT,
        page_name: 'My Account',
        duration: 0, // ตอนเข้า duration = 0
        is_bounce: false,
    });

    // ฟังก์ชันส่ง analytics ตอนออก
    const sendAnalyticsOnLeave = (isBounce: boolean) => {
        if (sent) {
            console.log('[ANALYTICS DEBUG] sendAnalyticsOnLeave called but already sent, skipping...');
            return;
        }
        sent = true;
        const duration = Math.floor((Date.now() - startTime) / 1000);
        console.log('[ANALYTICS DEBUG] Sending analytics:', {
            duration,
            is_bounce: isBounce,
            timestamp: new Date().toISOString(),
            component: 'MyAccount.tsx'
        });
        analyticsService.trackPageVisit({
            user_id: Number(localStorage.getItem('userId')),
            page_path: KEY_PAGES.MY_ACCOUNT,
            page_name: 'My Account',
            duration,
            is_bounce: isBounce,
            interaction_count: getInteractionCount(),
        });
    };

    // ออกจากหน้าแบบปิด tab/refresh
    const handleBeforeUnload = () => {
        console.log('[ANALYTICS DEBUG] beforeunload event triggered');
        sendAnalyticsOnLeave(true);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // ออกจากหน้าแบบ SPA (React)
    return () => {
        console.log('[ANALYTICS DEBUG] MyAccount.tsx useEffect cleanup - Component unmounting');
        window.removeEventListener('beforeunload', handleBeforeUnload);
        sendAnalyticsOnLeave(false);
    };
}, []);

console.log('[ANALYTICS DEBUG] MyAccount.tsx render called');

    const isValidImage = (file: File) => {
        return file.type.startsWith("image/");
    };




    return (
        <>
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
            <Typography
                variant="h6"
                className="title"
                style={{ marginBottom: '20px', marginTop: '10px' }}
            >
                User Information
            </Typography>

            <div className="add-user">

                

                    <Grid container spacing={2}>

                        {/* User Type Selection (Internal/External Person) */}




                        {/* Profile Image and Button */}
                        <Grid size={{ xs: 12, sm: 12 }} container direction="column" justifyContent="center" alignItems="center" textAlign="center">
                            {/* Display profile image */}
                            <Avatar sx={{ width: 150, height: 150 }} src={profileImage || ''} />

                            {/* File selection button */}
                            <Button variant="outlined" component="label" className="upload-button" sx={{ marginTop: 2 }}>
                                Edit Image
                                <input type="file" hidden onChange={handleFileChange} />
                            </Button>
                        </Grid>








                        {/* Name Fields */}
                        <Grid size={{ xs: 12, sm: 12 }}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }} >
                                    <Typography variant="body1" className="title-field">First Name</Typography>
                                    <TextField
                                        id="outlined-read-only-input"
                                        fullWidth
                                        value={String(user?.FirstName || "-")}
                                        autoFocus
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body1" className="title-field">Last Name</Typography>
                                    <TextField
                                        id="outlined-read-only-input"
                                        value={String(user?.LastName || "-")}
                                        fullWidth
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                            },
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Phone and Email Fields */}
                        <Grid size={{ xs: 12, sm: 12 }}>
                            <Grid container spacing={2}>
                                {/* Gender Dropdown */}
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Typography variant="body1" className="title-field">Gender</Typography>
                                    <TextField
                                        id="outlined-read-only-input"
                                        fullWidth
                                        value={user?.Gender?.name || "-"}
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Typography variant="body1" className="title-field">Phone Number</Typography>
                                    <TextField
                                        id="outlined-read-only-input"
                                        fullWidth
                                        value={user?.Phone || "-"}
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                            },
                                        }}
                                    />
                                </Grid>

                                {/* Email Field */}
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Typography variant="body1" className="title-field">Email</Typography>
                                    <TextField
                                        id="outlined-read-only-input"
                                        fullWidth
                                        value={user?.Email || "-"}
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                            },
                                        }}
                                    />
                                </Grid>




                            </Grid>
                        </Grid>

                        {/* Role Dropdown */}
                        {userType === 'internal' && (
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Typography variant="body1" className="title-field">Position</Typography>
                                <TextField
                                    id="outlined-read-only-input"
                                    fullWidth
                                    value={user?.Role?.name || "-"}
                                    slotProps={{
                                        input: {
                                            readOnly: true,
                                        },
                                    }}
                                />
                            </Grid>
                        )}

                        {/* Conditional Rendering for Manager (RoleID === 3) */}
                        {userType === 'internal' && (user?.RoleID === 3 || user?.RoleID === 4) && (
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Typography variant="body1" className="title-field">Management</Typography>
                                <TextField
                                    id="outlined-read-only-input"
                                    fullWidth
                                    value={String(user?.RequestType?.TypeName)}
                                    slotProps={{
                                        input: {
                                            readOnly: true,
                                        },
                                    }}
                                />
                            </Grid>
                        )}


                        {/* EmployeeID Field */}
                        {userType === 'internal' && <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="body1" className="title-field">Employee ID</Typography>
                            <TextField
                                id="outlined-read-only-input"
                                fullWidth
                                value={String(user?.EmployeeID || "-")}
                                slotProps={{
                                    input: {
                                        readOnly: true,
                                    },
                                }}
                            />
                        </Grid>
                        }


                        {/* Package Dropdown */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="body1" className="title-field">Privileges</Typography>
                            <TextField
                                id="outlined-read-only-input"
                                fullWidth
                                value={String(user?.UserPackages && user.UserPackages.length > 0 ? user.UserPackages[0].Package?.package_name || "-" : "-")}
                                slotProps={{
                                    input: {
                                        readOnly: true,
                                    },
                                }}
                            />
                        </Grid>

                        {/* Conditional Rendering based on User Type */}
                        {userType === 'external' && (
                            <>
                                <Grid size={{ xs: 4 }}>
                                    <Typography variant="body1" className="title-field">Company Name</Typography>

                                    <TextField
                                        id="outlined-read-only-input"
                                        fullWidth
                                        value={String(user?.CompanyName || "-")}
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                            },
                                        }}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body1" className="title-field">Business Description</Typography>
                                    <TextArea
                                        id="outlined-read-only-input"
                                        fullWidth
                                        value={String(user?.BusinessDetail || "-")}
                                        multiline
                                        minRows={2}
                                        maxRows={5}
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                            },
                                        }}
                                    />

                                </Grid>
                            </>
                        )}




                    </Grid>
                
            </div>
        </>
    );
};

export default MyAccount;