import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Database,
  Download,
  HelpCircle,
  Lock,
  MapPin,
  Moon,
  ShieldCheck,
  Smartphone,
  Target,
  User,
  Watch,
} from "lucide-react";
import { useMemo, useState } from "react";
import { lerPerfil } from "@/lib/pulse-data";
import { listarTreinos } from "@/lib/treino-history";

export const Route = createFileRoute("/_app/configuracoes")({ component: ConfiguracoesPage });

const appVersion = "Pulse 1.0";

function ConfiguracoesPage() {
  const perfil = useMemo(() => lerPerfil(), []);
  const treinos = useMemo(() => listarTreinos(), []);
  const [notifications, setNotifications] = useState({
    coach: true,
    treino: true,
    social: false,
    clima: true,
  });
  const [privacy, setPrivacy] = useState({
    perfilPublico: true,
    rotasPrivadas: true,
    metricasPublicas: false,
  });

  const totalKm = treinos.reduce(
    (sum, treino) => sum + Number(treino.distanciaMetros ?? 0) / 1000,
    0,
  );
  const totalHours = treinos.reduce(
    (sum, treino) => sum + Number(treino.duracaoSeg ?? 0) / 3600,
    0,
  );

  return (
    <main className="screen-container bg-[#0A0A0A] pt-safe text-white">
      <header className="flex items-center justify-between pt-4 pb-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to="/perfil"
            aria-label="Voltar para perfil"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1A1A1A] text-[#888888]"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-[-0.3px]">Configurações</h1>
            <p className="mt-1 truncate text-sm text-[#888888]">
              Preferências e segurança do Pulse
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        <SettingsCard>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#0A0A0A] text-[#C8FF00]">
              <User className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-bold">{perfil.nome || "Atleta Pulse"}</div>
              <div className="mt-1 truncate text-sm text-[#888888]">
                {perfil.cidade || "São Paulo, SP"} • Plano PRO
              </div>
            </div>
            <span className="rounded border border-[#C8FF00] bg-[#1A2A00] px-2 py-1 text-[11px] font-bold text-[#C8FF00]">
              PRO
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniStat label="Atividades" value={String(Math.max(treinos.length, 12))} />
            <MiniStat label="Km total" value={`${Math.max(totalKm, 426).toFixed(0)}`} />
            <MiniStat label="Horas" value={`${Math.max(totalHours, 48).toFixed(0)}h`} />
          </div>
        </SettingsCard>

        <SettingsCard title="Treino e metas" icon={Target}>
          <SettingsRow
            icon={Target}
            title="Meta semanal"
            description={`${perfil.metaSemanalKm || 20} km por semana`}
            value="Editar"
          />
          <SettingsRow
            icon={Moon}
            title="Zona de recuperação"
            description="Alertas quando sono, carga ou dor indicam risco"
            value="Ativa"
          />
          <SettingsRow
            icon={Watch}
            title="Dispositivos"
            description="Relógio esportivo, sensores e saúde do celular"
            value="2 conectados"
          />
        </SettingsCard>

        <SettingsCard title="Notificações" icon={Bell}>
          <ToggleRow
            icon={Bell}
            title="Pulse Coach"
            description="Briefings, ajustes de treino e lembretes inteligentes"
            checked={notifications.coach}
            onChange={() => setNotifications((state) => ({ ...state, coach: !state.coach }))}
          />
          <ToggleRow
            icon={Target}
            title="Treinos e metas"
            description="Avisos de meta semanal, sequência e próxima sessão"
            checked={notifications.treino}
            onChange={() => setNotifications((state) => ({ ...state, treino: !state.treino }))}
          />
          <ToggleRow
            icon={Cloud}
            title="Clima e segurança"
            description="Alertas de calor, chuva e melhor horário para sair"
            checked={notifications.clima}
            onChange={() => setNotifications((state) => ({ ...state, clima: !state.clima }))}
          />
        </SettingsCard>

        <SettingsCard title="Privacidade" icon={Lock}>
          <ToggleRow
            icon={User}
            title="Perfil público"
            description="Permitir que atletas encontrem seu perfil"
            checked={privacy.perfilPublico}
            onChange={() =>
              setPrivacy((state) => ({ ...state, perfilPublico: !state.perfilPublico }))
            }
          />
          <ToggleRow
            icon={MapPin}
            title="Ocultar início/fim das rotas"
            description="Protege sua casa e locais frequentes"
            checked={privacy.rotasPrivadas}
            onChange={() =>
              setPrivacy((state) => ({ ...state, rotasPrivadas: !state.rotasPrivadas }))
            }
          />
          <ToggleRow
            icon={Database}
            title="Métricas públicas"
            description="Exibir pace, carga e VITALs Score para a comunidade"
            checked={privacy.metricasPublicas}
            onChange={() =>
              setPrivacy((state) => ({ ...state, metricasPublicas: !state.metricasPublicas }))
            }
          />
        </SettingsCard>

        <SettingsCard title="Integrações" icon={ShieldCheck}>
          <SettingsRow
            icon={MapPin}
            title="Google Maps"
            description="Rotas, mapas e miniaturas de atividades"
            value="Pendente"
          />
          <SettingsRow
            icon={Cloud}
            title="Clima"
            description="Recomendações de treino baseadas no tempo local"
            value="Pendente"
          />
          <SettingsRow
            icon={Download}
            title="Instalar app"
            description="Adicionar o Pulse à tela inicial do celular"
            value="PWA"
          />
        </SettingsCard>

        <SettingsCard title="App e suporte" icon={Smartphone}>
          <SettingsRow
            icon={Smartphone}
            title="Versão"
            description={`${appVersion} • Tema escuro mobile-first`}
            value="Atual"
          />
          <SettingsRow
            icon={HelpCircle}
            title="Ajuda"
            description="Dúvidas sobre treinos, dados, privacidade e assinatura"
            value="Abrir"
          />
          <SettingsRow
            icon={ShieldCheck}
            title="Garantia"
            description="30 dias de garantia. Sem perguntas."
            value="Ativa"
          />
        </SettingsCard>
      </div>
    </main>
  );
}

