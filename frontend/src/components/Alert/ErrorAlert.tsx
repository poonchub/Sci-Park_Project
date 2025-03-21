import React, { useEffect } from 'react';
import { Alert } from '@mui/material';
import AlertTitle from '@mui/material/AlertTitle';

interface ErrorAlertProps {
  message: string;
  onClose: () => void;
  index: number; // Index for dynamic top positioning
  totalAlerts: number; // Total number of active alerts
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose, index, totalAlerts }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(); // Close the alert after 5 seconds
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Alert
      severity="error"
      onClose={onClose}
      sx={{
        position: 'absolute',
        top: `${20 + index * 100}px`, // Dynamic top position based on index
        left: '50%',
        transform: 'translateX(-50%)',
        width: '50%',
        zIndex: 1000 + totalAlerts - index, // Dynamic zIndex to ensure the last alert is on top
        backgroundColor: 'white', // Background color
        color: 'black', // Text color
        padding: '12px',
        '&::before': { // Red line at the top
          content: '""',
          display: 'block',
          width: '100%',
          height: '4px',
          backgroundColor: '#f02c2c',
          position: 'absolute',
          top: 0,
          left: 0,
        },
        '& .MuiAlert-icon': {
          color: '#f02c2c', // Red icon
        },
      }}
    >
      <AlertTitle style={{ color: "black", fontWeight: "bold" }}>Error</AlertTitle>
      {message}
    </Alert>
  );
};

export default ErrorAlert;
