// Importing necessary FontAwesome icons
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowsSpin, faBan, faCheck, faCircleXmark, faClipboardCheck, faExclamation, faFlagCheckered, faHourglassHalf } from "@fortawesome/free-solid-svg-icons";

// Interface defining the configuration for each status type
export interface StatusConfig {
    color: string; // Main color
    colorLite: string; // Light color for background
    icon: IconDefinition; // Associated icon
}

// Mapping different statuses to their respective configuration
export const statusConfig: Record<string, StatusConfig> = {
    "Pending":     { color: "#FFC107",  colorLite: "rgb(254, 255, 184)", icon: faHourglassHalf },
    "Approved":    { color: "#28A745",  colorLite: "rgb(203, 255, 215)", icon: faCheck },
    "Rejected":    { color: "#DC3545",  colorLite: "rgb(255, 211, 216)", icon: faBan },
    "Assigned":    { color: "#17A2B8",  colorLite: "rgb(204, 244, 255)", icon: faClipboardCheck },
    "In Progress": { color: "#007BFF",  colorLite: "rgb(202, 227, 255)", icon: faArrowsSpin },
    "Completed":   { color: "#6F42C1",  colorLite: "rgb(226, 210, 255)", icon: faFlagCheckered },
    "Failed":      { color: "#6C757D",  colorLite: "rgb(239, 247, 255)", icon: faExclamation },
    "Cancelled":   { color: "#FF5722",  colorLite: "rgb(255, 225, 210)", icon: faCircleXmark },
    "Unsuccessful":    { color: "#DC3545",  colorLite: "rgb(255, 211, 216)", icon: faCircleXmark },
  };
  