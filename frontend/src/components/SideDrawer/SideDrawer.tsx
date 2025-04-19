import {
	IconButton, List, ListItem, ListItemButton,
	ListItemIcon, ListItemText
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useTheme, styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import { Drawer } from '../Drawer/Drawer';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';

// Icons for each drawer item
const ICONS = [
	<DashboardOutlinedIcon sx={{ color: 'text.secondary' }} />,
	<ChecklistOutlinedIcon sx={{ color: 'text.secondary' }} />,
	<HandymanOutlinedIcon sx={{ color: 'text.secondary' }} />,
	<AssignmentIndOutlinedIcon sx={{ color: 'text.secondary' }} />,
	<ManageAccountsOutlinedIcon sx={{ color: 'text.secondary' }} />,
];

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
				{drawerItems.map((page, index) => (
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
								<ListItemIcon sx={{ mr: open ? 3 : 'auto', justifyContent: 'center' }}>
									{/* Dynamically render icons based on the item index */}
									{ICONS[index] || <ManageAccountsOutlinedIcon sx={{ color: 'text.secondary' }} />}
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