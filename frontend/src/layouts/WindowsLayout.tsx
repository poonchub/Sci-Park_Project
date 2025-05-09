import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';

import { GetUserById } from '../services/http';
import { UserInterface } from '../interfaces/IUser';

import AppBarMenu from '../components/AppBarMenu/AppBarMenu';
import SideDrawer from '../components/SideDrawer/SideDrawer';
import Footer from '../components/Footer/Footer';

import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import LayersIcon from '@mui/icons-material/Layers';

import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import { ArticleOutlined, ChevronLeft, ChevronRight, HomeOutlined } from '@mui/icons-material';


import {
	SECTIONS,
	getDrawerItemsBySection,
	getCurrentSectionKey,
	Role
} from '../constants/navigationConfig';

import { drawerWidth } from '../components/Drawer/Drawer';

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
		icon: <HomeOutlined />,
	},
	{
		segment: 'maintenance',
		title: 'Maintenance',
		icon: <BarChartIcon />,
		children: [
			{
				segment: 'dashboard',
				title: 'Dashboard',
				icon: <DashboardOutlinedIcon />,
			},
			{
				segment: 'all-maintenance-request',
				title: 'All Request',
				icon: <ChecklistOutlinedIcon />,
			},
			{
				segment: 'my-maintenance-request',
				title: 'My Request',
				icon: <ArticleOutlined />,
			},
			{
				segment: 'accept-work',
				title: 'My Work',
				icon: <ArticleOutlined />,
			},
		],
	},
	{
		kind: 'divider',
	},
	{
		kind: 'header',
		title: 'Management',
	},
	{
		segment: 'reports',
		title: 'Reports',
		icon: <BarChartIcon />,
		children: [
			{
				segment: 'sales',
				title: 'Sales',
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
];

import { useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, DashboardLayout, Navigation, NavigationItem, Router, Session } from '@toolpad/core';
import theme from '../styles/Theme';

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

		'all-maintenance-request',
		'my-maintenance-request'
	],
	Manager: [
		'home',
		'dashboard',
		'booking-room',
		'maintenance',

		'all-maintenance-request',
		'my-maintenance-request'
	],
	Operator: [
		'home',
		'booking-room',
		'maintenance',

		'my-maintenance-request',
		'accept-work'],
	User: [
		'booking-room',
		'maintenance',

		'my-maintenance-request'
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
				console.log("User:", res);
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
				}
			},
			signOut: () => {
				setSession(null);
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
			<DashboardLayout>
				{/* Main content area */}
				<Box
					sx={{
						p: 3,
						// minHeight: '100%',
					}}
				>
					<Outlet />
				</Box>
				<Footer/>
			</DashboardLayout>
		</AppProvider>
	);
};

export default WindowsLayout;