import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Alert,
} from "@mui/material";
import { Plus, X } from "lucide-react";
import { CreateJobPosition } from "../../services/http";
import { TextField } from "../TextField/TextField";

interface CreateJobPositionPopupProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (newJobPosition: any) => void;
}

const CreateJobPositionPopup: React.FC<CreateJobPositionPopupProps> = ({
    open,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState({
        Name: "",
        NameTH: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error when user starts typing
        if (error) setError(null);
    };

    const validateForm = () => {
        if (!formData.Name.trim()) {
            setError("Job Position Name (English) is required");
            return false;
        }
        if (!formData.NameTH.trim()) {
            setError("Job Position Name (Thai) is required");
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            setError(null);

            const response = await CreateJobPosition({
                Name: formData.Name.trim(),
                NameTH: formData.NameTH.trim(),
            });

            if (response.status === "success") {
                onSuccess(response.data);
                handleClose();
            } else {
                setError(response.message || "Failed to create job position");
            }
        } catch (error: any) {
            console.error("Error creating job position:", error);
            setError(error.response?.data?.error || "Failed to create job position");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({ Name: "", NameTH: "" });
        setError(null);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    minHeight: "400px",
                },
            }}
        >
            <DialogTitle>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Plus size={24} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Create New Job Position
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box>
                        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                            Job Position Name (English) *
                        </Typography>
                        <TextField
                            value={formData.Name}
                            onChange={(e) => handleInputChange("Name", e.target.value)}
                            fullWidth
                            placeholder="Software Developer"
                            disabled={isSubmitting}
                        />
                    </Box>

                    <Box>
                        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                            Job Position Name (Thai) *
                        </Typography>
                        <TextField
                            value={formData.NameTH}
                            onChange={(e) => handleInputChange("NameTH", e.target.value)}
                            fullWidth
                            placeholder="นักพัฒนาซอฟต์แวร์"
                            disabled={isSubmitting}
                        />
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 1 }}>
                <Button
                    variant="outlinedGray"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    startIcon={<X size={18} />}
                    sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    startIcon={<Plus size={18} />}
                    sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                    }}
                >
                    {isSubmitting ? "Creating..." : "Create Job Position"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateJobPositionPopup;
