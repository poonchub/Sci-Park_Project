import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';

import { GetUserById } from '../services/http';
import { UserInterface } from '../interfaces/IUser';

import Footer from '../components/Footer/Footer';
import AccountBoxOutlinedIcon from '@mui/icons-material/AccountBoxOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import LayersIcon from '@mui/icons-material/Layers';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';

import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import { AssignmentIndOutlined, FactCheckOutlined, HandymanOutlined, HomeOutlined, HomeRepairServiceOutlined, MeetingRoomOutlined } from '@mui/icons-material';


import {
	Role
} from '../constants/navigationConfig';

const NAVIGATION: Navigation = [
	{
		kind: 'header',
		title: 'Main items',
	},
	{
		segment: 'home',
		title: 'Home',
		icon: <HomeOutlined />,
	},
	{
		segment: 'booking-room',
		title: 'Booking Room',
		icon: <MeetingRoomOutlined />,
	},
	{
		segment: 'maintenance/my-maintenance-request',
		title: 'Maintenance Request',
		icon: <AssignmentIndOutlined />,
	},
	{
		kind: 'divider',
	},
	{
		kind: 'header',
		title: 'Management',
	},
	{
		segment: 'maintenance',
		title: 'Maintenance',
		icon: <HandymanOutlined />,
		children: [
			{
				segment: 'dashboard',
				title: 'Dashboard',
				icon: <DashboardOutlinedIcon />,
			},
			{
				segment: 'all-maintenance-request',
				title: 'All Request',
				icon: <FactCheckOutlined />,
			},
			{
				segment: 'accept-work',
				title: 'My Work',
				icon: <HomeRepairServiceOutlined />,
			},
		],
	},
	{
		segment: 'user',
		title: 'User',
		icon: <AccountBoxOutlinedIcon />,
		children: [
			{
				segment: 'manage-user',
				title: 'Manage User',
				icon: <ManageAccountsOutlinedIcon />,
			},
			{
				segment: 'add-user',
				title: 'Add User',
				icon: <PersonAddAltOutlinedIcon />,
			},
			{
				segment: 'traffic',
				title: 'Traffic',
				icon: <DescriptionIcon />,
			},
		],
	},
	{
		segment: 'integrations',
		title: 'Integrations',
		icon: <LayersIcon />,
	},
	{
		segment: 'room',
		title: 'Room',
		icon: <BarChartIcon />,
		children: [
			{
				segment: 'manage-room',
				title: 'Manage Room',
				icon: <DescriptionIcon />,
			},
			{
				segment: 'traffic',
				title: 'Traffic',
				icon: <DescriptionIcon />,
			},
		],
	},
	{
		segment: 'integrations',
		title: 'Integrations',
		icon: <LayersIcon />,
	},
	{
		kind: 'divider',
	},
];

import { useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, DashboardLayout, Navigation, NavigationItem, Router, Session } from '@toolpad/core';
import { Container, useTheme } from '@mui/material';

function useToolpadRouter(): Router {
	const location = useLocation();
	const navigate = useNavigate();

	return React.useMemo(() => {
		return {
			pathname: location.pathname,
			searchParams: new URLSearchParams(location.search),
			navigate: (path: string | URL) => navigate(String(path)),
		};
	}, [location, navigate]);
}

function hasSegment(item: NavigationItem): item is { segment: string } {
	return 'segment' in item;
}

const accessibleSegments: Record<Role, string[]> = {
	Admin: [
		'home',
		'dashboard',
		'booking-room',
		'maintenance',
		'maintenance/my-maintenance-request',
		'room',
		'user',

		'all-maintenance-request',
		'manage-room',
		'manage-user',
		'add-user',

	],
	Manager: [
		'home',
		'dashboard',
		'booking-room',
		'maintenance',
		'maintenance/my-maintenance-request',

		'all-maintenance-request',
	],
	Operator: [
		'home',
		'booking-room',
		'maintenance',
		'maintenance/my-maintenance-request',
		'room',

		'accept-work'],
	User: [
		'booking-room',
		'maintenance/my-maintenance-request',
	],
};

function isAllowed(segment: string, role: Role): boolean {
	const allowed = accessibleSegments[role] || [];
	return allowed.includes('*') || allowed.includes(segment);
}

function getNavigationByRole(role: Role): Navigation {
	return NAVIGATION.filter((item) => {
		if (item.kind === 'header' || item.kind === 'divider') return true;
		return hasSegment(item) && isAllowed(item.segment || '', role);
	}).map((item) => {
		if ('children' in item && Array.isArray(item.children)) {
			const filteredChildren = item.children.filter((child) =>
				hasSegment(child) && isAllowed(child.segment || '', role)
			);
			return { ...item, children: filteredChildren };
		}
		return item;
	});
}

const WindowsLayout: React.FC = (props: any) => {
	const { window } = props;
	const theme = useTheme();

	const router = useToolpadRouter();

	const demoWindow = window ? window() : undefined;

	const [user, setUser] = useState<UserInterface>();

	// Role of current user (from localStorage)
	const role = (localStorage.getItem("role") || 'Guest') as Role;
	const userId = localStorage.getItem("userId");

	// Fetch user data by ID (stored in localStorage)
	const getUser = async () => {
		try {
			const res = await GetUserById(Number(userId));
			if (res) {
				setUser(res);
			}
		} catch (error) {
			console.error("Error fetching user:", error);
		}
	};

	// Fetch user info on first load
	useEffect(() => {
		getUser();
	}, []);

	const navigation = getNavigationByRole(role);
	const navigateUrl = useNavigate();

	const [session, setSession] = React.useState<Session | null>(null);

	const authentication = React.useMemo(() => {
		return {
			signIn: () => {
				if (user) {
					setSession({
						user: {
							name: `${user.FirstName} ${user.LastName}`,
							email: user.Email,
							image: user.ProfilePath,
						},
					});
				} else {
					navigateUrl("/login");
				}
			},
			signOut: () => {
				setSession(null);
				localStorage.clear()
				localStorage.setItem("isLogin", "false");
				navigateUrl("/login");
			},
		};
	}, [user]);

	useEffect(() => {
		if (user) {
			setSession({
				user: {
					name: `${user.FirstName} ${user.LastName}`,
					email: user.Email,
					image: user.ProfilePath,
				},
			});
		}
	}, [user]);

	return (
		<AppProvider
			navigation={navigation}
			router={router}
			theme={theme}
			window={demoWindow}
			authentication={authentication}
			session={session}
			branding={{
				logo: <img src="/images/RSP2.png" alt="MUI logo" />,
				title: 'RSP Northeast 2',
				homeUrl: '/home',
			}}

		>
			<DashboardLayout
				sidebarExpandedWidth={260}
			>
				{/* Main content area */}
				<Container
					maxWidth={false}
					sx={{ p: '0px !important', overflow: 'auto' }}
					className='content-box'
				>
					<Box
						sx={{
							minHeight: '95vh',
							p: 4,
						}}
					>
						<Outlet />
					</Box>
					<Footer />
				</Container>
			</DashboardLayout>
		</AppProvider>
	);
};

export default WindowsLayout;