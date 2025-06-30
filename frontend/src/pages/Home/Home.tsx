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

// ข้อมูลองค์กร
const organizationInfo = {
    name: "Regional Science Park Northeast 2",
    description: "ศูนย์วิทยาศาสตร์และเทคโนโลยีชั้นนำ มุ่งสร้างสรรค์นวัตกรรมและสนับสนุนการทำงานอย่างมีประสิทธิภาพ",
    mission: "มุ่งมั่นพัฒนาและสนับสนุนงานวิจัยด้านวิทยาศาสตร์และเทคโนโลยี เพื่อยกระดับคุณภาพชีวิตและขับเคลื่อนเศรษฐกิจของประเทศ",
    about: "เราให้บริการระบบสนับสนุนการทำงานที่ครบวงจร ทั้งระบบแจ้งซ่อม ระบบจองห้องประชุม และบริการอื่นๆ อีกมากมาย เพื่อให้บุคลากรสามารถทำงานได้อย่างมีประสิทธิภาพสูงสุด"
};

// ข้อมูลข่าวสารจำลอง
const newsItems = [
    {
        id: 1,
        title: "เปิดตัวระบบ Scipark ใหม่",
        date: "15 พฤษภาคม 2025",
        summary: "เรายินดีที่จะประกาศการเปิดตัวระบบ Scipark ที่ได้รับการปรับปรุงใหม่ พร้อมฟีเจอร์การแจ้งซ่อมและการจองห้องประชุมที่ทันสมัย",
        image: "/api/placeholder/400/250"
    },
    {
        id: 2,
        title: "การประชุมวิทยาศาสตร์ประจำปี 2025",
        date: "10 พฤษภาคม 2025",
        summary: "เตรียมพบกับการประชุมวิทยาศาสตร์ประจำปี 2025 ซึ่งจะจัดขึ้นในเดือนมิถุนายนนี้ พร้อมวิทยากรระดับนานาชาติ",
        image: "/api/placeholder/400/250"
    },
    {
        id: 3,
        title: "เปิดรับสมัครโครงการวิจัยใหม่",
        date: "5 พฤษภาคม 2025",
        summary: "Scipark เปิดรับข้อเสนอโครงการวิจัยใหม่ในด้านเทคโนโลยีสะอาดและพลังงานทดแทน สมัครได้ตั้งแต่วันนี้ถึง 30 มิถุนายน",
        image: "/api/placeholder/400/250"
    }
];

// ฟีเจอร์หลักของระบบ
const mainFeatures = [
    {
        icon: <Wrench size={40} />,
        title: "ระบบแจ้งซ่อม",
        description: "แจ้งซ่อมอุปกรณ์และสิ่งอำนวยความสะดวกได้อย่างรวดเร็ว พร้อมติดตามสถานะงานซ่อมแบบเรียลไทม์",
        path: "/maintenance/my-maintenance-request"
    },
    {
        icon: <DoorOpen size={40} />,
        title: "ระบบจองห้องประชุม",
        description: "จองห้องประชุมและทรัพยากรได้สะดวก ดูตารางการใช้งานห้องและจัดการการประชุมได้ในที่เดียว",
        path: "/booking-room"
    },
];

// คอมโพเนนต์หลัก
export default function SciparkHomePage() {

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
                                ยินดีต้อนรับสู่
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
                    ระบบหลัก
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
                                เกี่ยวกับ {organizationInfo.name}
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
                                อ่านเพิ่มเติม
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
                    ข่าวสารล่าสุด
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
                                        อ่านต่อ
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
                        ดูข่าวสารทั้งหมด
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
                        สถิติการให้บริการ
                    </Typography>

                    <Grid container spacing={4} justifyContent="center">
                        <Grid size={{ xs: 6, md: 3 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                                    150+
                                </Typography>
                                <Typography variant="body1">
                                    ห้องประชุมให้บริการ
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                                    9,800+
                                </Typography>
                                <Typography variant="body1">
                                    การแจ้งซ่อมสำเร็จ
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                                    98%
                                </Typography>
                                <Typography variant="body1">
                                    ความพึงพอใจ
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                                    24/7
                                </Typography>
                                <Typography variant="body1">
                                    บริการสนับสนุน
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Container>
        </Box>
    );
}