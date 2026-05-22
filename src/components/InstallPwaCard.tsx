import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "pulse:pwa-install-card-dismissed";

function getInstallCopy() {
  if (typeof navigator === "undefined") {
    return {
      title: "Use o Pulse no celular",
      body: "Acesse este link pelo seu smartphone para instalar",
    };
  }

  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);

  if (isIOS) {
    return {
      title: "Instale o Pulse no seu iPhone",
      body: 'Toque em compartilhar -> "Adicionar a Tela de Inicio"',
    };
  }

  if (isAndroid) {
    return {
      title: "Instale o Pulse no seu celular",
      body: 'Toque em ⋮ -> "Adicionar a tela inicial"',
    };
  }

  return {
    title: "Use o Pulse no celular",
    body: "Acesse este link pelo seu smartphone para instalar",
  };
}

export function InstallPwaCard() {
  const [dismissed, setDismissed] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const copy = getInstallCopy();

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true");

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    dismiss();
  };

  return (
    <div className="glass-card flex items-center gap-3 p-3 text-left">
      <div className="icon-circle h-9 w-9 shrink-0 glow-primary-sm">
        {installPrompt ? <Download className="h-4 w-4 text-primary-light" /> : <Smartphone className="h-4 w-4 text-primary-light" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-xs font-black uppercase tracking-wide">{copy.title}</div>
        {installPrompt ? (
          <button onClick={install} className="mt-1 text-xs font-black text-primary-light">
            Instalar agora
          </button>
        ) : (
          <p className="mt-0.5 text-[11px] font-semibold leading-snug text-muted-foreground">{copy.body}</p>
        )}
      </div>

      <button onClick={dismiss} className="icon-circle h-8 w-8 shrink-0" aria-label="Fechar guia de instalacao">
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
