// Importing necessary FontAwesome icons
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCheck, faWrench, faTimesCircle, faHammer } from "@fortawesome/free-solid-svg-icons";

// Interface defining the configuration for each room status type
export interface RoomStatusConfig {
    color: string; // Main color for the status
    colorLite: string; // Light color for the background
    icon: IconDefinition; // Associated icon for the status
}

// Mapping different room statuses to their respective configuration
export const roomStatusConfig: Record<string, RoomStatusConfig> = {
    "Available": {
        color: "#28A745", // Green = available
        colorLite: "rgba(40, 167, 69, 0.2)", // light green
        icon: faCheck,
    },
    "Under Maintenance": {
        color: "#FFC107", // Yellow = maintenance
        colorLite: "rgba(255, 193, 7, 0.2)", // light yellow
        icon: faWrench,
    },
    "Unavailable": {
        color: "#6C757D", // Gray = unavailable
        colorLite: "rgba(108, 117, 125, 0.2)", // light gray
        icon: faTimesCircle,
    },
    "Damaged": {
        color: "#DC3545", // Red = damaged
        colorLite: "rgba(220, 53, 69, 0.2)", // light red
        icon: faHammer,
    },
};
