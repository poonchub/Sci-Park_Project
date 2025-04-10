# 🏢 Maintenance & Room Booking System  

## 📌 Overview  
This project is a **maintenance request and room booking system**, developed with:  
- **Frontend**: **React + TypeScript** ⚛️  
- **Backend**: **Golang + Gin** 🦫  
- **Database**: **SQLite** 🗄️  
- **Authentication**: **JWT-based authentication** 🔐  

### ✅ Features  
✅ Report maintenance issues 🚧  
✅ Track repair progress 📋  
✅ Book meeting rooms 🏢  
✅ Manage user roles and requests 🔄  

---

## 🛠️ System Requirements  
Before running the project, ensure you have the following installed:  

- **Node.js**: `v22.14.0`  
- **npm**: `11.1.0`  
- **Go**: Latest stable version recommended  

---

## 🚀 Backend Setup (Golang)  

### 📦 Install Required Modules  
Run the following commands to install dependencies:  

```sh
go get -u github.com/gin-gonic/gin
go get -u gorm.io/gorm
go get -u gorm.io/driver/sqlite
go get -u github.com/dgrijalva/jwt-go
go get -u golang.org/x/crypto@v0.16.0

npm install react-loader-spinner --legacy-peer-deps
npm install @mui/material @emotion/react @emotion/styled     --legacy-peer-deps
npm install @mui/icons-material --legacy-peer-deps
npm install @mui/x-date-pickers --legacy-peer-deps
npm install @mui/x-date-pickers @mui/icons-material --legacy-peer-deps

npm install @mui/material @mui/icons-material @mui/x-date-pickers dayjs @mui/x-date-pickers-pro --legacy-peer-deps


