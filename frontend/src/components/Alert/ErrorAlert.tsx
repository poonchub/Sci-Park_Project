import React, { useEffect } from 'react';
import { Alert } from '@mui/material';
import AlertTitle from '@mui/material/AlertTitle';

interface ErrorAlertProps {
  message: string;
  onClose: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();  // Close the alert after 5 seconds
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Alert
      severity="error"
      onClose={onClose}
      sx={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '50%',
        zIndex: 10,
        backgroundColor: '#f8d7da',  // Light red background for error
        border: '1px solid #dc3545', // Red border
        borderRadius: '10px',         // Rounded corners
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Shadow effect
      }}
    >
      <AlertTitle>Error</AlertTitle>
      {message}
    </Alert>
  );
};

export default ErrorAlert;
