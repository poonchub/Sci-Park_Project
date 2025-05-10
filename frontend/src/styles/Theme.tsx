import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    colorSchemes: { light: true, dark: true },
	cssVariables: {
		colorSchemeSelector: 'class',
	},
	breakpoints: {
		values: {
			xs: 0,
			sm: 600,
            sm650: 650,
			md: 900,
            md1000: 1000,
			lg: 1200,
			xl: 1536,
		},
	},
    palette: {
        // สีหลักของระบบ
        primary: {
            main: "#F26522", // sut-orange
            contrastText: "#FFFFFF",
            dark: "rgb(194, 78, 25)"
        },
        secondary: {
            main: "#FFFFFF", // sut-gold
            contrastText: "",
        },
        background: {
            primary: '#fcfcfc',
            secondary: '#212121'
        },
        text: {
            primary: "#000000", // text-primary
            secondary: "#6D6E70", // text-secondary,
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
        divider: "#e0e0e0", // step-border

        customBlue: '#08aff1',
    },
    typography: {
        fontFamily: '"Noto Sans Thai", sans-serif',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    padding: "4px 12px",
                    textTransform: "none",
                    fontSize: 14,
                    margin: 'none',
                    minHeight: '32.5px',
                    lineHeight: 1.4,
                    fontWeight: 600,
                    "&:hover": {
                        boxShadow: "0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 2px 4px 1px rgba(0, 0, 0, 0.12)",
                        fontWeight: 600
                    },
                },
                text: {
                    color: "#000000",
                    textTransform: "none",
                },
                containedPrimary: {
                    backgroundColor: "#F26522",
                    boxShadow: 'none',
                    color: "#FFFFFF",
                    "&:hover": {
                        backgroundColor: "#F26522",
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
            variants: [
                {
                    props: { variant: 'containedBlue' },
                    style: {
                        backgroundColor: '#08aff1',
                        color: '#fff',
                    },
                },
                {
                    props: { variant: 'outlinedCancel' },
                    style: {
                        border: '1px solid #FF3B30',
                        color: '#FF3B30',
                        maxHeight: '37px',
                        '&:hover': {
                            backgroundColor: '#FF3B30',
                            color: '#fff',
                        },
                    },
                },
            ],
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
                    
                },
            },
        },
        MuiTypography: {
            variants: [
                {
                    props: { variant: 'textButtonClassic' },
                    style: {
                        fontSize: '14px',
                        fontWeight: 500,
                        marginLeft: 6,
                        lineHeight: 1.5
                    },
                },
            ],
        },
    },
});

export default theme;
