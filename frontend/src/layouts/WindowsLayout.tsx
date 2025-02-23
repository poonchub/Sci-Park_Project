import React from 'react';
import { Outlet } from 'react-router-dom';
import NavbarWindows from '../components/NavbarWindows/NavbarWindows';

const WindowsLayout: React.FC = () => {
	return (
		<div>
			<NavbarWindows/>
			<div className="content">
				<Outlet/>
			</div>
		</div>
  )
}
export default WindowsLayout;