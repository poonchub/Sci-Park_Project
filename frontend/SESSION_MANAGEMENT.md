# Session Management System

## ภาพรวม
ระบบจัดการ session หมดอายุที่ออกแบบมาเพื่อให้ผู้ใช้ถูกเด้งไปหน้า login โดยอัตโนมัติเมื่อ token หมดอายุ

## วิธีการทำงาน

### 1. Axios Interceptor
- **ไฟล์**: `frontend/src/services/http/index.tsx`
- **หน้าที่**: จัดการ HTTP requests และ responses
- **การทำงาน**:
  - เพิ่ม token ในทุก request อัตโนมัติ
  - ตรวจสอบ response status 401 (Unauthorized)
  - เมื่อพบ token หมดอายุ จะเรียกใช้ `handleSessionExpiration()`

### 2. Session Manager Utility
- **ไฟล์**: `frontend/src/utils/sessionManager.ts`
- **หน้าที่**: จัดการ session หมดอายุ
- **ฟังก์ชันหลัก**:
  - `handleSessionExpiration()`: ล้าง localStorage และเด้งไปหน้า login
  - `checkTokenLocally()`: ตรวจสอบ JWT token ใน localStorage (เบาๆ)
  - `checkTokenValidity()`: ตรวจสอบความถูกต้องของ token
  - `setupSessionMonitoring()`: ตั้งค่าการตรวจสอบ session ต่อเนื่อง

### 3. WindowsLayout Component
- **ไฟล์**: `frontend/src/layouts/WindowsLayout.tsx`
- **หน้าที่**: ตรวจสอบ session ต่อเนื่อง
- **การทำงาน**:
  - ตรวจสอบ token ทุก 5 นาที
  - ใช้ `setupSessionMonitoring()` เพื่อจัดการการตรวจสอบ

## ประสิทธิภาพ

### การลด Load บน Server
1. **ตรวจสอบ Local ก่อน**: ใช้ `checkTokenLocally()` ตรวจสอบ JWT ใน localStorage
2. **ลดการเรียก API**: ตรวจสอบ API เฉพาะทุก 5 นาที
3. **Cache ระยะเวลา**: ใช้ `lastCheckTime` เพื่อป้องกันการเรียก API ซ้ำ
4. **Error Handling**: ไม่เด้งออกทันทีเมื่อเกิด network error

### การคำนวณ Load
- **เดิม**: 2 requests/นาที/ผู้ใช้ (ทุก 30 วินาที)
- **ใหม่**: 0.2 requests/นาที/ผู้ใช้ (ทุก 5 นาที)
- **ลดลง**: 90% ของ requests



## การตั้งค่า Token Expiration

### Backend
- **ไฟล์**: `backend/controller/Auth.go`
- **การตั้งค่า**: `ExpirationHours: 24` (24 ชั่วโมง)

### Frontend
- **การตรวจสอบ**: ทุก 5 นาที (300,000 ms)
- **การตรวจสอบเบาๆ**: ตรวจสอบ JWT token ใน localStorage ทุกครั้ง
- **การตรวจสอบ API**: เฉพาะเมื่อจำเป็น (ทุก 5 นาที)
- **การแจ้งเตือน**: Alert แสดงข้อความ "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่"

## การทดสอบ

### วิธีทดสอบ Token Expiration
1. Login เข้าระบบ
2. รอ 24 ชั่วโมง (ตามการตั้งค่า)
3. ระบบจะเด้งไปหน้า login โดยอัตโนมัติ
4. แสดง alert แจ้งเตือน

### การตรวจสอบ Manual
- ระบบจะตรวจสอบ token ทุก 5 นาที
- ตรวจสอบ JWT token ใน localStorage ทุกครั้ง (เบาๆ)
- ตรวจสอบกับ API เฉพาะเมื่อจำเป็น
- หาก token หมดอายุ จะเด้งไปหน้า login ทันที

## Error Handling

### HTTP Status Codes
- **401 Unauthorized**: Token หมดอายุหรือไม่ถูกต้อง
- **403 Forbidden**: ไม่มีสิทธิ์เข้าถึง

### Error Messages
- "JWT is expired"
- "token"
- "expired"
- "unauthorized"

## การปรับแต่ง

### เปลี่ยนระยะเวลาการตรวจสอบ
แก้ไขใน `sessionManager.ts`:
```typescript
const CHECK_INTERVAL = 300000; // เปลี่ยนจาก 300000 (5 นาที) เป็นค่าที่ต้องการ
```

### เปลี่ยนระยะเวลา Token Expiration
แก้ไขใน `backend/controller/Auth.go`:
```go
ExpirationHours: 10, // เปลี่ยนเป็นจำนวนชั่วโมงที่ต้องการ
```

## ข้อควรระวัง

1. **Performance**: การตรวจสอบทุก 5 นาทีช่วยลด load บน server
2. **Network**: ตรวจสอบ JWT ใน localStorage ก่อน (เบาๆ) แล้วจึงตรวจสอบ API
3. **User Experience**: ผู้ใช้จะถูกเด้งออกจากระบบโดยไม่มีการแจ้งเตือนล่วงหน้า
4. **Token Security**: การตรวจสอบใน localStorage อาจไม่ปลอดภัยเท่าการตรวจสอบกับ server

## การปรับปรุงในอนาคต

1. **Refresh Token**: เพิ่มระบบ refresh token เพื่อต่ออายุ session
2. **Warning System**: แจ้งเตือนก่อน session หมดอายุ
3. **Auto Save**: บันทึกข้อมูลที่กำลังทำงานก่อนเด้งออก
4. **Remember Me**: ตัวเลือกให้จำการเข้าสู่ระบบ
5. **Smart Caching**: ใช้ cache เพื่อลดการเรียก API
6. **Background Sync**: ซิงค์ข้อมูลในพื้นหลังเมื่อมี network 