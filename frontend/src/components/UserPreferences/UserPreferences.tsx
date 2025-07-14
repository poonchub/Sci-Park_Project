import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    FormControlLabel,
    Switch,
    Select,
    MenuItem,
    InputLabel,
    Typography,
    Box,
    Divider,
    Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import {
    getUserPreferences,
    saveUserPreferences,
    updatePreference,
    clearUserPreferences,
    UserPreferences,
} from '../../utils/cookieManager';

interface UserPreferencesProps {
    open: boolean;
    onClose: () => void;
}

const UserPreferencesDialog: React.FC<UserPreferencesProps> = ({ open, onClose }) => {
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const [preferences, setPreferences] = useState<UserPreferences>(getUserPreferences());
    const [hasChanges, setHasChanges] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (open) {
            setPreferences(getUserPreferences());
            setHasChanges(false);
        }
    }, [open]);

    const handlePreferenceChange = <K extends keyof UserPreferences>(
        key: K,
        value: UserPreferences[K]
    ) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        saveUserPreferences(preferences);
        
        // Apply theme changes
        if (preferences.theme !== getUserPreferences().theme) {
            // Update theme (you'll need to implement this based on your theme system)
            document.documentElement.classList.toggle('dark', preferences.theme === 'dark');
        }

        // Apply language changes
        if (preferences.language !== getUserPreferences().language) {
            i18n.changeLanguage(preferences.language);
        }

        setHasChanges(false);
        setShowSuccess(true);
        
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleReset = () => {
        clearUserPreferences();
        setPreferences(getUserPreferences());
        setHasChanges(true);
    };

    const handleClose = () => {
        if (hasChanges) {
            // Ask user if they want to save changes
            if (window.confirm('You have unsaved changes. Do you want to save them?')) {
                handleSave();
            }
        }
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Typography variant="h6">User Preferences</Typography>
            </DialogTitle>
            
            <DialogContent>
                {showSuccess && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Settings saved successfully
                    </Alert>
                )}

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Display Settings
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Theme</InputLabel>
                        <Select
                            value={preferences.theme}
                            label="Theme"
                            onChange={(e) => handlePreferenceChange('theme', e.target.value as 'light' | 'dark')}
                        >
                            <MenuItem value="light">Light</MenuItem>
                            <MenuItem value="dark">Dark</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Language</InputLabel>
                        <Select
                            value={preferences.language}
                            label="Language"
                            onChange={(e) => handlePreferenceChange('language', e.target.value as 'en' | 'th')}
                        >
                            <MenuItem value="en">English</MenuItem>
                            <MenuItem value="th">ไทย</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={preferences.sidebarExpanded}
                                onChange={(e) => handlePreferenceChange('sidebarExpanded', e.target.checked)}
                            />
                        }
                        label="Show expanded sidebar"
                    />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Notifications
                    </Typography>
                    
                    <FormControlLabel
                        control={
                            <Switch
                                checked={preferences.notificationsEnabled}
                                onChange={(e) => handlePreferenceChange('notificationsEnabled', e.target.checked)}
                            />
                        }
                        label="Enable notifications"
                    />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Functionality
                    </Typography>
                    
                    <FormControlLabel
                        control={
                            <Switch
                                checked={preferences.autoSave}
                                onChange={(e) => handlePreferenceChange('autoSave', e.target.checked)}
                            />
                        }
                        label="Auto save"
                    />

                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Items per page</InputLabel>
                        <Select
                            value={preferences.pageSize}
                            label="Items per page"
                            onChange={(e) => handlePreferenceChange('pageSize', e.target.value as number)}
                        >
                            <MenuItem value={5}>5 items</MenuItem>
                            <MenuItem value={10}>10 items</MenuItem>
                            <MenuItem value={20}>20 items</MenuItem>
                            <MenuItem value={50}>50 items</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                    <Typography variant="h6" gutterBottom>
                        Usage Information
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Last visited page: {preferences.lastVisitedPage || 'None'}
                    </Typography>

                    <Button
                        variant="outlined"
                        color="warning"
                        onClick={handleReset}
                        size="small"
                    >
                        Reset Settings
                    </Button>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained" 
                    disabled={!hasChanges}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserPreferencesDialog; 