import { styled } from "@mui/material";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';

// Extend MuiAppBarProps to include 'open' prop
interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const drawerWidth = 240;

// Styled AppBar with conditional styles based on 'open' prop
export const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open', // Avoid passing 'open' prop to DOM
})<AppBarProps>(({ theme }) => ({
    zIndex: theme.zIndex.drawer + 1, // Ensure it sits above the Drawer
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen, // Transition when closing
    }),

    // Conditional styling when Drawer is open
    variants: [
        {
            props: ({ open }) => open, // Check if 'open' is true
            style: {
                marginLeft: drawerWidth, // Shift AppBar when Drawer is open
                width: `calc(100% - ${drawerWidth}px)`, // Adjust width accordingly
                transition: theme.transitions.create(['width', 'margin'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen, // Transition when opening
                }),
            },
        },
    ],
}));
