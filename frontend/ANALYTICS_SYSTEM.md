# Analytics System Documentation

## 📊 ภาพรวมระบบ Analytics

ระบบ Analytics ถูกออกแบบมาเพื่อติดตามและวิเคราะห์พฤติกรรมการใช้งานของผู้ใช้ในระบบ Sci-Park โดยเน้นการเก็บข้อมูลเชิงปริมาณมากกว่าข้อมูลส่วนบุคคล

## 🏗️ สถาปัตยกรรมระบบ

### Backend (Go)
- **Entity**: `Analytics`, `UserAnalyticsSummary`, `PageAnalytics`, `SystemAnalytics`
- **Controller**: `Analytics.go` - จัดการ API endpoints
- **Database**: SQLite - เก็บข้อมูล Analytics

### Frontend (React + TypeScript)
- **Component**: `Analytics.tsx` - แสดงกราฟและสถิติ
- **Service**: `analyticsService.ts` - จัดการ API calls
- **Hook**: `useAnalytics.ts` - Track การเยี่ยมชมหน้า

## 📈 ข้อมูลที่เก็บ

### 1. ข้อมูลการเยี่ยมชม (Analytics)
```typescript
{
  user_id: number,
  page_path: string,
  page_name: string,
  session_id: string,
  user_agent: string,
  ip_address: string,
  visit_time: Date,
  duration: number, // วินาที
  referrer: string,
  device_type: string, // mobile, desktop, tablet
  browser: string,
  os: string,
  country: string,
  city: string,
  is_bounce: boolean,
  is_returning: boolean
}
```

### 2. สรุปข้อมูลผู้ใช้ (UserAnalyticsSummary)
```typescript
{
  user_id: number,
  total_visits: number,
  unique_pages: number,
  total_duration: number,
  last_visit: Date,
  most_visited_page: string,
  average_duration: number,
  bounce_rate: number,
  returning_rate: number
}
```

### 3. สถิติหน้า (PageAnalytics)
```typescript
{
  page_path: string,
  page_name: string,
  total_visits: number,
  unique_visitors: number,
  average_duration: number,
  bounce_rate: number,
  last_updated: Date
}
```

### 4. สถิติระบบ (SystemAnalytics)
```typescript
{
  date: Date,
  total_users: number,
  active_users: number,
  total_visits: number,
  total_pages: number,
  average_session: number,
  peak_hour: number,
  peak_day: string
}
```

## 🔌 API Endpoints

### 1. บันทึกการเยี่ยมชม
```http
POST /analytics/track
Content-Type: application/json
Authorization: Bearer <token>

{
  "user_id": 1,
  "page_path": "/dashboard",
  "page_name": "Dashboard",
  "duration": 120,
  "user_agent": "Mozilla/5.0...",
  "device_type": "desktop",
  "browser": "Chrome",
  "os": "Windows"
}
```

### 2. ดึงข้อมูล Dashboard
```http
GET /analytics/dashboard
Authorization: Bearer <token>

Response:
{
  "today_visits": 45,
  "week_visits": 320,
  "month_visits": 1250,
  "popular_pages_today": [...],
  "active_users_today": [...]
}
```

### 3. ดึงข้อมูลผู้ใช้
```http
GET /analytics/user/:user_id
Authorization: Bearer <token>
```

### 4. ดึงข้อมูลหน้า
```http
GET /analytics/page/:page_path
Authorization: Bearer <token>
```

### 5. ดึงข้อมูลระบบ
```http
GET /analytics/system
Authorization: Bearer <token>
```

## 🎯 การใช้งาน

### 1. การติดตั้ง Analytics Hook
```typescript
import { useAnalytics } from '../hooks/useAnalytics';

const MyComponent = () => {
  // Track การเยี่ยมชมอัตโนมัติ
  useAnalytics({ enabled: true, trackDuration: true });
  
  return <div>My Component</div>;
};
```

### 2. การเรียกใช้ Analytics Service
```typescript
import { getDashboardAnalytics, trackPageVisit } from '../services/analyticsService';

// ดึงข้อมูล Dashboard
const loadAnalytics = async () => {
  try {
    const data = await getDashboardAnalytics();
    console.log('Analytics data:', data);
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
};

// บันทึกการเยี่ยมชม
const trackVisit = async () => {
  await trackPageVisit({
    user_id: 1,
    page_path: '/dashboard',
    page_name: 'Dashboard',
    duration: 60,
    user_agent: navigator.userAgent,
    device_type: 'desktop',
    browser: 'Chrome',
    os: 'Windows'
  });
};
```

