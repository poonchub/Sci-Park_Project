import {
    Box,
    Button,
    CardMedia,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Fab,
    Grid,
    Tooltip,
    Typography,
    Zoom,
} from "@mui/material";
import { NewsInterface } from "../../interfaces/News";
import Carousel from "react-material-ui-carousel";
import { apiUrl, UpdateNewsByID, UpdateNewsImages } from "../../services/http";
import formatNewsDate from "../../utils/formatNewsDate";
import { CalendarDays, CircleX, Newspaper, Pencil, Pin, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TextField } from "../TextField/TextField";
import { DatePicker } from "../DatePicker/DatePicker";
import { CalendarMonth } from "@mui/icons-material";
import AlertGroup from "../AlertGroup/AlertGroup";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import React from "react";
import Lottie from "lottie-react";
import animationData from "../../../public/lottie/Succes 2.json";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import { handleDeleteNews } from "../../utils/handleDeleteNews";
import formatNewsDateRange from "../../utils/formatNewsDateRange";

interface NewsDetailPopupProps {
    open: boolean;
    onClose: () => void;
    selectedNews?: NewsInterface;
    isEditMode?: boolean;
    isClickEdit?: boolean;
    setIsClickEdit?: React.Dispatch<React.SetStateAction<boolean>>;
    onUpdated?: () => void;
}

