import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    FormControlLabel,
    Checkbox,
    Collapse,
    Paper,
    Link,
} from '@mui/material';
import { Info, Settings, X } from 'lucide-react';
import { getCookie, setCookie } from '../../utils/cookieManager';

interface CookieConsentProps {
    open?: boolean;
    onAccept?: (preferences: CookiePreferences) => void;
    onDecline?: () => void;
    onClose?: () => void;
}

interface CookiePreferences {
    necessary: boolean;
    analytics: boolean;
    preferences: boolean;
    marketing: boolean;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ open, onAccept, onDecline, onClose }) => {
    const [showConsent, setShowConsent] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState<CookiePreferences>({
        necessary: true, // Always required
        analytics: false,
        preferences: false,
        marketing: false,
    });

    useEffect(() => {
        // If open prop is provided, show the dialog
        if (open !== undefined) {
            setShowConsent(open);
        } else {
            // Check if user has already given consent
            const consentGiven = getCookie('cookie_consent');
            if (!consentGiven) {
                setShowConsent(true);
            }
        }
    }, [open]);

    const handleAcceptAll = () => {
        const allPreferences: CookiePreferences = {
            necessary: true,
            analytics: true,
            preferences: true,
            marketing: true,
        };
        
        setCookie('cookie_consent', JSON.stringify(allPreferences), { expires: 365 });
        setShowConsent(false);
        onAccept?.(allPreferences);
        onClose?.();
    };

    const handleAcceptSelected = () => {
        setCookie('cookie_consent', JSON.stringify(preferences), { expires: 365 });
        setShowConsent(false);
        onAccept?.(preferences);
        onClose?.();
    };

    const handleDecline = () => {
        const minimalPreferences: CookiePreferences = {
            necessary: true,
            analytics: false,
            preferences: false,
            marketing: false,
        };
        
        setCookie('cookie_consent', JSON.stringify(minimalPreferences), { expires: 365 });
        setShowConsent(false);
        onDecline?.();
        onClose?.();
    };

    const handlePreferenceChange = (key: keyof CookiePreferences) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setPreferences(prev => ({
            ...prev,
            [key]: event.target.checked,
        }));
    };

    if (!showConsent) {
        return null;
    }

    return (
        <Paper
            elevation={8}
            sx={{
                position: 'fixed',
                bottom: 20,
                left: 20,
                right: 20,
                maxWidth: 600,
                mx: 'auto',
                zIndex: 9999,
                p: 3,
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Info size={24} color="primary" style={{ marginRight: 8 }} />
                    <Typography variant="h6">Cookie Settings</Typography>
                </Box>
                <Button
                    size="small"
                    onClick={() => {
                        setShowConsent(false);
                        onClose?.();
                    }}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                >
                    <X size={20} />
                </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                We use cookies to improve your browsing experience. 
                Some cookies are necessary for the website to function properly. 
                You can choose which types of cookies to allow.
            </Typography>

            <Collapse in={showSettings}>
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Cookie Types
                    </Typography>
                    
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={preferences.necessary}
                                disabled
                                size="small"
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight="bold">
                                    Necessary Cookies
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Required for website functionality. Cannot be disabled.
                                </Typography>
                            </Box>
                        }
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={preferences.analytics}
                                onChange={handlePreferenceChange('analytics')}
                                size="small"
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight="bold">
                                    Analytics Cookies
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Help us understand website usage to improve performance
                                </Typography>
                            </Box>
                        }
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={preferences.preferences}
                                onChange={handlePreferenceChange('preferences')}
                                size="small"
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight="bold">
                                    Preference Cookies
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Remember your settings like theme, language, and other preferences
                                </Typography>
                            </Box>
                        }
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={preferences.marketing}
                                onChange={handlePreferenceChange('marketing')}
                                size="small"
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight="bold">
                                    Marketing Cookies
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Used for advertising and marketing purposes
                                </Typography>
                            </Box>
                        }
                    />
                </Box>
            </Collapse>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowSettings(!showSettings)}
                    startIcon={<Settings />}
                >
                    {showSettings ? 'Hide Settings' : 'Settings'}
                </Button>

                <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleDecline}
                >
                    Decline All
                </Button>

                <Button
                    variant="contained"
                    size="small"
                    onClick={handleAcceptSelected}
                    disabled={!preferences.necessary}
                >
                    Accept Selected
                </Button>

                <Button
                    variant="contained"
                    size="small"
                    onClick={handleAcceptAll}
                >
                    Accept All
                </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                By clicking "Accept", you consent to our use of cookies as described in our 
                <Link href="/privacy-policy" target="_blank" sx={{ ml: 0.5 }}>
                    Privacy Policy
                </Link>
            </Typography>
        </Paper>
    );
};

export default CookieConsent; 