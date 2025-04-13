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

// กำหนดไอคอนต่าง ๆ ไว้ที่นี่
const ICONS = [
	<DashboardOutlinedIcon sx={{ color: 'text.secondary' }} />,
	<ChecklistOutlinedIcon sx={{ color: 'text.secondary' }} />,
	<HandymanOutlinedIcon sx={{ color: 'text.secondary' }} />,
	<ManageAccountsOutlinedIcon sx={{ color: 'text.secondary' }} />
];

interface SideDrawerProps {
	open: boolean;
	onClose: () => void;
	drawerItems: { path: string; name: string }[];
	currentPath: string;
}

const DrawerHeader = styled('div')(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'flex-end',
	padding: theme.spacing(0, 1),
	...theme.mixins.toolbar,
}));

export default function SideDrawer({ open, onClose, drawerItems, currentPath }: SideDrawerProps) {
	const theme = useTheme();

	return (
		<Drawer variant="permanent" open={open} sx={{ zIndex: 97 }}>
			<DrawerHeader>
				<IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
					{theme.direction === 'rtl' ? <ChevronRight /> : <ChevronLeft />}
				</IconButton>
			</DrawerHeader>
			<List>
				{drawerItems.map((page, index) => (
					<ListItem key={page.path} disablePadding sx={{ display: 'block' }}>
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
								<ListItemIcon sx={{ mr: open ? 3 : 'auto', justifyContent: 'center' }}>
									{ICONS[index] || <ManageAccountsOutlinedIcon sx={{ color: 'text.secondary' }} />}
								</ListItemIcon>
								<ListItemText primary={page.name} sx={{ opacity: open ? 1 : 0, color: '#fff' }} />
							</ListItemButton>
						</Link>
					</ListItem>
				))}
			</List>
		</Drawer>
	);
}