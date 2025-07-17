import { Card, CardContent, Chip, Grid, Typography, Box, Fab, Collapse, Zoom, Tooltip } from '@mui/material';
import React, { useState } from 'react';
import { NewsInterface } from '../../interfaces/News';
import { apiUrl, UpdateNewsByID } from '../../services/http';
import { Pencil, Pin } from 'lucide-react';
import theme from '../../styles/Theme';
import formatNewsDate from '../../utils/formatNewsDate';

interface NewsCardProps {
    news: NewsInterface;
    setSelectedNews: React.Dispatch<React.SetStateAction<NewsInterface>>;
    onOpenPopup: () => void;
    gridSize?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
    isEditMode?: boolean;
    setIsClickEdit?: React.Dispatch<React.SetStateAction<boolean>>;
}

const NewsCard: React.FC<NewsCardProps> = ({
    news: initialNews,
    setSelectedNews,
    onOpenPopup,
    gridSize = { xs: 12, sm: 6, md: 6 },
    isEditMode = false,
    setIsClickEdit,
}) => {
    const [news, setNews] = useState<NewsInterface>(initialNews);

    const handleUpdateNews = async () => {
        try {
            const newsData: NewsInterface = {
                IsPinned: !news.IsPinned
            }
            const resNews = await UpdateNewsByID(newsData, news.ID)
            if (resNews) {
                setNews((prev) => ({
                    ...prev,
                    IsPinned: !prev.IsPinned
                }));

                if (news.IsPinned) {
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

    return (
        <Grid size={{ ...gridSize }} key={news.ID} >
            <Card
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                }}
                onClick={() => {
                    setSelectedNews(news)
                    onOpenPopup();
                }}
            >
                <Box
                    sx={{
                        overflow: 'hidden',
                        height: 400,
                        position: 'relative',
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
                        src={
                            news.NewsImages && news.NewsImages.length > 0
                                ? `${apiUrl}/${news.NewsImages[0].FilePath}?t=${news.NewsImages[0].UpdatedAt}`
                                : 'https://placehold.co/600x400'
                        }
                        alt={news.Title}
                    />

                    <Zoom
                        in={isEditMode}
                        timeout={400}
                        unmountOnExit
                    >
                        <Tooltip title={news.IsPinned ? 'Unpin' : ' Pin to top'}>
                            <Fab
                                size='small'
                                sx={{
                                    position: 'absolute',
                                    top: 16,
                                    right: 66,
                                    boxShadow: 3,
                                }}
                                color={news.IsPinned ? 'primary' : undefined}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    handleUpdateNews();
                                }}
                            >
                                <Pin
                                    style={{
                                        transform: 'rotate(45deg)',
                                    }}
                                />
                            </Fab>
                        </Tooltip>

                    </Zoom>
                    <Zoom
                        in={isEditMode}
                        timeout={300}
                        unmountOnExit
                    >
                        <Tooltip title='Edit'>
                            <Fab
                                size='small'
                                sx={{
                                    position: 'absolute',
                                    top: 16,
                                    right: 16,
                                    boxShadow: 3,
                                }}
                                color={'secondary'}
                                onClick={(event) => {
                                    event.stopPropagation()
                                    setSelectedNews(news)
                                    onOpenPopup()
                                    setIsClickEdit?.(true)
                                }}
                            >
                                <Pencil />
                            </Fab>
                        </Tooltip>
                    </Zoom>
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 1.5 }}>
                        <Chip
                            label={formatNewsDate(news.DisplayStart ?? '')}
                            size="small"
                            sx={{
                                bgcolor: 'primary.light',
                                color: 'white',
                                padding: 2,
                                fontWeight: 600,
                            }}
                        />
                    </Box>
                    <Box sx={{ px: 1 }}>
                        <Typography gutterBottom variant="h5" sx={{ fontWeight: 500 }}>
                            {news.Title}
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
                                    {`${formatNewsDate(news.DisplayStart ?? '')} - ${formatNewsDate(news.DisplayStart ?? '')}`}
                                </Typography>
                            </Box>
                        </Collapse>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {news.Summary}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );
};

export default NewsCard;