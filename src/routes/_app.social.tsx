import { createFileRoute } from "@tanstack/react-router";
import type React from "react";
import { useState } from "react";
import {
  Activity,
  Bell,
  Camera,
  CheckCircle2,
  Flame,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Mountain,
  Plus,
  Share2,
  Timer,
  Trophy,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/social")({ component: Social });

const posts = [
  {
    name: "Juliana Costa",
    location: "São Paulo, SP",
    time: "2h",
    caption:
      "Grande treino hoje! Ritmo forte do início ao fim. Disciplina é o que constrói resultado. 💪",
    type: "Corrida",
    period: "Manhã",
    distance: "10,24",
    pace: "5’08” /km",
    duration: "52:34",
    elevation: "102 m",
    calories: "756",
    likes: 32,
    comments: 4,
    avatar: "juliana",
    route: "M66 170 L90 126 L122 118 L145 50 L169 44 L158 95 L174 152 L126 135 L100 184 Z",
  },
  {
    name: "Pedro Henrique",
    location: "Rio de Janeiro, RJ",
    time: "4h",
    caption: "Longão de sábado concluído! Boas sensações o tempo todo.",
    type: "Corrida",
    period: "Longão",
    distance: "21,37",
    pace: "5’21” /km",
    duration: "1:54:32",
    elevation: "215 m",
    calories: "1.482",
    likes: 45,
    comments: 8,
    avatar: "pedro",
    route: "M46 56 L58 76 L102 80 L136 92 L164 125 L130 147 L92 139 L62 158",
  },
  {
    name: "Marcos Vinicius",
    location: "Belo Horizonte, MG",
    time: "6h",
    caption: "Dia de treino regenerativo. Corrida leve + mobilidade.",
    type: "Corrida",
    period: "Leve",
    distance: "6,12",
    pace: "5’48” /km",
    duration: "35:30",
    elevation: "74 m",
    calories: "418",
    likes: 18,
    comments: 2,
    avatar: "marcos",
    route: "M48 152 L76 108 L102 118 L132 70 L158 92 L130 146",
  },
];

function Social() {
  const [activeTab, setActiveTab] = useState("Feed");
  const [liked, setLiked] = useState<Record<string, boolean>>({ Juliana: true });

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden bg-[#050505] px-4 pt-[52px] pb-[96px] text-white">
      <header className="mb-7 flex min-w-0 items-center justify-between gap-3">
        <h1 className="min-w-0 text-[clamp(30px,8vw,40px)] font-medium tracking-[-0.04em]">
          Social
        </h1>
        <div className="flex shrink-0 items-center gap-3">
          <button
            className="grid h-11 w-11 shrink-0 place-items-center"
            aria-label="Adicionar amigo"
          >
            <UserPlus className="h-8 w-8" strokeWidth={1.8} />
          </button>
          <button
            className="relative grid h-11 w-11 shrink-0 place-items-center"
            aria-label="Notificações"
          >
            <Bell className="h-8 w-8" strokeWidth={1.8} />
            <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-[#D7FF1F]" />
          </button>
        </div>
      </header>

      <nav className="mb-4 grid grid-cols-3 border-b border-[#1A1F2B]">
        {["Feed", "Seguindo", "Clubes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`min-w-0 truncate pb-4 text-center text-[clamp(18px,5vw,24px)] font-medium first:text-left last:text-right ${
              activeTab === tab ? "border-b-2 border-[#D7FF1F] text-[#D7FF1F]" : "text-[#9CA3AF]"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <CreatePost />

      <div className="mt-6 space-y-5">
        {posts.map((post) => (
          <article
            key={post.name}
            className="rounded-[24px] border border-[#1A1F2B] bg-[#0B0F17] p-4"
          >
            <div className="flex items-start gap-3">
              <Avatar kind={post.avatar} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="truncate text-[clamp(20px,5vw,24px)] font-semibold text-white">
                    {post.name}
                  </h2>
                  <span className="rounded-md border border-[#D7FF1F]/50 px-2 py-0.5 text-xs font-bold text-[#D7FF1F]">
                    PRO
                  </span>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D7FF1F]" />
                </div>
                <p className="mt-1 truncate text-[clamp(13px,3vw,15px)] text-[#9CA3AF]">
                  {post.location} • {post.time}
                </p>
              </div>
              <button aria-label="Mais opções">
                <MoreHorizontal className="h-7 w-7 text-[#9CA3AF]" />
              </button>
            </div>

            <p className="mt-6 text-[clamp(18px,4.7vw,22px)] leading-snug text-[#D1D5DB]">
              {post.caption}
            </p>

            <div className="mt-4 overflow-hidden rounded-[18px] border border-[#1A1F2B]">
              <div className="grid grid-cols-[104px_minmax(0,1fr)] min-[420px]:grid-cols-[clamp(128px,34vw,184px)_minmax(0,1fr)]">
                <RouteThumb route={post.route} />
                <div className="min-w-0 p-3 min-[420px]:p-4">
                  <p className="truncate text-[clamp(15px,4vw,18px)] text-[#9CA3AF]">
                    {post.type} • {post.period}
                  </p>
                  <div className="mt-2 whitespace-nowrap text-[clamp(28px,7vw,40px)] font-semibold tracking-[-0.04em]">
                    {post.distance}
                    <span className="ml-1 text-base font-medium">km</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 min-[480px]:grid-cols-4">
                    <ActivityMetric icon={<Timer />} value={post.pace} label="Ritmo médio" />
                    <ActivityMetric icon={<Timer />} value={post.duration} label="Tempo" />
                    <ActivityMetric
                      icon={<Mountain />}
                      value={post.elevation}
                      label="Ganho de elev."
                    />
                    <ActivityMetric icon={<Flame />} value={post.calories} label="Calorias" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <AvatarStack />
              <div className="min-w-0 text-[clamp(13px,3vw,15px)] text-[#9CA3AF]">
                <p className="truncate">Curtido por Lucas, Pedro e outras {post.likes} pessoas</p>
                <p className="mt-1">{post.comments} comentários</p>
              </div>
            </div>

            <div className="mt-5 border-t border-[#1A1F2B] pt-4">
              <div className="grid grid-cols-3 gap-1">
                <ActionButton
                  active={liked[post.name]}
                  icon={<Heart className={liked[post.name] ? "fill-current" : ""} />}
                  label="Curtir"
                  onClick={() =>
                    setLiked((current) => ({ ...current, [post.name]: !current[post.name] }))
                  }
                />
                <ActionButton
                  icon={<MessageCircle />}
                  label="Comentar"
                  onClick={() => toast.success("Comentário rápido aberto.")}
                />
                <ActionButton
                  icon={<Share2 />}
                  label="Compartilhar"
                  onClick={() => toast.success("Post pronto para compartilhar.")}
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      <button
        className="fixed bottom-[90px] right-5 z-30 grid h-[68px] w-[68px] place-items-center rounded-full bg-[#D7FF1F] text-black shadow-[0_0_42px_rgba(215,255,31,0.35)]"
        aria-label="Criar post"
      >
        <Plus className="h-10 w-10" strokeWidth={2.2} />
      </button>
    </main>
  );
}

function CreatePost() {
  return (
    <section className="rounded-[24px] border border-[#1A1F2B] bg-[#0B0F17] p-4">
      <div className="flex items-center gap-4 border-b border-[#1A1F2B] pb-5">
        <Avatar kind="runner" size="lg" online />
        <button className="min-w-0 flex-1 truncate text-left text-[clamp(17px,4.8vw,22px)] text-[#9CA3AF]">
          No que você está pensando?
        </button>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[#1A1F2B] pt-4">
        <PostAction icon={<Activity />} label="Atividade" />
        <PostAction icon={<Camera />} label="Foto" />
        <PostAction icon={<Trophy />} label="Conquista" />
      </div>
    </section>
  );
}

function PostAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex h-10 min-w-0 items-center justify-center gap-1.5 text-[clamp(12px,3vw,14px)] text-[#D1D5DB]">
      <span className="text-[#D1D5DB] [&_svg]:h-5 [&_svg]:w-5 [&_svg]:stroke-[1.7]">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function Avatar({ kind, size, online }: { kind: string; size: "md" | "lg"; online?: boolean }) {
  const large = size === "lg";
  return (
    <div className={`relative shrink-0 ${large ? "h-[72px] w-[72px]" : "h-[58px] w-[58px]"}`}>
      <div className="h-full w-full overflow-hidden rounded-full border-2 border-[#D7FF1F] bg-[#111827]">
        <div className={`h-full w-full ${avatarBg(kind)}`} />
      </div>
      {online && (
        <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-[#0B0F17] bg-[#D7FF1F]" />
      )}
    </div>
  );
}

function avatarBg(kind: string) {
  if (kind === "juliana")
    return "bg-[radial-gradient(circle_at_45%_25%,#f9c8a8_0_16%,#3f1d1d_17%_34%,#121826_35%)]";
  if (kind === "pedro")
    return "bg-[radial-gradient(circle_at_50%_28%,#d7a06f_0_18%,#2a1b12_19%_36%,#101827_37%)]";
  if (kind === "marcos")
    return "bg-[radial-gradient(circle_at_48%_26%,#c69063_0_17%,#111827_18%_32%,#202020_33%)]";
  return "bg-[radial-gradient(circle_at_55%_32%,#d6a06f_0_18%,#111827_19%_42%,#020617_43%)]";
}

function RouteThumb({ route }: { route: string }) {
  return (
    <div className="h-full min-h-[156px] bg-[#07100F] min-[420px]:min-h-[188px]">
      <svg viewBox="0 0 220 220" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <rect width="220" height="220" fill="#07100F" />
        <path
          d="M0 40H220M0 88H220M0 136H220M0 184H220M40 0V220M88 0V220M136 0V220M184 0V220"
          stroke="#1A2A00"
          strokeWidth="1"
          opacity="0.5"
        />
        <path
          d="M24 30C60 58 70 32 102 54S152 36 198 74M15 166C42 142 62 154 92 128S146 116 204 134"
          stroke="#173600"
          strokeWidth="10"
          opacity="0.55"
        />
        <path
          d={route}
          fill="none"
          stroke="#D7FF1F"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="66" cy="170" r="12" fill="#D7FF1F" />
        <circle cx="66" cy="170" r="5" fill="#07100F" />
      </svg>
    </div>
  );
}

function ActivityMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="min-w-0 border-l border-[#1A1F2B] pl-3 first:border-l-0 first:pl-0">
      <div className="flex items-center gap-1.5 truncate text-[clamp(13px,3.6vw,16px)] text-white">
        <span className="shrink-0 text-white [&_svg]:h-5 [&_svg]:w-5 [&_svg]:stroke-[1.7]">
          {icon}
        </span>
        <span className="truncate">{value}</span>
      </div>
      <div className="mt-2 truncate text-[clamp(11px,3vw,13px)] text-[#9CA3AF]">{label}</div>
    </div>
  );
}

function AvatarStack() {
  return (
    <div className="flex shrink-0 -space-x-3">
      {["juliana", "pedro", "marcos", "runner"].map((kind) => (
        <div
          key={kind}
          className="h-9 w-9 overflow-hidden rounded-full border-2 border-[#0B0F17] bg-[#111827]"
        >
          <div className={`h-full w-full ${avatarBg(kind)}`} />
        </div>
      ))}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-w-0 items-center justify-center gap-1 text-[clamp(11px,3vw,15px)] ${
        active ? "text-[#D7FF1F]" : "text-[#D1D5DB]"
      }`}
    >
      <span className="shrink-0 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:stroke-[1.8] min-[420px]:[&_svg]:h-6 min-[420px]:[&_svg]:w-6">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
