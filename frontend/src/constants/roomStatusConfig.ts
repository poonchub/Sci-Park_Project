// Importing necessary FontAwesome icons
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCheck, faDoorOpen  } from "@fortawesome/free-solid-svg-icons";

// Interface defining the configuration for each room status type
export interface RoomStatusConfig {
    color: string; // Main color for the status
    colorLite: string; // Light color for the background
    icon: IconDefinition; // Associated icon for the status
}

// Mapping different room statuses to their respective configuration
export const roomStatusConfig: Record<string, RoomStatusConfig> = {
    "Reserved": {
        color: "#007BFF", // Blue color for Reserved
        colorLite: "rgb(202, 227, 255)", // Light blue background for Reserved
        icon: faCheck // Check icon for Reserved
    },
    "Not Reserved": {
        color: "#28A745", // Green color for Not Reserved (Available)
        colorLite: "rgb(202, 255, 202)", // Light green background for Not Reserved
        icon: faDoorOpen  // Circle icon for Not Reserved (Available)
    },
};
