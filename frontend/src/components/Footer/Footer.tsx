import { Email, Facebook, Instagram, Twitter } from '@mui/icons-material';
import { Box, CardMedia, Divider, Grid, IconButton, List, ListItem, ListItemText, Tooltip, Typography } from '@mui/material';
import { Container } from '@mui/system';
import { FlaskConical } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { OrganizationInfoInterface } from '../../interfaces/IOrganizationInfo';
import { apiUrl, GetOrganizationInfo } from '../../services/http';

function Footer() {
    const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfoInterface>()

    const getOrganizationInfo = async () => {
        try {
            const res = await GetOrganizationInfo()
            if (res) {
                setOrganizationInfo(res)
            }
        } catch (error) {
            console.error("Error fetching organization info:", error);
        }
    }

    useEffect(() => {
        getOrganizationInfo()
    }, [])

    return (
        <Box sx={{
            bgcolor: 'background.secondary',
            color: 'text.secondary',
            py: 8,
            px: 5,
            zIndex: 99
        }}
        >
            <Container maxWidth={'xl'}>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 3,
                            gap: 2,
                            flexWrap: 'wrap'
                        }}>
                            <CardMedia
                                component="img"
                                image={`${apiUrl}/${organizationInfo?.LogoPath}?t=${Date.now()}`}
                                alt={`logo`}
                                sx={{
                                    width: 150,
                                    backgroundColor: "rgba(255, 255, 255, 1)",
                                    padding: 1,
                                    borderRadius: 1.5
                                }}
                            />
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {organizationInfo?.NameEN}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Main Features
                        </Typography>
                        <List dense disablePadding>
                            <ListItem
                                disableGutters
                                component={RouterLink}
                                to="/maintenance/my-maintenance-request"
                                sx={{
                                    color: 'text.secondary',
                                    '&:hover': {
                                        color: 'primary.main',
                                    },
                                }}
                            >
                                <ListItemText primary="Maintenance Request" />
                            </ListItem>
                            <ListItem
                                disableGutters
                                component={RouterLink}
                                to="/booking-room"
                                sx={{
                                    color: 'text.secondary',
                                    '&:hover': {
                                        color: 'primary.main',
                                    },
                                }}
                            >
                                <ListItemText primary="Meeting Room Booking" />
                            </ListItem>
                        </List>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                            About Us
                        </Typography>
                        <List dense disablePadding sx={{ color: 'text.secondary' }}>
                            <ListItem
                                disableGutters
                                component={RouterLink}
                                to="/about-developer"
                                sx={{
                                    color: 'text.secondary',
                                    '&:hover': {
                                        color: 'primary.main',
                                    },
                                }}
                            >
                                <ListItemText primary="Organization History" />
                            </ListItem>
                            <ListItem
                                disableGutters
                                component={RouterLink}
                                to="/about-developer"
                                sx={{
                                    color: 'text.secondary',
                                    '&:hover': {
                                        color: 'primary.main',
                                    },
                                }}
                            >
                                <ListItemText primary="Development Team" />
                            </ListItem>
                        </List>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Policy
                        </Typography>
                        <List dense disablePadding>
                            <ListItem disableGutters>
                                <ListItemText primary="Privacy Policy" />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemText primary="Terms of Use" />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemText primary="How to Use the System" />
                            </ListItem>
                        </List>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Contact Us
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {organizationInfo?.Address}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {`Phone: ${organizationInfo?.Phone}`}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            {/* Social Media Icons */}
                            <Tooltip title={organizationInfo?.Email}>
                                <a href={`mailto:${organizationInfo?.Email}`}>
                                    <IconButton
                                        size="small"
                                        sx={{
                                            bgcolor: "primary.main",
                                            color: "white",
                                        }}
                                    >
                                        <Email />
                                    </IconButton>
                                </a>
                            </Tooltip>
                            <Tooltip title={organizationInfo?.FacebookUrl}>
                                <a
                                    href={organizationInfo?.FacebookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1"
                                >
                                    <IconButton
                                        size="small"
                                        sx={{
                                            bgcolor: "primary.main",
                                            color: "white",
                                        }}
                                    >
                                        <Facebook />
                                    </IconButton>
                                </a>
                            </Tooltip>
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ mt: 4, mb: 4 }} />

                <Typography variant="body2" color="text.secondary" align="center">
                    © {new Date().getFullYear()} Scipark. All rights reserved.
                </Typography>
            </Container>
        </Box>
    )
}
export default Footer;