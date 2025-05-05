import {
	IconButton, List, ListItem, ListItemButton,
	ListItemIcon, ListItemText
} from '@mui/material';
import { ArticleOutlined, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useTheme, styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import { Drawer } from '../Drawer/Drawer';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import AutoAwesomeMosaicOutlinedIcon from '@mui/icons-material/AutoAwesomeMosaicOutlined';
import DashboardCustomizeOutlinedIcon from '@mui/icons-material/DashboardCustomizeOutlined';

import { JSX } from 'react';

// Icons for each drawer item
const ICON_MAP: Record<string, JSX.Element> = {
	'/dashboard': <DashboardOutlinedIcon sx={{ color: 'text.secondary' }} />,
	'/all-maintenance-request': <ChecklistOutlinedIcon sx={{ color: 'text.secondary' }} />,
	'/my-maintenance-request': <ArticleOutlined sx={{ color: 'text.secondary' }} />,
	'/assign-work': <AssignmentIndOutlinedIcon sx={{ color: 'text.secondary' }} />,
	'/accept-work': <HandymanOutlinedIcon sx={{ color: 'text.secondary' }} />,
	'/manage-user': <ManageAccountsOutlinedIcon sx={{ color: 'text.secondary' }} />,
	'/add-user': <PersonAddAltOutlinedIcon sx={{ color: 'text.secondary' }} />,
	'/booking-room': <ChecklistOutlinedIcon sx={{ color: 'text.secondary' }} />,
	'/manage-room': <AutoAwesomeMosaicOutlinedIcon  sx={{ color: 'text.secondary' }} />,
	'/add-room': <DashboardCustomizeOutlinedIcon  sx={{ color: 'text.secondary' }} />,
};

// Props interface for the SideDrawer component
interface SideDrawerProps {
	open: boolean; // Drawer open state
	onClose: () => void; // Close drawer function
	drawerItems: { path: string; name: string }[]; // Items for the drawer
	currentPath: string; // Current active path for highlighting
}

// Styled component for drawer header (close button)
const DrawerHeader = styled('div')(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'flex-end',
	padding: theme.spacing(0, 1),
	...theme.mixins.toolbar,
}));

export default function SideDrawer({ open, onClose, drawerItems, currentPath }: SideDrawerProps) {
	const theme = useTheme(); // Access current theme for styling

	return (
		// Main Drawer component
		<Drawer variant="permanent" open={open} sx={{ zIndex: 97 }}>
			{/* Drawer header with the close button */}
			<DrawerHeader>
				<IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
					{/* Chevron icon to toggle drawer direction */}
					{theme.direction === 'rtl' ? <ChevronRight /> : <ChevronLeft />}
				</IconButton>
			</DrawerHeader>

			{/* List of drawer items */}
			<List>
				{drawerItems.map((page) => (
					// List item for each page link
					<ListItem key={page.path} disablePadding sx={{ display: 'block' }}>
						{/* Link component for navigation */}
						<Link to={page.path}>
							<ListItemButton
								sx={{
									minHeight: 48,
									px: 2.5,
									bgcolor: currentPath === page.path ? 'primary.main' : 'transparent',
									"&:hover": { bgcolor: 'primary.dark' },
									justifyContent: open ? 'initial' : 'center',
								}}
							>
								{/* Icon for each drawer item */}
								<ListItemIcon sx={{ mr: open ? 1 : 'auto', justifyContent: 'center' }}>
									{/* Dynamically render icons based on the item index */}
									{ICON_MAP[page.path] || <ManageAccountsOutlinedIcon sx={{ color: 'text.secondary' }} />}
								</ListItemIcon>

								{/* Text for each drawer item */}
								<ListItemText primary={page.name} sx={{ opacity: open ? 1 : 0, color: '#fff' }} />
							</ListItemButton>
						</Link>
					</ListItem>
				))}
			</List>
		</Drawer>
	);
}