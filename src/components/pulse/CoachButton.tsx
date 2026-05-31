import React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

// Using motion.create to make Link animatable
const MotionLink = motion.create(Link);

export const CoachButton = React.memo(function CoachButton({
  to = "/treino",
  children,
}: {
  to?: string;
  children: React.ReactNode;
}) {
  return (
    <MotionLink
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      to={to as never}
      className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#C8FF00] text-sm font-bold text-[#C8FF00]"
    >
      {children} <ChevronRight className="h-4 w-4" />
    </MotionLink>
  );
});
