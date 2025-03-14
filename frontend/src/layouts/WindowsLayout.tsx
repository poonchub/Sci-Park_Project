
import React, { useEffect, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Avatar, Button, Menu, MenuItem, Tooltip } from '@mui/material';
import { AppBar } from '../components/AppBar/AppBar';
import { Drawer } from '../components/Drawer/Drawer';

import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';

const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

const DrawerHeader = styled('div')(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'flex-end',
	padding: theme.spacing(0, 1),
	// necessary for content to be below app bar
	...theme.mixins.toolbar,
}));

const WindowsLayout: React.FC = () => {
	const [pagesAppbar, setPagesAppbar] = useState<{
		path: string;
		name: string;
	}[]>([]);

	const [pagesDrawer, setPagesDrawer] = useState<{
		path: string;
		name: string;
	}[]>([]);

	const theme = useTheme();
	const [open, setOpen] = React.useState(false);

	const location = useLocation();

	const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

	const renderNavbarLinkPage = () => {
		const role = localStorage.getItem("role");
		if (role === "Admin") {
			setPagesAppbar(
				[
					{ path: '/', name: 'หน้าหลัก' },
					{ path: '/booking-room', name: 'จองห้อง' },
					{ path: '/maintenance-request', name: 'แจ้งซ่อม' },
				]
			)
			setPagesDrawer(
				[
					{ path: '/', name: 'แดชบอร์ด' },
					{ path: '/maintenance-request', name: 'รายการแจ้งซ่อม' },
					{ path: '/', name: 'มอบหมายงานซ่อม' },
					{ path: '/', name: 'จัดการผู้ใช้งาน' },
				]
			)
		} else {
			setPagesAppbar(
				[
					{ path: '/', name: 'หน้าหลัก' },
					{ path: '/booking-room', name: 'จองห้อง' },
					{ path: '/outsider-maintenance-request', name: 'แจ้งซ่อม' },
				]
			)
		}
	};

	const handleOpenUserMenu = () => {
		setOpen(!open);
	};

	const handleCloseUserMenu = () => {
		setAnchorElUser(null);
	};

	const handleDrawerOpen = () => {
		setOpen(true);
	};

	const handleDrawerClose = () => {
		setOpen(false);
	};

	useEffect(() => {
		renderNavbarLinkPage()
	}, [])

	return (
		<Box sx={{ display: 'flex' }}>
			<CssBaseline />
			<AppBar position="fixed" open={open} sx={{ bgcolor: 'secondary.main', color: 'text.primary' }}>
				<Toolbar>
					<IconButton
						color="inherit"
						aria-label="open drawer"
						onClick={handleDrawerOpen}
						edge="start"
						sx={[
							{
								marginRight: 5,
							},
							open && { display: 'none' },
						]}
					>
						<MenuIcon />
					</IconButton>
					<Box>
						<img src="/images/logo.png" alt="" style={{ height: '30px' }} />
					</Box>
					<Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex', gap: '10px', justifyContent: 'center' } }}>
						{pagesAppbar.map((page: { path: string; name: string }) => {
							return (
								<Link to={page.path} key={page.name}>
									<Button
										sx={{
											my: 2,
											display: 'block',
											borderRadius: 10
										}}
										variant={location.pathname === page.path ? 'contained' : 'text'}
									>
										{page.name}
									</Button>
								</Link>
							);
						})}
					</Box>
					<Typography ></Typography>
					<Box sx={{ flexGrow: 0, flexDirection: 'column', ml: '10px' }}>
						<Tooltip title="Open settings">
							<IconButton onClick={handleOpenUserMenu} sx={{ p: 0, border: `3px solid ${theme.palette.primary.main}`, }}>
								<Avatar alt="Remy Sharp" src="/images/test-profile.jpg" />
							</IconButton>
						</Tooltip>
						<Menu
							sx={{ mt: '45px' }}
							id="menu-appbar"
							anchorEl={anchorElUser}
							anchorOrigin={{
								vertical: 'top',
								horizontal: 'right',
							}}
							keepMounted
							transformOrigin={{
								vertical: 'top',
								horizontal: 'right',
							}}
							open={Boolean(anchorElUser)}
							onClose={handleCloseUserMenu}
						>
							{settings.map((setting) => (
								<MenuItem key={setting} onClick={handleCloseUserMenu}>
									<Typography sx={{ textAlign: 'center' }}>{setting}</Typography>
								</MenuItem>
							))}
						</Menu>
					</Box>
				</Toolbar>
			</AppBar>
			<Drawer variant="permanent" open={open}>
				<DrawerHeader>
					<IconButton onClick={handleDrawerClose} sx={{ color: 'text.secondary' }}>
						{theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
					</IconButton>
				</DrawerHeader>
				<List>
					{pagesDrawer.map((page, index) => {
						console.log(pagesDrawer)
						return (
							<ListItem key={index} disablePadding sx={{ display: 'block' }}>
								<Link to={page.path}>
								<ListItemButton
									sx={[
										{
											minHeight: 48,
											px: 2.5,
											bgcolor: location.pathname === page.path ? '#F26522' : 'transparent',
											"&:hover": {
												bgcolor: '#dd591c'
											}
										},
										open
											? {
												justifyContent: 'initial',
											}
											: {
												justifyContent: 'center',
											},
									]}
								>
									<ListItemIcon
										sx={[
											{
												minWidth: 0,
												justifyContent: 'center',
											},
											open
												? {
													mr: 3,
												}
												: {
													mr: 'auto',
												},
										]}
									>
										{
											index === 0 ? <DashboardOutlinedIcon sx={{ color: 'text.secondary' }} /> :
												index === 1 ? <ChecklistOutlinedIcon sx={{ color: 'text.secondary' }} /> :
													index === 2 ? <HandymanOutlinedIcon sx={{ color: 'text.secondary' }} /> : <ManageAccountsOutlinedIcon sx={{ color: 'text.secondary' }} />
										}
									</ListItemIcon>
									<ListItemText
										primary={page.name}
										sx={[
											open
												? {
													opacity: 1,
												}
												: {
													opacity: 0,
												},
										]}
									/>
								</ListItemButton>
								</Link>
								
							</ListItem>
						)
					})}
				</List>
			</Drawer>
			<Box component="main" sx={{ flexGrow: 1, p: 3 }}>
				<DrawerHeader />
				<Outlet />
			</Box>
		</Box>
	)
}

export default WindowsLayout;
