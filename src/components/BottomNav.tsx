import { Link, useLocation } from "@tanstack/react-router";
import { BarChart3, Home, Plus, User, Users } from "lucide-react";

type Item = { to: string; icon: typeof Home; label: string; match?: string[] };

const items: Item[] = [
  { to: "/dashboard", icon: Home, label: "Início" },
  { to: "/atividades", icon: BarChart3, label: "Atividades", match: ["/atividades", "/historico"] },
  { to: "/social", icon: Users, label: "Comunidade" },
  { to: "/perfil", icon: User, label: "Perfil" },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 h-[calc(60px+env(safe-area-inset-bottom))] w-full max-w-[430px] -translate-x-1/2 overflow-hidden border-t border-white/[0.06] bg-[#0A0A0A] pb-safe">
      <div className="mx-auto grid h-[60px] w-full max-w-full grid-cols-5 items-center px-0">
        {items.slice(0, 2).map(({ to, icon: Icon, label, match }) => {
          const active = (match ?? [to]).some((path) => pathname.startsWith(path));
          return (
            <Link
              key={to}
              to={to as never}
              aria-label={label}
              className={`flex h-[60px] w-full flex-col items-center justify-center gap-1 text-[10px] font-medium leading-none ${
                active ? "text-[#C8FF00]" : "text-[#555555]"
              }`}
            >
              <Icon
                className="h-[22px] w-[22px]"
                strokeWidth={1.7}
                fill={active ? "currentColor" : "none"}
              />
              <span className="max-w-full truncate whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
        <Link
          to="/treino"
          aria-label="Iniciar treino"
          className="relative flex h-[60px] w-full items-center justify-center"
        >
          <span className="absolute -top-4 grid h-14 w-14 place-items-center rounded-full bg-[#C8FF00] text-black shadow-[0_4px_16px_rgba(200,255,0,0.4)]">
            <Plus className="h-7 w-7" strokeWidth={3} />
          </span>
        </Link>
        {items.slice(2).map(({ to, icon: Icon, label, match }) => {
          const active = (match ?? [to]).some((path) => pathname.startsWith(path));
          return (
            <Link
              key={to}
              to={to as never}
              aria-label={label}
              className={`flex h-[60px] w-full flex-col items-center justify-center gap-1 text-[10px] font-medium leading-none ${
                active ? "text-[#C8FF00]" : "text-[#555555]"
              }`}
            >
              <Icon
                className="h-[22px] w-[22px]"
                strokeWidth={1.7}
                fill={active ? "currentColor" : "none"}
              />
              <span className="max-w-full truncate whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
