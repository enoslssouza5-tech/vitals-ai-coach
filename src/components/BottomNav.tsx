import { Link, useLocation } from "@tanstack/react-router";
import { Activity, Home, Plus, User, Users, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Item = {
  to: string;
  icon: LucideIcon;
  label: string;
  match?: string[];
};

const items: Item[] = [
  { to: "/dashboard", icon: Home, label: "Inicio" },
  { to: "/atividades", icon: Activity, label: "Atividades", match: ["/atividades", "/historico"] },
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
      className="flex flex-col items-center justify-center gap-1 w-14 h-full active:opacity-70 transition-opacity"
    >
      <Icon className={`w-6 h-6 ${active ? "text-[#C8FF00]" : "text-gray-600"}`} strokeWidth={1.9} />
    </Link>
  );
}

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <AnimatePresence>
      {pathname !== "/treino" && (
        <motion.nav
          key="bottom-nav"
          aria-label="Navegacao principal"
          className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A] border-t border-white/5"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          transition={{ duration: 0.38, ease: "easeOut" }}
        >
          <div className="flex items-center justify-around px-2 h-16">
            <TabItem {...items[0]} />
            <TabItem {...items[1]} />
            <Link
              to="/treino"
              aria-label="Iniciar treino"
              className="flex items-center justify-center w-14 h-14 rounded-full bg-[#C8FF00] shadow-[0_0_20px_rgba(200,255,0,0.3)] active:scale-95 transition-transform duration-150 -mt-5"
            >
              <Plus className="w-7 h-7 text-[#0A0A0A] stroke-[2.5]" />
            </Link>
            <TabItem {...items[2]} />
            <TabItem {...items[3]} />
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
