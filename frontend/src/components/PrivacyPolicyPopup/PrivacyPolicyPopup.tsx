import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    FormControlLabel,
    Checkbox,
    Box,
    Link,
    Paper,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldAlt } from "@fortawesome/free-solid-svg-icons";

interface PrivacyPolicyPopupProps {
    open: boolean;
    onAccept: () => void;
    onDecline: () => void;
    onClose: () => void;
    language?: 'th' | 'en';
    onLanguageChange?: (language: 'th' | 'en') => void;
}

const PrivacyPolicyPopup: React.FC<PrivacyPolicyPopupProps> = ({ 
    open, 
    onAccept, 
    onDecline, 
    onClose,
    language = 'th',
    onLanguageChange
}) => {
    const [isChecked, setIsChecked] = useState(false);

    const handleAccept = () => {
        if (isChecked) {
            onAccept();
        }
    };

    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsChecked(event.target.checked);
    };

    const thaiContent = {
        title: "คำประกาศเกี่ยวกับความเป็นส่วนตัว",
        description: "เราจะเก็บรวบรวมและใช้ข้อมูลส่วนบุคคลของท่านซึ่งเป็นผู้ติดต่อหรือตัวแทนของนิติบุคคล เพื่อใช้ในการดำเนินการทางธุรกิจกับท่าน เช่น การจัดทำสัญญา การออกเอกสารทางบัญชี และการสื่อสารที่เกี่ยวข้องกับการให้บริการ",
        warning: "หากท่านให้ข้อมูลส่วนบุคคลของผู้อื่น โปรดตรวจสอบให้แน่ใจว่าท่านได้รับความยินยอมจากบุคคลเหล่านั้นแล้ว",
        agreement: "การดำเนินการต่อไปถือว่าท่านรับทราบและตกลงตามนโยบายความเป็นส่วนตัวของเรา",
        privacyLink: "ลิงก์ไปยังนโยบายความเป็นส่วนตัวฉบับเต็ม",
        acceptButton: "ยอมรับและดำเนินการต่อ",
        declineButton: "ยกเลิก",
        checkboxLabel: "ฉันได้อ่านและยอมรับตามนโยบายความเป็นส่วนตัว"
    };

    const englishContent = {
        title: "Privacy Policy Declaration",
        description: "We will collect and use your personal information as a contact person or representative of a legal entity for business operations with you, such as contract preparation, accounting documentation, and service-related communications.",
        warning: "If you provide personal information of others, please ensure that you have obtained consent from those individuals.",
        agreement: "Proceeding further indicates that you acknowledge and agree to our privacy policy.",
        privacyLink: "Link to full privacy policy",
        acceptButton: "Accept and Continue",
        declineButton: "Cancel",
        checkboxLabel: "I have read and agree to the privacy policy"
    };

    const content = language === 'th' ? thaiContent : englishContent;

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    borderRadius: 3,
                    maxHeight: '80vh',
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                pb: 1,
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FontAwesomeIcon icon={faShieldAlt} size="lg" color="#ff6f00" />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff6f00' }}>
                        {content.title}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onLanguageChange?.(language === 'th' ? 'en' : 'th')}
                        sx={{ minWidth: 80, fontSize: '0.75rem' }}
                    >
                        {language === 'th' ? 'EN' : 'ไทย'}
                    </Button>
                    <Button
                        size="small"
                        onClick={onClose}
                        sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                        <Close />
                    </Button>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 3, pb: 2 }}>
                <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                        {content.description}
                    </Typography>
                    
                    <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6, color: 'warning.main', fontWeight: 500 }}>
                        {content.warning}
                    </Typography>
                    
                    <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                        {content.agreement}
                    </Typography>
                    
                    <Link 
                        href="/privacy-policy" 
                        target="_blank" 
                        sx={{ 
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': {
                                textDecoration: 'underline'
                            }
                        }}
                    >
                        [{content.privacyLink}]
                    </Link>
                </Paper>

                <Box sx={{ mt: 3 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isChecked}
                                onChange={handleCheckboxChange}
                                color="primary"
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {content.checkboxLabel}
                            </Typography>
                        }
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
                <Button
                    variant="outlinedCancel"
                    onClick={onDecline}
                    
                >
                    {content.declineButton}
                </Button>
                <Button
                    variant="contained"
                    onClick={handleAccept}
                    disabled={!isChecked}
                    
                >
                    {content.acceptButton}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PrivacyPolicyPopup;
