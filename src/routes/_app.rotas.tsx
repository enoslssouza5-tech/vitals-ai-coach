import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Map, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/rotas")({ component: Rotas });

function Rotas() {
  return (
    <div>
      <PageHeader title="Rotas" subtitle="Suas rotas e descobertas" />
      <div className="px-5 pb-6">
        <div className="glass-card p-8 text-center animate-fade-in">
          <div className="h-14 w-14 rounded-full bg-primary/15 grid place-items-center mx-auto mb-4">
            <Map className="h-7 w-7 text-primary-light" />
          </div>
          <h3 className="font-bold text-lg">Rotas em breve</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            Salve rotas favoritas, descubra trilhas próximas e compartilhe com amigos. Em desenvolvimento.
          </p>
          <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-primary font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> EM BREVE
          </div>
        </div>
      </div>
    </div>
  );
}
