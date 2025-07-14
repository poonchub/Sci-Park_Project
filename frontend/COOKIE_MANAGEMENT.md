# Cookie Management System

## ภาพรวม
ระบบจัดการคุกกี้ที่ครบถ้วนสำหรับการเก็บข้อมูลผู้ใช้ การตั้งค่า และการวิเคราะห์พฤติกรรม

## 🎯 **ลำดับการเริ่มต้น**

### 1. **User Preferences (สำคัญที่สุด)**
- **ไฟล์**: `frontend/src/utils/cookieManager.ts`
- **หน้าที่**: จัดการการตั้งค่าผู้ใช้
- **ข้อมูลที่เก็บ**:
  - ธีม (สว่าง/มืด)
  - ภาษา (ไทย/อังกฤษ)
  - การตั้งค่าแถบเมนู
  - การแจ้งเตือน
  - การบันทึกอัตโนมัติ
  - จำนวนรายการต่อหน้า

### 2. **Analytics & Tracking**
- **ไฟล์**: `frontend/src/components/Analytics/Analytics.tsx`
- **หน้าที่**: วิเคราะห์พฤติกรรมผู้ใช้
- **ข้อมูลที่เก็บ**:
  - ประวัติการเข้าชมหน้า
  - จำนวนครั้งที่เข้าชม
  - หน้าที่เข้าชมบ่อยที่สุด
  - User ID และ Session ID

### 3. **Cookie Consent (GDPR Compliance)**
- **ไฟล์**: `frontend/src/components/CookieConsent/CookieConsent.tsx`
- **หน้าที่**: ขออนุญาตใช้คุกกี้
- **ประเภทคุกกี้**:
  - คุกกี้ที่จำเป็น
  - คุกกี้วิเคราะห์
  - คุกกี้การตั้งค่า
  - คุกกี้การตลาด

## 🛠️ **การใช้งาน**

### การตั้งค่าผู้ใช้
```typescript
import { getUserPreferences, updatePreference } from '../utils/cookieManager';

// อ่านการตั้งค่า
const prefs = getUserPreferences();

// อัปเดตการตั้งค่า
updatePreference('theme', 'dark');
updatePreference('language', 'th');
```

### การติดตามการใช้งาน
```typescript
import { trackPageVisit, getPageVisitHistory } from '../utils/cookieManager';

// บันทึกการเข้าชมหน้า
trackPageVisit('/dashboard');

// อ่านประวัติการเข้าชม
const history = getPageVisitHistory();
```

### การจำการเข้าสู่ระบบ
```typescript
import { setRememberMe, getRememberedEmail } from '../utils/cookieManager';

// จำอีเมล
setRememberMe('user@example.com', true);

// อ่านอีเมลที่จำไว้
const email = getRememberedEmail();
```

## 📊 **ประเภทคุกกี้**

### 1. **Necessary Cookies (จำเป็น)**
- **อายุ**: 1 ปี
- **ข้อมูล**: การตั้งค่าพื้นฐาน
- **ตัวอย่าง**: ธีม, ภาษา, การตั้งค่าแถบเมนู

### 2. **Analytics Cookies (วิเคราะห์)**
- **อายุ**: 7 วัน
- **ข้อมูล**: พฤติกรรมการใช้งาน
- **ตัวอย่าง**: ประวัติการเข้าชม, จำนวนครั้งที่เข้าชม

### 3. **Session Cookies (เซสชัน)**
- **อายุ**: 1 วัน
- **ข้อมูล**: ข้อมูลการเข้าสู่ระบบ
- **ตัวอย่าง**: User ID, Session ID

### 4. **Remember Me Cookies (จำการเข้าสู่ระบบ)**
- **อายุ**: 30 วัน
- **ข้อมูล**: อีเมลสำหรับการเข้าสู่ระบบ
- **ตัวอย่าง**: Remember email

## 🔧 **การตั้งค่า**

### Cookie Options
```typescript
const COOKIE_OPTIONS = {
    expires: 365,        // จำนวนวัน
    path: '/',           // Path ที่ใช้
    secure: true,        // HTTPS เท่านั้น (production)
    sameSite: 'strict',  // ป้องกัน CSRF
};
```

### การตั้งค่าความปลอดภัย
- **Secure**: ใช้ HTTPS เท่านั้นใน production
- **SameSite**: ป้องกัน CSRF attacks
- **HttpOnly**: สำหรับ cookies ที่สำคัญ (ต้องตั้งที่ server)
- **Path**: จำกัดการเข้าถึงเฉพาะ path ที่กำหนด

## 📱 **การใช้งานใน Components**

### UserPreferences Component
```typescript
import UserPreferencesDialog from '../components/UserPreferences/UserPreferences';

// ใช้ใน AppBar หรือ Settings
const [preferencesOpen, setPreferencesOpen] = useState(false);

<UserPreferencesDialog 
    open={preferencesOpen} 
    onClose={() => setPreferencesOpen(false)} 
/>
```

### Analytics Component
```typescript
import Analytics from '../components/Analytics/Analytics';

// ใช้ใน Dashboard หรือ Admin Panel
<Analytics />
```

### Cookie Consent
```typescript
import CookieConsent from '../components/CookieConsent/CookieConsent';

// ใช้ใน App.tsx
<CookieConsent 
    onAccept={(preferences) => {
        console.log('User accepted cookies:', preferences);
    }}
    onDecline={() => {
        console.log('User declined cookies');
    }}
/>
```