const NewsDetailPopup: React.FC<NewsDetailPopupProps> = ({
    open,
    onClose,
    selectedNews,
    isEditMode = false,
    isClickEdit = false,
    setIsClickEdit,
    onUpdated,
}) => {
    const [initialNews, setInitialNews] = useState<NewsInterface>({});
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [openEndPicker, setOpenEndPicker] = useState(false);
    const [openStartPicker, setOpenStartPicker] = useState(false);
    const [isSubmitButtonActive, setIsSubmitButtonActive] = useState(false);
    const [isDeleteButtonActive, setIsDeleteButtonActive] = useState(false);
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loadingStatus, setLoadingStatus] = useState<"idle" | "loading" | "success">("idle");
    const [openDelete, setOpenDelete] = useState(false);
    const [openImage, setOpenImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string>("");
    
    // Ref สำหรับเก็บ reference ของ element ที่มี focus ก่อนเปิด dialog
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // จัดการ focus management เพื่อป้องกัน aria-hidden warning
    useEffect(() => {
        if (open) {
            // เก็บ reference ของ element ที่มี focus ก่อนเปิด dialog
            previousFocusRef.current = document.activeElement as HTMLElement;
        } else {
            // เมื่อ dialog ปิด ให้ return focus ไปยัง element เดิม
            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                setTimeout(() => {
                    previousFocusRef.current?.focus();
                }, 0);
            }
        }
    }, [open]);

    const handleUpdatePinned = async () => {
        try {
            const newsData: NewsInterface = {
                IsPinned: !initialNews.IsPinned,
            };
            const resNews = await UpdateNewsByID(newsData, initialNews.ID);
            if (resNews) {
                setInitialNews((prev) => ({
                    ...prev,
                    IsPinned: !prev.IsPinned,
                }));

                // Update pin status successfully
            } else {
                console.error("Failed to update news.");
            }
        } catch (error) {
            console.error("An error occurred while updating the news:", error);
        }
    };

    const handleDateChange = (field: string, value: dayjs.Dayjs | null) => {
        setInitialNews((prev) => ({
            ...prev,
            [field]: value && value.isValid() ? value.toISOString() : "",
        }));
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;

        setInitialNews((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!initialNews.Title?.trim()) {
            newErrors.Title = "Please enter a news title.";
        } else if (!initialNews.Summary?.trim()) {
            newErrors.Summary = "Please provide a short summary of the news.";
        } else if (!initialNews.FullContent?.trim()) {
            newErrors.FullContent = "Please enter the full content of the news.";
        } else if (!initialNews.DisplayStart) {
            newErrors.DisplayStart = "Please select the start date for displaying the news.";
        } else if (!initialNews.DisplayEnd) {
            newErrors.DisplayEnd = "Please select the end date for displaying the news.";
        }

        if (initialNews.DisplayStart && initialNews.DisplayEnd) {
            const start = new Date(initialNews.DisplayStart);
            const end = new Date(initialNews.DisplayEnd);
            if (end < start) {
                newErrors.DisplayEnd = "The end date must be later than the start date.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdateNews = async () => {
        setIsSubmitButtonActive(true);
        setLoadingStatus("loading");

        if (!validateForm()) {
            setIsSubmitButtonActive(false);
            setLoadingStatus("idle");
            return;
        }

        try {
            const resUpdateNews = await UpdateNewsByID(initialNews, selectedNews?.ID);
            if (!resUpdateNews) {
                handleSetAlert("error", resUpdateNews?.Error || "Failed to update news");
                setIsSubmitButtonActive(false);
                setLoadingStatus("idle");
                return;
            }

            if (files.length > 0) {
                const formDataFile = new FormData();
                const userID = localStorage.getItem("userId") || "";
                formDataFile.append("userID", userID);
                formDataFile.append("newsID", String(initialNews.ID));
                files.forEach((file) => formDataFile.append("files", file));

                const resImage = await UpdateNewsImages(formDataFile);
                if (!resImage || resImage.error) {
                    handleSetAlert("error", resImage?.error || "Failed to upload images");
                    setIsSubmitButtonActive(false);
                    setLoadingStatus("idle");
                    return;
                }
            }

            // News updated successfully

            setTimeout(() => {
                setLoadingStatus("success");
                setIsClickEdit?.(false);
                setAlerts([]);
                setFiles([]);
            }, 350);

            setTimeout(() => {
                onUpdated?.();
                setIsSubmitButtonActive(false);
                onClose();
                setLoadingStatus("idle");
            }, 2100);
        } catch (error) {
            console.error("Error updating news:", error);
            handleSetAlert("error", "An unexpected error occurred.");
            setIsSubmitButtonActive(false);
            setLoadingStatus("idle");
        }
    };

    const handleClickDeleteNews = () => {
        handleDeleteNews({
            selectedNews,
            setIsDeleteButtonActive,
            setLoadingStatus,
            handleSetAlert,
            setIsClickEdit,
            setAlerts,
            setFiles,
            onUpdated,
            onClose,
        });
    };

    const handleSetAlert = (type: "success" | "error" | "warning", message: string) => {
        setAlerts((prevAlerts) => [...prevAlerts, { type, message }]);
    };

    const isValidImage = (file: File) => file.type.startsWith("image/");
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            let selectedFiles = Array.from(event.target.files).filter(isValidImage);

            if (selectedFiles.length > 3) {
                selectedFiles = selectedFiles.slice(0, 3);
                setAlerts((prev) => [...prev, { type: "warning", message: `You can upload up to ${3} files.` }]);
            }

            setFiles(selectedFiles);
        }
    };

    const handleResetData = () => {
        if (selectedNews) {
            setInitialNews(selectedNews);
        }
        setFiles([]);
    };

    useEffect(() => {
        if (selectedNews) {
            setInitialNews(selectedNews);
        }
    }, [selectedNews]);

    useEffect(() => {
        if (initialNews.DisplayStart && !initialNews.DisplayEnd) {
            setTimeout(() => setOpenEndPicker(true), 200);
        }
    }, [initialNews.DisplayStart]);

    useEffect(() => {
        if (initialNews.DisplayEnd && !initialNews.DisplayStart) {
            setTimeout(() => setOpenStartPicker(true), 200);
        }
    }, [initialNews.DisplayEnd]);

    let statusMessage = "";
    if (loadingStatus === "loading") {
        if (isSubmitButtonActive) {
            statusMessage = "Saving Changes...";
        } else if (isDeleteButtonActive) {
            statusMessage = "Deleting";
        }
    } else if (loadingStatus === "success") {
        statusMessage = "Completed!";
    }

    const imagePopup = (
        <Dialog
            open={openImage}
            onClose={() => {
                setOpenImage(false);
            }}
            maxWidth={false}
            disableRestoreFocus
            keepMounted={false}
            disableEnforceFocus
            disableAutoFocus
            sx={{
                '& .MuiDialog-paper': {
                    maxWidth: '70vw',
                    width: 'auto',
                    margin: 0,
                    borderRadius: 0,
                },
            }}
        >
            <CardMedia
                component="img"
                image={selectedImage}
                alt="image"
                sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                }}
            />
        </Dialog>
    );

    return (
        <Dialog
            open={open}
            onClose={() => {
                onClose();
                setIsClickEdit?.(false);
                handleResetData();
                setAlerts([]);
            }}
            disableRestoreFocus
            keepMounted={false}
            disableEnforceFocus
            disableAutoFocus
            slotProps={{
                paper: {
                    sx: {
                        width: "70%",
                        maxWidth: "1200px",
                    },
                },
            }}
        >
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            <ConfirmDialog
                open={openDelete}
                setOpenConfirm={setOpenDelete}
                handleFunction={handleClickDeleteNews}
                title="Confirm News Deletion"
                message="Are you sure you want to delete this news? This action cannot be undone."
                buttonActive={isDeleteButtonActive}
            />

            {imagePopup}

            <DialogTitle
                sx={{
                    display: "flex",
                    gap: 1,
                    justifyContent: "space-between",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                    }}
                >
                    <Newspaper />
                    <Typography sx={{ fontWeight: 700, fontSize: 22 }}>{"Latest News"}</Typography>
                </Box>
                <Zoom in={isSubmitButtonActive || isDeleteButtonActive} timeout={300} unmountOnExit>
                    <Box sx={{ display: "flex", gap: 1.2, alignItems: "center", position: "relative" }}>
                        <Typography sx={{ fontWeight: 500, fontSize: 14, color: "text.secondary" }}>{statusMessage}</Typography>

                        <Box sx={{ position: "relative", width: 30, height: 30 }}>
                            <Zoom in={loadingStatus === "loading"} timeout={300} unmountOnExit>
                                <CircularProgress
                                    size={30}
                                    sx={{ color: "customGreen", position: "absolute", top: "0%", left: "0%", transform: "translate(-50%, -50%)" }}
                                />
                            </Zoom>

                            <Zoom in={loadingStatus === "success"} timeout={300} unmountOnExit>
                                <Box sx={{ position: "absolute", top: 0, left: 0, width: 40, height: 40 }}>
                                    <Lottie animationData={animationData} loop={false} style={{ width: 30, height: 30 }} />
                                </Box>
                            </Zoom>
                        </Box>
                    </Box>
                </Zoom>
            </DialogTitle>
            <DialogContent sx={{ minWidth: 350 }}>
                <Grid container size={{ xs: 12 }}>
                    <Grid size={{ xs: 12 }} position={"relative"}>
                        {isClickEdit && (
                            <Box>
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg"
                                    multiple
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    hidden
                                />

                                <Zoom in={isClickEdit} timeout={300} unmountOnExit>
                                    <Fab
                                        variant="extended"
                                        size="small"
                                        sx={{
                                            position: "absolute",
                                            bottom: files.length > 1 || (initialNews.NewsImages?.length ?? 0) > 1 ? 55 : 30,
                                            right: 20,
                                            gap: 1,
                                            px: 2,
                                            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
                                            borderRadius: "12px",
                                            border: "1px solid rgba(255, 255, 255, 0.18)",
                                            lineHeight: 0,
                                            "&:hover": {
                                                color: "white",
                                            },
                                        }}
                                        color="secondary"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faImage} />
                                        Upload Image
                                    </Fab>
                                </Zoom>
                            </Box>
                        )}
                        <Carousel
                            indicators
                            autoPlay
                            animation="slide"
                            duration={500}
                            navButtonsAlwaysVisible
                            navButtonsAlwaysInvisible={
                                files.length > 0 ? !files || files.length == 1 : !initialNews?.NewsImages || initialNews.NewsImages.length <= 1
                            }
                            navButtonsProps={{
                                style: {
                                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                                },
                            }}
                        >
                            {files.length > 1 ? (
                                files.map((file, idx) => {
                                    const imageUrl = URL.createObjectURL(file);
                                    return (
                                        <CardMedia
                                            key={`newfile-${idx}`}
                                            component="img"
                                            image={imageUrl}
                                            alt={`uploaded-image-${idx}`}
                                            sx={{
                                                height: { xs: 150, sm: 200, md: 300, lg: 450 },
                                                borderRadius: 2,
                                                cursor: "pointer",
                                            }}
                                            onClick={() => {
                                                setSelectedImage(imageUrl)
                                                setOpenImage(true)
                                            }}
                                        />
                                    );
                                })
                            ) : files.length == 1 ? (
                                <CardMedia
                                    component="img"
                                    image={URL.createObjectURL(files[0])}
                                    alt="news-image"
                                    sx={{
                                        height: { xs: 150, sm: 200, md: 300, lg: 450 },
                                        borderRadius: 2,
                                        cursor: "pointer",
                                    }}
                                    onClick={() => setSelectedImage(URL.createObjectURL(files[0]))}
                                />
                            ) : initialNews?.NewsImages && initialNews.NewsImages.length > 1 ? (
                                initialNews.NewsImages.map((image, idx) => (
                                    <CardMedia
                                        key={idx}
                                        component="img"
                                        image={`${apiUrl}/${image?.FilePath}`}
                                        alt={`news-image-${idx}`}
                                        sx={{
                                            height: { xs: 150, sm: 200, md: 300, lg: 450 },
                                            borderRadius: 2,
                                            cursor: "pointer",
                                        }}
                                        onClick={() => {
                                            setSelectedImage(`${apiUrl}/${image?.FilePath}`)
                                            setOpenImage(true)
                                        }}
                                    />
                                ))
                            ) : (
                                <CardMedia
                                    component="img"
                                    image={
                                        initialNews?.NewsImages?.[0]?.FilePath
                                            ? `${apiUrl}/${initialNews.NewsImages[0].FilePath}`
                                            : "https://placehold.co/600x400"
                                    }
                                    alt="news-image"
                                    sx={{
                                        height: { xs: 150, sm: 200, md: 300, lg: 450 },
                                        borderRadius: 2,
                                        cursor: "pointer",
                                    }}
                                    onClick={() => {
                                        setSelectedImage(initialNews?.NewsImages?.[0]?.FilePath
                                            ? `${apiUrl}/${initialNews.NewsImages[0].FilePath}`
                                            : "https://placehold.co/600x400")
                                        setOpenImage(true)
                                    }}
                                />
                            )}
                        </Carousel>
                    </Grid>
                    <Grid size={{ xs: 12 }} position={"relative"}>
                        <Chip
                            label={formatNewsDate(selectedNews?.DisplayStart ?? "")}
                            size="small"
                            icon={<CalendarDays size={18} style={{ marginRight: 1 }} />}
                            sx={{
                                bgcolor: "primary.light",
                                color: "white",
                                padding: 2,
                                mt: 1.5,
                                fontWeight: 600,
                                "& .MuiChip-icon": {
                                    color: "white",
                                },
                            }}
                        />

                        {/* Pin Button */}
                        {isEditMode && (
                            <Zoom in={isEditMode} timeout={400}>
                                <motion.div
                                    initial={false}
                                    animate={{ right: isClickEdit ? 172 : isEditMode ? 120 : 16 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    style={{
                                        position: "absolute",
                                        top: 6,
                                    }}
                                >
                                    <Tooltip title={initialNews.IsPinned ? "Unpin" : " Pin to top"}>
                                        <Fab
                                            size="small"
                                            sx={{
                                                boxShadow: 3,
                                            }}
                                            color={initialNews?.IsPinned ? "primary" : undefined}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleUpdatePinned();
                                            }}
                                        >
                                            <Pin
                                                style={{
                                                    transform: "rotate(45deg)",
                                                }}
                                            />
                                        </Fab>
                                    </Tooltip>
                                </motion.div>
                            </Zoom>
                        )}

                        {/* Edit Button */}
                        <Zoom in={!isClickEdit && isEditMode} timeout={400}>
                            <Tooltip title="Edit">
                                <Fab
                                    size="small"
                                    sx={{
                                        position: "absolute",
                                        top: 6,
                                        right: 16,
                                        boxShadow: 3,
                                    }}
                                    color={"secondary"}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setIsClickEdit?.(true);
                                    }}
                                >
                                    <Pencil />
                                </Fab>
                            </Tooltip>
                        </Zoom>

                        {/* Delete Button */}
                        {isEditMode && (
                            <Zoom in={isEditMode} timeout={400}>
                                <motion.div
                                    initial={false}
                                    animate={{ right: isClickEdit ? 120 : isEditMode ? 68 : 16 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    style={{
                                        position: "absolute",
                                        top: 6,
                                    }}
                                >
                                    <Tooltip title="Delete">
                                        <Fab
                                            size="small"
                                            sx={{
                                                boxShadow: 3,
                                                backgroundColor: "secondary.main",
                                                color: "error.main",
                                                "&hover": {},
                                            }}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setOpenDelete(true);
                                            }}
                                        >
                                            <Trash2 />
                                        </Fab>
                                    </Tooltip>
                                </motion.div>
                            </Zoom>
                        )}

                        {/* Save Change Button */}
                        <Zoom in={isClickEdit} timeout={400}>
                            <Tooltip title="Save Change">
                                <Fab
                                    size="small"
                                    sx={{
                                        position: "absolute",
                                        top: 6,
                                        right: 68,
                                        boxShadow: 3,
                                        color: "secondary.main",
                                        backgroundColor: "customGreen",
                                        "&:hover": {
                                            backgroundColor: "#369d33",
                                        },
                                    }}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handleUpdateNews();
                                    }}
                                >
                                    <Save />
                                </Fab>
                            </Tooltip>
                        </Zoom>

                        {/* Cancel button */}
                        <Zoom in={isClickEdit} timeout={400}>
                            <Tooltip title="Cancel">
                                <Fab
                                    size="small"
                                    sx={{
                                        position: "absolute",
                                        top: 6,
                                        right: 16,
                                        boxShadow: 3,
                                    }}
                                    color={"secondary"}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setIsClickEdit?.(false);
                                        handleResetData();
                                        setAlerts([]);
                                    }}
                                >
                                    <RotateCcw />
                                </Fab>
                            </Tooltip>
                        </Zoom>
                    </Grid>

                    <Collapse in={isClickEdit} timeout={400} sx={{ mt: 2 }}>
                        <Grid
                            container
                            size={{ xs: 12 }}
                            spacing={2}
                            sx={{
                                px: 1,
                                mt: 2,
                            }}
                        >
                            <Grid container size={{ xs: 6 }} spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        label="Title"
                                        name="Title"
                                        fullWidth
                                        variant="outlined"
                                        value={initialNews?.Title ?? ""}
                                        onChange={handleInputChange}
                                        placeholder="Enter the news title"
                                        error={!!errors.Title}
                                        helperText={errors.Title}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        label="Summary"
                                        name="Summary"
                                        multiline
                                        rows={4}
                                        fullWidth
                                        variant="outlined"
                                        value={initialNews?.Summary ?? ""}
                                        onChange={handleInputChange}
                                        placeholder="Enter a short summary of the news"
                                        error={!!errors.Summary}
                                        helperText={errors.Summary}
                                        slotProps={{
                                            input: {
                                                className: "custom-input",
                                            },
                                        }}
                                    />
                                </Grid>
                            </Grid>
                            <Grid
                                container
                                size={{ xs: 6 }}
                                sx={{
                                    border: "1px solid #c5c5c6",
                                    borderRadius: "10px",
                                    p: 2,
                                    minHeight: "100%",
                                }}
                                spacing={1.2}
                            >
                                <Typography variant="body1" gutterBottom fontWeight={600}>
                                    Display Period
                                </Typography>
                                <Grid size={{ xs: 12 }}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            label="Start date"
                                            value={initialNews.DisplayStart ? dayjs(initialNews.DisplayStart) : null}
                                            onChange={(newValue) => handleDateChange("DisplayStart", newValue)}
                                            maxDate={initialNews.DisplayEnd ? dayjs(initialNews.DisplayEnd) : undefined}
                                            slots={{
                                                openPickerIcon: CalendarMonth,
                                            }}
                                            format="DD/MM/YYYY"
                                            open={openStartPicker}
                                            onOpen={() => setOpenStartPicker(true)}
                                            onClose={() => setOpenStartPicker(false)}
                                            sx={{ width: "100%" }}
                                            slotProps={{
                                                textField: {
                                                    error: !!errors.DisplayStart,
                                                    helperText: errors.DisplayStart,
                                                },
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            label="End Date"
                                            value={initialNews.DisplayEnd ? dayjs(initialNews.DisplayEnd) : null}
                                            onChange={(newValue) => handleDateChange("DisplayEnd", newValue)}
                                            minDate={initialNews.DisplayStart ? dayjs(initialNews.DisplayStart) : undefined}
                                            slots={{
                                                openPickerIcon: CalendarMonth,
                                            }}
                                            format="DD/MM/YYYY"
                                            open={openEndPicker}
                                            onOpen={() => setOpenEndPicker(true)}
                                            onClose={() => setOpenEndPicker(false)}
                                            sx={{ width: "100%" }}
                                            slotProps={{
                                                textField: {
                                                    error: !!errors.DisplayEnd,
                                                    helperText: errors.DisplayEnd,
                                                },
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="Content"
                                    name="FullContent"
                                    multiline
                                    rows={4}
                                    fullWidth
                                    variant="outlined"
                                    value={initialNews?.FullContent ?? ""}
                                    onChange={handleInputChange}
                                    placeholder="Enter the full content of the news"
                                    error={!!errors.FullContent}
                                    helperText={errors.FullContent}
                                    slotProps={{
                                        input: {
                                            className: "custom-input",
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Collapse>

                    <Collapse in={!isClickEdit} timeout={400} sx={{ width: "100%" }}>
                        <Grid size={{ xs: 12 }} sx={{ px: 1, mt: 2 }}>
                            <Typography variant="h5" fontWeight={600} gutterBottom width={"100%"}>
                                {initialNews?.Title}
                            </Typography>
                            <Collapse in={isEditMode} timeout={300}>
                                <Box display={'flex'} gap={1}>
                                    <Typography
                                        variant="body2"
                                        gutterBottom
                                        fontWeight={500}
                                    >
                                        {'Display Period:'}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        gutterBottom
                                    >
                                        {`${formatNewsDateRange(initialNews.DisplayStart || '', initialNews.DisplayEnd || '')}`}
                                    </Typography>
                                </Box>
                            </Collapse>
                            <Typography variant="body1" fontSize={16} gutterBottom sx={{ whiteSpace: "pre-line" }}>
                                {initialNews?.Summary}
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="body1" fontSize={14} sx={{ whiteSpace: "pre-line" }}>
                                {initialNews?.FullContent}
                            </Typography>
                        </Grid>
                    </Collapse>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Zoom in={open} timeout={400}>
                    <Button
                        onClick={() => {
                            onClose();
                            setIsClickEdit?.(false);
                            handleResetData();
                            setAlerts([]);
                        }}
                        variant="outlined"
                        startIcon={<CircleX size={18} />}
                    >
                        Close
                    </Button>
                </Zoom>
            </DialogActions>
        </Dialog>
    );
};

export default NewsDetailPopup;
