import '@mui/material/Button';

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
  