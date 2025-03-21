import React, { useEffect, useState } from 'react';
import { Alert } from '@mui/material';
import AlertTitle from '@mui/material/AlertTitle';

interface ErrorAlertProps {
  message: string;
  onClose: () => void;
  index: number; // Index for dynamic top positioning
  totalAlerts: number; // Total number of active alerts
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose, index, totalAlerts }) => {
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false); // State to track hover
  const [_intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null); // Store interval ID to clear it

  // Update progress over time when not hovered
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (!isHovered) {
      // Start the interval when not hovered
      timer = setInterval(() => {
        setProgress(prevProgress => {
          const newProgress = prevProgress - 1; // Decrease by 1% every 60ms
          if (newProgress <= 0) {
            if (timer) clearInterval(timer); // Stop when the progress is 0
            onClose(); // Trigger the onClose once progress is done
          }
          return newProgress;
        });
      }, 60); // Update every 60ms for smoother progress
      setIntervalId(timer); // Store the interval ID to clear later
    } else if (timer) {
      clearInterval(timer); // Stop the interval when hovered
    }

    // Cleanup on unmount or when hover state changes
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isHovered, onClose]);

  // To handle closing the alert and triggering the slide-out animation
  const handleClose = () => {
    document.querySelector('.MuiAlert-root')?.classList.add('slideOutToRight');
    setTimeout(onClose, 500); // Call onClose after animation ends (500ms)
  };

  return (
    <Alert
      severity="error"
      onClose={handleClose}  // Use handleClose here instead of directly passing onClose
      sx={{
        position: 'absolute',
        top: `${20 + index * 100}px`, // Dynamic top position based on index
        left: '100%', // Start from the right side of the screen
        transform: 'translateX(-50%)',
        width: '35%',
        zIndex: 1000 + totalAlerts - index, // Dynamic zIndex to ensure the last alert is on top
        backgroundColor: 'white', // Background color
        color: 'black', // Text color
        padding: '12px',
        opacity: 0, // Start with zero opacity (hidden)
        transition: 'opacity 0.5s ease-in, transform 0.5s ease-out', // Fade and slide transition
        animation: 'fadeInFromRight 0.5s ease-out forwards', // Fade-in and slide-in animation
        '&::before': { // Progress bar
          content: '""',
          display: 'block',
          width: `${progress}%`, // Progress decreases over time
          height: '4px',
          backgroundColor: '#f02c2c', // Red for error
          position: 'absolute',
          top: 0,
          left: 0,
          transition: 'width 0.06s linear', // Smooth transition for the width change
        },
        '& .MuiAlert-icon': { // Red icon color
          color: '#f02c2c',
        },
        '@keyframes fadeInFromRight': {
          '0%': {
            transform: 'translateX(0%)', // Start from the right side
            opacity: 0, // Fully transparent
          },
          '100%': {
            transform: 'translateX(-200%)', // Move to the center
            opacity: 1, // Fully opaque
          },
        },
        '@keyframes slideOutToRight': {
          '0%': {
            transform: 'translateX(-200%)', // Start at the center
            opacity: 1, // Fully visible
          },
          '100%': {
            transform: 'translateX(0%)', // Move to the right side
            opacity: 0, // Fade out
          },
        },
        '& .MuiAlert-action .MuiButtonBase-root': {
          // Apply animation to the close button when alert is being closed
          transition: 'transform 0.3s ease-in-out',
        },
      }}
      onMouseEnter={() => setIsHovered(true)}  // Set hover state to true
      onMouseLeave={() => setIsHovered(false)} // Set hover state to false
    >
      <AlertTitle style={{ color: "black", fontWeight: "bold" }}>Error</AlertTitle>
      {message}
    </Alert>
  );
};

export default ErrorAlert;
