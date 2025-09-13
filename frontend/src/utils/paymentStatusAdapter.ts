// แปลง raw status -> logicKey สำหรับตัดสินใจ และ -> configKey (Title Case) เพื่อ map เข้ากับ paymentStatusConfig เดิม
import { paymentStatusConfig } from "../constants/paymentStatusConfig";

export type LogicKey =
  | "unpaid"
  | "pending_payment"
  | "pending_verification"
  | "awaiting_receipt"
  | "approved"
  | "rejected"
  | "refunded";

type ConfigKey = keyof typeof paymentStatusConfig; // Title Case keys ของไฟล์ config เดิม

// alias ต่ำสุด: รับทุกคำแบบที่ backend/หน้าอื่น ๆ อาจส่งมา
const RAW_TO_LOGIC: Record<string, LogicKey> = {
  "": "unpaid",
  unpaid: "unpaid",
  "pending payment": "pending_payment",
  "awaiting payment": "pending_payment",
  submitted: "pending_verification",
  "pending verification": "pending_verification",
  "awaiting receipt": "awaiting_receipt",
  approved: "approved",
  paid: "approved",
  rejected: "rejected",
  refunded: "refunded",
};

const LOGIC_TO_CONFIG: Record<LogicKey, ConfigKey> = {
  unpaid: "Pending Payment",
  pending_payment: "Pending Payment",
  pending_verification: "Pending Verification",
  awaiting_receipt: "Awaiting Receipt",
  approved: "Paid",
  rejected: "Rejected",
  refunded: "Refunded",
};

export function toLogicStatus(raw?: string): LogicKey {
  const k = (raw || "").trim().toLowerCase();
  return RAW_TO_LOGIC[k] ?? "unpaid";
}

export function toConfigKey(raw?: string): ConfigKey {
  const logic = toLogicStatus(raw);
  return LOGIC_TO_CONFIG[logic];
}