## 🔒 **ความปลอดภัย**

### Best Practices
1. **ไม่เก็บข้อมูลที่ละเอียดอ่อน** ใน cookies
2. **ใช้ HTTPS** ใน production
3. **ตั้งค่า SameSite** เป็น 'strict'
4. **จำกัดอายุ** ของ cookies
5. **เข้ารหัสข้อมูล** ที่สำคัญ

### การป้องกัน
```typescript
// ตรวจสอบ HTTPS
const isSecure = window.location.protocol === 'https:';

// ตั้งค่า secure flag
const secureFlag = process.env.NODE_ENV === 'production';

// ตรวจสอบ SameSite support
const supportsSameSite = 'cookieStore' in window;
```

## 📈 **Analytics Features**

### Page Visit Tracking
- บันทึกหน้าที่เข้าชม
- นับจำนวนครั้งที่เข้าชม
- หาหน้าที่เข้าชมบ่อยที่สุด
- แสดงประวัติการเข้าชม

### User Behavior Analysis
- เวลาที่ใช้ในแต่ละหน้า
- ลำดับการเข้าชมหน้า
- การใช้งานฟีเจอร์ต่างๆ
- อุปกรณ์ที่ใช้

## 🎨 **UI/UX Features**

### Theme Management
- สลับระหว่างธีมสว่าง/มืด
- บันทึกการตั้งค่าอัตโนมัติ
- ใช้ CSS variables สำหรับธีม

### Language Management
- สลับภาษาไทย/อังกฤษ
- บันทึกการตั้งค่าภาษา
- ใช้ i18n สำหรับการแปล

### Responsive Design
- รองรับทุกขนาดหน้าจอ
- ปรับ UI ตามการตั้งค่า
- แสดงผลที่เหมาะสมกับอุปกรณ์

## 🚀 **Performance Optimization**

### Cookie Size Management
- จำกัดขนาด cookies
- ใช้ compression สำหรับข้อมูลขนาดใหญ่
- ลบ cookies ที่ไม่จำเป็น

### Caching Strategy
- ใช้ localStorage เป็น backup
- Cache การตั้งค่าที่ใช้บ่อย
- ลดการอ่าน/เขียน cookies

## 📋 **Checklist การใช้งาน**

### ✅ **ขั้นตอนการเริ่มต้น**
- [ ] ติดตั้ง cookieManager utility
- [ ] สร้าง UserPreferences component
- [ ] สร้าง Analytics component
- [ ] สร้าง CookieConsent component
- [ ] เพิ่มใน App.tsx

### ✅ **การทดสอบ**
- [ ] ทดสอบการบันทึกการตั้งค่า
- [ ] ทดสอบการติดตามการใช้งาน
- [ ] ทดสอบ Cookie Consent
- [ ] ทดสอบการล้างข้อมูล
- [ ] ทดสอบการทำงานใน production

### ✅ **การตรวจสอบ**
- [ ] ตรวจสอบความปลอดภัย
- [ ] ตรวจสอบประสิทธิภาพ
- [ ] ตรวจสอบการทำงานข้าม browser
- [ ] ตรวจสอบ GDPR compliance
- [ ] ตรวจสอบการทำงานใน mobile

## 🔄 **การอัปเดตในอนาคต**

### Planned Features
1. **Advanced Analytics**: การวิเคราะห์พฤติกรรมขั้นสูง
2. **A/B Testing**: การทดสอบฟีเจอร์ใหม่
3. **Personalization**: การปรับแต่งเนื้อหาตามผู้ใช้
4. **Cross-Device Sync**: ซิงค์การตั้งค่าระหว่างอุปกรณ์
5. **Privacy Dashboard**: แสดงข้อมูลที่เก็บและให้ผู้ใช้ลบได้

### Performance Improvements
1. **Cookie Compression**: บีบอัดข้อมูลใน cookies
2. **Smart Caching**: ใช้ cache อย่างฉลาด
3. **Lazy Loading**: โหลดข้อมูลเมื่อจำเป็น
4. **Background Sync**: ซิงค์ข้อมูลในพื้นหลัง

## 📚 **References**

- [MDN Web Docs - Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [GDPR Cookie Consent](https://gdpr.eu/cookies/)
- [Cookie Security Best Practices](https://owasp.org/www-project-cheat-sheets/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Material-UI Cookies](https://mui.com/material-ui/getting-started/usage/)

## 🎯 **สรุป**

ระบบจัดการคุกกี้นี้ให้:
- **ความปลอดภัยสูง** ด้วยการตั้งค่าที่เหมาะสม
- **ประสบการณ์ผู้ใช้ดี** ด้วยการตั้งค่าที่ยืดหยุ่น
- **การวิเคราะห์ที่แม่นยำ** ด้วยการติดตามพฤติกรรม
- **การปฏิบัติตามกฎหมาย** ด้วย GDPR compliance
- **ประสิทธิภาพสูง** ด้วยการจัดการที่เหมาะสม

เริ่มต้นจาก **User Preferences** ก่อน แล้วค่อยๆ เพิ่มฟีเจอร์อื่นๆ ตามลำดับความสำคัญ! 