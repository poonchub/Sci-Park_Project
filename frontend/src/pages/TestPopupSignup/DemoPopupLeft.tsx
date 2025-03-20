import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

const DemoPopupLeft = () => {
  const [isOpen, setIsOpen] = useState(true); // เปิดโดยอัตโนมัติเมื่อเริ่มต้น

  // ใช้ useEffect เพื่อให้ popup เปิดเมื่อเริ่มโหลดหน้า
  useEffect(() => {
    // เปิด popup เมื่อหน้าโหลด
    setIsOpen(true);
  }, []);

  return (
    <Box sx={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {/* Popup ที่ใช้ Framer Motion */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '20px', // ทำขอบมน
        }}
        initial={{ width: 0 }}
        animate={{
          width: isOpen ? '30%' : '0%',  // ขยายแค่ครึ่งหนึ่งของจอ
        }}
        transition={{
          type: 'spring',
          stiffness: 40,   // ลดค่า stiffness เพื่อให้การเคลื่อนไหวช้าลง
          damping: 30,     // เพิ่มค่า damping เพื่อให้การเคลื่อนไหวช้าลง
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            backgroundColor: '',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'black',
            fontSize: '2rem',
            borderRadius: '20px', // ทำขอบมน
          }}
        >
          Popup Content Here
        </Box>
      </motion.div>
    </Box>
  );
};

export default DemoPopupLeft;