function SettingsCard({
  children,
  title,
  icon: Icon,
}: {
  children: React.ReactNode;
  title?: string;
  icon?: typeof User;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4">
      {title && Icon ? (
        <div className="mb-4 flex items-center gap-2">
          <Icon className="h-5 w-5 text-[#C8FF00]" strokeWidth={1.7} />
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
      ) : null}
      {children}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#0A0A0A] p-3 text-center">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="mt-1 truncate text-[11px] text-[#888888]">{label}</div>
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  title,
  description,
  value,
}: {
  icon: typeof User;
  title: string;
  description: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[64px] items-center gap-3 border-t border-white/[0.06] py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0A0A0A] text-[#C8FF00]">
        <Icon className="h-5 w-5" strokeWidth={1.7} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-white">{title}</div>
        <div className="mt-0.5 line-clamp-2 text-xs leading-snug text-[#888888]">{description}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#C8FF00]">
        {value}
        <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: typeof User;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex min-h-[64px] items-center gap-3 border-t border-white/[0.06] py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0A0A0A] text-[#C8FF00]">
        <Icon className="h-5 w-5" strokeWidth={1.7} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-white">{title}</div>
        <div className="mt-0.5 line-clamp-2 text-xs leading-snug text-[#888888]">{description}</div>
      </div>
      <button
        type="button"
        onClick={onChange}
        aria-pressed={checked}
        className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors ${
          checked ? "justify-end bg-[#C8FF00]" : "justify-start bg-[#333333]"
        }`}
      >
        <span className="h-6 w-6 rounded-full bg-black" />
      </button>
    </div>
  );
}
