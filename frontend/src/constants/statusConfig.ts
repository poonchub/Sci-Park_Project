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
        colorLite: "rgba(235, 202, 12, 0.22)",
        icon: faHourglassHalf
    },
    "Approved": {
        color: "#10a605",
        colorLite: "rgba(0, 255, 60, 0.18)",
        icon: faCheck
    },
    "In Progress": {
        color: "#007BFF",
        colorLite: "rgba(0, 123, 255, 0.18)",
        icon: faArrowsSpin
    },
    "In Process": {
        color: "#007BFF",
        colorLite: "rgba(0, 123, 255, 0.18)",
        icon: faArrowsSpin
    },
    "Waiting For Review": {
        color: "#17A2B8",
        colorLite: "rgba(23, 163, 184, 0.18)",
        icon: faClipboardCheck
    },
    "Completed": {
        color: "#884af7",
        colorLite: "rgba(110, 66, 193, 0.18)",
        icon: faFlagCheckered
    },
    "Unsuccessful": {
        color: "#DC3545",
        colorLite: "rgba(220, 53, 70, 0.19)",
        icon: faCircleXmark
    },
    "Rework Requested": {
        color: "#FFA500",
        colorLite: "rgba(255, 166, 0, 0.21)",
        icon: faRedo
    },
};