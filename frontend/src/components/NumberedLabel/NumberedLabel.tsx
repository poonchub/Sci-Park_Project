import React from 'react';
import { Box } from '@mui/material';

interface NumberedLabelProps {
  number: number;
  size?: number;
}

const NumberedLabel: React.FC<NumberedLabelProps> = ({ number, size = 24 }) => {
  return (
    <Box
      sx={{
        bgcolor: 'primary.main',
        borderRadius: 4,
        padding: '4px 8px',
        fontSize: 16,
        fontWeight: 600,
        color: '#fff',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {number}
    </Box>
  );
};

export default NumberedLabel;
