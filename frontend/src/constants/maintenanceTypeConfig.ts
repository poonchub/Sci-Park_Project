// Importing necessary FontAwesome icons
import { faBolt, faFaucet, faWifi, faFan, faHammer, faTools } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// Configuration for each maintenance type
export interface MaintenanceTypeConfig {
  color: string; // Main color
  colorLite: string; // Light color
  icon: IconDefinition; // Associated icon
}

// Maintenance type configurations
export const maintenanceTypeConfig: Record<string, MaintenanceTypeConfig> = {
  "งานไฟฟ้า": { color: "#FFA500", colorLite: "rgba(255, 166, 0, 0.17)", icon: faBolt },
  "งานเครื่องปรับอากาศ": { color: "#00CED1", colorLite: "rgba(0, 206, 209, 0.16)", icon: faFan },
  "งานอินเทอร์เน็ต": { color: "#6A5ACD", colorLite: "rgba(105, 90, 205, 0.18)", icon: faWifi },
  "งานประปา": { color: "#2088ff", colorLite: "rgba(32, 136, 255, 0.18)", icon: faFaucet },
  "งานโครงสร้าง": { color: "#8B4513", colorLite: "rgba(139, 69, 19, 0.18)", icon: faHammer },
  "งานอื่นๆ": { color: "#708090", colorLite: "rgba(112, 128, 144, 0.16)", icon: faTools },
};