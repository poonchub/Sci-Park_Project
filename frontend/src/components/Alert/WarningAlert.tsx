import React, { useEffect } from 'react';
import { Alert } from '@mui/material';
import AlertTitle from '@mui/material/AlertTitle';

interface WarningAlertProps {
  message: string;
  onClose: () => void;
}

const WarningAlert: React.FC<WarningAlertProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();  // Close the alert after 5 seconds
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Alert
      severity="warning"
      onClose={onClose}
      sx={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '50%',
        zIndex: 10,
        backgroundColor: '#fff3cd',  // Light yellow background for warning
        border: '1px solid #ffc107', // Yellow border
        borderRadius: '10px',         // Rounded corners
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Shadow effect
      }}
    >
      <AlertTitle>Warning</AlertTitle>
      {message}
    </Alert>
  );
};

export default WarningAlert;
