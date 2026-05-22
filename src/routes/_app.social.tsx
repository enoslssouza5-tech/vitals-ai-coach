import { createFileRoute } from "@tanstack/react-router";
import { HeroHeader } from "@/components/HeroHeader";
import { Trophy, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/social")({ component: Social });

function Social() {
  return (
    <div>
      <HeroHeader image="running" title="SOCIAL" subtitle="AMIGOS E DESAFIOS COLETIVOS" height="30vh" />
      
      <div className="px-5 pb-28 -mt-4 relative z-10 select-none">
        <motion.div 
          className="glass-card p-8 text-center cursor-pointer"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="icon-circle h-14 w-14 mx-auto mb-4 glow-primary-sm">
            <Trophy className="h-7 w-7 text-primary-light" />
          </div>
          <h3 className="font-black text-lg uppercase tracking-tight">SOCIAL EM BREVE</h3>
          <p className="text-xs text-muted-foreground mt-3 max-w-xs mx-auto leading-relaxed font-semibold">
            Conecte-se com amigos, participe de rankings semanais, dispute medalhas virtuais e suba de liga nas competições ativas.
          </p>
          
          {/* TODO: trigger AuthModal for premium feature */}
          <div className="mt-6 inline-flex items-center gap-1.5 text-[9px] font-black tracking-widest text-primary-light bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase">
            <Sparkles className="h-3.5 w-3.5" /> EM DESENVOLVIMENTO
          </div>
        </motion.div>
      </div>
    </div>
  );
}
