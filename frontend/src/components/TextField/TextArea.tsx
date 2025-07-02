import { styled, TextField as MuiTextField } from "@mui/material";


// Custom styled TextField component
export const TextArea = styled(MuiTextField)(() => ({
    borderRadius: "10px",

    // Custom styling for input
    "& .custom-input": {
        padding: "10px",
        height: "auto !important",
    },

    // Outlined input root styles
    "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
        border: "none",
        minHeight: '45px',

        // Default border styling
        "& fieldset": {
            borderColor: "rgba(109, 110, 112, 0.4)",
            borderWidth: "1px",
        },

        // Hover effect on border
        "&:hover fieldset": {
            borderColor: "rgb(242, 101, 34)",
            
            borderWidth: "1px",
        },

        // Focus effect on border
        "&.Mui-focused fieldset": {
            borderColor: "rgb(242, 101, 34)",
            borderWidth: "2px",
        },
    },

}));
