import {
    Typography,
    Container,
    Box,
    Card,
    CardContent,
    CardMedia,
    Grid,
    Button,
    Paper,
    Chip,
} from '@mui/material';

import {
    Wrench,
    DoorOpen,
    ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { analyticsService, KEY_PAGES } from '../../services/analyticsService';
import { useInteractionTracker } from '../../hooks/useInteractionTracker';

// ข้อมูลองค์กร
const organizationInfo = {
    name: "Regional Science Park Northeast 2",
    description: "A leading science and technology center committed to innovation and supporting efficient work processes.",
    mission: "Dedicated to developing and supporting research in science and technology to enhance quality of life and drive the nation's economy.",
    about: "We provide a comprehensive support system including repair requests, meeting room bookings, and many other services to enable personnel to work at their highest efficiency."
};

// Sample news data
const newsItems = [
    {
        id: 1,
        title: "Launch of the New Scipark System",
        date: "May 15, 2025",
        summary: "We are pleased to announce the launch of the revamped Scipark system featuring modern repair request and meeting room booking capabilities.",
        image: "/api/placeholder/400/250"
    },
    {
        id: 2,
        title: "Annual Science Conference 2025",
        date: "May 10, 2025",
        summary: "Get ready for the 2025 Annual Science Conference happening this June with international speakers.",
        image: "/api/placeholder/400/250"
    },
    {
        id: 3,
        title: "Call for New Research Proposals",
        date: "May 5, 2025",
        summary: "Scipark is accepting new research proposals in clean technology and renewable energy. Applications open now through June 30.",
        image: "/api/placeholder/400/250"
    }
];

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
    const startTimeRef = useRef(Date.now());
    const sentRef = useRef(false);

    // Initialize interaction tracker
    const { getInteractionCount } = useInteractionTracker({
        pagePath: KEY_PAGES.HOME,
        onInteractionChange: (count) => {
            console.log(`[INTERACTION DEBUG] Home - Interaction count updated: ${count}`);
        }
    });

    useEffect(() => {
        const startTime = Date.now();
        let sent = false;

        console.log('[ANALYTICS DEBUG] Home.tsx useEffect triggered - Component mounted');

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
                console.log('[ANALYTICS DEBUG] sendAnalyticsOnLeave called but already sent, skipping...');
                return;
            }
            sent = true;
            const duration = Math.floor((Date.now() - startTime) / 1000);
            console.log('[ANALYTICS DEBUG] Sending analytics:', {
                duration,
                is_bounce: isBounce,
                timestamp: new Date().toISOString(),
                component: 'Home.tsx'
            });
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
            console.log('[ANALYTICS DEBUG] beforeunload event triggered');
            sendAnalyticsOnLeave(true);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // ออกจากหน้าแบบ SPA (React)
        return () => {
            console.log('[ANALYTICS DEBUG] Home.tsx useEffect cleanup - Component unmounting');
            window.removeEventListener('beforeunload', handleBeforeUnload);
            sendAnalyticsOnLeave(false);
        };
    }, []);

    console.log('[ANALYTICS DEBUG] Home.tsx render called');

    return (
        <Box className="home-page">
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
                    <Grid container spacing={4} alignItems="center">
                        <Grid size={{ xs: 12, md: 6 }}>
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
                                {organizationInfo.name}
                            </Typography>
                            <Typography variant="h5">
                                {organizationInfo.description}
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
                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 6, mb: 3, fontWeight: 'bold' }}>
                    Main Features
                </Typography>

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
                            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                About {organizationInfo.name}
                            </Typography>
                            <Typography variant="body1">
                                {organizationInfo.mission}
                            </Typography>
                            <Typography variant="body1">
                                {organizationInfo.about}
                            </Typography>
                            <Button
                                variant="outlined"
                                endIcon={<ArrowRight />}
                                sx={{ mt: 2 }}
                            >
                                Read More
                            </Button>
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
                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 8, mb: 3, fontWeight: 'bold' }}>
                    Latest News
                </Typography>

                <Grid container spacing={4}>
                    {newsItems.map((news) => (
                        <Grid key={news.id} size={{ xs: 12, md: 4 }}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.3s, box-shadow 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: 6,
                                    }
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={news.image}
                                    alt={news.title}
                                />
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ mb: 2 }}>
                                        <Chip
                                            label={news.date}
                                            size="small"
                                            sx={{ bgcolor: 'primary.light', color: 'white' }}
                                        />
                                    </Box>
                                    <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 'medium' }}>
                                        {news.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {news.summary}
                                    </Typography>
                                </CardContent>
                                <Box sx={{ p: 2, pt: 0 }}>
                                    <Button
                                        size="small"
                                        sx={{
                                            color: 'customBlue',
                                            "&:hover": {
                                                background: 'none',
                                                boxShadow: 'none'
                                            }
                                        }}
                                        endIcon={<ArrowRight />}
                                    >
                                        Read More
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        endIcon={<ArrowRight />}
                    >
                        View All News
                    </Button>
                </Box>

                {/* Statistics & Highlights */}
                <Box
                    sx={{
                        mt: 8,
                        mb: 8,
                        p: 6,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        color: 'white'
                    }}
                >
                    <Typography variant="h4" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 4, fontWeight: 'bold' }}>
                        Service Statistics
                    </Typography>

                    <Grid container spacing={4} justifyContent="center">
                        <Grid size={{ xs: 6, md: 3 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                                    150+
                                </Typography>
                                <Typography variant="body1">
                                    Meeting Rooms Available
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                                    9,800+
                                </Typography>
                                <Typography variant="body1">
                                    Completed Repair Requests
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                                    98%
                                </Typography>
                                <Typography variant="body1">
                                    Customer Satisfaction
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                                    24/7
                                </Typography>
                                <Typography variant="body1">
                                    Support Service
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Container>
        </Box>
    );
}