import { Facebook, Instagram, Twitter } from '@mui/icons-material';
import { Box, Divider, Grid, IconButton, List, ListItem, ListItemText, Typography } from '@mui/material';
import { Container } from '@mui/system';
import { FlaskConical } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

function Footer() {
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
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <FlaskConical size={24} />
                            <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                                SCIPARK
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            A leading science and technology center, dedicated to creating innovation and supporting efficient work.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            {/* Social Media Icons */}
                            <IconButton size="small" sx={{ bgcolor: 'primary.main', color: 'white' }}>
                                <Facebook />
                            </IconButton>
                            <IconButton size="small" sx={{ bgcolor: 'primary.main', color: 'white' }}>
                                <Instagram />
                            </IconButton>
                            <IconButton size="small" sx={{ bgcolor: 'primary.main', color: 'white' }}>
                                <Twitter />
                            </IconButton>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2 }}>
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

                    <Grid size={{ xs: 6, md: 2 }}>
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

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                            นโยบาย
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

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Contact Us
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Science Center Building<br />
                            No. 123 Science Road<br />
                            Bangkok 10900<br />
                            Tel: 02-123-4567<br />
                            Email: contact@scipark.org
                        </Typography>
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