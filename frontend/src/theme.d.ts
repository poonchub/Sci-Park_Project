import '@mui/material/Button';

declare module '@mui/material/Button' {
    interface ButtonPropsVariantOverrides {
        containedBlue: true;
        outlinedCancel: true;
    }
}

declare module "@mui/material/styles" {
    interface PaletteOptions {
        blue?: string
    }

    interface TypeBackground {
        primary?: string;
        secondary?: string;
      }
}