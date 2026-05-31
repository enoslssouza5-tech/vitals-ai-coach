import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Plus,
  QrCode,
  Share2,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type BrowserKind =
  | "ios-safari"
  | "ios-chrome"
  | "android-samsung"
  | "android-chrome"
  | "android-firefox"
  | "desktop";

type InstallStep = {
  icon: LucideIcon;
  title: string;
  detail?: string;
  highlight?: string;
};

const DISMISS_KEY = "pulse_install_dismissed";

function isStandalone() {
  if (typeof window === "undefined") return true;

  const displayMode = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

  return displayMode || iosStandalone;
}

function detectBrowser(): BrowserKind {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua);
  const isChrome = (/Chrome/.test(ua) || /CriOS/.test(ua)) && !/Edg/.test(ua);
  const isFirefox = /Firefox|FxiOS/.test(ua);
  const isSamsung = /SamsungBrowser/.test(ua);

  if (isIOS && isSafari) return "ios-safari";
  if (isIOS && isChrome) return "ios-chrome";
  if (isAndroid && isSamsung) return "android-samsung";
  if (isAndroid && isChrome) return "android-chrome";
  if (isAndroid && isFirefox) return "android-firefox";
  return "desktop";
}

function getInstallGuide(browser: BrowserKind): { title: string; steps: InstallStep[] } {
  if (browser === "ios-safari") {
    return {
      title: "No Safari do iPhone:",
      steps: [
        {
          icon: Share2,
          title: "Toque no botão compartilhar",
          detail: "ícone de caixinha com seta, no centro da barra inferior",
        },
        {
          icon: Plus,
          title: "Role a lista e toque em",
          highlight: '"Adicionar à Tela de Início"',
        },
        {
          icon: Check,
          title: 'Toque em "Adicionar"',
          detail: "O Pulse aparecerá na sua tela inicial como um app",
        },
      ],
    };
  }

  if (browser === "ios-chrome") {
    return {
      title: "No Chrome do iPhone:",
      steps: [
        {
          icon: MoreHorizontal,
          title: "Toque nos 3 pontinhos",
          detail: "no canto inferior direito da tela",
        },
        {
          icon: Plus,
          title: 'Toque em "Adicionar à Tela de Início"',
        },
        {
          icon: Check,
          title: 'Confirme tocando em "Adicionar"',
        },
      ],
    };
  }

  if (browser === "android-samsung") {
    return {
      title: "No Samsung Internet:",
      steps: [
        {
          icon: Menu,
          title: "Toque no menu (3 traços)",
          detail: "canto inferior direito",
        },
        {
          icon: Plus,
          title: 'Toque em "Adicionar página a"',
          detail: 'depois em "Tela inicial"',
        },
        {
          icon: Check,
          title: 'Confirme tocando em "Adicionar"',
        },
      ],
    };
  }

  if (browser === "android-firefox") {
    return {
      title: "No Firefox:",
      steps: [
        {
          icon: MoreVertical,
          title: "Toque nos 3 pontinhos",
          detail: "no canto superior direito",
        },
        {
          icon: Plus,
          title: 'Toque em "Instalar"',
          detail: 'ou "Adicionar à tela inicial"',
        },
        {
          icon: Check,
          title: "Confirme a instalação",
        },
      ],
    };
  }

  if (browser === "android-chrome") {
    return {
      title: "No Chrome do Android:",
      steps: [
        {
          icon: MoreVertical,
          title: "Toque nos 3 pontinhos",
          detail: "no canto superior direito",
        },
        {
          icon: Smartphone,
          title: 'Toque em "Adicionar à tela inicial"',
          detail: 'ou "Instalar aplicativo"',
        },
        {
          icon: Check,
          title: 'Confirme tocando em "Adicionar"',
        },
      ],
    };
  }

  return {
    title: "Para melhor experiência, acesse pelo celular.",
    steps: [],
  };
}

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return true;
  }
}

function saveDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, "true");
  } catch {
    // Storage can be blocked in private modes; closing the overlay still keeps the app usable.
  }
}

export function PwaInstallOverlay() {
  const [visible, setVisible] = useState(false);
  const [browser, setBrowser] = useState<BrowserKind>("desktop");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [appUrl, setAppUrl] = useState("");

  const guide = useMemo(() => getInstallGuide(browser), [browser]);
  const canUseNativePrompt = Boolean(installPrompt);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return;

    const detectedBrowser = detectBrowser();
    setBrowser(detectedBrowser);
    setAppUrl(window.location.origin + "/dashboard");

    if (detectedBrowser === "desktop") return;

    const timer = window.setTimeout(() => {
      if (!isStandalone() && !wasDismissed()) setVisible(true);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    saveDismissed();
    setVisible(false);
  };

  const install = async () => {
    if (!installPrompt) {
      dismiss();
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    dismiss();
  };

  return (
    <div
      className="pwa-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      <div className="pwa-install-panel">
        <div className="pwa-logo-wrap" aria-hidden="true">
          <img src="/images/logo.png" alt="" className="pwa-logo" />
        </div>

        <h1 id="pwa-install-title" className="pwa-install-title">
          Para desfrutar melhor da experiência, instale o Pulse no seu celular.
        </h1>
        <p className="pwa-install-subtitle">É rápido e gratuito!</p>

        <div className="pwa-install-divider">
          <span>Passo a passo</span>
        </div>

        <section className="w-full" aria-label={guide.title}>
          <h2 className="pwa-guide-title">{guide.title}</h2>

          {browser === "desktop" ? (
            <div className="pwa-desktop-qr">
              {canUseNativePrompt ? (
                <div className="pwa-native-prompt-card">
                  <Download className="h-6 w-6 text-[#C8FF00]" />
                  <span>Este navegador permite instalar o Pulse no computador.</span>
                </div>
              ) : (
                <>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=148x148&margin=10&data=${encodeURIComponent(appUrl)}`}
                    alt="QR Code para abrir o Pulse no celular"
                    className="pwa-qr-image"
                  />
                  <p>Aponte a câmera do celular para o QR Code</p>
                  <div className="pwa-copy-link">
                    <Copy className="h-4 w-4" />
                    <span>{appUrl}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="install-steps">
              {guide.steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div className="install-step" key={`${step.title}-${index}`}>
                    <div className="step-number" aria-hidden="true">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="step-content">
                      <div className="step-title">{step.title}</div>
                      {step.highlight ? (
                        <div className="step-highlight">{step.highlight}</div>
                      ) : null}
                      {step.detail ? <div className="step-detail">{step.detail}</div> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <button className="pwa-primary-button" type="button" onClick={install}>
          {canUseNativePrompt ? (
            <>
              <Download className="h-5 w-5" />
              Instalar o Pulse agora
            </>
          ) : (
            <>
              <QrCode className="h-5 w-5" />
              Entendi, vou instalar
            </>
          )}
        </button>

        <button className="pwa-dismiss-button" type="button" onClick={dismiss}>
          Continuar sem instalar →
        </button>
      </div>
    </div>
  );
}
