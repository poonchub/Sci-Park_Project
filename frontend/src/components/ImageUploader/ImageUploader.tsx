import React from "react";
import { Typography, Button, Grid } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";

interface Alert {
    type: "warning" | "error" | "success";
    message: string;
}

interface ImageUploaderProps {
    maxFiles?: number;
    value: File[];
    onChange: (files: File[]) => void;
    setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
}


const isValidImage = (file: File) => file.type.startsWith("image/");

const ImageUploader: React.FC<ImageUploaderProps> = ({
    maxFiles = 3,
    value,
    onChange,
    setAlerts = () => { },
}) => {
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        let droppedFiles = Array.from(event.dataTransfer.files).filter(isValidImage);

        if (droppedFiles.length > maxFiles) {
            droppedFiles = droppedFiles.slice(0, maxFiles);
            setAlerts((prev) => [...prev, { type: "warning", message: `You can upload up to ${maxFiles} files.` }]);
        }

        onChange(droppedFiles);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            let selectedFiles = Array.from(event.target.files).filter(isValidImage);

            if (selectedFiles.length > maxFiles) {
                selectedFiles = selectedFiles.slice(0, maxFiles);
                setAlerts((prev) => [...prev, { type: "warning", message: `You can upload up to ${maxFiles} files.` }]);
            }

            onChange(selectedFiles);
        }
    };

    return (
        <>

            {/* Drop Zone */}
            <Grid
                size={{ xs: 12, md: 12 }}
                sx={{
                    border: "2px dashed #0094DE",
                    borderRadius: 2,
                    p: 1.8,
                    textAlign: "center",
                    backgroundColor: "#F4FBFF",
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
            >
                {/* Preview Images */}
                {value.length != 0 &&
                    <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
                        {value.map((file, index) => {
                            const imageUrl = URL.createObjectURL(file);
                            return (
                                <Grid key={index} size={{ xs: 6, md: 4 }}>
                                    <img
                                        src={imageUrl}
                                        alt={`preview-${index}`}
                                        width="100%"
                                        style={{ borderRadius: 8 }}
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>
                }

                <Typography sx={{ mb: 0.5, fontSize: 14 }}>ลากและวางไฟล์ที่นี่ หรือ</Typography>
                <Button variant="contained" component="label">
                    <FontAwesomeIcon icon={faImage} size="lg" />
                    <Typography variant="textButtonClassic" >คลิกเลือกไฟล์</Typography>
                    <input
                        accept="image/*"
                        type="file"
                        multiple
                        hidden
                        onChange={handleFileChange}
                    />
                </Button>
            </Grid>
        </>
    );
};

export default ImageUploader;
