import React, { useState } from 'react';
import { TextField, Button, Typography, Grid, Link, Paper, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material'; // นำเข้าไอคอนสำหรับเปิด/ปิดการดูรหัสผ่าน
import bg from '../../assets/background/bg.png'; // Background image
import './LoginPage.css';  // นำเข้าไฟล์ CSS ที่เราสร้างขึ้น
import { useNavigate } from 'react-router-dom'; // นำเข้า useNavigate สำหรับการนำทาง

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // ใช้สถานะสำหรับเปิด/ปิดการดูรหัส
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    // แสดงข้อมูลที่กรอกเข้ามา
    console.log('Email:', email);
    console.log('Password:', password);

    // ตั้งค่าการเข้าสู่ระบบ
    localStorage.setItem("isLogin", "true");

    // localStorage.setItem("role", "Admin");
    localStorage.setItem("role", "Outsider");

    // กำหนดบทบาท
    const role = "Admin"; // เปลี่ยนเป็นค่าบทบาทที่ได้รับจากผู้ใช้ หรือระบบ
    let redirectPath = "/login"; // กำหนดเส้นทางเริ่มต้นเป็น /login
    
    // กำหนดเส้นทางตามบทบาท
    switch (role) {
      case "Admin":
        redirectPath = "/"; // หากเป็น Admin ให้ไปที่หน้า home หรือหน้าอื่น ๆ ที่กำหนด
        break;
      default:
        redirectPath = "/login"; // ถ้าไม่ใช่บทบาทที่กำหนดจะไปที่หน้า login
    }
    
    // ใช้ navigate เพื่อไปยังเส้นทางที่เลือก
    navigate(redirectPath);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword); // สลับสถานะการแสดงรหัส
  };

  const handleMouseDownPassword = (event: React.MouseEvent) => {
    event.preventDefault(); // ป้องกันไม่ให้ฟอร์มถูกส่งเมื่อคลิก
  };

  return (
    <div className="login-page">  {/* เพิ่มคลาส login-page ที่ครอบทั้งหมด */}
      <Grid container spacing={0}>
        {/* Left Side */}
        <Grid item xs={12} sm={6}>
          <div
            className="left-side"
            style={{
              backgroundImage: `url(${bg})`,  // ใช้เส้นทางที่ถูกต้อง
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '100vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              color: 'white',
              textAlign: 'center',
              padding: '16px',
            }}
          >
            <Typography variant="h3" fontWeight="bold">Science Park</Typography>
            <Typography variant="h6">Welcome back! Please sign in to continue</Typography>
          </div>
        </Grid>

        {/* Right Side */}
        <Grid item xs={12} sm={6}>
          <Paper className="right-side">
            <Typography variant="h5" gutterBottom>Sign In</Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                margin="normal"
                type={showPassword ? "text" : "password"} // สลับระหว่าง "text" และ "password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClickShowPassword} // คลิกเพื่อเปิด/ปิดการดูรหัส
                        onMouseDown={handleMouseDownPassword} // ป้องกันการคลิกของเมาส์
                        edge="end"
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />} {/* ไอคอนตา */}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" fullWidth variant="contained" color="primary" className="sign-in-button">
                Sign In
              </Button>
              <Link href="#" className="forgot-link">
                Forgot Email or Password?
              </Link>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default LoginPage;
