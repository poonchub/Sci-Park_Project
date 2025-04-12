import { Box, Typography } from '@mui/material';

function Footer() {
    return (
        <Box sx={{ 
            bgcolor: 'background.secondary', 
            color: 'text.secondary',
            py: 3,
            px: 5,
            zIndex: 99
        }}
        >
            <Typography variant='h5'>Sci-Park</Typography>
            <Typography variant='body1'>000-000-0000</Typography>
            <Typography variant='body1'>test@gmail.com</Typography>
            <Typography variant='body1'>08.00 - 16.00</Typography>
        </Box>
    )
}
export default Footer;