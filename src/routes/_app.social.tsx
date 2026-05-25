import { createFileRoute } from "@tanstack/react-router";
import type React from "react";
import { useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Camera,
  CheckCircle2,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Share2,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { clubs as initialClubs, followingAthletes, weeklyRanking } from "@/lib/pulse-mock";

export const Route = createFileRoute("/_app/social")({ component: Social });

type Post = {
  id: string;
  name: string;
  location: string;
  time: string;
  caption: string;
  type: string;
  period: string;
  distance: string;
  pace: string;
  duration: string;
  elevation: string;
  calories: string;
  likes: number;
  comments: number;
  avatar: string;
  route: string;
};

const seedPosts: Post[] = [
  {
    id: "juliana",
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
    id: "pedro",
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
];

function Social() {
  const [activeTab, setActiveTab] = useState("Feed");
  const [posts, setPosts] = useState(seedPosts);
  const [liked, setLiked] = useState<Record<string, boolean>>({ juliana: true });
  const [commenting, setCommenting] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [followState, setFollowState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(followingAthletes.map((athlete) => [athlete.name, athlete.following])),
  );
  const [clubState, setClubState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialClubs.map((club) => [club.name, club.joined])),
  );

  const likeCount = (post: Post) => post.likes + (liked[post.id] ? 1 : 0);

  const publish = (caption: string, kind: string) => {
    setPosts((current) => [
      {
        ...seedPosts[0],
        id: `post-${Date.now()}`,
        name: "Lucas Martins",
        location: "São Paulo, SP",
        time: "agora",
        caption: caption || `Novo post de ${kind.toLowerCase()} no Pulse.`,
        likes: 0,
        comments: 0,
        avatar: "runner",
      },
      ...current,
    ]);
    setComposerOpen(false);
    toast.success("Post publicado.");
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden bg-[#0A0A0A] px-4 pt-[52px] pb-[96px] text-white">
      <header className="mb-7 flex min-w-0 items-center justify-between gap-3">
        <h1 className="min-w-0 text-[clamp(30px,8vw,40px)] font-black tracking-[-0.04em]">
          Social
        </h1>
        <div className="flex shrink-0 items-center gap-3">
          <button className="grid h-11 w-11 place-items-center" aria-label="Adicionar amigo">
            <UserPlus className="h-8 w-8" strokeWidth={1.8} />
          </button>
          <button className="relative grid h-11 w-11 place-items-center" aria-label="Notificações">
            <Bell className="h-8 w-8" strokeWidth={1.8} />
            <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-[#C8FF00]" />
          </button>
        </div>
      </header>

      <nav className="mb-4 grid grid-cols-3 border-b border-white/[0.06]">
        {["Feed", "Seguindo", "Clubes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`min-w-0 truncate pb-4 text-center text-[clamp(18px,5vw,24px)] font-medium first:text-left last:text-right ${
              activeTab === tab ? "border-b-2 border-[#C8FF00] text-[#C8FF00]" : "text-[#888888]"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "Feed" && (
        <>
          <CreatePost onOpen={() => setComposerOpen(true)} />
          <div className="mt-6 space-y-5">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                liked={Boolean(liked[post.id])}
                likeCount={likeCount(post)}
                commenting={commenting === post.id}
                commentText={commentText}
                onCommentText={setCommentText}
                onLike={() => setLiked((current) => ({ ...current, [post.id]: !current[post.id] }))}
                onComment={() => {
                  setCommenting((current) => (current === post.id ? null : post.id));
                  setCommentText("");
                }}
                onSendComment={() => {
                  if (!commentText.trim()) return;
                  setPosts((current) =>
                    current.map((item) =>
                      item.id === post.id ? { ...item, comments: item.comments + 1 } : item,
                    ),
                  );
                  setCommenting(null);
                  setCommentText("");
                  toast.success("Comentário enviado.");
                }}
                onShare={() => setSharePost(post)}
              />
            ))}
          </div>
          <Ranking />
        </>
      )}

      {activeTab === "Seguindo" && (
        <section className="space-y-3">
          {followingAthletes.map((athlete) => (
            <div
              key={athlete.name}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4"
            >
              <Avatar kind={athlete.name} size="md" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-bold">{athlete.name}</div>
                <div className="truncate text-sm text-[#888888]">
                  {athlete.city} • {athlete.km} esta semana
                </div>
              </div>
              <button
                onClick={() =>
                  setFollowState((current) => ({
                    ...current,
                    [athlete.name]: !current[athlete.name],
                  }))
                }
                className={`h-10 rounded-xl px-3 text-sm font-bold ${
                  followState[athlete.name]
                    ? "bg-[#C8FF00] text-black"
                    : "border border-[#C8FF00] text-[#C8FF00]"
                }`}
              >
                {followState[athlete.name] ? "Seguindo" : "Seguir"}
              </button>
            </div>
          ))}
        </section>
      )}

      {activeTab === "Clubes" && (
        <section className="space-y-3">
          {initialClubs.map((club) => (
            <div
              key={club.name}
              className="rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-xl font-bold">{club.name}</div>
                  <div className="mt-1 text-sm text-[#888888]">{club.members}</div>
                  <div className="mt-3 text-sm text-white">Próximo treino: {club.next}</div>
                </div>
                <Users className="h-6 w-6 shrink-0 text-[#C8FF00]" />
              </div>
              <button
                onClick={() =>
                  setClubState((current) => ({ ...current, [club.name]: !current[club.name] }))
                }
                className={`mt-4 h-11 w-full rounded-xl text-sm font-bold ${
                  clubState[club.name]
                    ? "bg-[#C8FF00] text-black"
                    : "border border-[#C8FF00] text-[#C8FF00]"
                }`}
              >
                {clubState[club.name] ? "Membro" : "Entrar"}
              </button>
            </div>
          ))}
        </section>
      )}

      <button
        onClick={() => setComposerOpen(true)}
        className="fixed bottom-[90px] left-1/2 z-30 ml-[130px] grid h-[68px] w-[68px] -translate-x-1/2 place-items-center rounded-full bg-[#C8FF00] text-black shadow-[0_0_34px_rgba(200,255,0,0.32)]"
        aria-label="Criar post"
      >
        <Plus className="h-10 w-10" strokeWidth={2.2} />
      </button>

      {sharePost && <ShareSheet post={sharePost} onClose={() => setSharePost(null)} />}
      {composerOpen && <Composer onClose={() => setComposerOpen(false)} onPublish={publish} />}
    </main>
  );
}

function CreatePost({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4">
      <div className="flex items-center gap-4 border-b border-white/[0.06] pb-5">
        <Avatar kind="runner" size="lg" online />
        <button
          onClick={onOpen}
          className="min-w-0 flex-1 truncate text-left text-[clamp(17px,4.8vw,22px)] text-[#888888]"
        >
          No que você está pensando?
        </button>
      </div>
      <div className="grid grid-cols-3 divide-x divide-white/[0.06] pt-4">
        <PostAction icon={<Activity />} label="Atividade" onClick={onOpen} />
        <PostAction icon={<Camera />} label="Foto" onClick={onOpen} />
        <PostAction icon={<Trophy />} label="Conquista" onClick={onOpen} />
      </div>
    </section>
  );
}

function PostCard({
  post,
  liked,
  likeCount,
  commenting,
  commentText,
  onCommentText,
  onLike,
  onComment,
  onSendComment,
  onShare,
}: {
  post: Post;
  liked: boolean;
  likeCount: number;
  commenting: boolean;
  commentText: string;
  onCommentText: (value: string) => void;
  onLike: () => void;
  onComment: () => void;
  onSendComment: () => void;
  onShare: () => void;
}) {
  return (
    <article className="rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4">
      <div className="flex items-start gap-3">
        <Avatar kind={post.avatar} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[clamp(20px,5vw,24px)] font-semibold">{post.name}</h2>
            <span className="rounded-md border border-[#C8FF00]/50 px-2 py-0.5 text-xs font-bold text-[#C8FF00]">
              PRO
            </span>
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#C8FF00]" />
          </div>
          <p className="mt-1 truncate text-[clamp(13px,3vw,15px)] text-[#888888]">
            {post.location} • {post.time}
          </p>
        </div>
        <MoreHorizontal className="h-7 w-7 text-[#888888]" />
      </div>

      <p className="mt-6 text-[clamp(18px,4.7vw,22px)] leading-snug text-[#D1D5DB]">
        {post.caption}
      </p>

      <div className="mt-4 overflow-hidden rounded-[18px] border border-white/[0.06]">
        <div className="grid grid-cols-[104px_minmax(0,1fr)]">
          <RouteThumb route={post.route} />
          <div className="min-w-0 p-3">
            <p className="truncate text-[clamp(15px,4vw,18px)] text-[#888888]">
              {post.type} • {post.period}
            </p>
            <div className="mt-2 whitespace-nowrap text-[clamp(28px,7vw,40px)] font-black">
              {post.distance}
              <span className="ml-1 text-base font-medium">km</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm text-white">
              <SmallMetric value={post.pace} label="Ritmo médio" />
              <SmallMetric value={post.duration} label="Tempo" />
              <SmallMetric value={post.elevation} label="Ganho elev." />
              <SmallMetric value={post.calories} label="Calorias" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <AvatarStack />
        <div className="min-w-0 text-[clamp(13px,3vw,15px)] text-[#888888]">
          <p className="truncate">Curtido por Lucas, Pedro e outras {likeCount} pessoas</p>
          <p className="mt-1">{post.comments} comentários</p>
        </div>
      </div>

      {commenting && (
        <div className="mt-4 flex gap-2">
          <input
            autoFocus
            value={commentText}
            onChange={(event) => onCommentText(event.target.value)}
            placeholder="Escreva um comentário..."
            className="min-w-0 flex-1 rounded-xl border border-white/[0.06] bg-[#0A0A0A] px-3 text-sm text-white outline-none placeholder:text-[#888888]"
          />
          <button
            onClick={onSendComment}
            className="h-11 rounded-xl bg-[#C8FF00] px-4 text-sm font-bold text-black"
          >
            Enviar
          </button>
        </div>
      )}

      <div className="mt-5 border-t border-white/[0.06] pt-4">
        <div className="grid grid-cols-3 gap-1">
          <ActionButton
            active={liked}
            icon={<Heart className={liked ? "fill-current" : ""} />}
            label="Curtir"
            onClick={onLike}
          />
          <ActionButton icon={<MessageCircle />} label="Comentar" onClick={onComment} />
          <ActionButton icon={<Share2 />} label="Compartilhar" onClick={onShare} />
        </div>
      </div>
    </article>
  );
}

function Ranking() {
  return (
    <section className="mt-6 rounded-2xl border border-white/[0.06] bg-[#1A1A1A] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Ranking da semana</h2>
        <span className="text-sm font-semibold text-[#C8FF00]">Ver completo ›</span>
      </div>
      <div className="space-y-3">
        {weeklyRanking.map((item) => (
          <div
            key={`${item.rank}-${item.name}`}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              item.me ? "border-[#C8FF00]" : "border-white/[0.06]"
            }`}
          >
            <div className="w-8 text-lg font-black text-[#C8FF00]">#{item.rank}</div>
            <Avatar kind={item.name} size="md" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{item.name}</div>
              <div className="text-sm text-[#888888]">{item.km} na semana</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ShareSheet({ post, onClose }: { post: Post; onClose: () => void }) {
  const copy = async () => {
    await navigator.clipboard?.writeText(`https://pulse.app/social/${post.id}`);
    toast.success("Link copiado.");
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
      <div className="w-full max-w-[430px] rounded-t-3xl border border-white/[0.06] bg-[#1A1A1A] p-4">
        <button onClick={copy} className="h-12 w-full text-left font-bold">
          Copiar link
        </button>
        <button
          onClick={() => toast.success("Abrindo WhatsApp...")}
          className="h-12 w-full text-left font-bold"
        >
          Compartilhar no WhatsApp
        </button>
        <button
          onClick={onClose}
          className="mt-2 h-12 w-full rounded-xl bg-[#0A0A0A] text-[#888888]"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Composer({
  onClose,
  onPublish,
}: {
  onClose: () => void;
  onPublish: (caption: string, kind: string) => void;
}) {
  const [kind, setKind] = useState("Atividade");
  const [text, setText] = useState("");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
      <div className="w-full max-w-[398px] rounded-3xl border border-white/[0.06] bg-[#1A1A1A] p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Criar post</h2>
          <button onClick={onClose} className="text-[#888888]">
            Cancelar
          </button>
        </div>
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {["Atividade", "Foto", "Conquista"].map((item) => (
            <button
              key={item}
              onClick={() => setKind(item)}
              className={`h-10 rounded-full px-4 text-sm font-bold ${kind === item ? "bg-[#C8FF00] text-black" : "border border-white/[0.08] text-[#888888]"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Compartilhe seu treino..."
          className="min-h-[150px] w-full resize-none rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-4 text-white outline-none placeholder:text-[#888888]"
        />
        <button
          onClick={() => onPublish(text, kind)}
          className="mt-4 h-12 w-full rounded-xl bg-[#C8FF00] font-black text-black"
        >
          Publicar
        </button>
      </div>
    </div>
  );
}

function PostAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-10 min-w-0 items-center justify-center gap-1.5 text-[clamp(12px,3vw,14px)] text-[#D1D5DB]"
    >
      <span className="[&_svg]:h-5 [&_svg]:w-5 [&_svg]:stroke-[1.7]">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function Avatar({ kind, size, online }: { kind: string; size: "md" | "lg"; online?: boolean }) {
  const large = size === "lg";
  return (
    <div className={`relative shrink-0 ${large ? "h-[72px] w-[72px]" : "h-[46px] w-[46px]"}`}>
      <div className="h-full w-full overflow-hidden rounded-full border-2 border-[#C8FF00] bg-[#111827]">
        <div className={`h-full w-full ${avatarBg(kind)}`} />
      </div>
      {online && (
        <span className="absolute right-1 bottom-1 h-4 w-4 rounded-full border-2 border-[#1A1A1A] bg-[#C8FF00]" />
      )}
    </div>
  );
}

function avatarBg(kind: string) {
  const lower = kind.toLowerCase();
  if (lower.includes("juliana"))
    return "bg-[radial-gradient(circle_at_45%_25%,#f9c8a8_0_16%,#3f1d1d_17%_34%,#121826_35%)]";
  if (lower.includes("pedro"))
    return "bg-[radial-gradient(circle_at_50%_28%,#d7a06f_0_18%,#2a1b12_19%_36%,#101827_37%)]";
  if (lower.includes("marcos"))
    return "bg-[radial-gradient(circle_at_48%_26%,#c69063_0_17%,#111827_18%_32%,#202020_33%)]";
  return "bg-[radial-gradient(circle_at_55%_32%,#d6a06f_0_18%,#111827_19%_42%,#020617_43%)]";
}

function RouteThumb({ route }: { route: string }) {
  return (
    <div className="h-full min-h-[156px] bg-[#0A0A0A]">
      <svg viewBox="0 0 220 220" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <rect width="220" height="220" fill="#0A0A0A" />
        <path
          d="M0 40H220M0 88H220M0 136H220M0 184H220M40 0V220M88 0V220M136 0V220M184 0V220"
          stroke="rgba(255,255,255,0.06)"
        />
        <path
          d={route}
          fill="none"
          stroke="#C8FF00"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="66" cy="170" r="12" fill="#C8FF00" />
        <circle cx="66" cy="170" r="5" fill="#0A0A0A" />
      </svg>
    </div>
  );
}

function SmallMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-bold">{value}</div>
      <div className="mt-1 truncate text-[11px] text-[#888888]">{label}</div>
    </div>
  );
}

function AvatarStack() {
  return (
    <div className="flex shrink-0 -space-x-3">
      {["juliana", "pedro", "marcos", "runner"].map((kind) => (
        <div
          key={kind}
          className="h-8 w-8 overflow-hidden rounded-full border-2 border-[#1A1A1A] bg-[#111827]"
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
      className={`flex min-w-0 items-center justify-center gap-1 text-[clamp(11px,3vw,15px)] ${active ? "text-[#C8FF00]" : "text-[#D1D5DB]"}`}
    >
      <span className="shrink-0 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:stroke-[1.8]">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
