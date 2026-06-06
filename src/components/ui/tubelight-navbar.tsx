"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
  activeName?: string;
  ariaLabel?: string;
  embedded?: boolean;
  onItemSelect?: (item: NavItem) => void;
}

export function NavBar({ items, className, activeName, ariaLabel, embedded = false, onItemSelect }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(activeName ?? items[0]?.name ?? "");
  const activeItemRef = useRef<HTMLButtonElement | null>(null);
  const isControlled = typeof activeName === "string";
  const currentTab = isControlled ? activeName : activeTab;

  useEffect(() => {
    if (isControlled) setActiveTab(activeName);
  }, [activeName, isControlled]);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [currentTab]);

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        embedded ? "relative z-10" : "fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6",
        className,
      )}
    >
      <div className="flex w-max items-center gap-2 rounded-full border border-white/10 bg-[#0f0f0f]/75 px-1 py-1 shadow-lg shadow-black/35 backdrop-blur-lg">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.name;

          return (
            <button
              key={item.name}
              ref={isActive ? activeItemRef : undefined}
              type="button"
              onClick={() => {
                setActiveTab(item.name);
                onItemSelect?.(item);
              }}
              className={cn(
                "relative flex min-h-11 min-w-14 flex-shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white/75 transition-colors hover:text-[#C8FF00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]",
                isActive && "text-[#C8FF00]",
              )}
            >
              <Icon size={18} strokeWidth={2.2} />
              <span className="hidden sm:inline">{item.name}</span>
              <span className="max-w-16 truncate text-[10px] font-semibold leading-none sm:hidden">{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="treino-tubelight-lamp"
                  className="absolute inset-0 -z-10 w-full rounded-full bg-[#C8FF00]/10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-[#C8FF00]">
                    <div className="absolute -left-2 -top-2 h-6 w-12 rounded-full bg-[#C8FF00]/20 blur-md" />
                    <div className="absolute -top-1 h-6 w-8 rounded-full bg-[#C8FF00]/20 blur-md" />
                    <div className="absolute left-2 top-0 h-4 w-4 rounded-full bg-[#C8FF00]/20 blur-sm" />
                  </div>
                </motion.div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
