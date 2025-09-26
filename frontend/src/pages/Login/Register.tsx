import React, { useState, useEffect } from 'react';
import { Button, MenuItem, InputLabel, FormControl, FormHelperText, Typography, IconButton, Grid, Divider, Link } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // Import motion from framer-motion

// Import ListGenders และ CreateUserExternalOnly แทน CreateUser
import { ListGenders, CreateUserExternalOnly } from '../../services/http'; // <--- แก้ไขตรงนี้
import { GendersInterface } from '../../interfaces/IGenders';
import { UserInterface } from '../../interfaces/IUser';

import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import { Select } from '../../components/Select/Select';
import { TextField } from '../../components/TextField/TextField';
import { TextArea } from '../../components/TextField/TextArea';
import Loader from '../../components/Loadable/Loader'; // Assuming you have a Loader component

import REGISTER_WELCOME_IMAGE from '../../assets/background/RSP.png'; // Replace with your actual image path

import './LoginPage.css'; // Reusing LoginPage.css for the container and motion div styles

const RegisterPage: React.FC = () => {
    const { control, handleSubmit, reset, formState: { errors }, trigger, getValues } = useForm({ mode: "onBlur" }); // <--- เพิ่ม getValues
    const [genders, setGenders] = useState<GendersInterface[]>([]);
    const [_file, setFile] = useState<File | null>(null);

    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState(1); // State to manage the steps
    const [loading, setLoading] = useState(false); // Loading state for API calls
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const genderData = await ListGenders();
                setGenders(genderData);
            } catch (error) {
                setAlerts((prev) => [...prev, { type: 'error', message: 'Failed to load gender data.' }]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleClickShowPassword = () => {
        setShowPassword((prev) => !prev);
    };

    const handleNextStep = async () => {
        // Trigger validation only for fields in Step 1
        const isStep1Valid = await trigger(["CompanyName", "BusinessDetail", "FirstName", "LastName"]);
        if (isStep1Valid) {
            setStep(2);
        } else {
            setAlerts((prev) => [...prev, { type: 'warning', message: 'Please fill in the first section completely and correctly' }]);
        }
    };

    const onSubmit = async (_data: UserInterface) => {
        // Trigger validation only for fields in Step 2
        const isStep2Valid = await trigger(["GenderID", "Phone", "Email", "Password"]);
        if (!isStep2Valid) {
            setAlerts((prev) => [...prev, { type: 'warning', message: 'Please fill in the second section completely and correctly' }]);
            return;
        }

        setLoading(true);

        // รวมข้อมูลจากทั้งสองขั้นตอนเข้าด้วยกัน
        // getValues() จะดึงค่าทั้งหมดจาก form control โดยไม่คำนึงถึง step
        const allFormData = {
            ...getValues(), // <--- ดึงข้อมูลทั้งหมดจาก form control
            
            IsEmployee: "false", // กำหนดให้เป็นผู้ใช้ภายนอกเสมอ
            // ไม่ต้องกำหนด role_id หรือ package_id ที่นี่ เพราะ CreateUserExternalOnly จัดการแล้ว
        };

        // Debug: แสดงข้อมูลที่จะส่งไป
        console.log("=== Frontend Debug: Data being sent ===");
        console.log("Form data:", allFormData);
        console.log("Individual fields:");
        console.log("CompanyName:", (allFormData as any).CompanyName);
        console.log("BusinessDetail:", (allFormData as any).BusinessDetail);
        console.log("FirstName:", (allFormData as any).FirstName);
        console.log("LastName:", (allFormData as any).LastName);
        console.log("Email:", (allFormData as any).Email);
        console.log("Phone:", (allFormData as any).Phone);
        console.log("GenderID:", (allFormData as any).GenderID);
        console.log("IsEmployee:", allFormData.IsEmployee);

        try {
            // เรียกใช้ CreateUserExternalOnly แทน CreateUser
            const response = await CreateUserExternalOnly(allFormData); // <--- แก้ไขตรงนี้
            if (response.status === "success") {
                setAlerts((prev) => [...prev, { type: 'success', message: response.message }]);
                reset(); // ล้างฟอร์ม
                setFile(null); // ล้างไฟล์รูปภาพ
                setTimeout(() => navigate('/login'), 2000); // Redirect ไปหน้า login
            } else {
                setAlerts((prev) => [...prev, { type: 'error', message: response.message }]);
            }
        } catch (error) {
            console.error('Error creating user', error);
            // ใช้ error message จาก response ถ้ามี
            const errorMessage = (error as any)?.response?.data?.error || response?.message || 'An error occurred. Please try again.';
            setAlerts((prev) => [...prev, { type: 'error', message: errorMessage }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {alerts.map((alert, index) => (
                <React.Fragment key={index}>
                    {alert.type === 'success' && <SuccessAlert message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />}
                    {alert.type === 'error' && <ErrorAlert message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />}
                    {alert.type === 'warning' && <WarningAlert message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />}
                </React.Fragment>
            ))}

            {loading ? <Loader /> : (
                <div className="login-page">
                    <motion.div
                        style={{
                            top: '50%',
                            right: '5%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'white',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            borderRadius: '8px',
                            padding: '30px',
                            height: '100%',
                            minWidth: '300px',
                            width: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                        initial={{ opacity: 0, x: '50%' }}
                        animate={{ opacity: 1, x: '5%' }}
                        transition={{ type: 'spring', stiffness: 40, damping: 30 }}
                    >
                        <div className="right-side">
                            <Typography variant="h4" className='sign-in-welcome'>Welcome to</Typography>
                            {REGISTER_WELCOME_IMAGE && <img src={REGISTER_WELCOME_IMAGE} alt="Welcome" className="sign-in-image" />}

                            <form onSubmit={handleSubmit(onSubmit)}>
                                {step === 1 && (
                                    <>
                                        <Typography variant="h6" sx={{ mb: 2 }}>Company and Personal Information (Section 1)</Typography>

                                        
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="FirstName"
                                                    control={control}
                                                    defaultValue=""
                                                    rules={{ required: 'Please enter your first name' }}
                                                    render={({ field }) => (
                                                        <TextField className='field' {...field} label="First Name" fullWidth error={!!errors.FirstName} helperText={String(errors.FirstName?.message || "")} slotProps={{ inputLabel: { sx: { color: '#6D6E70' } }, formHelperText: { sx: { color: "red" } } }} />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="LastName"
                                                    control={control}
                                                    defaultValue=""
                                                    rules={{ required: 'Please enter your last name' }}
                                                    render={({ field }) => (
                                                        <TextField className='field' {...field} label="Last Name" fullWidth error={!!errors.LastName} helperText={String(errors.LastName?.message || "")} slotProps={{ inputLabel: { sx: { color: '#6D6E70' } }, formHelperText: { sx: { color: "red" } } }} />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="CompanyName"
                                                    control={control}
                                                    defaultValue=""
                                                    rules={{ required: 'Please enter company name' }}
                                                    render={({ field }) => (
                                                        <TextField className='field' {...field} label="Company Name" fullWidth error={!!errors.CompanyName} helperText={String(errors.CompanyName?.message || "")} slotProps={{ inputLabel: { sx: { color: '#6D6E70' } }, formHelperText: { sx: { color: "red" } } }} />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="BusinessDetail"
                                                    control={control}
                                                    defaultValue=""
                                                    rules={{ required: 'Please enter business description' }}
                                                    render={({ field }) => (
                                                        <TextArea className='field' {...field} label="Business Description" fullWidth multiline rows={3} error={!!errors.BusinessDetail} helperText={String(errors.BusinessDetail?.message || "")} slotProps={{ inputLabel: { sx: { color: '#6D6E70' } }, formHelperText: { sx: { color: "red" } } }} />
                                                    )}
                                                />
                                            </Grid>
                                        

                                        <Button
                                            type="button"
                                            fullWidth
                                            variant="contained"
                                            color="primary"
                                            className='sign-in-button'
                                            sx={{ mt: 3 }}
                                            onClick={handleNextStep}
                                        >
                                            Next
                                        </Button>
                                        <Divider sx={{ my: 2 }}><Typography variant="body2" sx={{ color: 'gray', px: 1 }}>OR</Typography></Divider>
                                        <Link href="/login" className="forgot-link">Back to Signin</Link>
                                    </>
                                )}

                                {step === 2 && (
                                    <>
                                        <Typography variant="h6" sx={{ mb: 2 }}>Contact Information and Password (Section 2)</Typography>

                                        
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <FormControl fullWidth error={!!errors.GenderID}>
                                                    <InputLabel sx={{ color: '#6D6E70' }}>Select Gender</InputLabel>
                                                    <Controller
                                                        name="GenderID"
                                                        control={control}
                                                        defaultValue=""
                                                        rules={{ required: 'Please select gender' }}
                                                        render={({ field }) => (
                                                            <Select {...field} label="Select Gender" sx={{ color: '#6D6E70' }}>
                                                                {genders.map((gender) => (
                                                                    <MenuItem key={gender.ID} value={gender.ID}>{gender.Name}</MenuItem>
                                                                ))}
                                                            </Select>
                                                        )}
                                                    />
                                                    <FormHelperText sx={{ color: "red" }}>{String(errors.GenderID?.message || "")}</FormHelperText>
                                                </FormControl>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="Phone"
                                                    control={control}
                                                    defaultValue=""
                                                    rules={{
                                                        required: 'Please enter phone number',
                                                        pattern: {
                                                            value: /^0[0-9]{9}$/,
                                                            message: 'Phone number must start with 0 and have 10 digits'
                                                        }
                                                    }}
                                                    render={({ field }) => (
                                                        <TextField className='field' {...field} label="Phone Number" fullWidth error={!!errors.Phone} helperText={String(errors.Phone?.message || "")} slotProps={{ inputLabel: { sx: { color: '#6D6E70' } }, formHelperText: { sx: { color: "red" } } }} />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="Email"
                                                    control={control}
                                                    defaultValue=""
                                                    rules={{
                                                        required: 'Please enter email',
                                                        pattern: {
                                                            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                                            message: 'Please enter a valid email'
                                                        }
                                                    }}
                                                    render={({ field }) => (
                                                        <TextField className='field' {...field} label="Email" fullWidth error={!!errors.Email} helperText={String(errors.Email?.message || "")} slotProps={{ inputLabel: { sx: { color: '#6D6E70' } }, formHelperText: { sx: { color: "red" } } }} />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="Password"
                                                    control={control}
                                                    defaultValue=""
                                                    rules={{
                                                        required: 'Please enter password',
                                                        pattern: {
                                                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/,
                                                            message: 'Password must contain at least 1 lowercase, 1 uppercase, 1 number, and 1 special character with minimum 8 characters'
                                                        }
                                                    }}
                                                    render={({ field }) => (
                                                        <TextField
                                                            className='field'
                                                            {...field}
                                                            label="Password"
                                                            type={showPassword ? 'text' : 'password'}
                                                            fullWidth
                                                            error={!!errors.Password}
                                                            helperText={String(errors.Password?.message || "")}
                                                            slotProps={{
                                                                inputLabel: { sx: { color: '#6D6E70' } },
                                                                formHelperText: { sx: { color: "red" } },
                                                                input: {
                                                                    endAdornment: (
                                                                        <IconButton onClick={handleClickShowPassword} edge="end">
                                                                            {showPassword ? <Visibility /> : <VisibilityOff />}
                                                                        </IconButton>
                                                                    ),
                                                                },
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                            
                                        


                                        <Grid container spacing={2} sx={{ mt: 3 }}>
                                            <Grid size={{ xs: 12, sm: 6 }} >
                                                <Button
                                                    type="button"
                                                    fullWidth
                                                    variant="outlinedGray"
                                                    color="secondary"
                                                    onClick={() => { setStep(1); }}
                                                >
                                                    Back
                                                </Button>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }} >
                                                <Button type="submit" fullWidth variant="contained" color="primary">
                                                    Register
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </>
                                )}
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default RegisterPage;