### 3. การแสดงผล Analytics Component
```typescript
import Analytics from '../components/Analytics/Analytics';

// ใน route หรือ component
<Analytics />
```

## 📊 กราฟและสถิติที่แสดง

### 1. Summary Cards
- **Today's Visits**: จำนวนการเยี่ยมชมวันนี้
- **This Week**: จำนวนการเยี่ยมชมสัปดาห์นี้
- **This Month**: จำนวนการเยี่ยมชมเดือนนี้
- **Active Users Today**: จำนวนผู้ใช้ที่ใช้งานวันนี้

### 2. Time Series Chart
- แสดงแนวโน้มการเยี่ยมชมตามเวลา
- รองรับ Daily, Weekly, Monthly, Yearly
- แสดงข้อมูล Visits และ Users

### 3. Popular Pages Chart
- Pie chart แสดงหน้าที่ได้รับความนิยม
- แสดงสัดส่วนการเยี่ยมชมแต่ละหน้า

### 4. Page Performance Table
- ตารางแสดงรายละเอียดประสิทธิภาพของแต่ละหน้า
- ข้อมูล: Total Visits, Unique Visitors, Avg Duration, Bounce Rate

## 🔧 การตั้งค่า

### 1. Environment Variables
```env
VITE_API_BASE_URL=http://localhost:8080
```

### 2. Cookie Consent
ระบบจะ track การเยี่ยมชมเฉพาะเมื่อผู้ใช้ยอมรับ Analytics cookies

### 3. Privacy Settings
- ไม่เก็บข้อมูลส่วนบุคคลที่ระบุตัวตนได้
- เน้นข้อมูลเชิงปริมาณและสถิติ
- ข้อมูลถูกเก็บในฐานข้อมูลภายในระบบ

## 🚀 การ Deploy

### 1. Backend
```bash
cd backend
go run main.go
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Database Migration
ระบบจะสร้างตาราง Analytics อัตโนมัติเมื่อเริ่มต้น

## 📝 การบำรุงรักษา

### 1. การลบข้อมูลเก่า
```sql
-- ลบข้อมูล Analytics ที่เก่ากว่า 1 ปี
DELETE FROM analytics WHERE visit_time < DATE('now', '-1 year');

-- ลบข้อมูล Summary ที่เก่ากว่า 1 ปี
DELETE FROM user_analytics_summaries WHERE updated_at < DATE('now', '-1 year');
```

### 2. การสำรองข้อมูล
```bash
# สำรองฐานข้อมูล
cp sci-park_web-application.db backup_$(date +%Y%m%d).db
```

### 3. การตรวจสอบประสิทธิภาพ
- ตรวจสอบขนาดฐานข้อมูลเป็นประจำ
- ตรวจสอบ API response time
- ตรวจสอบ error logs

## 🔒 ความปลอดภัย

### 1. การยืนยันตัวตน
- ทุก API endpoint ต้องใช้ JWT token
- ตรวจสอบสิทธิ์การเข้าถึง

### 2. การป้องกันข้อมูล
- ไม่เก็บข้อมูลส่วนบุคคลที่ละเอียดอ่อน
- เข้ารหัสข้อมูลที่สำคัญ
- จำกัดการเข้าถึงฐานข้อมูล

### 3. การตรวจสอบ
- Log การเข้าถึง API
- ตรวจสอบ suspicious activity
- ตั้งค่า rate limiting

## 🐛 การแก้ไขปัญหา

### 1. ข้อมูลไม่แสดง
- ตรวจสอบ API connection
- ตรวจสอบ JWT token
- ตรวจสอบ console errors

### 2. การ Track ไม่ทำงาน
- ตรวจสอบ Cookie Consent
- ตรวจสอบ localStorage token
- ตรวจสอบ network requests

### 3. กราฟไม่แสดง
- ตรวจสอบ recharts installation
- ตรวจสอบ data format
- ตรวจสอบ responsive container

## 📞 การสนับสนุน

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ console logs
2. ตรวจสอบ network tab
3. ตรวจสอบ database connection
4. ติดต่อทีมพัฒนา 