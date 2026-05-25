import { Link, useLocation } from "@tanstack/react-router";
import { BarChart3, Home, Sparkles, User, Users } from "lucide-react";

type Item = { to: string; icon: typeof Home; label: string; center?: boolean; match?: string[] };

const items: Item[] = [
  { to: "/dashboard", icon: Home, label: "Início" },
  { to: "/atividades", icon: BarChart3, label: "Atividades", match: ["/atividades", "/historico"] },
  {
    to: "/iacoach",
    icon: Sparkles,
    label: "Coach",
    center: true,
    match: ["/iacoach", "/treino"],
  },
  { to: "/social", icon: Users, label: "Comunidade" },
  { to: "/perfil", icon: User, label: "Perfil" },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 h-[calc(60px+env(safe-area-inset-bottom))] w-full max-w-[430px] -translate-x-1/2 overflow-hidden border-t border-white/[0.06] bg-[#0A0A0A] pb-safe">
      <div className="mx-auto grid h-[60px] w-full max-w-full grid-cols-5 items-center px-0">
        {items.map(({ to, icon: Icon, label, center, match }) => {
          const active = (match ?? [to]).some((path) => pathname.startsWith(path));
          return (
            <Link
              key={to}
              to={to as never}
              aria-label={label}
              className={`flex h-[60px] w-full flex-col items-center justify-center gap-1 text-[10px] font-medium leading-none ${
                active ? "text-[#D7FF1F]" : "text-[#555555]"
              }`}
            >
              <Icon
                className="h-[22px] w-[22px]"
                strokeWidth={center ? 1.8 : 1.7}
                fill={active && !center ? "currentColor" : "none"}
              />
              <span className="max-w-full truncate whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
