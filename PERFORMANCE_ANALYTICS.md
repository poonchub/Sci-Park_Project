# Performance Analytics System

## Overview
ระบบ Performance Analytics สำหรับติดตามประสิทธิภาพของหน้าเว็บหลัก 4 หน้า:
- Home (/)
- Booking Room (/booking-room)
- My Maintenance Request (/my-maintenance-request)
- My Account (/my-account)

## Features

### 1. Date Range Selection
- ผู้ใช้สามารถเลือกช่วงวันที่เริ่มต้นและสิ้นสุด
- ข้อมูลจะอัปเดตอัตโนมัติเมื่อเปลี่ยนวันที่
- รองรับการเลือกวันที่ย้อนหลังได้

### 2. Peak Hour Analysis
- แสดงชั่วโมงที่มีผู้ใช้งานมากที่สุด
- แสดงจำนวน visits ในชั่วโมงนั้น
- ข้อมูลคำนวณจากช่วงวันที่ที่เลือก

### 3. Peak Day Analysis
- แสดงวันที่มีผู้ใช้งานมากที่สุด
- แสดงจำนวน visits ในวันนั้น
- แสดงชื่อวัน (Sunday, Monday, etc.)

### 4. Page Performance Table
- แสดงข้อมูลประสิทธิภาพของ 4 หน้าเว็บหลัก
- ข้อมูลประกอบด้วย:
  - Page Name
  - Total Visits
  - Unique Visitors
  - Average Duration
  - Bounce Rate

## API Endpoints

### GET /analytics/performance
```
Query Parameters:
- start: YYYY-MM-DD (required)
- end: YYYY-MM-DD (required)

Response:
{
  "page_performance": [
    {
      "page_path": "/",
      "page_name": "Home",
      "total_visits": 150,
      "unique_visitors": 120,
      "average_duration": 180.5,
      "bounce_rate": 25.3
    }
  ],
  "peak_hour": {
    "hour": 14,
    "visits": 45
  },
  "peak_day": {
    "day": "Monday",
    "visits": 120
  },
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}
```

## Frontend Components

### Analytics Component
- ใช้ Date picker จาก Overview tab
- แสดงข้อมูลใน Performance tab
- รองรับ Loading states
- แสดง Date range ที่เลือก

### Performance Tab Layout
1. **Date Range Display** - แสดงช่วงวันที่ที่เลือก
2. **Peak Hour Card** - แสดงชั่วโมงที่มีคนใช้เยอะที่สุด
3. **Peak Day Card** - แสดงวันที่มีคนใช้เยอะที่สุด
4. **Page Performance Table** - แสดงข้อมูลประสิทธิภาพของแต่ละหน้า

## Database Queries

### Peak Hour Query
```sql
SELECT CAST(strftime('%H', visit_time) AS INTEGER) as hour, COUNT(*) as count
FROM analytics
WHERE visit_time >= ? AND visit_time <= ?
GROUP BY hour
ORDER BY count DESC
LIMIT 1
```

### Peak Day Query
```sql
SELECT strftime('%w', visit_time) as day, COUNT(*) as count
FROM analytics
WHERE visit_time >= ? AND visit_time <= ?
GROUP BY day
ORDER BY count DESC
LIMIT 1
```

### Page Performance Query
```sql
SELECT * FROM page_analytics
WHERE page_path IN ('/', '/booking-room', '/my-maintenance-request', '/my-account')
ORDER BY total_visits DESC
```

## Usage

1. เปิดหน้า Analytics Dashboard
2. เลือกวันที่เริ่มต้นและสิ้นสุดใน Date picker
3. คลิกที่ Performance tab
4. ดูข้อมูล Peak Hour, Peak Day และ Page Performance

## Error Handling

- ตรวจสอบรูปแบบวันที่ (YYYY-MM-DD)
- ตรวจสอบว่าวันสิ้นสุดไม่เกินวันปัจจุบัน
- ตรวจสอบว่าวันสิ้นสุดต้องมากกว่าวันเริ่มต้น
- แสดงข้อความ "No data available" เมื่อไม่มีข้อมูล

## Future Enhancements

1. **Export Data** - เพิ่มฟีเจอร์ส่งออกข้อมูลเป็น CSV/Excel
2. **Charts** - เพิ่มกราฟแสดงแนวโน้ม
3. **Real-time Updates** - อัปเดตข้อมูลแบบ real-time
4. **Custom Date Ranges** - เพิ่มตัวเลือกช่วงวันที่แบบ preset
5. **Comparative Analysis** - เปรียบเทียบข้อมูลระหว่างช่วงเวลา 