import {
	Avatar, Box, Button, IconButton, Menu, MenuItem,
	Toolbar, Tooltip, Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { UserInterface } from '../../interfaces/IUser';
import { AppBar } from '../AppBar/AppBar';
import { getCurrentSectionKey } from '../../constants/navigationConfig';
import { role } from '../../routes';

// Define types for the props of the AppBarMenu component
interface AppBarMenuProps {
	open: boolean; // Determines if the drawer is open
	onDrawerOpen: () => void; // Function to trigger the opening of the drawer
	sections: { key: string; path: string; name: string }[]; // Array of section data with key, path, and name
	user?: UserInterface; // Optional user data
}

// Define settings for the user profile menu
const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

export default function AppBarMenu({
	open,
	onDrawerOpen,
	sections,
	user
}: AppBarMenuProps) {
	// Get the current location to determine the active page
	const location = useLocation();
	// Get the current theme for styling
	const theme = useTheme();
	// State for controlling the user menu visibility
	const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

	// Open the user menu when clicked
	const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorElUser(event.currentTarget);
	};

	// Close the user menu
	const handleCloseUserMenu = () => {
		setAnchorElUser(null);
	};

	return (
		<AppBar position="fixed" open={open} sx={{ bgcolor: 'secondary.main', color: 'text.primary', zIndex: 98 }}>
			<Toolbar>
				{/* Icon button to open the drawer */}
				<IconButton
					color="inherit"
					aria-label="open drawer"
					onClick={onDrawerOpen}
					edge="start"
					sx={[{ marginRight: 5 }, open && { display: 'none' }]} // Hide when the drawer is open
				>
					<MenuIcon />
				</IconButton>

				{/* Logo */}
				<Box>
					<img src="/images/RSP2.png" alt="logo" style={{ height: '30px' }} />
					
				</Box> <h4>&nbsp;RSP Northeast 2</h4>
			
				{/* Title */}
				{/* Navigation buttons for each section */}
				<Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex', gap: '10px', justifyContent: 'center' } }}>
					{sections.map((page) => {
						// Check if the current page matches the section key to determine the active state
						const isActive = getCurrentSectionKey(location.pathname) === page.key;
						return (
							<Link to={page.path} key={page.key}>
								<Button
									sx={{ my: 2, display: 'block', borderRadius: 10 }}
									variant={isActive ? 'contained' : 'text'}
								>
									{page.name}
								</Button>
							</Link>
						);
					})}
				</Box>

				{/* User's full name */}
				<Box sx={{ textAlign: 'end' }}>
					<Typography>{`${user?.FirstName} ${user?.LastName}`}</Typography>
					<Typography sx={{ fontSize: 12, color: 'gray' }}>{`${role}`}</Typography>
				</Box>
				
				{/* User profile avatar and settings menu */}
				<Box sx={{ flexGrow: 0, ml: '10px' }}>
					<Tooltip title="Open settings">
						{/* Avatar icon button */}
						<IconButton onClick={handleOpenUserMenu} sx={{ p: 0, border: `3px solid ${theme.palette.primary.main}` }}>
							<Avatar alt="Profile" src="/images/test-profile.jpg" />
						</IconButton>
					</Tooltip>

					{/* User menu with settings options */}
					<Menu
						sx={{ mt: '45px' }}
						anchorEl={anchorElUser}
						anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
						transformOrigin={{ vertical: 'top', horizontal: 'right' }}
						open={Boolean(anchorElUser)}
						onClose={handleCloseUserMenu}
					>
						{settings.map((setting) => (
							<MenuItem key={setting} onClick={handleCloseUserMenu}>
								<Typography textAlign="center">{setting}</Typography>
							</MenuItem>
						))}
					</Menu>
				</Box>
			</Toolbar>
		</AppBar>
	);
}  