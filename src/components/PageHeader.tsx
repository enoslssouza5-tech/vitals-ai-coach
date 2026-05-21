import { Bell } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="px-5 pt-safe pb-4 flex items-center justify-between sticky top-0 z-30 bg-background/80 backdrop-blur-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {right ?? (
          <button className="h-10 w-10 grid place-items-center rounded-full bg-surface border border-border active:scale-95 transition">
            <Bell className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
}
