import { Facebook, Instagram, Twitter } from '@mui/icons-material';
import { Box, Divider, Grid, IconButton, List, ListItem, ListItemText, Typography } from '@mui/material';
import { Container } from '@mui/system';
import { FlaskConical } from 'lucide-react';

function Footer() {
    return (
        <Box sx={{
            bgcolor: 'background.secondary',
            color: 'text.secondary',
            py: 8,
            px: 5,
            zIndex: 99
        }}
        >
            <Container maxWidth={false}>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <FlaskConical size={24} />
                            <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                                SCIPARK
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            ศูนย์วิทยาศาสตร์และเทคโนโลยีชั้นนำ มุ่งสร้างสรรค์นวัตกรรมและสนับสนุนการทำงานอย่างมีประสิทธิภาพ
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            {/* Social Media Icons */}
                            <IconButton size="small" sx={{ bgcolor: 'primary.main', color: 'white' }}>
                                <Facebook/>
                            </IconButton>
                            <IconButton size="small" sx={{ bgcolor: 'primary.main', color: 'white' }}>
                                <Instagram/>
                            </IconButton>
                            <IconButton size="small" sx={{ bgcolor: 'primary.main', color: 'white' }}>
                                <Twitter/>
                            </IconButton>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                            ระบบหลัก
                        </Typography>
                        <List dense disablePadding>
                            <ListItem disableGutters>
                                <ListItemText primary="ระบบแจ้งซ่อม" />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemText primary="ระบบจองห้องประชุม" />
                            </ListItem>
                        </List>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                            เกี่ยวกับเรา
                        </Typography>
                        <List dense disablePadding>
                            <ListItem disableGutters>
                                <ListItemText primary="ประวัติองค์กร" />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemText primary="พันธกิจ" />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemText primary="ทีมงาน" />
                            </ListItem>
                        </List>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                            นโยบาย
                        </Typography>
                        <List dense disablePadding>
                            <ListItem disableGutters>
                                <ListItemText primary="นโยบายความเป็นส่วนตัว" />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemText primary="เงื่อนไขการใช้งาน" />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemText primary="วิธีใช้งานระบบ" />
                            </ListItem>
                        </List>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                            ติดต่อเรา
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            อาคารศูนย์วิทยาศาสตร์<br />
                            เลขที่ 123 ถนนวิทยาศาสตร์<br />
                            กรุงเทพฯ 10900<br />
                            โทร: 02-123-4567<br />
                            อีเมล: contact@scipark.org
                        </Typography>
                    </Grid>
                </Grid>

                <Divider sx={{ mt: 4, mb: 4 }} />

                <Typography variant="body2" color="text.secondary" align="center">
                    © {new Date().getFullYear()} Scipark. สงวนลิขสิทธิ์.
                </Typography>
            </Container>
        </Box>
    )
}
export default Footer;