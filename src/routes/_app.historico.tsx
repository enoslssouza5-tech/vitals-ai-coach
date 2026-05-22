import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { HeroHeader } from "@/components/HeroHeader";
import { Footprints, Bike, Dumbbell, MapPin, MountainSnow, Trash2, Share2, Eye, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/historico")({ component: Historico });

const ICONS: Record<string, any> = { running: Footprints, cycling: Bike, walking: MapPin, hiking: MountainSnow, workout: Dumbbell };

function Historico() {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities", "all", user?.id],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await supabase.from("activities").select("*").eq("user_id", user!.id).order("started_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  const deleteActivity = async (id: string) => {
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atividade removida!");
    setSelectedActivity(null);
    qc.invalidateQueries({ queryKey: ["activities"] });
  };

  const handleTouchStart = (activity: any) => {
    timerRef.current = setTimeout(() => {
      setSelectedActivity(activity);
      // Immediate sutil haptic representation
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600); // 600ms for long press
  };

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
  };

  return (
    <div>
      <HeroHeader image="cycling" title="HISTÓRICO" subtitle="SEUS REGISTROS E CONQUISTAS" height="30vh" />

      <div className="px-5 space-y-4 pb-28 -mt-4 relative z-10 select-none">
        <div className="athletic-label tracking-widest text-[10px]">● ATIVIDADES REGISTRADAS</div>

        {isLoading && <p className="text-xs font-black tracking-widest uppercase text-muted-foreground text-center py-8">CARREGANDO...</p>}
        
        {!isLoading && (activities?.length ?? 0) === 0 && (
          <motion.div 
            className="glass-card p-8 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-xs font-semibold text-muted-foreground mb-5 uppercase tracking-wide">Nenhuma atividade registrada ainda. Vamos treinar?</p>
            <Link to="/treino" className="inline-flex h-11 px-5 rounded-2xl bg-primary text-primary-foreground font-black tracking-widest text-xs items-center glow-primary-sm">
              START YOUR FIRST WORKOUT
            </Link>
          </motion.div>
        )}

        <motion.div 
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {activities?.map((a) => {
            const Icon = ICONS[a.type] ?? Footprints;
            const d = new Date(a.started_at);
            const km = (Number(a.distance_meters ?? 0) / 1000).toFixed(2);
            const min = Math.round((a.duration_seconds ?? 0) / 60);
            
            return (
              <motion.div 
                key={a.id} 
                variants={itemVariants}
                whileTap={{ scale: 0.97 }}
                onMouseDown={() => handleTouchStart(a)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onTouchStart={() => handleTouchStart(a)}
                onTouchEnd={handleTouchEnd}
                onClick={() => {
                  // Fallback to show context menu on simple tap for better discoverability
                  setSelectedActivity(a);
                }}
                className="glass-card p-4 flex items-center gap-4 cursor-pointer relative overflow-hidden"
                style={{ willChange: "transform" }}
              >
                <div className="icon-circle h-12 w-12 shrink-0 glow-primary-sm">
                  <Icon className="h-6 w-6 text-primary-light" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm tracking-tight truncate uppercase">{a.title ?? a.type}</div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">
                    {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-base font-black font-mono leading-none flex items-baseline justify-end">
                    {km}
                    <span className="text-[9px] font-black text-muted-foreground uppercase ml-0.5">km</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase num mt-1">{min} min</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* QUICK ACTIONS MODAL ON LONG PRESS */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/85 backdrop-blur-md" onClick={() => setSelectedActivity(null)} />
            
            {/* Modal */}
            <motion.div 
              className="relative z-10 w-full max-w-sm glass-card p-6 border border-primary/25"
              initial={{ y: 150, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 150, scale: 0.95 }}
              transition={{ type: "spring" as const, stiffness: 260, damping: 26 }}
            >
              <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4">
                <div>
                  <span className="text-[9px] font-black text-primary-light tracking-widest uppercase">QUICK ACTION MENU</span>
                  <h4 className="font-black text-sm uppercase truncate mt-0.5">{selectedActivity.title ?? selectedActivity.type}</h4>
                </div>
                <button 
                  onClick={() => setSelectedActivity(null)}
                  className="icon-circle h-8 w-8 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => {
                    toast.info("Compartilhando atividade...");
                    setSelectedActivity(null);
                  }}
                  className="w-full h-12 rounded-xl bg-surface/50 border border-border/20 flex items-center gap-3 px-4 font-black tracking-widest text-[10px] uppercase text-left cursor-pointer hover:bg-surface transition"
                >
                  <Share2 className="h-4 w-4 text-primary-light" /> SHARE ACTIVITY
                </button>
                
                <button 
                  onClick={() => {
                    toast.info(`Insights da IA: ${selectedActivity.ai_insights ?? "Foco na resistência."}`);
                    setSelectedActivity(null);
                  }}
                  className="w-full h-12 rounded-xl bg-surface/50 border border-border/20 flex items-center gap-3 px-4 font-black tracking-widest text-[10px] uppercase text-left cursor-pointer hover:bg-surface transition"
                >
                  <Eye className="h-4 w-4 text-primary-light" /> VIEW COACH INSIGHTS
                </button>

                <button 
                  onClick={() => deleteActivity(selectedActivity.id)}
                  className="w-full h-12 rounded-xl bg-danger/10 border border-danger/25 flex items-center gap-3 px-4 font-black tracking-widest text-[10px] uppercase text-left text-danger cursor-pointer hover:bg-danger/20 transition"
                >
                  <Trash2 className="h-4 w-4 text-danger" /> DELETE WORKOUT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
