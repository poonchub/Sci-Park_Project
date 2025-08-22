// Importing necessary Lucide React icons
import { Code, Leaf, Zap, Heart } from "lucide-react";
import { LucideIcon } from "lucide-react";

// Configuration for each business group
export interface BusinessGroupConfig {
    color: string; // Main color
    colorLite: string; // Light color
    icon: LucideIcon; // Associated icon
}

// Business group configurations
export const businessGroupConfig: Record<string, BusinessGroupConfig> = {
    "IT Software & digital content": {
        color: "#3B82F6",
        colorLite: "rgba(59, 130, 246, 0.17)",
        icon: Code
    },
    "Agriculture & Food": {
        color: "#10B981",
        colorLite: "rgba(16, 185, 129, 0.16)",
        icon: Leaf
    },
    "Energy Tech & material": {
        color: "#F59E0B",
        colorLite: "rgba(245, 158, 11, 0.18)",
        icon: Zap
    },
    "Medical & Bio-Tech": {
        color: "#EF4444",
        colorLite: "rgba(239, 68, 68, 0.16)",
        icon: Heart
    },
};
