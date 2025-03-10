import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from '../components/NavbarWindows/AdminNavbar';
import OutsiderNavbar from '../components/NavbarWindows/OutsiderNavbar';

const WindowsLayout: React.FC = () => {

  const role = localStorage.getItem("role");

  const renderNavbar = () => {
    if (role === "Admin") {
      return <AdminNavbar />;
    } else {
      return <OutsiderNavbar />; // Default or Outsider case
    }
  };

  return (
    <div>
      {renderNavbar()}
      <div className="content" style={{
        height: "calc(100vh - 65px)",
        overflow: "hidden",
      }}>
        <Outlet />
      </div>
      <footer>
        {/* You can add footer content here */}
      </footer>
    </div>
  );
}

export default WindowsLayout;
