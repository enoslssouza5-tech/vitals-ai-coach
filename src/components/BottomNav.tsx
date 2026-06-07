import { Link, useLocation } from "@tanstack/react-router";
import { Activity, Bot, Home, User, Users, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Item = {
  to: string;
  icon: LucideIcon;
  label: string;
  match?: string[];
};

const items: Item[] = [
  { to: "/dashboard", icon: Home, label: "Inicio" },
  { to: "/atividades", icon: Activity, label: "Atividades", match: ["/atividades", "/historico"] },
  { to: "/iacoach", icon: Bot, label: "Coach" },
  { to: "/social", icon: Users, label: "Comunidade" },
  { to: "/perfil", icon: User, label: "Perfil" },
];

function TabItem({ to, icon: Icon, label, match }: Item) {
  const { pathname } = useLocation();
  const active = (match ?? [to]).some((path) => pathname.startsWith(path));

  return (
    <Link
      to={to as never}
      aria-label={label}
      className={`relative flex h-16 min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-black leading-none transition-colors ${
        active ? "text-[#C8FF00]" : "text-white/40"
      }`}
    >
      <Icon className="h-[21px] w-[21px]" strokeWidth={1.9} />
      <span className="max-w-full truncate whitespace-nowrap">{label}</span>
      {active && <span className="absolute bottom-2 h-[3px] w-[3px] rounded-full bg-[#C8FF00]" />}
    </Link>
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const [isTreinoAtivo, setIsTreinoAtivo] = useState(false);

  useEffect(() => {
    if (pathname !== "/treino") {
      setIsTreinoAtivo(false);
      return;
    }

    const handleStageChange = (event: Event) => {
      const stage = (event as CustomEvent<{ stage?: string }>).detail?.stage;
      setIsTreinoAtivo(stage === "active");
    };

    window.addEventListener("pulse-treino-stage", handleStageChange);
    return () => window.removeEventListener("pulse-treino-stage", handleStageChange);
  }, [pathname]);

  if (pathname === "/treino" && isTreinoAtivo) return null;

  return (
    <motion.nav
      aria-label="Navegacao principal"
      className="tab-bar"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div className="mx-auto grid h-16 w-full max-w-full grid-cols-5 items-center px-2">
        {items.map((item) => (
          <TabItem key={item.to} {...item} />
        ))}
      </div>
    </motion.nav>
  );
}
