import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Activity, Mail, Lock } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail.");
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    try {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (r.error) throw r.error;
      if (!r.redirected) navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Erro com Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 pt-safe pb-10 flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="pulse-ring h-16 w-16 rounded-full bg-primary grid place-items-center glow-primary mb-4">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Pulse</h1>
          <p className="text-sm text-muted-foreground mt-1">Seu treinador inteligente</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input
              required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary outline-none transition"
            />
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-surface border border-border focus:border-primary outline-none transition"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha" minLength={6}
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-surface border border-border focus:border-primary outline-none transition"
            />
          </div>
          <button
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold glow-primary-sm active:scale-[0.98] transition disabled:opacity-60"
          >
            {loading ? "..." : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-border flex-1" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="h-px bg-border flex-1" />
        </div>

        <button
          onClick={google} disabled={loading}
          className="w-full h-12 rounded-xl bg-surface border border-border font-medium active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.6 4.1-5.35 4.1-3.2 0-5.85-2.65-5.85-5.9s2.65-5.9 5.85-5.9c1.85 0 3.05.78 3.75 1.45l2.55-2.45C16.7 3.95 14.6 3 12 3 6.95 3 2.85 7.1 2.85 12s4.1 9 9.15 9c5.3 0 8.8-3.7 8.8-8.9 0-.6-.05-1.05-.15-1.5z"/></svg>
          Continuar com Google
        </button>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 text-sm text-muted-foreground"
        >
          {mode === "signin" ? (
            <>Não tem conta? <span className="text-primary font-semibold">Criar agora</span></>
          ) : (
            <>Já tem conta? <span className="text-primary font-semibold">Entrar</span></>
          )}
        </button>

        <Link to="/" className="mt-6 text-xs text-center text-muted-foreground/60">← Voltar</Link>
      </div>
    </div>
  );
}
