# ⚡ Quick Start Guide - API Testing

## 🚀 **เริ่มต้นด้วย Automated Script**

### 🎯 **วิธีใช้งานแบบง่าย (แนะนำ)**

#### Windows:
```bash
# 1. เข้าโฟลเดอร์ API_Test
cd backend/API_Test

# 2. เปิด Go Server ใน Terminal แยก
cd backend && go run main.go

# 3. รัน Automated Script
run_all_tests.bat
```

#### Linux/Mac:
```bash
# 1. เข้าโฟลเดอร์ API_Test
cd backend/API_Test

# 2. เปิด Go Server ใน Terminal แยก
cd backend && go run main.go

# 3. ทำให้ script executable และรัน
chmod +x run_all_tests.sh
./run_all_tests.sh
```

---

## 📋 **Script จะทำอะไรให้**

✅ **Install npm dependencies**  
✅ **รัน Go Unit Tests** (validation logic)  
✅ **สร้าง Test Database** (backup + restore)  
✅ **รัน API Integration Tests** (3 แบบ)  
✅ **Cleanup** ทุกอย่างให้เรียบร้อย  
✅ **Rollback Database** กลับเป็นเดิม  

---

## 🎯 **คำสั่งแยกใช้**

| คำสั่ง | หน้าที่ |
|--------|---------|
| `node mock_test_strategy.js` | ทดสอบแบบ Safe (แนะนำ) |
| `node complete_user_api_test.js` | ทดสอบครบถ้วน |
| `node transaction_test.js` | ทดสอบพร้อม Cleanup |

---

## ⚠️ **หากมีปัญหา**

### Server ไม่ตอบสนอง
```bash
# ตรวจสอบ server
curl http://localhost:8000/
```

### Script ไม่รัน (Windows)
```bash
# รันใน PowerShell แทน
powershell -ExecutionPolicy Bypass -File run_all_tests.bat
```

### Permission Denied (Linux/Mac)
```bash
# ให้สิทธิ์ execute
chmod +x run_all_tests.sh
```

---

**🎉 Automated Testing พร้อมใช้งาน!** 🚀
