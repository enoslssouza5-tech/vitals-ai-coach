import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useAuthModal } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { HeroHeader } from "@/components/HeroHeader";
import { Counter } from "@/components/Counter";
import { toast } from "sonner";
import { History, Shield, ChevronRight, Eye, EyeOff, LogIn } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/perfil")({ component: Perfil });

function Perfil() {
  const { user, isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: count } = useQuery({
    queryKey: ["activities", "count", user?.id],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { count } = await supabase.from("activities").select("*", { head: true, count: "exact" }).eq("user_id", user!.id);
      return count ?? 0;
    },
  });

  const [privacy, setPrivacy] = useState<string>("friends");
  const [hideEndpoints, setHideEndpoints] = useState(false);
  const [invisible, setInvisible] = useState(false);

  useEffect(() => {
    if (profile) {
      setPrivacy(profile.privacy_mode ?? "friends");
      setHideEndpoints(profile.hide_start_end ?? false);
      setInvisible(profile.invisible_mode ?? false);
    }
  }, [profile]);

  const updatePrivacy = async (patch: Partial<{ privacy_mode: string; hide_start_end: boolean; invisible_mode: boolean }>) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
  };

  return (
    <div>
      <HeroHeader image="running" title="PERFIL" subtitle="DADOS E PRIVACIDADE DO ATLETA" height="28vh" />

      <motion.div 
        className="px-5 space-y-5 pb-28 -mt-4 relative z-10 select-none"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* User identification */}
        <motion.div 
          className="glass-card p-4"
          variants={itemVariants}
          whileTap={{ scale: 0.98 }}
        >
          <button
            onClick={openAuthModal}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black tracking-widest text-primary-foreground glow-primary-sm"
          >
            <LogIn className="h-4 w-4" /> ENTRAR OU CRIAR CONTA
          </button>
        </motion.div>

        {/* Triple aggregates */}
        <motion.div className="grid grid-cols-3 gap-3" variants={itemVariants}>
          <Stat n={count ?? 0} l="ATIVIDADES" />
          <Stat n={profile?.weight_kg ?? 72} l="PESO (KG)" decimals={0} />
          <Stat n={profile?.height_cm ?? 175} l="ALTURA (CM)" decimals={0} />
        </motion.div>

        {/* History Navigation */}
        <motion.div variants={itemVariants}>
          <Link to="/historico" className="glass-card p-4 flex items-center justify-between active:scale-[0.98] transition block">
            <div className="flex items-center gap-3">
              <div className="icon-circle h-10 w-10 glow-primary-sm"><History className="h-5 w-5 text-primary-light" /></div>
              <div className="font-black text-sm tracking-wide">MY ACTIVITY HISTORY</div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </motion.div>

        {/* Privacy options */}
        <motion.div className="glass-card p-5" variants={itemVariants}>
          <div className="flex items-center gap-2 mb-4">
            <div className="icon-circle h-8 w-8 glow-primary-sm"><Shield className="h-4 w-4 text-primary-light" /></div>
            <div className="athletic-label tracking-widest text-[10px] mb-0">● PRIVACIDADE E SEGURANÇA</div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[9px] text-muted-foreground font-black tracking-widest uppercase">VISIBILIDADE DO PERFIL</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(["public", "friends", "private"] as const).map((p) => (
                  <button key={p} onClick={() => { setPrivacy(p); updatePrivacy({ privacy_mode: p }); }}
                    className={`h-10 rounded-xl text-[10px] font-black tracking-widest uppercase transition cursor-pointer ${privacy === p ? "bg-primary text-primary-foreground glow-primary-sm" : "glass-card text-muted-foreground"}`}>
                    {p === "public" ? "Todos" : p === "friends" ? "Amigos" : "Privado"}
                  </button>
                ))}
              </div>
            </div>
            
            <Toggle label="OCULTAR INÍCIO/FIM DA ROTA" icon={EyeOff} value={hideEndpoints}
              onChange={(v) => { setHideEndpoints(v); updatePrivacy({ hide_start_end: v }); }} />
            
            <Toggle label="MODO INVISÍVEL ATIVO" icon={Eye} value={invisible}
              onChange={(v) => { setInvisible(v); updatePrivacy({ invisible_mode: v }); }} />
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

function Stat({ n, l, decimals = 0 }: { n: any; l: string; decimals?: number }) {
  const isNum = typeof n === "number";
  return (
    <div className="glass-card p-4 text-center cursor-pointer select-none" style={{ willChange: "transform" }}>
      <div className="text-2xl font-black font-mono leading-none text-primary-light">
        {isNum ? <Counter to={n} decimals={decimals} /> : "—"}
      </div>
      <div className="text-[9px] text-muted-foreground font-black tracking-widest uppercase mt-2">{l}</div>
    </div>
  );
}

function Toggle({ label, icon: Icon, value, onChange }: { label: string; icon: any; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="w-full flex items-center justify-between p-3 rounded-xl glass-card active:scale-[0.99] transition cursor-pointer">
      <span className="flex items-center gap-2 text-xs font-black tracking-wider text-muted-foreground">
        <div className="icon-circle h-7 w-7"><Icon className="h-3.5 w-3.5 text-primary-light" /></div>
        {label}
      </span>
      <span className={`h-6 w-11 rounded-full transition ${value ? "bg-primary" : "bg-border/30"} relative`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${value ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}
