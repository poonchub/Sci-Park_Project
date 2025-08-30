import React from "react";
import { Typography, Button, Grid, Box } from "@mui/material";
import { FileText } from "lucide-react";

interface Alert {
    type: "warning" | "error" | "success";
    message: string;
}

interface DocumentUploaderProps {
    maxFiles?: number;
    value: File[];
    onChange: (files: File[]) => void;
    setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
    buttonText: string;
    acceptedFileTypes?: string[];
    maxFileSize?: number;
}

const isValidDocument = (file: File, acceptedTypes: string[], maxSize: number) => {
    // ตรวจสอบประเภทไฟล์
    const isValidType = acceptedTypes.some(type => 
        file.name.toLowerCase().endsWith(type.toLowerCase()) || 
        file.type === 'application/pdf'
    );
    
    // ตรวจสอบขนาดไฟล์
    const isValidSize = file.size <= maxSize;
    
    return isValidType && isValidSize;
};

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
    maxFiles = 3,
    value,
    onChange,
    setAlerts = () => { },
    buttonText,
    acceptedFileTypes = ['.pdf'],
    maxFileSize = 10 * 1024 * 1024, // 10MB default
}) => {
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        let droppedFiles = Array.from(event.dataTransfer.files).filter(file => 
            isValidDocument(file, acceptedFileTypes, maxFileSize)
        );

        if (droppedFiles.length > maxFiles) {
            droppedFiles = droppedFiles.slice(0, maxFiles);
            setAlerts((prev) => [...prev, { type: "warning", message: `You can upload up to ${maxFiles} files.` }]);
        }

        onChange(droppedFiles);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            let selectedFiles = Array.from(event.target.files).filter(file => 
                isValidDocument(file, acceptedFileTypes, maxFileSize)
            );

            if (selectedFiles.length > maxFiles) {
                selectedFiles = selectedFiles.slice(0, maxFiles);
                setAlerts((prev) => [...prev, { type: "warning", message: `You can upload up to ${maxFiles} files.` }]);
            }

            onChange(selectedFiles);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <>
            {/* Drop Zone */}
            <Grid
                size={{ xs: 12 }}
                sx={{
                    border: "2px dashed #0094DE",
                    borderRadius: 2,
                    px: 1.8,
                    py: 4,
                    textAlign: "center",
                    backgroundColor: "rgba(0, 162, 255, 0.1)",
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
            >
                {/* Preview Documents */}
                {value.length !== 0 && (
                    <Grid container spacing={2} sx={{ 
                        mt: 0.5, mb: 2, 
                        height: 'auto', 
                        overflow: 'auto',
                        p: 1
                    }}>
                        {value.map((file, index) => (
                            <Grid key={index} size={{ xs: 12, md: 6 }}>
                                <Box sx={{
                                    p: 2,
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 2,
                                    backgroundColor: '#fafafa',
                                    textAlign: 'left'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <FileText size={20} color="#0094DE" />
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {file.name}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Size: {formatFileSize(file.size)}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                )}

                <Typography sx={{ mb: 1.4, fontSize: 14 }}>
                    Drag and drop document files here, or
                </Typography>
                <Button variant="contained" component="label">
                    <FileText size={20}/>
                    <Typography variant="textButtonClassic">{buttonText}</Typography>
                    <input
                        name="documentUploader"
                        accept={acceptedFileTypes.join(',')}
                        type="file"
                        multiple={maxFiles > 1}
                        hidden
                        onChange={handleFileChange}
                    />
                </Button>
                <Typography sx={{ fontSize: 13, color: 'gray', mt: 1.4 }}>
                    Supported file types: {acceptedFileTypes.join(', ')} (Max size: {formatFileSize(maxFileSize)})
                </Typography>
            </Grid>
        </>
    );
};

export default DocumentUploader;
