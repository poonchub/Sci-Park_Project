import React, { useState, useEffect } from 'react';
import { Button, Typography, Divider, Link } from '@mui/material';
import { motion } from 'framer-motion';
import './LoginPage.css';

import { UserInterface } from '../../interfaces/IUser';
import SuccessAlert from '../../components/Alert/SuccessAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import RSP from '../../assets/background/RSP.png';
import RESEND from '../../assets/icon/cycle.png';
import { TextField } from "../../components/TextField/TextField";
import Loader from '../../components/Loadable/Loader';
import { SendOTP, ValidateOTP, ChangePassword } from '../../services/http';

const ResetPasswordPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [uuid, setUuid] = useState(Array(6).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(5 * 60);

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
        console.log(">>>>>",response);
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

  const handleChangePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      return setAlerts([...alerts, { type: 'error', message: "Passwords do not match." }]);
    }
    const id = Number(localStorage.getItem("id"));
    const response = await ChangePassword({ id, password: newPassword });
    if (response.status === 200) {
      setAlerts([{ type: 'success', message: "Password changed successfully!" }]);
      localStorage.clear();
      window.location.href = "/login";
    } else {
      setAlerts([{ type: 'error', message: response.data.error || "Change password failed" }]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newUuid = [...uuid];
    newUuid[index] = e.target.value;
    setUuid(newUuid);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    const pasteData = e.clipboardData.getData("text"); // รับค่าที่ paste
    const newUuid = [...uuid];
  
    // หากค่าที่ paste มีความยาวที่ถูกต้อง (เช่น 6 ตัว)
    if (pasteData.length === uuid.length) {
      // ใส่ค่าที่ paste ลงในช่องต่างๆ ตามลำดับ
      for (let i = 0; i < pasteData.length; i++) {
        newUuid[i] = pasteData[i];
      }
    }
  
    setUuid(newUuid);
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
                        onPaste={(e) => handlePaste(e, index)}  // เพิ่มฟังก์ชันจัดการ paste
                        maxLength={1}
                        onKeyUp={(e) => handleFocusNext(e, index)}
                        onKeyDown={(e) => handleFocusPrev(e, index)}
                        className="input-otp"
                        inputMode="numeric" // บอกว่าเป็น input ตัวเลข
                        pattern="[0-9]" // ให้รับเฉพาะตัวเลข
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
                <form onSubmit={handleChangePasswordSubmit}>
                  <TextField className='field' fullWidth label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} slotProps={{
                inputLabel: {
                  sx: { color: '#6D6E70' }, // Apply gray color to label
                  // Apply gray color to label
                },
                formHelperText: {
                  sx: { color: "red" }, // Apply red color to helper text (MUI v7+)
                },
              }}/>
                  <TextField className='field' fullWidth label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} slotProps={{
                inputLabel: {
                  sx: { color: '#6D6E70' }, // Apply gray color to label
                  // Apply gray color to label
                },
                formHelperText: {
                  sx: { color: "red" }, // Apply red color to helper text (MUI v7+)
                },
              }}/>
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
