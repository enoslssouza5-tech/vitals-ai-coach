import React from "react";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";

export const AppScreen = React.memo(function AppScreen({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="mx-auto w-full max-w-[390px] overflow-x-hidden px-5 pt-safe pb-[92px]"
    >
      {children}
    </motion.main>
  );
});

export const NotificationBell = React.memo(function NotificationBell() {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.06] bg-[#1A1A1A] text-white"
      aria-label="Notificacoes"
    >
      <Bell className="h-5 w-5" strokeWidth={1.7} />
      <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#C8FF00]" />
    </motion.button>
  );
});

export const AppHeader = React.memo(function AppHeader({
  title,
  subtitle,
  right,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 pt-8 pb-6">
      <div className="min-w-0">
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#C8FF00]">
          Pulse
        </div>
        <h1 className="text-[28px] leading-[0.98] font-black tracking-[-0.02em] text-white">
          {title}
        </h1>
        {subtitle && <p className="mt-3 text-[14px] leading-snug text-[#888888]">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4 text-white">{right ?? <NotificationBell />}</div>
    </header>
  );
});

export const PageActionHeader = React.memo(function PageActionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <AppHeader
      title={title}
      right={
        <div className="flex items-center gap-3">
          {action}
          <NotificationBell />
        </div>
      }
    />
  );
});
