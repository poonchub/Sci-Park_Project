// Importing necessary Lucide React icons
import { Hourglass, LucideIcon, Repeat } from "lucide-react";
import { RotateCcw, Check, X, ClipboardCheck, Flag, Clock, RotateCcw as Redo, AlertTriangle, Ban } from "lucide-react";

// Interface defining the configuration for each status type
export interface StatusConfig {
    color: string; // Main color
    colorLite: string; // Light color for background
    icon: LucideIcon; // Associated icon
}

// Mapping different statuses to their respective configuration
export const statusConfig: Record<string, StatusConfig> = {
    "Pending": {
        color: "#ebca0c",
        colorLite: "rgba(235, 202, 12, 0.22)",
        icon: Hourglass
    },
    "Approved": {
        color: "#10a605",
        colorLite: "rgba(0, 255, 60, 0.18)",
        icon: Check
    },
    "In Progress": {
        color: "#007BFF",
        colorLite: "rgba(0, 123, 255, 0.18)",
        icon: RotateCcw
    },
    "In Process": {
        color: "#007BFF",
        colorLite: "rgba(0, 123, 255, 0.18)",
        icon: RotateCcw
    },
    "Waiting For Review": {
        color: "#17A2B8",
        colorLite: "rgba(23, 163, 184, 0.18)",
        icon: ClipboardCheck
    },
    "Completed": {
        color: "#884af7",
        colorLite: "rgba(110, 66, 193, 0.18)",
        icon: Flag
    },
    "Unsuccessful": {
        color: "#DC3545",
        colorLite: "rgba(220, 53, 70, 0.19)",
        icon: X
    },
    "Rework Requested": {
        color: "#FFA500",
        colorLite: "rgba(255, 166, 0, 0.21)",
        icon: Repeat
    },
    "Cancellation In Progress": {
        color: "#FF6B35",
        colorLite: "rgba(255, 107, 53, 0.18)",
        icon: AlertTriangle
    },
    "Successfully Cancelled": {
        color: "#6C757D",
        colorLite: "rgba(108, 117, 125, 0.18)",
        icon: Ban
    },
};