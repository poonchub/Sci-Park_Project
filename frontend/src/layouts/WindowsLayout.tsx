import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';

import { GetUserById } from '../services/http';
import { UserInterface } from '../interfaces/IUser';

import AppBarMenu from '../components/AppBarMenu/AppBarMenu';
import SideDrawer from '../components/SideDrawer/SideDrawer';
import Footer from '../components/Footer/Footer';

import {
	SECTIONS,
	getDrawerItemsBySection,
	getCurrentSectionKey,
	Role
} from '../constants/navigationConfig';

import { drawerWidth } from '../components/Drawer/Drawer';

const userId = localStorage.getItem("userId");

const WindowsLayout: React.FC = () => {
	const [user, setUser] = useState<UserInterface>();

	// Role of current user (from localStorage)
	const role = (localStorage.getItem("role") || 'Guest') as Role;

	// Determine current top-level section based on current URL
	const currentSectionKey = getCurrentSectionKey(location.pathname);

	// Drawer items for current section and role
	const pagesDrawer = getDrawerItemsBySection(currentSectionKey, role);

	// AppBar sections (static)
	const pagesAppbar = SECTIONS;

	// Drawer open/close state
	const [open, setOpen] = useState(false);

	// Fetch user data by ID (stored in localStorage)
	const getUser = async () => {
		try {
			const res = await GetUserById(Number(userId));
			if (res) {
				setUser(res);
				console.log("User:", res);
			}
		} catch (error) {
			console.error("Error fetching user:", error);
		}
	};

	// Open and close drawer handlers
	const handleDrawerOpen = () => setOpen(true);
	const handleDrawerClose = () => setOpen(false);

	// Fetch user info on first load
	useEffect(() => {
		getUser();
	}, []);

	return (
		<Box
			sx={(theme) => {
				const closedWidth = {
					xs: `calc(${theme.spacing(7)} + 1px)`,
					sm: `calc(${theme.spacing(8)} + 1px)`,
				};

				return {
					display: 'flex',
					flexDirection: 'column',
					minHeight: '100vh',
					transition: theme.transitions.create('margin', {
						easing: theme.transitions.easing.sharp,
						duration: theme.transitions.duration.standard,
					}),
					marginLeft: open ? `${drawerWidth}px` : closedWidth,
				};
			}}
		>
			<CssBaseline />

			{/* Top AppBar */}
			<AppBarMenu
				open={open}
				onDrawerOpen={handleDrawerOpen}
				sections={pagesAppbar}
				user={user}
			/>

			{/* Left Side Drawer */}
			<SideDrawer
				open={open}
				onClose={handleDrawerClose}
				drawerItems={pagesDrawer}
				currentPath={location.pathname}
			/>

			{/* Main content area */}
			<Box
				component="main"
				sx={{
					flexGrow: 1,
					p: 3,
					pt: 11, // Ensure content is below the AppBar
					minHeight: '100vh',
				}}
			>
				<Outlet />
			</Box>

			{/* Bottom Footer */}
			<Footer />
		</Box>
	);
};

export default WindowsLayout;