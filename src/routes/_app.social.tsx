import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Trophy, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/social")({ component: Social });

function Social() {
  return (
    <div>
      <PageHeader title="Social" subtitle="Amigos, desafios e rankings" />
      <div className="px-5 pb-6">
        <div className="glass-card p-8 text-center animate-fade-in">
          <div className="h-14 w-14 rounded-full bg-primary/15 grid place-items-center mx-auto mb-4">
            <Trophy className="h-7 w-7 text-primary-light" />
          </div>
          <h3 className="font-bold text-lg">Social em breve</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            Conecte-se com amigos, participe de desafios mensais e suba no ranking. Em desenvolvimento.
          </p>
          <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-primary font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> EM BREVE
          </div>
        </div>
      </div>
    </div>
  );
}
