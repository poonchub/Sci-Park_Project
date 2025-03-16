import React, { useEffect } from 'react';
import { Alert } from '@mui/material';
import AlertTitle from '@mui/material/AlertTitle';

interface InfoAlertProps {
  message: string;
  onClose: () => void;
}

const InfoAlert: React.FC<InfoAlertProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();  // Close the alert after 5 seconds
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Alert
      severity="info"
      onClose={onClose}
      sx={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '50%',
        zIndex: 1000,
        backgroundColor: '#e7f3fe',  // Light blue background for info
        border: '1px solid #007bff', // Blue border
        borderRadius: '10px',         // Rounded corners
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Shadow effect
      }}
    >
      <AlertTitle>Info</AlertTitle>
      {message}
    </Alert>
  );
};

export default InfoAlert;
