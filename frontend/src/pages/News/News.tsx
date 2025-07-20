import { Box, Button, Card, CardContent, CardMedia, Chip, Collapse, Container, Fade, FormControlLabel, Grid, Stack, Switch, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { NewsInterface } from '../../interfaces/News'
import { apiUrl, CreateNews, CreateNewsImages, DeleteNewsByID, DeleteNewsImagesByNewsID, GetUserById, ListNews, ListNewsOrdered, socketUrl } from '../../services/http';
import { TextField } from '../../components/TextField/TextField';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faGear } from '@fortawesome/free-solid-svg-icons';
import { BrushCleaning, CirclePlus, SquarePlus } from 'lucide-react';
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
import NewsCard from '../../components/NewsCard/NewsCard';
import NewsDetailPopup from '../../components/NewsDetailPopup/NewsDetailPopup';
import { MaterialUISwitch } from '../../components/MaterialUISwitch/MaterialUISwitch';
import { io } from 'socket.io-client';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import { handleDeleteNews } from '../../utils/handleDeleteNews';

function News() {
    const [news, setNews] = useState<NewsInterface[]>([])
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isClickEdit, setIsClickEdit] = useState(false);
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
    const [isDeleteButtonActive, setIsDeleteButtonActive] = useState(false);
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [dateRange, setDateRange] = useState<{ start: Dayjs | null; end: Dayjs | null }>({
        start: null,
        end: null,
    });
    const [files, setFiles] = useState<File[]>([]);
    const [selectedNews, setSelectedNews] = useState<NewsInterface>({})
    const [openPopupCard, setOpenPopupCard] = useState<boolean>(false)

    const [openEndPicker, setOpenEndPicker] = useState(false);
    const [openStartPicker, setOpenStartPicker] = useState(false);
    const [openDelete, setOpenDelete] = useState(false)

    const getNews = async () => {
        try {
            const res = await ListNewsOrdered()
            if (res) {
                setNews([...res])
            }
        } catch (error) {
            console.error("Error fetching news:", error);
        }
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

        const userID = Number(localStorage.getItem("userId"))
        if (!userID) {
            handleSetAlert("error", "UserID not found");
            setIsSubmitButtonActive(false);
            return;
        } else {
            formData.UserID = userID
        }

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
                formDataFile.append("userID", String(userID));
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
                handleResetData()
                setIsSubmitButtonActive(false)
                getNews()
            }, 1800);
        } catch (error) {
            console.error("🚨 Error submitting request:", error);
            handleSetAlert("error", "An unexpected error occurred");
            setIsSubmitButtonActive(false);
        }
    };

    const handleClickDeleteNews = () => {
        handleDeleteNews({
            selectedNews,
            setIsDeleteButtonActive,
            handleSetAlert,
            setIsClickEdit,
            setAlerts,
            setFiles,
            onUpdated: getNews,
            successAlert: true,
        })
    }

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
            newErrors.Title = "Please enter a news title.";
        } else if (!formData.Summary?.trim()) {
            newErrors.Summary = "Please provide a short summary of the news.";
        } else if (!formData.FullContent?.trim()) {
            newErrors.FullContent = "Please enter the full content of the news.";
        } else if (!formData.DisplayStart) {
            newErrors.DisplayStart = "Please select the start date for displaying the news.";
        } else if (!formData.DisplayEnd) {
            newErrors.DisplayEnd = "Please select the end date for displaying the news.";
        }

        if (formData.DisplayStart && formData.DisplayEnd) {
            const start = new Date(formData.DisplayStart);
            const end = new Date(formData.DisplayEnd);
            if (end < start) {
                newErrors.DisplayEnd = "The end date must be later than the start date.";
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
                await Promise.all([getNews()]);
                setIsLoadingData(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (openPopupCard) {
            document.getElementById('root')?.setAttribute('inert', '');
        } else {
            document.getElementById('root')?.removeAttribute('inert');
        }
    }, [openPopupCard]);

    return (
        <Box className="news-page">
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            <NewsDetailPopup
                open={openPopupCard}
                onClose={() => setOpenPopupCard(false)}
                selectedNews={selectedNews}
                isEditMode={isEditMode}
                isClickEdit={isClickEdit}
                setIsClickEdit={setIsClickEdit}
                onUpdated={getNews}
            />

            <ConfirmDialog
                open={openDelete}
                setOpenConfirm={setOpenDelete}
                handleFunction={handleClickDeleteNews}
                title="Confirm News Deletion"
                message="Are you sure you want to delete this news? This action cannot be undone."
                buttonActive={isSubmitButtonActive}
            />

            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}
                    sx={{
                        alignItems: 'flex-start'
                    }}
                >
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
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <Typography sx={{ fontWeight: 500 }}>
                                    {isEditMode ? "Editing Enabled" : "View Only"}
                                </Typography>
                                <MaterialUISwitch sx={{ m: 1 }}
                                    onChange={(event) =>
                                        setIsEditMode(event.target.checked)
                                    }
                                />
                            </Stack>
                        </Grid>
                    }

                    <Grid className="title-box" size={{ xs: 12 }}>
                        <Typography variant="body1" className="title" sx={{ fontWeight: 500 }}>
                            News from management and teams to foster understanding and connection within the organization.
                        </Typography>
                    </Grid>

                    {
                        <Collapse in={isEditMode} timeout={400} unmountOnExit>
                            <Card sx={{
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
                                                            border: '1px solid #c5c5c6',
                                                            borderRadius: "10px",
                                                            p: 2
                                                        }}
                                                        spacing={1.2}
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
                                                <Button 
                                                    variant='outlinedGray'
                                                    startIcon={<BrushCleaning size={18} strokeWidth={2}/>}
                                                    onClick={handleResetData}
                                                >
                                                    Clear
                                                </Button>
                                                <Button
                                                    variant='contained'
                                                    type='submit'
                                                    disabled={isSubmitButtonActive}
                                                    startIcon={<SquarePlus size={18} strokeWidth={2}/>}
                                                >
                                                    Create News
                                                </Button>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Card>
                        </Collapse>
                    }
                    <Grid container size={{ xs: 12 }} spacing={3}>
                        {news.map((news) => (
                            <NewsCard
                                key={JSON.stringify(news)}
                                news={news}
                                gridSize={{ xs: 12, sm: 12, lg: 6, xl: 4 }}
                                isEditMode={isEditMode}
                                onOpenPopup={() => setOpenPopupCard(true)}
                                setSelectedNews={setSelectedNews}
                                setIsClickEdit={setIsClickEdit}
                                setOpenDelete={setOpenDelete}
                            />
                        ))}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default News