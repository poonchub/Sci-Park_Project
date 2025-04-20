import { styled, TextField as MuiTextField } from "@mui/material";

export const TextField = styled(MuiTextField)(() => ({
    backgroundColor: "#fff",
    borderRadius: "10px",

    "& .custom-input": {
        padding: "10px",          // เพิ่ม padding ด้านใน
        height: "auto !important",
    },

    "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
        border: "none",
        height: '45px',

        "& fieldset": {
            borderColor: "rgba(109, 110, 112, 0.4)", // สีขอบปกติ
            borderWidth: "1px", // กำหนดความหนาของขอบ
        },
        "&:hover fieldset": {
            borderColor: "rgb(242, 101, 34)", // สีขอบเมื่อ hover
            
            borderWidth: "1px", // ขยายเมื่อ hover
        },
        "&.Mui-focused fieldset": {
            borderColor: "rgb(242, 101, 34)", // สีขอบเมื่อ focused
            borderWidth: "2px", // ขยายเมื่อ focused
        },
    },

}));
