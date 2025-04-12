import { faBolt, faFaucet, faWifi, faFan, faHammer, faTools } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface MaintenanceTypeConfig {
  color: string;
  colorLite: string;
  icon: IconDefinition;
}

export const maintenanceTypeConfig: Record<string, MaintenanceTypeConfig> = {
  "งานไฟฟ้า": { color: "#FFA500", colorLite: "rgb(255, 241, 217)", icon: faBolt },
  "งานเครื่องปรับอากาศ": { color: "#00CED1", colorLite: "rgb(217, 254, 255)", icon: faFan },
  "งานอินเทอร์เน็ต": { color: "#6F42C1", colorLite: "rgb(226, 210, 255)", icon: faWifi },
  "งานประปา": { color: "#2088ff", colorLite: "rgb(205, 242, 255)", icon: faFaucet },
  "งานโครงสร้าง": { color: "#8B4513", colorLite: "rgb(255, 221, 196)", icon: faHammer },
  "งานอื่นๆ": { color: "#708090", colorLite: "rgb(228, 235, 241)", icon: faTools },
};