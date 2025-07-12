import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        dashboard: "Dashboard",
        bookingRoom: "Booking Room",
        maintenance: "Maintenace",
        home: "Home",
        user: "User",
        manageUser: "Manage User",
        addUser: "Add User",
        addUserByCsv: "Add User by CSV",
        room: "Room",
        manageRoom: "Manage Room",
        requestList: "Request List",
        // other translations
      },
    },
    th: {
      translation: {
        dashboard: "แดชบอร์ด",
        bookingRoom: "การจองห้อง",
        maintenance: "การแจ้งซ่อม",
        home: "หน้าหลัก",
        user: "ผู้ใช้งาน",
        manageUser: "จัดการผู้ใช้วงาน",
        addUser: "เพิ่มผู้ใช้งาน",
        addUserByCsv: "เพิ่มผู้ใช้ด้วย CSV",
        room: "ห้อง",
        manageRoom: "จัดการห้อง",
        requestList: "รายการคำร้อง",

        // other translations
      },
    },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
