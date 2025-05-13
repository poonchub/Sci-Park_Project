import { styled } from "@mui/material";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers";

// Styled DatePicker with custom appearance
export const DatePicker = styled(MuiDatePicker)(() => ({
    // Input styling
    "& .MuiInputBase-root": {
        borderRadius: "10px",         // Rounded corners
        height: '45px',
        border: "none",
        width: '100%'
    },
    // Border color (default and on hover)
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgb(109, 110, 112, 0.4)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#F26522 !important", // Highlight on hover
    },
}));