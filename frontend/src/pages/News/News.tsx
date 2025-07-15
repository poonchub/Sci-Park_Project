import { Box, Button, Card, CardContent, CardMedia, Chip, Container, FormControlLabel, Grid, Switch, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { NewsInterface } from '../../interfaces/News'
import { apiUrl, CreateNews, CreateNewsImages, DeleteNewsByID, DeleteNewsImagesByNewsID, GetUserById, ListNews } from '../../services/http';
import { TextField } from '../../components/TextField/TextField';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { CirclePlus } from 'lucide-react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '../../components/DatePicker/DatePicker';
import { CalendarMonth } from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import ImageUploader from '../../components/ImageUploader/ImageUploader';
import { Android12Switch } from '../../components/Android12Switch/Android12Switch ';
import AlertGroup from '../../components/AlertGroup/AlertGroup';
import { UserInterface } from '../../interfaces/IUser';
import { isAdmin, isManager } from '../../routes';

function News() {
    const [news, setNews] = useState<NewsInterface[]>([])
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<NewsInterface>({
        Title: '',
        Summary: '',
        FullContent: '',
        DisplayStart: '',
        DisplayEnd: '',
        UserID: 0,
        IsPinned: true,
    })
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitButtonActive, setIsSubmitButtonActive] = useState(false);
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [dateRange, setDateRange] = useState<{ start: Dayjs | null; end: Dayjs | null }>({
        start: null,
        end: null,
    });
    const [files, setFiles] = useState<File[]>([]);
    const [user, setUser] = useState<UserInterface>();

    const [openEndPicker, setOpenEndPicker] = useState(false);
    const [openStartPicker, setOpenStartPicker] = useState(false);

    const getNews = async () => {
        try {
            const res = await ListNews()
            if (res) {
                setNews(res)
            }
        } catch (error) {
            console.error("Error fetching news:", error);
        }
    }

    const getUser = async () => {
        try {
            const res = await GetUserById(Number(localStorage.getItem("userId")));
            if (res) {
                setUser(res);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    function formatDate(isoString: string): string {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleDateChange = (field: string, value: dayjs.Dayjs | null) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value ? value.toISOString() : '',
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        setIsSubmitButtonActive(true);
        event.preventDefault();
        if (!validateForm()) {
            setIsSubmitButtonActive(false);
            return;
        }

        if (!user?.ID) {
            handleSetAlert("error", "UserID not found");
            setIsSubmitButtonActive(false);
            return;
        } else {
            formData.UserID = user?.ID
        }

        console.log(files.length)

        if (files.length === 0) {
            handleSetAlert("warning", "No images uploaded");
            setIsSubmitButtonActive(false);
            return;
        }

        try {
            const resNews = await CreateNews(formData)
            if (!resNews) {
                handleSetAlert("error", resNews?.Error || "Failed to create news");
                setIsSubmitButtonActive(false);
                return;
            }

            if (files.length > 0) {
                const formDataFile = new FormData();
                formDataFile.append("userID", String(user.ID));
                formDataFile.append("newsID", resNews.data.ID);

                files.forEach((file) => formDataFile.append("files", file));

                const resImage = await CreateNewsImages(formDataFile);
                if (!resImage) {
                    handleSetAlert("error", resImage?.Error || "Failed to upload images");
                    DeleteNewsByID(resNews.data.ID)
                    DeleteNewsImagesByNewsID(resNews.data.ID)
                    setIsSubmitButtonActive(false);
                    return;
                }
            }

            handleSetAlert("success", "The news has been created successfully.");
            setTimeout(() => {
                getNews()
                handleResetData()
            }, 1800);
        } catch (error) {
            console.error("🚨 Error submitting request:", error);
            handleSetAlert("error", "An unexpected error occurred");
            setIsSubmitButtonActive(false);
        }
    };

    const handleSetAlert = (type: "success" | "error" | "warning", message: string) => {
        setAlerts((prevAlerts) => [...prevAlerts, { type, message }]);
    };

    const handleResetData = () => {
        setFormData({
            Title: '',
            Summary: '',
            FullContent: '',
            DisplayStart: '',
            DisplayEnd: '',
            UserID: 0,
            IsPinned: true,
        });
        setFiles([]);
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.Title?.trim()) {
            newErrors.Title = "Title is required.";
        } else if (!formData.Summary?.trim()) {
            newErrors.Summary = "Summary is required.";
        } else if (!formData.FullContent?.trim()) {
            newErrors.FullContent = "Summary is required.";
        } else if (!formData.DisplayStart) {
            newErrors.DisplayStart = "Start date is required.";
        } else if (!formData.DisplayEnd) {
            newErrors.DisplayEnd = "End date is required.";
        }

        if (formData.DisplayStart && formData.DisplayEnd) {
            const start = new Date(formData.DisplayStart);
            const end = new Date(formData.DisplayEnd);
            if (end < start) {
                newErrors.DisplayEnd = "End date must be after start date.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        if (formData.DisplayStart && !formData.DisplayEnd) {
            setTimeout(() => setOpenEndPicker(true), 200);
        }
    }, [formData.DisplayStart]);

    useEffect(() => {
        if (formData.DisplayEnd && !formData.DisplayStart) {
            setTimeout(() => setOpenStartPicker(true), 200);
        }
    }, [formData.DisplayEnd]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await Promise.all([getNews(), getUser(),]);
                setIsLoadingData(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    return (
        <Box className="news-page">
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    <Grid className="title-box" size={{ xs: 4 }}>
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            Latest News
                        </Typography>
                    </Grid>
                    {
                        (isAdmin || isManager) && <Grid
                            container
                            className="title-box"
                            size={{ xs: 8 }}
                            sx={{
                                justifyContent: 'flex-end'
                            }}
                        >
                            {
                                isEditMode ? (
                                    <Button
                                        variant='outlined'
                                        onClick={() => setIsEditMode(false)}
                                    >
                                        <FontAwesomeIcon icon={faGear} size="lg" />
                                        <Typography variant="textButtonClassic">View Mode</Typography>
                                    </Button>
                                ) : (
                                    <Button
                                        variant='outlined'
                                        onClick={() => setIsEditMode(true)}
                                    >
                                        <FontAwesomeIcon icon={faGear} size="lg" />
                                        <Typography variant="textButtonClassic">Edit Mode</Typography>
                                    </Button>
                                )
                            }

                        </Grid>
                    }

                    {
                        isEditMode && <Card sx={{
                            p: 2,
                            borderRadius: 2,
                            width: '100%',
                            marginBottom: 3
                        }}>
                            <Grid
                                container
                                spacing={2}
                                size={{ xs: 12 }}
                                sx={{ p: 2 }}
                            >
                                <Grid container
                                    sx={{
                                        alignItems: 'center'
                                    }}
                                    spacing={1}
                                >
                                    <CirclePlus size={18} strokeWidth={2} />
                                    <Typography variant='body1' sx={{ fontWeight: 500, fontSize: 20 }}>
                                        Create News Post
                                    </Typography>
                                </Grid>
                                <Grid container
                                    size={{ xs: 12 }}
                                    spacing={4}
                                    component="form"
                                    onSubmit={handleSubmit}
                                    sx={{
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <Grid
                                        container
                                        size={{ xs: 6 }}
                                        spacing={2}
                                    >
                                        <Grid size={{ xs: 12 }} >
                                            <Typography variant="body1" gutterBottom fontWeight={600}>
                                                Title
                                            </Typography>
                                            <TextField
                                                name='Title'
                                                fullWidth
                                                variant="outlined"
                                                value={formData.Title}
                                                onChange={handleInputChange}
                                                placeholder="Enter the news title"
                                                error={!!errors.Title}
                                                helperText={errors.Title}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <Typography variant="body1" gutterBottom fontWeight={600}>
                                                Summary
                                            </Typography>
                                            <TextField
                                                name='Summary'
                                                multiline
                                                rows={4}
                                                fullWidth
                                                variant="outlined"
                                                value={formData.Summary}
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
                                        <Grid size={{ xs: 12 }}>
                                            <Typography variant="body1" gutterBottom fontWeight={600}>
                                                Content
                                            </Typography>
                                            <TextField
                                                name='FullContent'
                                                multiline
                                                rows={4}
                                                fullWidth
                                                variant="outlined"
                                                value={formData.FullContent}
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
                                        <Grid size={{ xs: 12 }} paddingLeft={1}>
                                            <FormControlLabel
                                                control={
                                                    <Android12Switch
                                                        checked={formData.IsPinned}
                                                        onChange={(event) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                IsPinned: event.target.checked,
                                                            }))
                                                        }
                                                    />
                                                }
                                                label="Pin to top"
                                            />
                                        </Grid>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Box display={'flex'} flexDirection={'column'} gap={2}>
                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body1" gutterBottom fontWeight={600}>
                                                    Display Period
                                                </Typography>
                                                <Grid container
                                                    size={{ xs: 12 }}
                                                    sx={{
                                                        border: '1px solid #08aff1',
                                                        borderRadius: "10px",
                                                        p: 2
                                                    }}
                                                    spacing={1}
                                                >
                                                    <Grid size={{ xs: 6 }}>
                                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                            <DatePicker
                                                                label="Start date"
                                                                value={formData.DisplayStart ? dayjs(formData.DisplayStart) : null}
                                                                onChange={(newValue) => handleDateChange('DisplayStart', newValue)}
                                                                maxDate={formData.DisplayEnd ? dayjs(formData.DisplayEnd) : undefined}
                                                                slots={{
                                                                    openPickerIcon: CalendarMonth,
                                                                }}
                                                                open={openStartPicker}
                                                                onOpen={() => setOpenStartPicker(true)}
                                                                onClose={() => setOpenStartPicker(false)}
                                                                sx={{ width: '100%' }}
                                                            />
                                                        </LocalizationProvider>
                                                    </Grid>
                                                    <Grid size={{ xs: 6 }}>
                                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                            <DatePicker
                                                                label="End Date"
                                                                value={formData.DisplayEnd ? dayjs(formData.DisplayEnd) : null}
                                                                onChange={(newValue) => handleDateChange('DisplayEnd', newValue)}
                                                                minDate={formData.DisplayStart ? dayjs(formData.DisplayStart) : undefined}
                                                                slots={{
                                                                    openPickerIcon: CalendarMonth,
                                                                }}
                                                                open={openEndPicker}
                                                                onOpen={() => setOpenEndPicker(true)}
                                                                onClose={() => setOpenEndPicker(false)}
                                                                sx={{ width: '100%' }}
                                                            />
                                                        </LocalizationProvider>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                            <Grid size={{ xs: 12 }}>
                                                <Box display={"flex"}>
                                                    <Typography variant="body1" gutterBottom fontWeight={600}>
                                                        Images
                                                    </Typography>
                                                    <Typography
                                                        variant="body1"
                                                        sx={{
                                                            ml: 0.5,
                                                            color: "gray",
                                                        }}
                                                    >
                                                        (maximum 3 files)
                                                    </Typography>
                                                </Box>

                                                <ImageUploader value={files} onChange={setFiles} setAlerts={setAlerts} maxFiles={3} />
                                            </Grid>
                                        </Box>
                                    </Grid>
                                    <Grid container
                                        size={{ xs: 12 }}
                                        sx={{ justifyContent: 'flex-end' }}
                                    >
                                        <Box display={'flex'} gap={1.5}>
                                            <Button variant='outlinedGray'>
                                                Cancel
                                            </Button>
                                            <Button variant='contained' type='submit'>
                                                Create News
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Card>
                    }

                    <Grid container size={{ xs: 12 }} spacing={3}>
                        {news.map((news) => {
                            return (
                                <Grid key={news.ID} size={{ xs: 6 }}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: 2
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                overflow: 'hidden',
                                                height: 400,
                                                '& img': {
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    transition: 'transform 0.3s ease-in-out',
                                                },
                                                '&:hover img': {
                                                    transform: 'scale(1.05)',
                                                },
                                            }}
                                        >
                                            <img
                                                src={`${apiUrl}/${news.NewsImages?.[0]?.FilePath}`}
                                                alt={news.Title}
                                            />
                                        </Box>

                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Box sx={{ mb: 1.5 }}>
                                                <Chip
                                                    label={formatDate(news.DisplayStart ?? '')}
                                                    size="small"
                                                    sx={{ bgcolor: 'primary.light', color: 'white', padding: 2, fontWeight: 600 }}
                                                />
                                            </Box>
                                            <Box sx={{ px: 1 }}>
                                                <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 'medium' }}>
                                                    {news.Title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {news.Summary}
                                                </Typography>
                                            </Box>

                                        </CardContent>
                                    </Card>
                                </Grid>
                            )
                        })}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default News