import React from 'react';
import { Puff } from 'react-loader-spinner'; // นำเข้า Puff spinner

const Loader: React.FC = () => (
  <div
    style={{
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.9)", // พื้นหลังสีขาว
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Puff
      visible={true} // สถานะการแสดงผลของ spinner
      height="20vh" // ความสูงเป็น 10% ของความสูงหน้าจอ
      width="20vh" // ความกว้างเป็น 10% ของความกว้างหน้าจอ
      color="#F26522" // สีของ spinner
      ariaLabel="puff-loading" // สำหรับการเข้าถึง
      wrapperStyle={{}} // สไตล์ของ wrapper (ไม่มีการกำหนดในที่นี้)
      wrapperClass="" // class สำหรับ wrapper (ไม่กำหนด)
    />
  </div>
);

export default Loader;
