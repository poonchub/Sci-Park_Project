import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowsSpin, faBan, faCheck, faExclamation, faFlagCheckered, faHourglassHalf } from "@fortawesome/free-solid-svg-icons";

export interface StatusConfig {
    color: string; 
    colorLite: string; 
    icon: IconDefinition
}

export const statusConfig: Record<string, StatusConfig> = {
    "Pending": { color: "#FFC107", colorLite: "rgb(254, 255, 184)", icon: faHourglassHalf },
    "Approved": { color: "#28A745", colorLite: "rgb(203, 255, 215)", icon: faCheck },
    "Rejected": { color: "#DC3545", colorLite: "rgb(255, 211, 216)", icon: faBan },
    "In Progress": { color: "#007BFF", colorLite: "rgb(159, 205, 255)", icon: faArrowsSpin },
    "Completed": { color: "#6F42C1", colorLite: "rgb(207, 181, 255)", icon: faFlagCheckered },
    "Failed": { color: "#6C757D", colorLite: "rgb(239, 247, 255)", icon: faExclamation }
};