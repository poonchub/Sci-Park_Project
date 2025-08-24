import {
    Typography,
    Container,
    Box,
    Card,
    CardContent,
    Grid,
    Button,
    Paper,
    Skeleton,
} from '@mui/material';

import {
    Wrench,
    DoorOpen,
    ArrowRight,
    BookMarked,
    Newspaper,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { analyticsService, KEY_PAGES } from '../../services/analyticsService';
import { useInteractionTracker } from '../../hooks/useInteractionTracker';
import { GetOrganizationInfo, ListPinnedNewsPeriod, ListUnpinnedNewsPeriod } from '../../services/http';
import { NewsInterface } from '../../interfaces/News';
import NewsCard from '../../components/NewsCard/NewsCard';
import NewsDetailPopup from '../../components/NewsDetailPopup/NewsDetailPopup';
import { OrganizationInfoInterface } from '../../interfaces/IOrganizationInfo';

// ฟีเจอร์หลักของระบบ
const mainFeatures = [
    {
        icon: <Wrench size={40} />,
        title: "Maintenance Request",
        description: "Quickly report issues with equipment and facilities, and track repair status in real-time.",
        path: "/maintenance/my-maintenance-request"
    },
    {
        icon: <DoorOpen size={40} />,
        title: "Meeting Room Booking",
        description: "Easily book meeting rooms and resources, view room schedules, and manage meetings all in one place.",
        path: "/booking-room"
    },
];

// คอมโพเนนต์หลัก
export default function SciparkHomePage() {
    const [news, setNews] = useState<NewsInterface[]>([])
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [openPopupCard, setOpenPopupCard] = useState<boolean>(false)
    const [selectedNews, setSelectedNews] = useState<NewsInterface>({})
    const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfoInterface>({})

    // Initialize interaction tracker
    const { getInteractionCount } = useInteractionTracker({
        pagePath: KEY_PAGES.HOME,

    });

    const getOrganizationInfo = async () => {
        try {
            const res = await GetOrganizationInfo()
            if (res) {
                setOrganizationInfo(res)
            }
        } catch (error) {
            console.error("Error fetching organization info:", error);
        }
    }

    const getNews = async () => {
        try {
            const pinnedNews = await ListPinnedNewsPeriod();
            if (!pinnedNews) {
                setNews([]);
                return;
            }

            let combinedNews = [...pinnedNews];
            if (pinnedNews.length < 3) {
                const needed = 3 - pinnedNews.length;
                const orderedNews = await ListUnpinnedNewsPeriod(needed);
                console.log("orderedNews", orderedNews)
                if (orderedNews) {
                    const pinnedIds = new Set(pinnedNews.map((item: any) => item.ID));
                    const filteredOrderedNews = orderedNews.filter((item: any) => !pinnedIds.has(item.ID));

                    combinedNews = combinedNews.concat(filteredOrderedNews.slice(0, needed));
                }
            }

            setNews(combinedNews);
        } catch (error) {
            console.error("Error fetching news:", error);
        }
    }

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await Promise.all([
                    getNews(),
                    getOrganizationInfo(),
                ]);
                setIsLoadingData(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        const startTime = Date.now();
        let sent = false;

        // ส่ง request ตอนเข้า (duration = 0)
        analyticsService.trackPageVisit({
            user_id: Number(localStorage.getItem('userId')),
            page_path: KEY_PAGES.HOME,
            page_name: 'Home Page',
            duration: 0, // ตอนเข้า duration = 0
            is_bounce: false,
        });

        // ฟังก์ชันส่ง analytics ตอนออก
        const sendAnalyticsOnLeave = (isBounce: boolean) => {
            if (sent) {
                return;
            }
            sent = true;
            const duration = Math.floor((Date.now() - startTime) / 1000);
            analyticsService.trackPageVisit({
                user_id: Number(localStorage.getItem('userId')),
                page_path: KEY_PAGES.HOME,
                page_name: 'Home Page',
                duration,
                is_bounce: isBounce,
                interaction_count: getInteractionCount(),
            });
        };

        // ออกจากหน้าแบบปิด tab/refresh
        const handleBeforeUnload = () => {
            sendAnalyticsOnLeave(true);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // ออกจากหน้าแบบ SPA (React)
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            sendAnalyticsOnLeave(false);
        };
    }, []);

    return (
        <Box className="home-page">

            <NewsDetailPopup
                open={openPopupCard}
                onClose={() => setOpenPopupCard(false)}
                selectedNews={selectedNews}
            />

            {
                isLoadingData ? (
                    <Skeleton variant="rectangular" width="100%" height={"87vh"} sx={{ borderRadius: 2 }} />
                ) : (
                    <>
                        {/* Hero Section */}
                        <Box
                            sx={{
                                position: 'relative',
                                bgcolor: 'primary.main',
                                color: 'white',
                                pt: 8,
                                pb: 6,
                                overflow: 'hidden'
                            }}
                        >
                            <Container maxWidth={'xl'}>
                                <Grid container spacing={4} alignItems="center" size={{ xs: 12 }}>
                                    <Grid size={{ xs: 12, lg: 6 }}>
                                        <Typography
                                            component="h2"
                                            variant="h4"
                                            align="left"
                                            gutterBottom
                                            sx={{ fontWeight: 'bold' }}
                                        >
                                            Welcome to
                                        </Typography>
                                        <Typography
                                            component="h1"
                                            variant="h2"
                                            align="left"
                                            gutterBottom
                                            sx={{ fontWeight: 'bold' }}
                                        >
                                            {organizationInfo.NameEN}
                                        </Typography>
                                        <Typography variant="h5">
                                            {organizationInfo.Slogan}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Container>

                            {/* ลวดลายเพิ่มความสวยงาม */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: -100,
                                    right: -100,
                                    width: 300,
                                    height: 300,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    zIndex: 0,
                                }}
                            />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: -50,
                                    left: -50,
                                    width: 200,
                                    height: 200,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(255,255,255,0.07)',
                                    zIndex: 0,
                                }}
                            />
                        </Box>

                        {/* Main Content */}
                        <Container maxWidth={'xl'} sx={{ padding: '0px 0px !important' }}>
                            {/* Quick Access Cards */}
                            <Box sx={{
                                display: 'flex',
                                gap: 1,
                                mt: 6,
                                mb: 2
                            }}>
                                <BookMarked size={34}/>
                                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    Main Features
                                </Typography>
                            </Box>


                            <Grid container spacing={4}>
                                {mainFeatures.map((feature, index) => (
                                    <Grid size={{ xs: 12, md: (12 / mainFeatures.length) }} key={index}>
                                        <Link to={feature.path}>
                                            <Card
                                                sx={{
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    transition: 'transform 0.3s, box-shadow 0.3s',
                                                    '&:hover': {
                                                        transform: 'translateY(-5px)',
                                                        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                                                    }
                                                }}
                                            >
                                                <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                                                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                                                        {feature.icon}
                                                    </Box>
                                                    <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 'bold' }}>
                                                        {feature.title}
                                                    </Typography>
                                                    <Typography variant="body1" color="text.secondary">
                                                        {feature.description}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* About Organization */}
                            <Paper
                                elevation={0}
                                sx={{
                                    mt: 8,
                                    mb: 8,
                                    p: 4,
                                    borderRadius: 2,
                                    bgcolor: 'background.paper',
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <Grid container spacing={4} alignItems="center">
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                                            {organizationInfo.NameEN}
                                        </Typography>
                                        <Typography variant="body1">
                                            {organizationInfo.Description}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Box
                                            component="img"
                                            src="./background/SP_NON.jpg"
                                            alt="About Scipark"
                                            sx={{
                                                width: '100%',
                                                borderRadius: 2,
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Latest News */}
                            <Box sx={{
                                display: 'flex',
                                gap: 1,
                                mt: 6,
                                mb: 2
                            }}>
                                <Newspaper size={34}/>
                                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    Latest News
                                </Typography>
                            </Box>

                            <Grid container spacing={4}>
                                {news.map((news) => (
                                    <NewsCard
                                        key={news.ID}
                                        news={news}
                                        gridSize={{ xs: 12, sm: 12, lg: 6, xl: 4 }}
                                        onOpenPopup={() => setOpenPopupCard(true)}
                                        setSelectedNews={setSelectedNews}
                                    />
                                ))}
                            </Grid>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                <Link to='/news'>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        endIcon={<ArrowRight />}
                                    >
                                        View All News
                                    </Button>
                                </Link>
                            </Box>
                        </Container>
                    </>
                )
            }

        </Box>
    );
}