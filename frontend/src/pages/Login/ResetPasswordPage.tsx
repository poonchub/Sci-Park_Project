import React, { useState, useEffect } from 'react';
import { Button, Typography, Divider, Link, IconButton } from '@mui/material'; // Added IconButton
import { motion } from 'framer-motion';
import './LoginPage.css';

import { useNavigate } from 'react-router-dom';
import { UserInterface } from '../../interfaces/IUser';
import SuccessAlert from '../../components/Alert/SuccessAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import RSP from '../../assets/background/RSP.png';
import RESEND from '../../assets/icon/cycle.png';
import { TextField } from "../../components/TextField/TextField";
import Loader from '../../components/Loadable/Loader';
import { SendOTP, ValidateOTP, ChangePassword } from '../../services/http';

import { useForm, Controller } from 'react-hook-form'; // Import useForm and Controller
import Visibility from '@mui/icons-material/Visibility'; // Import icons
import VisibilityOff from '@mui/icons-material/VisibilityOff'; // Import icons

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const { control, handleSubmit, formState: { errors }, watch, reset: resetForm } = useForm({
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        }
    }); // Initialize react-hook-form
    const newPasswordValue = watch('newPassword'); // Watch newPassword for comparison

    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [uuid, setUuid] = useState(Array(6).fill(''));
    // Removed newPassword and confirmPassword states as react-hook-form will manage them
    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
    const [showWarning, setShowWarning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(5 * 60);

    const [showNewPassword, setShowNewPassword] = useState(false); // State for new password visibility
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password visibility

    useEffect(() => {
        if (step === 2 && timer > 0) {
            const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
            return () => clearInterval(countdown);
        }
    }, [step, timer]);

    const formatTimer = () => {
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleResend = async () => {
        if (!email) return;
        setLoading(true);
        try {
            const response = await SendOTP({ email } as UserInterface);
            if (response?.status === 200) {
                setTimer(5 * 60);
                setAlerts([...alerts, { type: 'success', message: `OTP resent to ${email}` }]);
            } else {
                setAlerts([...alerts, { type: 'error', message: response?.data?.error || "Resend failed" }]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitVerifyEmail = async (event: React.FormEvent) => {
        event.preventDefault();
        if (email === '') {
            setShowWarning(true);
            setAlerts([...alerts, { type: 'warning', message: "Please fill in all the fields." }]);
            return;
        }
        setLoading(true);
        try {
            const response = await SendOTP({ email } as UserInterface);
            if (response?.status === 200) {
                localStorage.setItem("email", email);
                setAlerts([...alerts, { type: 'success', message: `OTP sent to ${email}` }]);
                setStep(2);
                setTimer(5 * 60);
            } else {
                setAlerts([...alerts, { type: 'error', message: response?.data?.error || "Send OTP failed!" }]);
            }
        } catch {
            setAlerts([...alerts, { type: 'error', message: "An error occurred while sending OTP." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleOTPSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const token = uuid.join('');
        if (!token || !email) {
            return setAlerts([...alerts, { type: 'error', message: "Please fill all fields" }]);
        }
        setLoading(true);
        try {
            const response = await ValidateOTP({ token, email });
            if (response.status === 200) {
                console.log(">>>>>", response);
                console.log(">>>>>", response.data.token);
                console.log(">>>>>", response.data.id);
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("id", response.data.id);
                setAlerts([...alerts, { type: 'success', message: "OTP verified. Set new password." }]);
                setStep(3);
            } else {
                setAlerts([...alerts, { type: 'error', message: response.data.error }]);
            }
        } finally {
            setLoading(false);
        }
    };

    // This function will now be called by react-hook-form's handleSubmit
    const handleChangePasswordSubmit = async (data: { newPassword: string, confirmPassword: string }) => {
        const { newPassword, confirmPassword } = data; // Destructure values from react-hook-form data

        

        const id = Number(localStorage.getItem("id"));
        if (isNaN(id)) {
            setAlerts([{ type: 'error', message: "User ID not found. Please restart the process." }]);
            return;
        }

        setLoading(true);
        try {
            const response = await ChangePassword({ id, password: newPassword });
            if (response.status === 200) {
                setAlerts([{ type: 'success', message: "Password changed successfully!" }]);
                localStorage.clear();
                // Use navigate for programmatic navigation
                navigate("/login");
            } else {
                setAlerts([{ type: 'error', message: response.data.error || "Change password failed" }]);
            }
        } catch (error) {
            setAlerts([{ type: 'error', message: "An error occurred while changing password." }]);
            console.error("Change password error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const newUuid = [...uuid];
        newUuid[index] = e.target.value;
        setUuid(newUuid);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pasteData = e.clipboardData.getData("text").trim();
        if (pasteData.length === uuid.length && /^\d+$/.test(pasteData)) { // Check length and if it's all digits
            const newUuid = pasteData.split('');
            setUuid(newUuid);
            // Optionally focus on the last input after pasting
            setTimeout(() => {
                const lastInput = document.getElementById(`uuid-input-${uuid.length - 1}`) as HTMLInputElement;
                lastInput?.focus();
            }, 0);
        }
        e.preventDefault(); // Prevent default paste behavior for individual inputs
    };


    const handleFocusNext = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key !== 'Backspace') {
            if (uuid[index] !== '' && index < uuid.length - 1) {
                const nextInput = document.getElementById(`uuid-input-${index + 1}`) as HTMLInputElement;
                nextInput?.focus();
            }
        }
    };

    const handleFocusPrev = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && index > 0 && uuid[index] === '') {
            const prevInput = document.getElementById(`uuid-input-${index - 1}`) as HTMLInputElement;
            prevInput?.focus();
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
                            height: '100%', // Adjusted height to auto for content
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
                            {RSP && <img src={RSP} alt="RSP" className="sign-in-image" />}

                            {step === 1 && (
                                <form onSubmit={handleSubmitVerifyEmail}>
                                    <TextField className='field' fullWidth label="Email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} helperText={showWarning && !email ? "Please enter your email" : ""} slotProps={{ inputLabel: { sx: { color: '#6D6E70' } }, formHelperText: { sx: { color: "red" } } }} />
                                    <Button type="submit" fullWidth variant="contained" color="primary" className='sign-in-button'>Send Verify</Button>
                                    <Divider sx={{ my: 2 }}><Typography variant="body2" sx={{ color: 'gray', px: 1 }}>OR</Typography></Divider>
                                    <Link href="/login" className="forgot-link">Back to Signin</Link>
                                </form>
                            )}

                            {step === 2 && (
                                <form onSubmit={handleOTPSubmit}>
                                    <Typography variant="h6">OTP sent to {email}</Typography>
                                    <Typography variant="body2" sx={{ color: 'gray', mb: 2 }}>Time left: {formatTimer()}</Typography>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0' }}>
                                        {uuid.map((value, index) => (
                                            <input
                                                key={index}
                                                id={`uuid-input-${index}`}
                                                value={value}
                                                onChange={(e) => handleChange(e, index)}
                                                onPaste={handlePaste}
                                                maxLength={1}
                                                onKeyUp={(e) => handleFocusNext(e, index)}
                                                onKeyDown={(e) => handleFocusPrev(e, index)}
                                                className="input-otp"
                                                inputMode="numeric"
                                                pattern="[0-9]"
                                            />
                                        ))}
                                    </div>
                                    <Button type="submit" fullWidth variant="contained" color="primary" className='sign-in-button'>Verify OTP</Button>
                                    <button className="forgot-link" onClick={handleResend} style={{ width: "100%", background: "none", border: "none", textAlign: "center", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <img src={RESEND} alt="Resend Icon" style={{ width: "20px", marginRight: "8px" }} />Resend OTP
                                    </button>
                                </form>
                            )}

                            {step === 3 && (
                                <form onSubmit={handleSubmit(handleChangePasswordSubmit)}> {/* Use handleSubmit from react-hook-form */}
                                    <Controller
                                        name="newPassword"
                                        control={control}
                                        rules={{
                                            required: 'กรุณากรอกรหัสผ่านใหม่',
                                            pattern: {
                                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/,
                                                message: 'รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก, พิมพ์ใหญ่ และตัวเลขอย่างน้อย 8 ตัว'
                                            }
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                className='field'
                                                fullWidth
                                                label="New Password"
                                                type={showNewPassword ? 'text' : 'password'}
                                                {...field} // Spread field props (value, onChange, onBlur, name, ref)
                                                error={!!errors.newPassword}
                                                helperText={String(errors.newPassword?.message || "")}
                                                slotProps={{
                                                    inputLabel: {
                                                        sx: { color: '#6D6E70' },
                                                    },
                                                    formHelperText: {
                                                        sx: { color: "red" },
                                                    },
                                                    input: {
                                                        endAdornment: (
                                                            <IconButton onClick={() => setShowNewPassword(prev => !prev)} edge="end">
                                                                {showNewPassword ? <Visibility /> : <VisibilityOff />}
                                                            </IconButton>
                                                        )
                                                    }
                                                }}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="confirmPassword"
                                        control={control}
                                        rules={{
                                            required: 'กรุณายืนยันรหัสผ่านใหม่',
                                            validate: (value) =>
                                                value === newPasswordValue || 'รหัสผ่านไม่ตรงกัน'
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                className='field'
                                                fullWidth
                                                label="Confirm Password"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                {...field} // Spread field props
                                                error={!!errors.confirmPassword}
                                                helperText={String(errors.confirmPassword?.message || "")}
                                                slotProps={{
                                                    inputLabel: {
                                                        sx: { color: '#6D6E70' },
                                                    },
                                                    formHelperText: {
                                                        sx: { color: "red" },
                                                    },
                                                    input: {
                                                        endAdornment: (
                                                            <IconButton onClick={() => setShowConfirmPassword(prev => !prev)} edge="end">
                                                                {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                                                            </IconButton>
                                                        )
                                                    }
                                                }}
                                            />
                                        )}
                                    />
                                    <Button type="submit" fullWidth variant="contained" color="primary" className='sign-in-button'>Change Password</Button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ResetPasswordPage;