import React, { useEffect, useState, useRef } from 'react';
import { Alert } from '@mui/material';
import AlertTitle from '@mui/material/AlertTitle';

interface WarningAlertProps {
  message: string;
  onClose: () => void;
  index: number; // Index for dynamic top positioning
  totalAlerts: number; // Total number of active alerts
}

const WarningAlert: React.FC<WarningAlertProps> = ({ message, onClose, index, totalAlerts }) => {
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false); // State to track hover
  const [_intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null); // Store interval ID to clear it
  const shouldCloseRef = useRef(false);

  // Update progress over time when not hovered
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (!isHovered) {
      // Start the interval when not hovered
      timer = setInterval(() => {
        setProgress(prevProgress => {
          const newProgress = prevProgress - 1; // Decrease by 2% every 60ms
          if (newProgress <= 0) {
            if (timer) clearInterval(timer); // Stop when the progress is 0
            shouldCloseRef.current = true; // Mark that we should close
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
  }, [isHovered]);

  // Separate effect to handle closing when progress reaches 0
  useEffect(() => {
    if (shouldCloseRef.current) {
      shouldCloseRef.current = false;
      // Clear any existing timers
      if (_intervalId) {
        clearInterval(_intervalId);
      }
      onClose();
    }
  }, [progress, onClose, _intervalId]);

  // To handle closing the alert and triggering the slide-out animation
  const handleClose = () => {
    // Clear any existing timers to prevent conflicts
    if (_intervalId) {
      clearInterval(_intervalId);
    }
    // Call onClose immediately to ensure proper cleanup
    onClose();
  };

  return (
    <Alert
      severity="warning"
      onClose={handleClose}  // Use handleClose here instead of directly passing onClose
      sx={{
        position: 'fixed',
        top: `${20 + index * 100}px`, // Dynamic top position based on index
        left: '100%', // Start from the right side of the screen
        transform: 'translateX(-50%)',
        width: '35%',
        zIndex: 1350 + index, // Simple zIndex based on index only
        backgroundColor: '#fffbeb', // Light yellow background for better contrast
        color: '#92400e', // Dark orange text for better readability
        padding: '12px',
        opacity: 0, // Start with zero opacity (hidden)
        transition: 'opacity 0.5s ease-in, transform 0.5s ease-out', // Fade and slide transition
        animation: 'fadeInFromRight 0.5s ease-out forwards', // Fade-in and slide-in animation
        '&::before': { // Progress bar
          content: '""',
          display: 'block',
          width: `${progress}%`, // Progress decreases over time
          height: '4px',
          backgroundColor: '#ffcc00', // Yellow for warning
          position: 'absolute',
          top: 0,
          left: 0,
          transition: 'width 0.06s linear', // Smooth transition for the width change
        },
        '& .MuiAlert-icon': { // Yellow icon color
          color: '#ffcc00',
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
      <AlertTitle style={{ color: "#92400e", fontWeight: "bold" }}>Warning</AlertTitle>
      {message}
    </Alert>
  );
};

export default WarningAlert;
