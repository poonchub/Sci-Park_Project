import { BellRing } from "lucide-react";
import { motion } from "framer-motion";

const MotionBellRing = motion(BellRing);

export default function AnimatedBell() {
  return (
    <MotionBellRing
      size={16}
      color="#F26522"
      strokeWidth={3}
      animate={{ rotate: [-15, 15, -15] }}
      transition={{
        duration: 1.8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
}