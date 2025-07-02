import { apiUrl } from '../../services/http';

import React, { useState, useEffect } from 'react';
import { Button, Typography, Avatar, Grid } from '@mui/material';
import '../AddUser/AddUserForm.css';  // Import the updated CSS
import { UserInterface } from '../../interfaces/IUser';
import { GetUserById,ListPackages } from '../../services/http';
import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import { TextField } from "../../components/TextField/TextField";
import { TextArea } from '../../components/TextField/TextArea';
import {MaintenaceImagesInterface} from '../../interfaces/IMaintenaceImages'
import { GetUserInterface } from '../../interfaces/IGetUser';






const MyAccount: React.FC = () => {

    const [file, setFile] = useState<File | null>(null);  // เก็บไฟล์เดียว
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);// Fetch data when component mounts
    const [user, setUser] = useState<GetUserInterface | null>();
    const [userType, setUserType] = useState<string>('internal');
    const [img,setImg] = useState<MaintenaceImagesInterface | null>()
    const roleID = 3;  // Watching RoleID value

    const convertPathsToFiles = async (images: MaintenaceImagesInterface[]): Promise<File[]> => {
    if (images.length === 0) return [];

    const img = images[0]; // ✅ ดึงแค่ไฟล์แรก
    const url = apiUrl + "/" + img.FilePath;
    const response = await fetch(url);
    const blob = await response.blob();
    const fileType = blob.type || "image/jpeg";
    const fileName = img.FilePath?.split("/").pop() || `image1.jpg`;

    return [new File([blob], fileName, { type: fileType })]; // ✅ คืนค่ากลับเป็น array ที่มีไฟล์เดียว
};


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            let selectedFiles = Array.from(event.target.files).filter(isValidImage);

            // ตรวจสอบว่าเลือกไฟล์ได้แค่ 1 ไฟล์
            if (selectedFiles.length > 1) {
                selectedFiles = selectedFiles.slice(0, 1);
                alert("สามารถเลือกได้แค่ 1 ไฟล์เท่านั้น");
            }

            // แปลงไฟล์เป็น Base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);  // เก็บ Base64 string ของรูปภาพ
            };

            if (selectedFiles[0]) {
                reader.readAsDataURL(selectedFiles[0]);
                setFile(selectedFiles[0]);  // เก็บไฟล์เดียว
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

                // เก็บภาพลง state ถ้าต้องการ
                setImg(imagePathArray[0]);

                const files = await convertPathsToFiles(imagePathArray);
                if (files.length > 0) {
                    const file = files[0];
                    setFile(file);

                    // แปลงไฟล์เป็น Base64 เพื่อแสดงรูป
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


    const onSubmit = async (data: UserInterface) => {

        

    };



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
                ข้อมูลผู้ใช้
            </Typography>

            <div className="add-user">

                

                    <Grid container spacing={2}>

                        {/* User Type Selection (บุคคลภายใน/บุคคลภายนอก) */}




                        {/* Profile Image and Button */}
                        <Grid size={{ xs: 12, sm: 12 }} container direction="column" justifyContent="center" alignItems="center" textAlign="center">
                            {/* แสดงภาพโปรไฟล์ */}
                            <Avatar sx={{ width: 150, height: 150 }} src={profileImage || ''} />

                            {/* ปุ่มเลือกไฟล์ */}
                            <Button variant="outlined" component="label" className="upload-button" sx={{ marginTop: 2 }}>
                                แก้ไขรูปภาพ
                                <input type="file" hidden onChange={handleFileChange} />
                            </Button>
                        </Grid>








                        {/* Name Fields */}
                        <Grid size={{ xs: 12, sm: 12 }}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }} >
                                    <Typography variant="body1" className="title-field">ชื่อ</Typography>
                                    <TextField
                                        id="outlined-read-only-input"
                                        defaultValue={"-"}
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
                                    <Typography variant="body1" className="title-field">นามสกุล</Typography>
                                    <TextField
                                        id="outlined-read-only-input"
                                        defaultValue="-"
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
                                    <Typography variant="body1" className="title-field">เพศ</Typography>
                                    <TextField
                                        id="outlined-read-only-input"
                                        defaultValue="-"
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
                                    <Typography variant="body1" className="title-field">หมายเลข โทรศัพท์</Typography>
                                    <TextField
                                        id="outlined-read-only-input"
                                        defaultValue="-"
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
                                    <Typography variant="body1" className="title-field">อีเมล</Typography>
                                    <TextField
                                        id="outlined-read-only-input"
                                        defaultValue="-"
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
                                <Typography variant="body1" className="title-field">ตำแหน่ง</Typography>
                                <TextField
                                    id="outlined-read-only-input"
                                    defaultValue="-"
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
                        {userType === 'internal' && roleID === 3 && (
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Typography variant="body1" className="title-field">จัดการ</Typography>
                                <TextField
                                    id="outlined-read-only-input"
                                    defaultValue="-"
                                    fullWidth
                                    
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
                            <Typography variant="body1" className="title-field">รหัสพนักงาน</Typography>
                            <TextField
                                id="outlined-read-only-input"
                                defaultValue="-"
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
                            <Typography variant="body1" className="title-field">สิทธิพิเศษ</Typography>
                            <TextField
                                id="outlined-read-only-input"
                                defaultValue="-"
                                fullWidth
                                value={String(user?.UserPackages || "-")}
                                slotProps={{
                                    input: {
                                        readOnly: true,
                                    },
                                }}
                            />
                        </Grid>

                        {/* Conditional Rendering based on User Type */}
                        {userType === 'internal' && (
                            <>
                                <Grid size={{ xs: 4 }}>
                                    <Typography variant="body1" className="title-field">ชื่อบริษัท</Typography>

                                    <TextField
                                        id="outlined-read-only-input"
                                        defaultValue="-"
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
                                    <Typography variant="body1" className="title-field">คำอธิบายธุรกิจ</Typography>
                                    <TextArea
                                        id="outlined-read-only-input"
                                        defaultValue={"-"}
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