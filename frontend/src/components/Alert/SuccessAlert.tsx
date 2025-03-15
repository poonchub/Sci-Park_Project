import React, { useEffect } from 'react';
import { Alert } from '@mui/material';
import AlertTitle from '@mui/material/AlertTitle';

interface SuccessAlertProps {
  message: string;
  onClose: () => void;
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ message, onClose }) => {
  useEffect(() => {
    // Set timeout to automatically close the alert after 5 seconds
    const timer = setTimeout(() => {
      onClose();  // Close the alert after 5 seconds
    }, 5000);

    // Cleanup the timeout when the component unmounts
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Alert
      severity="success"
      onClose={onClose}
      sx={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '50%',
        zIndex: 99,
        backgroundColor: '#d4edda',  // Light green background for success
        border: '1px solid #28a745', // Darker green border
        borderRadius: '10px',         // Rounded corners
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Shadow effect
      }}
    >
      <AlertTitle>Success</AlertTitle>
      {message}
    </Alert>
  );
};

export default SuccessAlert;
