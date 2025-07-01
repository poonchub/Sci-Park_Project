import { Armchair, LayoutGrid, LucideIcon, MicVocal, Presentation, Projector, Table } from "lucide-react";

// Configuration for each maintenance type
export interface EquipmentConfig {
    color: string; // Main color
    colorLite: string; // Light color
    icon: LucideIcon;
}

// Equipmenet configurations
export const equipmentConfig: Record<string, EquipmentConfig> = {
    "โปรเจคเตอร์": { color: "#FFA500", colorLite: "rgba(255, 166, 0, 0.17)", icon: Projector },
    "ไมโครโฟน": { color: "#00CED1", colorLite: "rgba(0, 206, 209, 0.16)", icon: MicVocal },
    "กระดานไวท์บอร์ด": { color: "#6A5ACD", colorLite: "rgba(105, 90, 205, 0.18)", icon: Presentation },
    "โต๊ะ": { color: "#2088ff", colorLite: "rgba(32, 136, 255, 0.18)", icon: LayoutGrid },
    "เก้าอี้": { color: "#8B4513", colorLite: "rgba(139, 69, 19, 0.18)", icon: Armchair },
};