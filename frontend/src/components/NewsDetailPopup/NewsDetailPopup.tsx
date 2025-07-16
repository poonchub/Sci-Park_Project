import {
    Box, Button, CardMedia, Chip, Collapse, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, Divider, Fab, Grid, Typography
} from '@mui/material';
import { NewsInterface } from '../../interfaces/News';
import Carousel from 'react-material-ui-carousel';
import { apiUrl, UpdateNewsByID } from '../../services/http';
import formatNewsDate from '../../utils/formatNewsDate';
import { BadgeCheck, CalendarDays, CircleX, ImageUp, Newspaper, Pencil, Pin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TextField } from '../TextField/TextField';
import { DatePicker } from '../DatePicker/DatePicker';
import { CalendarMonth } from '@mui/icons-material';
import AlertGroup from '../AlertGroup/AlertGroup';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

interface NewsDetailPopupProps {
    open: boolean;
    onClose: () => void;
    selectedNews?: NewsInterface;
    isEditMode?: boolean;
    isClickEdit?: boolean;
    setIsClickEdit?: React.Dispatch<React.SetStateAction<boolean>>;
}

const NewsDetailPopup: React.FC<NewsDetailPopupProps> = ({
    open,
    onClose,
    selectedNews,
    isEditMode = false,
    isClickEdit = false,
    setIsClickEdit,
}) => {
    const [initialNews, setInitialNews] = useState<NewsInterface>({});
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [openEndPicker, setOpenEndPicker] = useState(false);
    const [openStartPicker, setOpenStartPicker] = useState(false);
    const [isSubmitButtonActive, setIsSubmitButtonActive] = useState(false);
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [files, setFiles] = useState<File[]>([]);

    const handleUpdatePinned = async () => {
        try {
            const newsData: NewsInterface = {
                IsPinned: !initialNews.IsPinned
            }
            const resNews = await UpdateNewsByID(newsData, initialNews.ID)
            if (resNews) {
                setInitialNews((prev) => ({
                    ...prev,
                    IsPinned: !prev.IsPinned
                }));

                if (initialNews.IsPinned) {
                    console.log("The news has been unpinned from the top.")
                } else {
                    console.log("The news has been pinned to the top.")
                }
            } else {
                console.error("Failed to update news.")
            }
        } catch (error) {
            console.error("An error occurred while updating the news:", error)
        }
    }

    const handleDateChange = (field: string, value: dayjs.Dayjs | null) => {
        setInitialNews((prev) => ({
            ...prev,
            [field]: value && value.isValid() ? value.toISOString() : '',
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
            newErrors.Title = "Title is required.";
        } else if (!initialNews.Summary?.trim()) {
            newErrors.Summary = "Summary is required.";
        } else if (!initialNews.FullContent?.trim()) {
            newErrors.FullContent = "Summary is required.";
        } else if (!initialNews.DisplayStart) {
            newErrors.DisplayStart = "Start date is required.";
        } else if (!initialNews.DisplayEnd) {
            newErrors.DisplayEnd = "End date is required.";
        }

        if (initialNews.DisplayStart && initialNews.DisplayEnd) {
            const start = new Date(initialNews.DisplayStart);
            const end = new Date(initialNews.DisplayEnd);
            if (end < start) {
                newErrors.DisplayEnd = "End date must be after start date.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdateNews = async () => {
        setIsSubmitButtonActive(true);
        if (!validateForm()) {
            setIsSubmitButtonActive(false);
            return;
        }

        if (files.length === 0) {
            handleSetAlert("warning", "No images uploaded");
            setIsSubmitButtonActive(false);
            return;
        }

        try {

        } catch (error) {

        }
    }

    const handleSetAlert = (type: "success" | "error" | "warning", message: string) => {
        setAlerts((prevAlerts) => [...prevAlerts, { type, message }]);
    };

    useEffect(() => {
        if (selectedNews) {
            setInitialNews(selectedNews)
        }
    }, [selectedNews])

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

    return (
        <Dialog
            open={open}
            onClose={() => {
                onClose();
                setIsClickEdit?.(false);
            }}
            slotProps={{
                paper: {
                    sx: {
                        width: '70%',
                        maxWidth: '1200px',
                    },
                },
            }}
        >
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            <DialogTitle sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center'
            }}>
                <Newspaper />
                <Typography sx={{ fontWeight: 700, fontSize: 22 }}>
                    {"Latest News"}
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ minWidth: 350 }}>
                <Grid container size={{ xs: 12 }}>
                    <Grid size={{ xs: 12 }} position={'relative'}>
                        <Fab
                            variant="extended"
                            size='small'
                            sx={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                boxShadow: 3,
                                gap: 1,
                                px: 2
                            }}
                            color={initialNews?.IsPinned ? 'primary' : undefined}
                            onClick={(event) => {
                                event.stopPropagation();
                                handleUpdatePinned();
                            }}
                        >
                            <ImageUp/>
                            Upload Image
                        </Fab>
                        <Carousel
                            indicators
                            autoPlay
                            animation="slide"
                            duration={500}
                            navButtonsAlwaysVisible
                            navButtonsAlwaysInvisible={
                                !initialNews?.NewsImages || initialNews.NewsImages.length <= 1
                            }
                            navButtonsProps={{
                                style: {
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                },
                            }}
                        >
                            {initialNews?.NewsImages && initialNews.NewsImages.length > 1 ? (
                                initialNews.NewsImages.map((image, idx) => (
                                    <CardMedia
                                        key={idx}
                                        component="img"
                                        image={`${apiUrl}/${image?.FilePath}`}
                                        alt={`news-image-${idx}`}
                                        sx={{
                                            height: { xs: 150, sm: 200, md: 300, lg: 450 },
                                            borderRadius: 2,
                                        }}
                                    />
                                ))
                            ) : (
                                <CardMedia
                                    component="img"
                                    image={
                                        initialNews?.NewsImages?.[0]?.FilePath
                                            ? `${apiUrl}/${initialNews.NewsImages[0].FilePath}`
                                            : 'https://placehold.co/600x400'
                                    }
                                    alt="news-image"
                                    sx={{
                                        height: { xs: 150, sm: 200, md: 300, lg: 450 },
                                        borderRadius: 2,
                                    }}
                                />
                            )}
                        </Carousel>
                    </Grid>
                    <Grid size={{ xs: 12 }} position={'relative'}>
                        <Chip
                            label={formatNewsDate(selectedNews?.DisplayStart ?? '')}
                            size="small"
                            icon={<CalendarDays size={18} style={{ marginRight: 1 }} />}
                            sx={{
                                bgcolor: 'primary.light',
                                color: 'white',
                                padding: 2,
                                mt: 1.5,
                                fontWeight: 600,
                                '& .MuiChip-icon': {
                                    color: 'white',
                                },
                            }}
                        />
                        {
                            isEditMode &&
                            <>
                                <Fab
                                    size='small'
                                    aria-label="like"
                                    sx={{
                                        position: 'absolute',
                                        top: 6,
                                        right: 64,
                                        boxShadow: 3,
                                    }}
                                    color={initialNews?.IsPinned ? 'primary' : undefined}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handleUpdatePinned();
                                    }}
                                >
                                    <Pin
                                        style={{
                                            transform: 'rotate(45deg)',
                                        }}
                                    />
                                </Fab>
                                {
                                    isClickEdit ? (
                                        <Fab
                                            size='small'
                                            aria-label="like"
                                            sx={{
                                                position: 'absolute',
                                                top: 6,
                                                right: 16,
                                                boxShadow: 3,
                                            }}
                                            color={'secondary'}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleUpdateNews()
                                            }}
                                        >
                                            <BadgeCheck />
                                        </Fab>
                                    ) : (
                                        <Fab
                                            size='small'
                                            aria-label="like"
                                            sx={{
                                                position: 'absolute',
                                                top: 6,
                                                right: 16,
                                                boxShadow: 3,
                                            }}
                                            color={'secondary'}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setIsClickEdit?.(true)
                                            }}
                                        >
                                            <Pencil />
                                        </Fab>
                                    )
                                }
                            </>
                        }
                    </Grid>

                    <Collapse in={isClickEdit} timeout={400} sx={{ mt: 2 }}>
                        <Grid container
                            size={{ xs: 12 }}
                            spacing={2}
                            sx={{
                                px: 1, mt: 2
                            }}
                        >
                            <Grid
                                container
                                size={{ xs: 6 }}
                                spacing={2}
                            >
                                <Grid size={{ xs: 12 }} >
                                    <TextField
                                        label='Title'
                                        name='Title'
                                        fullWidth
                                        variant="outlined"
                                        value={initialNews?.Title ?? ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter the news title"
                                        error={!!errors.Title}
                                        helperText={errors.Title}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        label='Summary'
                                        name='Summary'
                                        multiline
                                        rows={4}
                                        fullWidth
                                        variant="outlined"
                                        value={initialNews?.Summary ?? ''}
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
                            <Grid container
                                size={{ xs: 6 }}
                                sx={{
                                    border: '1px solid #c5c5c6',
                                    borderRadius: "10px",
                                    p: 2,
                                    minHeight: '100%'
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
                                            onChange={(newValue) => handleDateChange('DisplayStart', newValue)}
                                            maxDate={initialNews.DisplayEnd ? dayjs(initialNews.DisplayEnd) : undefined}
                                            slots={{
                                                openPickerIcon: CalendarMonth,
                                            }}
                                            format="DD/MM/YYYY"
                                            open={openStartPicker}
                                            onOpen={() => setOpenStartPicker(true)}
                                            onClose={() => setOpenStartPicker(false)}
                                            sx={{ width: '100%' }}
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
                                            onChange={(newValue) => handleDateChange('DisplayEnd', newValue)}
                                            minDate={initialNews.DisplayStart ? dayjs(initialNews.DisplayStart) : undefined}
                                            slots={{
                                                openPickerIcon: CalendarMonth,
                                            }}
                                            format="DD/MM/YYYY"
                                            open={openEndPicker}
                                            onOpen={() => setOpenEndPicker(true)}
                                            onClose={() => setOpenEndPicker(false)}
                                            sx={{ width: '100%' }}
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
                                    label='Content'
                                    name='FullContent'
                                    multiline
                                    rows={4}
                                    fullWidth
                                    variant="outlined"
                                    value={initialNews?.FullContent ?? ''}
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

                    <Collapse in={!isClickEdit} timeout={400} sx={{ width: '100%' }}>
                        <Grid size={{ xs: 12 }} sx={{ px: 1, mt: 2 }}>
                            <Typography variant='h5' fontWeight={600} gutterBottom width={'100%'}>
                                {initialNews?.Title}
                            </Typography>
                            <Typography variant='body1' fontSize={16} gutterBottom sx={{ whiteSpace: 'pre-line' }}>
                                {initialNews?.Summary}
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant='body1' fontSize={14} sx={{ whiteSpace: 'pre-line' }}>
                                {initialNews?.FullContent}
                            </Typography>
                        </Grid>
                    </Collapse>

                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="outlined" startIcon={<CircleX size={18} />}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NewsDetailPopup;
