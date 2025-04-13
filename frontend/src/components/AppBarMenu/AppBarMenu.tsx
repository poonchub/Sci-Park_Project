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

interface AppBarMenuProps {
	open: boolean;
	onDrawerOpen: () => void;
	sections: { key: string; path: string; name: string }[];
	user?: UserInterface;
}

const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

export default function AppBarMenu({ open, onDrawerOpen, sections, user }: AppBarMenuProps) {
	const location = useLocation();
	const theme = useTheme();
	const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

	const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorElUser(event.currentTarget);
	};

	const handleCloseUserMenu = () => {
		setAnchorElUser(null);
	};

	return (
		<AppBar position="fixed" open={open} sx={{ bgcolor: 'secondary.main', color: 'text.primary', zIndex: 98 }}>
			<Toolbar>
				<IconButton
					color="inherit"
					aria-label="open drawer"
					onClick={onDrawerOpen}
					edge="start"
					sx={[
						{ marginRight: 5 },
						open && { display: 'none' },
					]}
				>
					<MenuIcon />
				</IconButton>
				<Box>
					<img src="/images/logo.png" alt="logo" style={{ height: '30px' }} />
				</Box>
				<Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex', gap: '10px', justifyContent: 'center' } }}>
					{sections.map((page) => {
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
				<Typography>{`${user?.FirstName} ${user?.LastName}`}</Typography>
				<Box sx={{ flexGrow: 0, ml: '10px' }}>
					<Tooltip title="Open settings">
						<IconButton onClick={handleOpenUserMenu} sx={{ p: 0, border: `3px solid ${theme.palette.primary.main}` }}>
							<Avatar alt="Profile" src="/images/test-profile.jpg" />
						</IconButton>
					</Tooltip>
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
