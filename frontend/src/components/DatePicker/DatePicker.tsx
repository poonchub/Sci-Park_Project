import { styled } from "@mui/material";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers";

export const DatePicker = styled(MuiDatePicker, {
    shouldForwardProp: (prop) => prop !== "readOnly",
})(({ readOnly }) => ({
    "& .MuiInputBase-root": {
        borderRadius: "10px",
        height: "45px",
        border: "none",
        width: "100%",
        ...(readOnly && {
            pointerEvents: "none",
            cursor: "default",
            backgroundColor: "rgb(235, 235, 235, 0.3)",
        }),
    },
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgb(109, 110, 112, 0.4)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#F26522 !important",
        ...(readOnly && { borderColor: "rgb(109, 110, 112, 0.4) !important" }), // ไม่เปลี่ยนสีเวลา hover
    },
    "& .MuiInputLabel-root": {
        top: "-4px",
    },
    "& .MuiInputLabel-shrink": {
        top: "2px",
    },
}));
