// Importing necessary FontAwesome icons
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowsSpin, faCheck, faCircleXmark, faClipboardCheck, faFlagCheckered, faHourglassHalf, faRedo } from "@fortawesome/free-solid-svg-icons";

// Interface defining the configuration for each status type
export interface StatusConfig {
    color: string; // Main color
    colorLite: string; // Light color for background
    icon: IconDefinition; // Associated icon
}

// Mapping different statuses to their respective configuration
export const statusConfig: Record<string, StatusConfig> = {
    "Pending": {
        color: "#ebca0c",
        colorLite: "rgb(254, 255, 202)",
        icon: faHourglassHalf
    },
    "Approved": {
        color: "#28A745",
        colorLite: "rgb(203, 255, 215)",
        icon: faCheck
    },
    "In Progress": {
        color: "#007BFF",
        colorLite: "rgb(202, 227, 255)",
        icon: faArrowsSpin
    },
    "Waiting for Review": {
        color: "#17A2B8",
        colorLite: "rgb(208, 242, 255)",
        icon: faClipboardCheck
    },
    "Completed": {
        color: "#6F42C1",
        colorLite: "rgb(226, 210, 255)",
        icon: faFlagCheckered
    },
    "Unsuccessful": {
        color: "#DC3545",
        colorLite: "rgb(255, 211, 216)",
        icon: faCircleXmark
    },
    "Rework Requested": {
        color: "#FFA500",
        colorLite: "rgb(255, 224, 178)",
        icon: faRedo
    },
};