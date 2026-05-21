import { Link, useLocation } from "@tanstack/react-router";
import { Home, Map, Plus, Trophy, User } from "lucide-react";

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
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-background/85 backdrop-blur-xl border-t border-border">
      <div className="mx-auto max-w-md grid grid-cols-5 items-end px-2 pt-2">
        {items.map(({ to, icon: Icon, label, center }) => {
          const active = pathname.startsWith(to);
          if (center) {
            return (
              <Link key={to} to={to as never} className="flex justify-center -mt-6">
                <span className="grid place-items-center h-14 w-14 rounded-full bg-primary text-primary-foreground glow-primary active:scale-95 transition">
                  <Icon className="h-6 w-6" strokeWidth={2.5} />
                </span>
              </Link>
            );
          }
          return (
            <Link key={to} to={to as never} className="flex flex-col items-center gap-1 py-2 active:scale-95 transition">
              <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
