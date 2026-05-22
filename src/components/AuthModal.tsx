import { useState, type FormEvent, type InputHTMLAttributes } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Mail, User, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth, useAuthModal } from "@/lib/auth";
import { AppLogo } from "@/components/AppLogo";

export function AuthModal() {
  const { isOpen, closeAuthModal } = useAuthModal();
  const { setSession } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        if (data.session) setSession(data.session);
        toast.success("Conta criada.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSession(data.session);
        toast.success("Bem-vindo ao Pulse.");
      }
      closeAuthModal();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
      if (!result.redirected) {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        closeAuthModal();
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro com Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
        >
          <motion.div
            className="auth-sheet glass-card w-full max-w-md rounded-t-[2rem] rounded-b-none p-5 pb-safe"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <AppLogo size="sm" />
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">
                    {mode === "signin" ? "Entrar" : "Criar conta"}
                  </h2>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Acesse recursos premium do Pulse.
                  </p>
                </div>
              </div>
              <button className="icon-circle h-9 w-9" onClick={closeAuthModal} aria-label="Fechar">
                <X className="h-4 w-4 text-primary-light" />
              </button>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-3">
              {mode === "signup" && (
                <Field icon={User} value={name} onChange={setName} placeholder="Seu nome" required />
              )}
              <Field icon={Mail} value={email} onChange={setEmail} placeholder="E-mail" type="email" required />
              <Field icon={Lock} value={password} onChange={setPassword} placeholder="Senha" type="password" minLength={6} required />

              <button
                disabled={loading}
                className="h-12 w-full rounded-2xl bg-primary text-sm font-black tracking-widest text-primary-foreground glow-primary-sm disabled:opacity-60"
              >
                {loading ? "..." : mode === "signin" ? "ENTRAR" : "CRIAR CONTA"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            <button
              onClick={google}
              disabled={loading}
              className="glass-card flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#fff" d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.6 4.1-5.35 4.1-3.2 0-5.85-2.65-5.85-5.9s2.65-5.9 5.85-5.9c1.85 0 3.05.78 3.75 1.45l2.55-2.45C16.7 3.95 14.6 3 12 3 6.95 3 2.85 7.1 2.85 12s4.1 9 9.15 9c5.3 0 8.8-3.7 8.8-8.9 0-.6-.05-1.05-.15-1.5z" />
              </svg>
              Continuar com Google
            </button>

            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-5 w-full text-center text-sm font-semibold text-muted-foreground"
            >
              {mode === "signin" ? "Nao tem conta? " : "Ja tem conta? "}
              <span className="text-primary-light">{mode === "signin" ? "Criar agora" : "Entrar"}</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  icon: Icon,
  value,
  onChange,
  ...props
}: {
  icon: any;
  value: string;
  onChange: (value: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        {...props}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-border bg-surface/50 pl-11 pr-4 outline-none backdrop-blur transition focus:border-primary-light"
      />
    </div>
  );
}
