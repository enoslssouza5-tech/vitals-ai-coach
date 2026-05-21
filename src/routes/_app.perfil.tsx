import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { LogOut, History, Shield, ChevronRight, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/_app/perfil")({ component: Perfil });

function Perfil() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: count } = useQuery({
    queryKey: ["activities", "count", user?.id],
    enabled: !!user,
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

  const updatePrivacy = async (patch: Record<string, any>) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const initials = (profile?.full_name ?? user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div>
      <PageHeader title="Perfil" />
      <div className="px-5 space-y-4 pb-6">
        <div className="flex items-center gap-4 animate-fade-in">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary-light grid place-items-center text-2xl font-bold glow-primary-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{profile?.full_name ?? "Atleta"}</h2>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 animate-fade-in">
          <Stat n={count ?? 0} l="Atividades" />
          <Stat n={profile?.weight_kg ?? "—"} l="Peso (kg)" />
          <Stat n={profile?.height_cm ?? "—"} l="Altura (cm)" />
        </div>

        <Link to="/historico" className="glass-card p-4 flex items-center justify-between active:scale-[0.99] transition animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/15 grid place-items-center"><History className="h-5 w-5 text-primary-light" /></div>
            <div className="font-semibold">Histórico de treinos</div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>

        <div className="glass-card p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary-light" />
            <h3 className="font-semibold">Privacidade</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Visibilidade padrão</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(["public", "friends", "private"] as const).map((p) => (
                  <button key={p} onClick={() => { setPrivacy(p); updatePrivacy({ privacy_mode: p }); }}
                    className={`h-10 rounded-lg text-xs font-semibold transition ${privacy === p ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"}`}>
                    {p === "public" ? "Todos" : p === "friends" ? "Amigos" : "Privado"}
                  </button>
                ))}
              </div>
            </div>

            <Toggle label="Ocultar início/fim da rota" icon={EyeOff} value={hideEndpoints}
              onChange={(v) => { setHideEndpoints(v); updatePrivacy({ hide_start_end: v }); }} />
            <Toggle label="Modo invisível" icon={Eye} value={invisible}
              onChange={(v) => { setInvisible(v); updatePrivacy({ invisible_mode: v }); }} />
          </div>
        </div>

        <button onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
          className="w-full h-12 rounded-xl bg-surface border border-border text-danger font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: any; l: string }) {
  return (
    <div className="glass-card p-3 text-center">
      <div className="text-xl font-bold num">{n}</div>
      <div className="text-[10px] text-muted-foreground uppercase mt-0.5">{l}</div>
    </div>
  );
}

function Toggle({ label, icon: Icon, value, onChange }: { label: string; icon: any; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-2 active:scale-[0.99] transition">
      <span className="flex items-center gap-2 text-sm"><Icon className="h-4 w-4 text-muted-foreground" /> {label}</span>
      <span className={`h-6 w-11 rounded-full transition ${value ? "bg-primary" : "bg-border"} relative`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${value ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}
