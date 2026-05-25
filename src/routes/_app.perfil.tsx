import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bell,
  Bike,
  ChevronDown,
  ChevronRight,
  Dumbbell,
  Edit3,
  Footprints,
  Info,
  Lock,
  MapPin,
  Medal,
  Settings,
  Timer,
  Trophy,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GoogleMapView } from "@/components/GoogleMapView";
import { lerPerfil, salvarPerfil, type PerfilPulse } from "@/lib/pulse-data";
import { performanceSeries, pulseActivities, type PulseActivity } from "@/lib/pulse-mock";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/perfil")({ component: Perfil });

const tabs = ["Resumo", "Atividades", "Estatísticas", "Conquistas"];
const performanceOptions = ["Distância", "Pace", "Tempo", "Calorias"] as const;

function Perfil() {
  const [perfil, setPerfil] = useState<PerfilPulse>(() => lerPerfil());
  const [activeTab, setActiveTab] = useState("Resumo");
  const [metric, setMetric] = useState<(typeof performanceOptions)[number]>("Distância");
  const [sportFilter, setSportFilter] = useState("Todas");
  const nome = perfil.nome || "Lucas Martins";
  const username = `@${nome.toLowerCase().replace(/\s+/g, "")}`;

  const filteredActivities = useMemo(
    () =>
      pulseActivities.filter(
        (activity) => sportFilter === "Todas" || activity.sport === sportFilter,
      ),
    [sportFilter],
  );

  const salvar = () => {
    salvarPerfil(perfil);
    toast.success("Perfil atualizado.");
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden bg-[#0A0A0A] px-4 pt-safe pb-[96px] text-white">
      <header className="flex items-center justify-between pt-7 pb-8">
        <h1 className="text-[31px] font-black tracking-[-0.04em]">Perfil</h1>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <button className="grid h-11 w-11 place-items-center" aria-label="Configurações">
            <Settings className="h-8 w-8" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <section className="space-y-5">
        <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-4">
          <div className="relative h-28 w-28">
            <img
              src="/images/hero-running.png"
              alt=""
              className="h-28 w-28 rounded-full border-2 border-[#C8FF00] object-cover"
            />
            <button
              onClick={salvar}
              className="absolute right-0 bottom-0 grid h-10 w-10 place-items-center rounded-full bg-[#2A2A2A]"
              aria-label="Editar perfil"
            >
              <Edit3 className="h-5 w-5" strokeWidth={1.7} />
            </button>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <input
                value={perfil.nome || nome}
                onChange={(event) => setPerfil({ ...perfil, nome: event.target.value })}
                className="min-w-0 flex-1 bg-transparent text-[22px] font-black leading-tight tracking-[-0.04em] outline-none"
                aria-label="Nome"
              />
              <span className="rounded border border-[#C8FF00]/45 px-2 py-0.5 text-xs font-bold text-[#C8FF00]">
                PRO
              </span>
            </div>
            <div className="mt-1 text-base text-[#888888]">{username}</div>
            <div className="mt-3 flex items-center gap-2 text-sm text-[#888888]">
              <MapPin className="h-4 w-4" /> {perfil.cidade || "São Paulo, SP"}
            </div>
            <p className="mt-4 text-[15px] leading-snug text-[#888888]">
              Corro por evolução. Pulse Coach me guia. Disciplina me leva.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-end gap-4">
          <div className="flex gap-10">
            <ProfileCount value="135" label="Seguindo" />
            <ProfileCount value="1.248" label="Seguidores" />
          </div>
          <div className="text-center">
            <div className="grid h-24 w-24 place-items-center bg-[#101409] text-[34px] font-black text-[#C8FF00] [clip-path:polygon(50%_0%,92%_25%,92%_75%,50%_100%,8%_75%,8%_25%)]">
              78
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-[11px] uppercase text-[#888888]">
              VITALS SCORE <Info className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </section>

      <nav className="mt-8 grid grid-cols-4 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`min-w-0 truncate pb-4 text-center text-[clamp(13px,3.4vw,17px)] font-semibold ${
              activeTab === tab ? "border-b-2 border-[#C8FF00] text-[#C8FF00]" : "text-[#555555]"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {activeTab === "Resumo" && <ResumoTab metric={metric} onMetric={setMetric} />}
        {activeTab === "Atividades" && (
          <ActivitiesTab
            sportFilter={sportFilter}
            onSportFilter={setSportFilter}
            activities={filteredActivities}
          />
        )}
        {activeTab === "Estatísticas" && <StatsTab />}
        {activeTab === "Conquistas" && <AchievementsTab />}
      </div>
    </main>
  );
}

function ResumoTab({
  metric,
  onMetric,
}: {
  metric: (typeof performanceOptions)[number];
  onMetric: (metric: (typeof performanceOptions)[number]) => void;
}) {
  return (
    <div className="space-y-5">
      <Card>
        <SectionHeader title="Esta semana" action="Ver todas" />
        <WeeklyGrid />
      </Card>

      <Card>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Performance</h2>
            <p className="mt-1 text-base text-[#888888]">Últimos 6 meses</p>
          </div>
          <label className="relative">
            <select
              value={metric}
              onChange={(event) => onMetric(event.target.value as typeof metric)}
              className="h-11 appearance-none rounded-lg border border-white/[0.06] bg-[#0A0A0A] pr-9 pl-4 text-base outline-none"
            >
              {performanceOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-3 right-3 h-5 w-5" />
          </label>
        </div>
        <PerformanceChart metric={metric} />
      </Card>

      <Card>
        <SectionHeader title="Atividade recente" action="Ver todas" />
        <div className="divide-y divide-white/[0.06]">
          {pulseActivities.slice(0, 2).map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function ActivitiesTab({
  sportFilter,
  onSportFilter,
  activities,
}: {
  sportFilter: string;
  onSportFilter: (sport: string) => void;
  activities: PulseActivity[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["Todas", "Corrida", "Bike", "Funcional"].map((sport) => (
          <button
            key={sport}
            onClick={() => onSportFilter(sport)}
            className={`h-10 shrink-0 rounded-full border px-4 text-sm font-bold ${
              sportFilter === sport
                ? "border-[#C8FF00] bg-[#C8FF00] text-black"
                : "border-white/10 bg-[#1A1A1A] text-[#888888]"
            }`}
          >
            {sport}
          </button>
        ))}
      </div>
      <Card>
        <div className="divide-y divide-white/[0.06]">
          {activities.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatsTab() {
  return (
    <div className="space-y-5">
      <Card>
        <SectionHeader title="Totais históricos" />
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Km total", "4.918"],
            ["Horas", "512h"],
            ["Atividades", "684"],
            ["Países", "3"],
          ].map(([label, value]) => (
            <MetricBox key={label} label={label} value={value} />
          ))}
        </div>
      </Card>
      <Card>
        <SectionHeader title="Recordes pessoais" />
        <div className="grid grid-cols-2 gap-3">
          {[
            ["5k", "23:48", "12 abr"],
            ["10k", "49:52", "02 mar"],
            ["Meia", "1:54:32", "18 fev"],
            ["Melhor pace", "4'38”", "05 jan"],
            ["Maior distância", "24,1 km", "22 dez"],
            ["Sequência", "18 dias", "Hoje"],
          ].map(([label, value, date]) => (
            <div key={label} className="rounded-xl border border-white/[0.06] bg-[#0A0A0A] p-3">
              <div className="text-[22px] font-black text-[#C8FF00]">{value}</div>
              <div className="mt-1 text-sm font-bold">{label}</div>
              <div className="text-xs text-[#888888]">{date}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionHeader title="Distribuição por esporte" />
        {[
          ["Corrida", 68],
          ["Bike", 18],
          ["Funcional", 10],
          ["Tênis", 4],
        ].map(([label, percent]) => (
          <div key={label} className="mb-4 last:mb-0">
            <div className="mb-2 flex justify-between text-sm">
              <span>{label}</span>
              <span className="text-[#888888]">{percent}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#333333]">
              <div className="h-full rounded-full bg-[#C8FF00]" style={{ width: `${percent}%` }} />
            </div>
          </div>
        ))}
      </Card>
      <Card>
        <SectionHeader title="Melhores meses" />
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 24 }, (_, index) => (
            <div
              key={index}
              className="aspect-square rounded-md"
              style={{ background: `rgba(200,255,0,${0.12 + (index % 5) * 0.12})` }}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function AchievementsTab() {
  const items = [
    ["Primeiro 5k", "12 abr", true, true],
    ["10k forte", "02 mar", true, false],
    ["Meia maratona", "18 fev", true, true],
    ["30 dias ativo", "Faltam 8 dias", false, false],
    ["Sub 45 no 10k", "Ritmo 4'30”", false, true],
    ["Explorador", "3 cidades", true, false],
    ["Madrugador", "25 treinos", true, false],
    ["Escalador", "1.000m D+", false, false],
    ["Consistência", "12 mai", true, true],
  ];
  return (
    <Card>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold">Conquistas</h2>
        <span className="text-sm text-[#888888]">12 de 48 desbloqueadas</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map(([name, detail, unlocked, rare]) => (
          <div
            key={String(name)}
            className={`min-h-[116px] rounded-2xl border p-3 text-center ${
              rare ? "border-[#C8FF00]" : "border-white/[0.06]"
            } bg-[#0A0A0A]`}
          >
            <div
              className={`mx-auto grid h-10 w-10 place-items-center rounded-full ${unlocked ? "text-[#C8FF00]" : "text-[#333333]"}`}
            >
              {unlocked ? <Medal className="h-8 w-8" /> : <Lock className="h-7 w-7" />}
            </div>
            <div className="mt-2 text-[12px] font-bold leading-tight">{name}</div>
            <div className="mt-1 text-[10px] text-[#888888]">{detail}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PerformanceChart({ metric }: { metric: keyof typeof performanceSeries }) {
  const data = performanceSeries[metric];
  const last = data[data.length - 1];
  return (
    <div className="relative h-[190px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 6, bottom: 0, left: -30 }}>
          <defs>
            <linearGradient id="pulseProfileArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#C8FF00" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#C8FF00" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" axisLine={false} tickLine={false} stroke="#555555" fontSize={12} />
          <YAxis hide />
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
            dataKey="value"
            stroke="#C8FF00"
            strokeWidth={3}
            fill="url(#pulseProfileArea)"
            dot={false}
            activeDot={{ r: 7, fill: "#C8FF00", stroke: "#1A1A1A", strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="absolute right-0 top-[82px] rounded-md bg-[#C8FF00] px-2 py-1 text-sm font-bold text-black">
        {last.value}
      </div>
    </div>
  );
}

function WeeklyGrid() {
  const items = [
    [<Footprints />, "42,6 km", "Distância"],
    [<Timer />, "4h 32m", "Tempo"],
    [<Bike />, "5'22”", "Ritmo médio"],
    [<Trophy />, "2.896", "Calorias"],
  ] as const;
  return (
    <div className="grid grid-cols-4 divide-x divide-white/[0.06]">
      {items.map(([icon, value, label]) => (
        <div key={label} className="min-w-0 px-1.5 text-center first:pl-0 last:pr-0">
          <div className="mx-auto mb-3 flex h-8 items-center justify-center text-[#C8FF00] [&_svg]:h-7 [&_svg]:w-7 [&_svg]:stroke-[1.6]">
            {icon}
          </div>
          <div className="truncate text-[clamp(16px,4vw,22px)] font-black">{value}</div>
          <div className="mt-2 truncate text-[clamp(9px,2vw,11px)] text-[#888888]">{label}</div>
        </div>
      ))}
    </div>
  );
}

function ActivityRow({ activity }: { activity: PulseActivity }) {
  return (
    <button className="flex w-full items-center gap-3 py-4 text-left first:pt-0 last:pb-0">
      <GoogleMapView
        paths={[activity.route]}
        className="h-[72px] w-[72px] shrink-0 rounded-lg"
        interactive={false}
        showControls={false}
        defaultMode="roadmap"
        strokeWeight={3}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[clamp(16px,4vw,20px)] font-bold">{activity.title}</div>
        <div className="mt-1 truncate text-[clamp(13px,3vw,15px)] text-[#888888]">
          {activity.date}
        </div>
        <div className="mt-3 flex gap-x-3 overflow-hidden text-[clamp(11px,2.7vw,13px)] text-[#888888]">
          <span className="truncate">{activity.distance}</span>
          <span className="truncate">{activity.pace}</span>
          <span className="truncate">{activity.time}</span>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-[#555555]" />
    </button>
  );
}

function NotificationBell() {
  return (
    <button className="relative grid h-11 w-11 place-items-center" aria-label="Notificações">
      <Bell className="h-7 w-7" strokeWidth={1.8} />
      <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-[#C8FF00]" />
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4">
      {children}
    </section>
  );
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="truncate text-xl font-bold">{title}</h2>
      {action && <span className="shrink-0 text-sm font-semibold text-[#C8FF00]">{action}</span>}
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0A] p-3">
      <div className="text-[11px] text-[#888888]">{label}</div>
      <div className="mt-2 text-[26px] font-black text-[#C8FF00]">{value}</div>
    </div>
  );
}

function ProfileCount({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-base text-[#888888]">{label}</div>
    </div>
  );
}
