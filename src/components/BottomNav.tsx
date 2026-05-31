import { Link, useLocation } from "@tanstack/react-router";
import { BarChart3, Home, Plus, User, Users } from "lucide-react";

type Item = { to: string; icon: typeof Home; label: string; match?: string[] };

const items: Item[] = [
  { to: "/dashboard", icon: Home, label: "Inicio" },
  { to: "/atividades", icon: BarChart3, label: "Atividades", match: ["/atividades", "/historico"] },
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
      className={`relative flex h-[60px] w-full flex-col items-center justify-center gap-1 text-[10px] font-black leading-none transition-colors ${
        active ? "text-white" : "text-[#555555]"
      }`}
    >
      <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
      <span className="max-w-full truncate whitespace-nowrap">{label}</span>
      {active && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#C8FF00]" />}
    </Link>
  );
}

export function BottomNav() {
  return (
    <nav className="tab-bar" aria-label="Navegacao principal">
      <div className="mx-auto grid h-[60px] w-full max-w-full grid-cols-5 items-center px-1">
        {items.slice(0, 2).map((item) => (
          <TabItem key={item.to} {...item} />
        ))}
        <Link
          to="/treino"
          aria-label="Iniciar treino"
          className="relative flex h-[60px] w-full items-center justify-center"
        >
          <span className="absolute -top-4 grid h-14 w-14 place-items-center rounded-full bg-[#C8FF00] text-black shadow-[0_8px_18px_rgba(200,255,0,0.28)]">
            <Plus className="h-7 w-7" strokeWidth={3} />
          </span>
        </Link>
        {items.slice(2).map((item) => (
          <TabItem key={item.to} {...item} />
        ))}
      </div>
    </nav>
  );
}
