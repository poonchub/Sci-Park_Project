import React from 'react';
import { Outlet } from 'react-router-dom';
import NavbarWindows from '../components/NavbarWindows/NavbarWindows';

const WindowsLayout: React.FC = () => {
	return (
		<div>
			<NavbarWindows/>
			<div className="content" style={{
				height: "calc(100vh - 65px)",
				overflow: "scroll",
				padding: "30px 70px"
			}}>
				<Outlet/>
			</div>
		</div>
  )
}
export default WindowsLayout;