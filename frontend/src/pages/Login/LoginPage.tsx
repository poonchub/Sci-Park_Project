import React, { useState } from 'react';
import { TextField, Button, Typography, Link, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import './LoginPage.css'; // ใช้ CSS ที่มีอยู่
import { useNavigate } from 'react-router-dom';
import { UserLogin } from '../../services/http';
import { UserInterface } from '../../interfaces/IUser';
import SuccessAlert from '../../components/Alert/SuccessAlert';
import WarningAlert from '../../components/Alert/WarningAlert'; // Import WarningAlert
import ErrorAlert from '../../components/Alert/ErrorAlert';    // Import ErrorAlert

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWarning, setShowWarning] = useState(false);  // For Warning
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log(email, password);
    // Validate form input before sending data to backend
    if (email === "" || password === "") {
      setErrorMessage("Please fill in all the fields.");
      setShowWarning(true); // Show WarningAlert if fields are missing
      return;
    }

    const data: UserInterface = {
      Email: email,
      Password: password,
    };

    try {
      const responseData: any = await UserLogin(data);
      const response = responseData?.data;
      if (response && response.Token && response.Role) {
        localStorage.setItem("isLogin", "true");
        localStorage.setItem("role", response.Role || "Outsider");
        localStorage.setItem("token", response.Token);

        setSuccessMessage("Login successful!");
        setShowSuccess(true);  // Show SuccessAlert on successful login

        let redirectPath = "/login";
        if (response.Role) {
          redirectPath = "/";
        }

        navigate(redirectPath);
      } else {
        setErrorMessage(response?.Error || "Login failed! Please check your credentials.");
        setShowError(true);  // Show ErrorAlert on failed login
      }
    } catch (error: unknown) {
      if (error instanceof Error && (error as any).response) {
        const errorMessage = (error as any).response?.data?.Error || "An error occurred during login.";
        console.error("Error from backend:", errorMessage);
        setErrorMessage(errorMessage);
        setShowError(true);  // Show ErrorAlert when there is an error from the backend
      } else {
        console.error("An error occurred:", error);
        setErrorMessage("An error occurred while logging in.");
        setShowError(true);  // Show ErrorAlert when there is a general error
      }
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  return (
    <div className="login-page">
      <div className="right-side">
        <Typography variant="h2" gutterBottom>Sign In</Typography>

        {/* Show Success Alert */}
        {showSuccess && (
          <SuccessAlert
            message={successMessage}
            onClose={() => setShowSuccess(false)}
          />
        )}

        {/* Show Error Alert */}
        {showError && (
          <ErrorAlert
            message={errorMessage}
            onClose={() => setShowError(false)}
          />
        )}

        {/* Show Warning Alert */}
        {showWarning && (
          <WarningAlert
            message={errorMessage}
            onClose={() => setShowWarning(false)}
          />
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            helperText={showWarning && !email ? "Please enter your email" : ""}
            slotProps={{
              inputLabel: {
                sx: { color: '#6D6E70' }, // Apply gray color to label
              },
            }}
          />
          <TextField
            fullWidth
            label="Password"
            variant="outlined"
            margin="normal"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText={showWarning && !password ? "Please enter your password" : ""}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
              inputLabel: {
                sx: { color: '#6D6E70' }, // Apply gray color to label
              },
            }}
          />
          <Button type="submit" fullWidth variant="contained" color="primary" className="sign-in-button">
            Sign In
          </Button>
          <Link href="#" className="forgot-link">
            Forgot Email or Password?
          </Link>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
