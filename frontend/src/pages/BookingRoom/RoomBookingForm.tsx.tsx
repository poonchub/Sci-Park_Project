// ✅ RoomBookingForm.tsx – หน้าจองห้องตาม mockup ที่ 2

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  CardMedia,
  Container,
  Paper,
  Avatar
} from '@mui/material';
import { CalendarMonth, AccessTime, Person, Email, Image } from '@mui/icons-material';
import dayjs from 'dayjs';

const RoomBookingForm = ({ room, onBack }: { room: any; onBack: () => void }) => {
  const [date, setDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [timeOption, setTimeOption] = useState<'half' | 'full'>('half');
  const [timeRange, setTimeRange] = useState<'morning' | 'afternoon'>('morning');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const getPrice = () => (timeOption === 'half' ? room?.HalfDayRate : room?.FullDayRate);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {room?.TypeName}
        </Typography>

        <Grid container spacing={3}>
          {/* ซ้าย: ภาพ + ตัวเลือก */}
          <Grid item xs={12} md={6}>
            <CardMedia
              component="img"
              image="https://www.hoteljosef.com/wp-content/uploads/2024/06/conference-rooms-prague-projector-690x470.jpg"
              alt="room preview"
              sx={{ borderRadius: 2, mb: 2 }}
            />

            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                เลือกวันที่
              </Typography>
              <TextField
                type="date"
                fullWidth
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Box>

            <Box mt={3}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                เลือกระยะเวลา
              </Typography>
              <RadioGroup
                row
                value={timeOption}
                onChange={(e) => setTimeOption(e.target.value as 'half' | 'full')}
              >
                <FormControlLabel
                  value="half"
                  control={<Radio />}
                  label={`ครึ่งวัน (${room?.HalfDayRate?.toLocaleString()} บาท)`}
                />
                <FormControlLabel
                  value="full"
                  control={<Radio />}
                  label={`เต็มวัน (${room?.FullDayRate?.toLocaleString()} บาท)`}
                />
              </RadioGroup>
            </Box>

            {timeOption === 'half' && (
              <Box mt={2}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  เลือกช่วงเวลา
                </Typography>
                <RadioGroup
                  row
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as 'morning' | 'afternoon')}
                >
                  <FormControlLabel
                    value="morning"
                    control={<Radio />}
                    label="ช่วงเช้า (09:00 - 13:00)"
                  />
                  <FormControlLabel
                    value="afternoon"
                    control={<Radio />}
                    label="ช่วงบ่าย (13:00 - 17:00)"
                  />
                </RadioGroup>
              </Box>
            )}
          </Grid>

          {/* ขวา: สรุปการจอง + ฟอร์ม + QR */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                สรุปการจอง
              </Typography>
              <Typography>ห้องประชุม: {room?.TypeName}</Typography>
              <Typography>วันที่: {dayjs(date).format('DD/MM/YYYY')}</Typography>
              <Typography>
                ระยะเวลา: {timeOption === 'half' ? 'ครึ่งวัน (4 ชั่วโมง)' : 'เต็มวัน (8 ชั่วโมง)'}
              </Typography>
              {timeOption === 'half' && (
                <Typography>
                  ช่วงเวลา: {timeRange === 'morning' ? '09:00 - 13:00' : '13:00 - 17:00'}
                </Typography>
              )}
              <Typography mt={1} variant="h6">
                💰 {getPrice()?.toLocaleString()} บาท
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                ข้อมูลผู้จอง
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="ชื่อ-นามสกุล"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    InputProps={{ startAdornment: <Person sx={{ mr: 1 }} /> }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="เบอร์โทรศัพท์"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="อีเมล"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{ startAdornment: <Email sx={{ mr: 1 }} /> }}
                  />
                </Grid>
              </Grid>

              <Box mt={3}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  แนบหลักฐานการโอน
                </Typography>
                <Button variant="outlined" component="label" startIcon={<Image />}>
                  อัปโหลดไฟล์ JPG, PNG
                  <input hidden type="file" accept="image/*" onChange={handleFileChange} />
                </Button>
                {file && <Typography mt={1}>{file.name}</Typography>}
              </Box>

              <Box mt={3}>
                <Typography fontWeight={600} gutterBottom>
                  ช่องทางชำระเงิน
                </Typography>
                <img
                  src="https://promptpay.io/1234567890/86500.png"
                  alt="QR Payment"
                  style={{ width: '100%', maxWidth: '200px', borderRadius: 8 }}
                />
              </Box>

              <Box mt={3}>
                <Button fullWidth variant="contained" size="large">
                  ยืนยันการจอง
                </Button>
              </Box>

              <Box mt={2}>
                <Button fullWidth variant="text" onClick={onBack}>
                  ← กลับหน้าก่อนหน้า
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default RoomBookingForm;
