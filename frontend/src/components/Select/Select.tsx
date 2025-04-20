import { styled } from "@mui/material";
import { Select as MuiSelect } from "@mui/material";

export const Select = styled(MuiSelect)(() => ({
    backgroundColor: "#fff",
    borderRadius: "10px",
    border: '1px',
    textAlign: 'center',
    height: '45px',
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgb(109, 110, 112, 0.4)", // สีขอบปกติ
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#F26522", // สีขอบเมื่อ hover
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#F26522", // สีขอบเมื่อ focused
    },
}));