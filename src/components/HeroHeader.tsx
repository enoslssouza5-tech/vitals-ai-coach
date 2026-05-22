import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface HeroHeaderProps {
  title: string;
  subtitle?: string;
  image: "running" | "cycling";
  top?: ReactNode;
  right?: ReactNode;
  /** Height of the hero area in viewport units */
  height?: string;
}

export function HeroHeader({ title, subtitle, image, top, right, height = "42vh" }: HeroHeaderProps) {
  const src = image === "running" ? "/images/hero-running.png" : "/images/hero-cycling.png";

  return (
    <div className="hero-header w-full relative" style={{ height, minHeight: 280 }}>
      {/* Background image */}
      <img
        src={src}
        alt=""
        className="hero-header__img"
        loading="eager"
      />

      {top}

      {/* Dark gradient overlay matching Deep Navy background */}
      <div className="hero-header__overlay" />

      {/* Header Content - Animated using Framer Motion */}
      <div className="hero-header__content w-full flex items-end justify-between relative z-10 px-5 pb-6 pt-safe">
        <motion.div 
          className="flex-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Bold large uppercase screen title left aligned */}
          <h1 className="hero-header__title select-none">
            {title}
          </h1>
          {subtitle && (
            <p className="hero-header__subtitle select-none font-medium">
              {subtitle}
            </p>
          )}
        </motion.div>
        
        {right && (
          <motion.div 
            className="hero-header__right"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            {right}
          </motion.div>
        )}
      </div>
    </div>
  );
}
