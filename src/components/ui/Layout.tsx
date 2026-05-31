import React from "react";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";

export const AppScreen = React.memo(function AppScreen({ children }: { children: React.ReactNode }) {
  return (
    <motion.main 
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-[390px] overflow-x-hidden px-4 pt-safe pb-[90px]"
    >
      {children}
    </motion.main>
  );
});

export const NotificationBell = React.memo(function NotificationBell() {
  return (
    <motion.button 
      whileTap={{ scale: 0.9 }}
      className="relative h-11 w-11 grid place-items-center" 
      aria-label="Notificacoes"
    >
      <Bell className="h-7 w-7" strokeWidth={1.8} />
      <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#C8FF00]" />
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
    <header className="flex items-start justify-between gap-4 pt-7 pb-6">
      <div>
        <h1 className="text-2xl leading-tight font-bold tracking-[-0.3px] text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-base leading-snug text-[#888888]">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4 text-white">{right ?? <NotificationBell />}</div>
    </header>
  );
});

export const PageActionHeader = React.memo(function PageActionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
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
