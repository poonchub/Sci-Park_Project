// Importing necessary Lucide React icons
import { LucideIcon } from "lucide-react";
import { Check, Wrench, X, Hammer } from "lucide-react";

// Interface defining the configuration for each room status type
export interface RoomStatusConfig {
    color: string; // Main color for the status
    colorLite: string; // Light color for the background
    icon: LucideIcon; // Associated icon for the status
}

// Mapping different room statuses to their respective configuration
export const roomStatusConfig: Record<string, RoomStatusConfig> = {
    "Available": {
        color: "#10a605", // Green = available
        colorLite: "rgba(0, 255, 60, 0.18)", // light green
        icon: Check,
    },
    "Under Maintenance": {
        color: "#FFA500", // Yellow = maintenance
        colorLite: "rgba(255, 166, 0, 0.21)", // light yellow
        icon: Wrench,
    },
    "Unavailable": {
        color: "#6C757D", // Gray = unavailable
        colorLite: "rgba(108, 117, 125, 0.2)", // light gray
        icon: X,
    },
    "Damaged": {
        color: "#DC3545", // Red = damaged
        colorLite: "rgba(220, 53, 70, 0.19)", // light red
        icon: Hammer,
    },
};
