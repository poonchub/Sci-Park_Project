import { styled } from "@mui/material";
import { Select as MuiSelect } from "@mui/material";

// Styled Select component with custom border and focus effects
export const Select = styled(MuiSelect)(() => ({
    borderRadius: "10px",
    border: '1px',
    textAlign: 'center',
    height: '45px',
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgb(109, 110, 112, 0.4)",
    },
    // Border color on hover
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#F26522",
    },
    // Border color when focused
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#F26522",
    },
}));
