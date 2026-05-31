import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

interface DesignCardProps extends HTMLMotionProps<"section"> {
  children: React.ReactNode;
  className?: string;
}

export const DesignCard = React.memo(function DesignCard({
  children,
  className = "",
  ...props
}: DesignCardProps) {
  return (
    <motion.section className={`pulse-card overflow-hidden p-5 ${className}`} {...props}>
      {children}
    </motion.section>
  );
});
