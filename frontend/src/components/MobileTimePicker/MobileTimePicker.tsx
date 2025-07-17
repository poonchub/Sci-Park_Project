import { MobileTimePicker as MuiMobileTimePicker } from '@mui/x-date-pickers';
import { styled } from '@mui/material/styles';

// Styled MobileTimePicker
export const MobileTimePicker = styled(MuiMobileTimePicker)(() => ({
    "& .MuiInputBase-root": {
        borderRadius: "10px",
        height: '45px',
        border: "none",
        width: '100%',
    },
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgb(109, 110, 112, 0.4)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#F26522 !important",
    },
    "& .MuiInputLabel-root": {
        top: "-4px",
    },
    "& .MuiInputLabel-shrink": {
        top: "2px",
    },
}));