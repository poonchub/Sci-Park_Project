import React, { useState } from 'react';
import { Grid, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Card, CardContent, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { AccessTime, CheckCircle, ErrorOutline } from '@mui/icons-material';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker'; // Import DateRangePicker
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'; // Use Adapter for Dayjs
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'; // Use LocalizationProvider for Date Pickers

import './OutsiderMaintenanceRequest.css'; // Import the CSS file for styling

const OutsiderMaintenanceRequest: React.FC = () => {
  // State for filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null);

  // Sample data for the table
  const rows = [
    { id: 1, date: '26 มีนาคม 2025', status: 'สำเร็จ', details: 'ห้องประชุม ชั้น 3 ห้อง A01', operator: 'Operator Test', phone: '000-000-0000' },
    { id: 2, date: '26 มีนาคม 2025', status: 'รอกำหนดการอนุมัติ', details: 'ห้องประชุม ชั้น 3 ห้อง A01', operator: 'Operator Test', phone: '000-000-0000' },
    { id: 3, date: '26 มีนาคม 2025', status: 'สำเร็จ', details: 'ห้องประชุม ชั้น 3 ห้อง A01', operator: 'Operator Test', phone: '000-000-0000' },
  ];

  // Handle filter change for search and status
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setStatus(e.target.value as string);
  };

  // Handle date range selection
  const handleDateRangeChange = (newRange: [Date, Date] | null) => {
    setSelectedDateRange(newRange);
  };

  return (
    <div className="outsider-maintenance-request">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" className="title">
            รายการแจ้งซ่อม
          </Typography>
        </Grid>

        {/* Status Indicators */}
        <Grid item xs={12} md={3}>
          <Card variant="outlined" className="status-card">
            <CardContent>
              <Typography variant="h6" color="textPrimary">สถานะสำเร็จ</Typography>
              <div className="status-item success">
                <CheckCircle /> <span>3 รายการสำเร็จ</span>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card variant="outlined" className="status-card">
            <CardContent>
              <Typography variant="h6" color="textPrimary">กำลังดำเนินการ</Typography>
              <div className="status-item in-progress">
                <AccessTime /> <span>1 รายการกำลังดำเนินการ</span>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card variant="outlined" className="status-card">
            <CardContent>
              <Typography variant="h6" color="textPrimary">ไม่ผ่านการอนุมัติ</Typography>
              <div className="status-item cancelled">
                <ErrorOutline /> <span>0 รายการไม่ผ่านการอนุมัติ</span>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card variant="outlined" className="status-card">
            <CardContent>
              <Typography variant="h6" color="textPrimary">รอกำหนดการอนุมัติ</Typography>
              <div className="status-item pending">
                <AccessTime /> <span>0 รายการรอกำหนดการอนุมัติ</span>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Filters Section */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth
                label="ค้นหา"
                variant="outlined"
                value={search}
                onChange={handleSearchChange}
              />
            </Grid>

            {/* Date Range Picker */}
            <Grid item xs={6} sm={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateRangePicker
                  value={selectedDateRange}
                  onChange={handleDateRangeChange}
                  localeText={{ start: 'Check-in', end: 'Check-out' }} // Customize the labels
                  calendars={2} // Show two months
                  disableFuture // Disable future dates
                />
              </LocalizationProvider>
            </Grid>

            {/* Status Filter */}
            <Grid item xs={6} sm={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>สถานะทั้งหมด</InputLabel>
                <Select
                  value={status}
                  onChange={handleStatusChange}
                  label="สถานะทั้งหมด"
                >
                  <MenuItem value="ทั้งหมด">ทั้งหมด</MenuItem>
                  <MenuItem value="สำเร็จ">สำเร็จ</MenuItem>
                  <MenuItem value="รอกำหนดการอนุมัติ">รอกำหนดการอนุมัติ</MenuItem>
                  <MenuItem value="ไม่ผ่านการอนุมัติ">ไม่ผ่านการอนุมัติ</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Button variant="contained" color="primary" fullWidth>
                เขียนคำร้องแจ้งซ่อม
              </Button>
            </Grid>
          </Grid>
        </Grid>

        {/* Maintenance Request Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ลำดับ</TableCell>
                  <TableCell>วันที่เริ่มแจ้งซ่อม</TableCell>
                  <TableCell>บริเวณที่แจ้งซ่อม</TableCell>
                  <TableCell>รายละเอียด</TableCell>
                  <TableCell>ผู้ดำเนินการซ่อม</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.details}</TableCell>
                    <TableCell>{row.operator}</TableCell>
                    <TableCell>{row.phone}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color={row.status === 'สำเร็จ' ? 'success' : row.status === 'รอกำหนดการอนุมัติ' ? 'info' : 'error'}
                      >
                        {row.status}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button variant="outlined">ตรวจสอบ</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </div>
  );
};

export default OutsiderMaintenanceRequest;
