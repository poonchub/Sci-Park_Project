import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        // สีหลักของระบบ
        primary: {
            main: "#F26522", // sut-orange
            light: "rgb(255, 238, 227)",
            contrastText: "#FFFFFF",
        },
        secondary: {
            main: "#FFFFFF", // sut-gold
            contrastText: "",
        },
        background: {
            default: "#fcfcfc", // background-color
            paper: "#FFFFFF",
        },
        text: {
            primary: "#000000", // text-primary
            secondary: "#FFFFFF", // text-secondary,
        },
        info: {
            main: "#08aff1", // text-link
        },
        warning: {
            main: "#A67436", // step-active
        },
        error: {
            main: "#FF3B30", // button-cancel-bg
        },
        success: {
            main: "#F26522", // step-border-success
        },
        grey: {
            500: "#6D6E70", // sut-gray
        },
        divider: "#6D6E70", // step-border
    },
    typography: {
        fontFamily: '"Noto Sans Thai", sans-serif',        
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    padding: "4px 16px",
                    textTransform: "none",
                },
                text: {
                    color: "#000000",
                    textTransform: "none",
                    "&:hover": {
                        backgroundColor: "#F26522",
                        color: "#FFFFFF",
                    },
                },
                containedPrimary: {
                    backgroundColor: "#F26522",
                    color: "#FFFFFF",
                    "&:hover": {
                        backgroundColor: "#dd591c",
                    },
                },
                outlined: {
                    borderColor: "#08aff1",
                    color: "#08aff1",
                    "&:hover": {
                        backgroundColor: "#08aff1",
                        color: "#FFFFFF",
                    },
                },
            },
        },
        MuiInputBase: {
            styleOverrides: {
                root: {
                    border: "1px solid rgba(109, 110, 112, 0.4)", // input-border
                    "&:focus": {
                        borderColor: "#08aff1", // input-focus
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: "rgba(0, 0, 0, 0.25) 0px 2px 4px", // shadow-light
                },
            },
        },
    },
});

export default theme;
