import '@mui/material/Button';
import '@mui/material/styles';

declare module '@mui/system' {
  interface BreakpointOverrides {
    sm650: true;
    md1000: true;
  }
}

declare module '@mui/material/Button' {
    interface ButtonPropsVariantOverrides {
        containedBlue: true;
        outlinedCancel: true;
    }
}

declare module "@mui/material/styles" {
    interface PaletteOptions {
        customBlue?: string
    }

    interface TypeBackground {
        primary?: string;
        secondary?: string;
      }
}

declare module "@mui/material/Typography" {
    interface TypographyPropsVariantOverrides {
        textButtonClassic: true;
    }
  }
  