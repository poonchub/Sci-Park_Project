// Importing necessary FontAwesome icons
import { faChartLine, faCalendarCheck, faWrench, faUsers, faDoorOpen, faCog } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// Configuration for each page type
export interface PageConfig {
    color: string; // Main color
    colorLite: string; // Light color
    icon: IconDefinition; // Associated icon
}

// Page configurations
export const pageConfig: Record<string, PageConfig> = {
    "Dashboard": {
        color: "#1976d2",
        colorLite: "rgba(25, 118, 210, 0.17)",
        icon: faChartLine
    },
    "Booking Room": {
        color: "#4caf50",
        colorLite: "rgba(76, 175, 80, 0.16)",
        icon: faCalendarCheck
    },
    "Maintenance": {
        color: "#ff9800",
        colorLite: "rgba(255, 152, 0, 0.18)",
        icon: faWrench
    },
    "User Management": {
        color: "#9c27b0",
        colorLite: "rgba(156, 39, 176, 0.18)",
        icon: faUsers
    },
    "Room Management": {
        color: "#00bcd4",
        colorLite: "rgba(0, 188, 212, 0.16)",
        icon: faDoorOpen
    },
    "Settings": {
        color: "#607d8b",
        colorLite: "rgba(96, 125, 139, 0.16)",
        icon: faCog
    },
}; 