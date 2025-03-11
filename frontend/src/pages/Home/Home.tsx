import React from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // นำเข้า useNavigate

const Home: React.FC = () => {
  const navigate = useNavigate(); // ใช้ useNavigate เพื่อให้สามารถนำทางได้

  const handleLogout = () => {
    // การตั้งค่าการออกจากระบบ
    localStorage.setItem("isLogin", "false");
    // นำทางไปยังหน้า login หลังจากออกจากระบบ
    navigate("/login");
  };

  return (
    <div className="home-page">
      <h1>Log Out</h1>
      {/* ใช้ปุ่มสำหรับ Logout */}
      <Button 
        onClick={handleLogout} 
        fullWidth 
        variant="contained" 
        color="primary" 
        className="sign-in-button"
      >
        Logout
      </Button>
    </div>
  );
};

export default Home;
