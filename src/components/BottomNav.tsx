import { Link, useLocation } from "@tanstack/react-router";
import { Home, Map, Plus, Trophy, User } from "lucide-react";
import { motion } from "framer-motion";

type Item = { to: string; icon: typeof Home; label: string; center?: boolean };
const items: Item[] = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/rotas", icon: Map, label: "Rotas" },
  { to: "/treino", icon: Plus, label: "Treino", center: true },
  { to: "/social", icon: Trophy, label: "Social" },
  { to: "/perfil", icon: User, label: "Perfil" },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe border-t"
      style={{
        background: "oklch(0.12 0.03 250 / 0.88)",
        backdropFilter: "blur(24px) saturate(1.5)",
        WebkitBackdropFilter: "blur(24px) saturate(1.5)",
        borderColor: "oklch(0.30 0.05 250 / 0.3)",
      }}>
      <div className="mx-auto max-w-md grid grid-cols-5 items-center px-2 py-2">
        {items.map(({ to, icon: Icon, label, center }) => {
          const active = pathname.startsWith(to);

          if (center) {
            return (
              <Link key={to} to={to as never} className="flex justify-center -mt-6">
                {/* Athletic active workout button pulsing scaling infinitely */}
                <motion.span 
                  className="grid place-items-center h-14 w-14 rounded-full bg-primary text-primary-foreground glow-primary relative z-50 cursor-pointer"
                  animate={{
                    scale: [1, 1.06, 1],
                    boxShadow: [
                      "0 0 16px oklch(0.62 0.20 250 / 0.4)",
                      "0 0 28px oklch(0.62 0.20 250 / 0.7)",
                      "0 0 16px oklch(0.62 0.20 250 / 0.4)"
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  whileTap={{ scale: 0.92 }}
                >
                  <Plus className="h-7 w-7" strokeWidth={3} />
                </motion.span>
              </Link>
            );
          }

          return (
            <Link key={to} to={to as never} className="flex flex-col items-center justify-center py-2 relative">
              <motion.div
                className="flex flex-col items-center justify-center cursor-pointer"
                whileTap={{ scale: 1.25 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {/* Only icon is displayed, with bright active color */}
                <Icon 
                  className={`h-6 w-6 transition-colors duration-200 ${active ? "text-primary-light" : "text-muted-foreground"}`} 
                  style={active ? { filter: "drop-shadow(0 0 6px oklch(0.72 0.18 250 / 0.6))" } : {}}
                  strokeWidth={2.2}
                />
                
                {/* Active indicator dot underneath the icon */}
                {active && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-primary-light"
                    style={{ boxShadow: "0 0 8px oklch(0.72 0.18 250)" }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
