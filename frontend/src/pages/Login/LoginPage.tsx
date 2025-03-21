import React, { useState } from 'react';
import { Button, Typography, Divider, Link, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {  motion } from 'framer-motion';
import './LoginPage.css'; // ใช้ CSS ที่มีอยู่
import { useNavigate } from 'react-router-dom';
import { UserLogin } from '../../services/http';
import { UserInterface } from '../../interfaces/IUser';
import SuccessAlert from '../../components/Alert/SuccessAlert';
import WarningAlert from '../../components/Alert/WarningAlert'; // Import WarningAlert
import ErrorAlert from '../../components/Alert/ErrorAlert';    // Import ErrorAlert
import RSP from '../../assets/background/RSP.png';
import { TextField } from "../../components/TextField/TextField";
import Loader from '../../components/Loadable/Loader';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
  const [showWarning, setShowWarning] = useState(false);  // For Warning
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (email === "" || password === "") {
      setShowWarning(true);
      setAlerts([...alerts, { type: 'warning', message: "Please fill in all the fields." }]);  // Add warning alert
      return;
    }

    const data: UserInterface = {
      Email: email,
      Password: password,
    };

    try {
      const responseData: any = await UserLogin(data);
      const response = responseData?.data;
      if (response && response.Token && response.Role) {
        localStorage.setItem("isLogin", "true");
        localStorage.setItem("role", response.Role || "Outsider");
        localStorage.setItem("token", response.Token);

        setAlerts([...alerts, { type: 'success', message: "Login successful!" }]);  // Add success alert
      
        setLoading(true);  // Start loading
        setTimeout(() => {
          let redirectPath = "/login";
          if (response.Role) {
            redirectPath = "/";
          }
          navigate(redirectPath);
          setLoading(false);  // Stop loading after navigation
        }, 2000);  // 2 seconds delay
      } else {

        setAlerts([...alerts, { type: 'error', message: response?.Error || "Login failed!" }]);  // Add error alert
      }
    } catch (error: unknown) {
      if (error instanceof Error && (error as any).response) {
        const errorMessage = (error as any).response?.data?.Error || "An error occurred during login.";
        
        setAlerts([...alerts, { type: 'error', message: errorMessage }]);  // Add error alert
      } else {
        
        setAlerts([...alerts, { type: 'error', message: "An error occurred while logging in." }]);  // Add error alert
      }
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  return (
    <div>
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
    {loading ? (
      <Loader />
    ) : ( 
    <div className="login-page">

      
      <motion.div
        style={{

          top: '50%',
          right: '5%', // กำหนดระยะจากขอบขวา
          transform: 'translateY(-50%)', // จัดให้อยู่ตรงกลางแนวตั้ง
          backgroundColor: 'white',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px', // ใช้ค่าที่กำหนดเพียงครั้งเดียว
          padding: '30px',
          height: '100%', // ให้สูงเท่ากับขนาดของเนื้อหา
          minWidth: '300px', // ใช้ค่าเดียว ไม่ต้องกำหนดซ้ำ
          width: 'auto', // ให้เต็มตามขนาด max-width ที่กำหนด
          display: 'flex',
          flexDirection: 'column',

        }}
        initial={{ opacity: 0, x: '50%' }} // เริ่มจากขวานอกจอ
        animate={{ opacity: 1, x: '5%' }} // ขยับเข้ามาจากขวา
        transition={{
          type: 'spring',
          stiffness: 40,
          damping: 30,
        }}
      >

        <div className="right-side">
          <Typography variant="h4" className='sign-in-welcome' >
            Welcome to
          </Typography>
          {RSP && <img src={RSP} alt="RSP" className="sign-in-image" />}





          <form onSubmit={handleSubmit} >
            <TextField
              className='field'
              fullWidth
              label="Email"
              variant="outlined"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              helperText={showWarning && !email ? "Please enter your email" : ""}
              slotProps={{
                inputLabel: {
                  sx: { color: '#6D6E70' }, // Apply gray color to label
                  // Apply gray color to label
                },
                formHelperText: {
                  sx: { color: "red" }, // Apply red color to helper text (MUI v7+)
                },
              }}
            />
            <TextField
              className="field"
              fullWidth
              label="Password"
              variant="outlined"
              margin="normal"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText={showWarning && !password ? "Please enter your password" : ""}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
                inputLabel: {
                  sx: { color: "#6D6E70" }, // Apply gray color to label
                },
                formHelperText: {
                  sx: { color: "red" }, // Apply red color to helper text (MUI v7+)
                },
              }}
            />


            <Button type="submit" fullWidth variant="contained" color="primary" className='sign-in-button'>
              Sign In
            </Button>
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" sx={{ color: 'gray', px: 1 }}>
                OR
              </Typography>
            </Divider>
            <Link href="#" className="forgot-link">
              Forgot Email or Password?
            </Link>
          </form>
        </div>
      </motion.div>
    
    </div>
            )}</div>
  );
};

export default LoginPage;
