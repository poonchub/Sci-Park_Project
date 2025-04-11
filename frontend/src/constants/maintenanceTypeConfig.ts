import { faBolt, faTv, faCouch, faFaucet } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface MaintenanceTypeConfig {
  color: string;
  colorLite: string;
  icon: IconDefinition;
}

export const maintenanceTypeConfig: Record<string, MaintenanceTypeConfig> = {
  "งานไฟฟ้า": { color: "#FFA500", colorLite: "rgb(255, 241, 217)", icon: faBolt },
  "งานเครื่องใช้ไฟฟ้า": { color: "#6F42C1", colorLite: "rgb(213, 191, 255)", icon: faTv },
  "งานเฟอร์นิเจอร์": { color: "#8B4513", colorLite: "rgb(255, 221, 196)", icon: faCouch },
  "งานประปา": { color: "rgb(0, 162, 255)", colorLite: "rgb(205, 242, 255)", icon: faFaucet },
};