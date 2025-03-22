import { styled } from "@mui/material";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers";

export const DatePicker = styled(MuiDatePicker)(() => ({
    "& .MuiInputBase-root": {
        backgroundColor: "#fff", // เปลี่ยนสีพื้นหลังของ input
        borderRadius: "10px",
        height: '45px',
        border: "none",
        width: '100%'
    },
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgb(109, 110, 112, 0.4)", // เปลี่ยนสีเส้นขอบ
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#F26522 !important", // เปลี่ยนสีขอบเมื่อ hover
    },
}));