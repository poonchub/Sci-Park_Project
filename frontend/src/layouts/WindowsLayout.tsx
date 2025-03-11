
import React, { useState } from 'react';
import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Avatar, Button, Menu, MenuItem, Tooltip } from '@mui/material';

const drawerWidth = 240;

const pages = [
	{ path: '/', name: 'หน้าหลัก' },
	{ path: '/booking-room', name: 'จองห้อง' },
	{ path: '/maintenance-request', name: 'แจ้งซ่อม' },
];

const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

const openedMixin = (theme: Theme): CSSObject => ({
	width: drawerWidth,
	transition: theme.transitions.create('width', {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.enteringScreen,
	}),
	overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
	transition: theme.transitions.create('width', {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	overflowX: 'hidden',
	width: `calc(${theme.spacing(7)} + 1px)`,
	[theme.breakpoints.up('sm')]: {
		width: `calc(${theme.spacing(8)} + 1px)`,
	},
});

const DrawerHeader = styled('div')(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'flex-end',
	padding: theme.spacing(0, 1),
	// necessary for content to be below app bar
	...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
	open?: boolean;
}

const AppBar = styled(MuiAppBar, {
	shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme }) => ({
	zIndex: theme.zIndex.drawer + 1,
	transition: theme.transitions.create(['width', 'margin'], {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	variants: [
		{
			props: ({ open }) => open,
			style: {
				marginLeft: drawerWidth,
				width: `calc(100% - ${drawerWidth}px)`,
				transition: theme.transitions.create(['width', 'margin'], {
					easing: theme.transitions.easing.sharp,
					duration: theme.transitions.duration.enteringScreen,
				}),
			},
		},
	],
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
	({ theme }) => ({
		width: drawerWidth,
		flexShrink: 0,
		whiteSpace: 'nowrap',
		boxSizing: 'border-box',
		'& .MuiDrawer-paper': {
			border: 'none',
			backgroundColor: '#212121',
			color: '#fff',
		},
		variants: [
			{
				props: ({ open }) => open,
				style: {
					...openedMixin(theme),
					'& .MuiDrawer-paper': openedMixin(theme),
				},
			},
			{
				props: ({ open }) => !open,
				style: {
					...closedMixin(theme),
					'& .MuiDrawer-paper': closedMixin(theme),
				},
			},
		],
	}),
);

const WindowsLayout: React.FC = () => {
	const [fname, setFname] = useState("พูลทรัพย์");
	const [lname, setLname] = useState("นานาวัน");


	const theme = useTheme();
	const [open, setOpen] = React.useState(false);

	const location = useLocation();

	const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

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

	return (
		<Box sx={{ display: 'flex' }}>
			<CssBaseline />
			<AppBar position="fixed" open={open} sx={{bgcolor: 'secondary.main', color: 'text.primary'}}>
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
						<img src="/images/logo.png" alt="" style={{height: '30px'}} />
					</Box>
					<Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex', gap: '10px', justifyContent: 'center' } }}>
						{pages.map((page) => {
							return (
								<Link to={page.path} key={page.name}>
									<Button
										// onClick={handleCloseNavMenu}
										sx={{
											my: 2,
											display: 'block',
										}}
										variant={location.pathname === page.path ? 'contained' : 'text'}
									>
										{page.name}
									</Button>
								</Link>
							)
						})}
					</Box>
					<Typography >{fname}</Typography>
					<Box sx={{ flexGrow: 0, flexDirection: 'column', ml: '10px' }}>
						<Tooltip title="Open settings">
							<IconButton onClick={handleOpenUserMenu} sx={{ p: 0, border: `3px solid ${theme.palette.primary.main}`,  }}>
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
					<IconButton onClick={handleDrawerClose} sx={{color: 'text.secondary'}}>
						{theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
					</IconButton>
				</DrawerHeader>
				<List>
					{['แดชบอร์ด', 'รายการแจ้งซ่อม', 'มอบหมายงานซ่อม', 'จัดการผู้ใช้งาน'].map((text, index) => (
						<ListItem key={text} disablePadding sx={{ display: 'block' }}>
							<ListItemButton
								sx={[
									{
										minHeight: 48,
										px: 2.5,
										
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
									{index % 2 === 0 ? <InboxIcon sx={{color: 'text.secondary'}}/> : <MailIcon sx={{color: 'text.secondary'}}/>}
								</ListItemIcon>
								<ListItemText
									primary={text}
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
						</ListItem>
					))}
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
