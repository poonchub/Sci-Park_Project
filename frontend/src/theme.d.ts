import '@mui/material/Button';
import '@mui/material/styles';

declare module '@mui/system' {
  interface BreakpointOverrides {
    mobileS: true;
    sm650: true;
    md1000: true;
  }
}

declare module '@mui/material/Button' {
    interface ButtonPropsVariantOverrides {
        containedBlue: true;
        containedCancel: true;
        containedWhite: true;
        outlinedCancel: true;
        outlinedGray: true;
    }
}

declare module "@mui/material/styles" {
    interface PaletteOptions {
        customBlue?: string
        customGreen?: string
    }

    interface TypeBackground {
        primary?: string;
        secondary?: string;
      }
}

declare module "@mui/material/Typography" {
    interface TypographyPropsVariantOverrides {
        textButtonClassic: true;
        titlePopup: true;
        titleConfirmPopup: true;
        titlePage: true;
    }
  }
  