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
        colorLite: "rgb(202, 255, 202)",
        icon: faCheck,
    },
    "Under Maintenance": {
        color: "#FFC107", // Yellow = maintenance
        colorLite: "rgb(255, 243, 205)",
        icon: faWrench,
    },
    "Unavailable": {
        color: "#6C757D", // Gray = unavailable
        colorLite: "rgb(222, 226, 230)",
        icon: faTimesCircle,
    },
    "Damaged": {
        color: "#DC3545", // Red = damaged
        colorLite: "rgb(248, 215, 218)",
        icon: faHammer,
    },
};
