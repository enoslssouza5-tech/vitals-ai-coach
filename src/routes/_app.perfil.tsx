import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ActivityList,
  AppScreen,
  DesignCard,
  NotificationBell,
  ProfileLocation,
  SectionTitle,
  VitalsHex,
  WeeklySummary,
} from "@/components/PulseUI";
import { lerPerfil, salvarPerfil, type PerfilPulse } from "@/lib/pulse-data";
import { listarTreinos } from "@/lib/treino-history";
import { ChevronDown, Edit3, Info, Settings } from "lucide-react";
import { toast } from "sonner";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_app/perfil")({ component: Perfil });

const tabs = ["Resumo", "Atividades", "Estatísticas", "Conquistas"];

function Perfil() {
  const [perfil, setPerfil] = useState<PerfilPulse>(() => lerPerfil());
  const [activeTab, setActiveTab] = useState("Resumo");
  const treinos = useMemo(() => listarTreinos(), []);
  const nome = perfil.nome || "Lucas Martins";
  const username = `@${nome.toLowerCase().replace(/\s+/g, "")}`;

  const salvar = () => {
    salvarPerfil(perfil);
    toast.success("Perfil atualizado.");
  };

  return (
    <AppScreen>
      <header className="flex items-center justify-between pt-7 pb-8">
        <h1 className="text-[31px] font-black tracking-[-0.04em] text-white">Perfil</h1>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <button className="h-11 w-11 grid place-items-center" aria-label="Configuracoes">
            <Settings className="h-8 w-8 text-white" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <section className="space-y-5">
        <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-5">
          <div className="relative h-[150px] w-[150px]">
            <img
              src="/images/hero-running.png"
              alt=""
              className="h-[150px] w-[150px] rounded-full border-2 border-[#C8FF00] object-cover object-center"
            />
            <button
              onClick={salvar}
              className="absolute bottom-0 right-0 grid h-12 w-12 place-items-center rounded-full bg-[#2A2A2A] text-white"
              aria-label="Editar perfil"
            >
              <Edit3 className="h-6 w-6" strokeWidth={1.7} />
            </button>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <input
                value={perfil.nome || nome}
                onChange={(event) => setPerfil({ ...perfil, nome: event.target.value })}
                className="min-w-0 flex-1 bg-transparent text-[22px] font-black leading-tight tracking-[-0.04em] text-white outline-none"
                aria-label="Nome"
              />
              <span className="rounded border border-[#C8FF00]/45 px-2 py-0.5 text-xs font-bold text-[#C8FF00]">
                PRO
              </span>
            </div>
            <div className="mt-1 text-base text-[#888888]">{username}</div>
            <ProfileLocation city={perfil.cidade || "São Paulo, SP"} />
            <p className="mt-6 text-base leading-snug text-[#888888]">
              Corro por evolução.
              <br />
              Pulse Coach me guia. Disciplina me leva.
            </p>
            <div className="mt-7 flex gap-12">
              <ProfileCount value="135" label="Seguindo" />
              <ProfileCount value="1.248" label="Seguidores" />
            </div>
          </div>
        </div>

        <div className="-mt-1 flex justify-end">
          <div className="text-center">
            <VitalsHex value={78} small />
            <div className="mt-2 flex items-center justify-center gap-1 text-sm uppercase text-[#888888]">
              VITALS SCORE <Info className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </section>

      <nav className="mt-8 grid grid-cols-4 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-center text-lg font-semibold ${
              activeTab === tab ? "border-b-2 border-[#C8FF00] text-[#C8FF00]" : "text-[#555555]"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="mt-6 space-y-5">
        <DesignCard>
          <SectionTitle title="Esta semana" action="Ver todas" />
          <WeeklySummary showComparisons={false} />
        </DesignCard>

        <DesignCard>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Performance</h2>
              <p className="mt-1 text-base text-[#888888]">Últimos 6 meses</p>
            </div>
            <button className="flex h-11 items-center gap-3 rounded-lg border border-white/[0.06] px-4 text-base text-white">
              Distância <ChevronDown className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="relative h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={performanceData}
                margin={{ top: 16, right: 6, bottom: 0, left: -30 }}
              >
                <defs>
                  <linearGradient id="pulseArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#C8FF00" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#C8FF00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  stroke="#555555"
                  fontSize={14}
                />
                <YAxis hide domain={[20, 48]} />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    background: "#1A1A1A",
                    border: "1px solid rgba(255,255,255,.06)",
                    borderRadius: 8,
                    color: "#C8FF00",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="km"
                  stroke="#C8FF00"
                  strokeWidth={3}
                  fill="url(#pulseArea)"
                  dot={false}
                  activeDot={{ r: 7, fill: "#C8FF00", stroke: "#1A1A1A", strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="absolute right-0 top-[82px] rounded-md bg-[#C8FF00] px-2 py-1 text-sm font-bold text-black">
              42,6 km
            </div>
          </div>
        </DesignCard>

        <DesignCard>
          <SectionTitle title="Atividade recente" action="Ver todas" />
          <ActivityList treinos={treinos} showBadge={false} limit={2} />
        </DesignCard>
      </div>
    </AppScreen>
  );
}

function ProfileCount({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-base text-[#888888]">{label}</div>
    </div>
  );
}

const performanceData = [
  { label: "Nov", km: 26 },
  { label: "Dez", km: 29 },
  { label: "Jan", km: 36 },
  { label: "Fev", km: 32 },
  { label: "Mar", km: 35 },
  { label: "Abr", km: 42.6 },
];
