import React from "react";
import { motion } from "framer-motion";

export const VitalsHex = React.memo(function VitalsHex({ value = 78, small = false }: { value?: number; small?: boolean }) {
  return (
    <div className={`relative grid place-items-center ${small ? "h-28 w-28" : "h-32 w-32"}`}>
      <motion.div 
        animate={{
          boxShadow: ["0 0 0 rgba(200, 255, 0, 0)", "0 0 20px rgba(200, 255, 0, 0.2)", "0 0 0 rgba(200, 255, 0, 0)"]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="vitals-hex absolute inset-2" 
      />
      <div className="relative text-center">
        <div className={`${small ? "text-[28px]" : "text-4xl"} font-bold text-[#C8FF00]`}>
          {value}
        </div>
      </div>
    </div>
  );
});
