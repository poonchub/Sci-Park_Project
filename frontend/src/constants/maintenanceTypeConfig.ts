// Importing necessary Lucide React icons
import { Zap, Fan, Wifi, Droplets, Hammer, Wrench } from "lucide-react";
import { LucideIcon } from "lucide-react";

// Configuration for each maintenance type
export interface MaintenanceTypeConfig {
    color: string; // Main color
    colorLite: string; // Light color
    icon: LucideIcon; // Associated icon
}

// Maintenance type configurations
export const maintenanceTypeConfig: Record<string, MaintenanceTypeConfig> = {
    "Electrical Work": {
        color: "#FFA500",
        colorLite: "rgba(255, 166, 0, 0.17)",
        icon: Zap
    },
    "Air Conditioning Work": {
        color: "#00CED1",
        colorLite: "rgba(0, 206, 209, 0.16)",
        icon: Fan
    },
    "Internet Work": {
        color: "#6A5ACD",
        colorLite: "rgba(105, 90, 205, 0.18)",
        icon: Wifi
    },
    "Plumbing Work": {
        color: "#2088ff",
        colorLite: "rgba(32, 136, 255, 0.18)",
        icon: Droplets
    },
    "Structural Work": {
        color: "#8B4513",
        colorLite: "rgba(139, 69, 19, 0.18)",
        icon: Hammer
    },
    "Other Work": {
        color: "#708090",
        colorLite: "rgba(112, 128, 144, 0.16)",
        icon: Wrench
    },
};