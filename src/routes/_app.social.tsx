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
    <main className="screen-container bg-[#0A0A0A] pt-safe text-white">
      <header className="flex min-w-0 items-center justify-between gap-3 pt-4 pb-4">
        <h1 className="min-w-0 text-2xl font-bold tracking-[-0.3px]">Comunidade</h1>
        <div className="flex shrink-0 items-center gap-3">
          <button className="grid h-11 w-11 place-items-center" aria-label="Adicionar amigo">
            <UserPlus className="h-[22px] w-[22px] text-[#888888]" strokeWidth={1.8} />
          </button>
          <button className="relative grid h-11 w-11 place-items-center" aria-label="Notificações">
            <Bell className="h-[22px] w-[22px] text-[#888888]" strokeWidth={1.8} />
            <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-[#C8FF00]" />
          </button>
        </div>
      </header>

      <nav className="inner-tabs">
        {["Feed", "Seguindo", "Clubes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`inner-tab ${activeTab === tab ? "active" : ""}`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "Feed" && (
        <>
          <CreatePost onOpen={() => setComposerOpen(true)} />
          <div className="mt-4 space-y-3">
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
                  <div className="truncate text-base font-semibold">{club.name}</div>
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
        className="fixed bottom-[90px] left-1/2 z-30 ml-[120px] grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full bg-[#C8FF00] text-black shadow-[0_4px_16px_rgba(200,255,0,0.35)]"
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
    <section className="rounded-2xl border border-white/[0.06] bg-[#1A1A1A] px-4 py-3">
      <div className="flex items-center gap-3">
        <Avatar kind="runner" size="sm" online />
        <button
          onClick={onOpen}
          className="min-h-11 min-w-0 flex-1 truncate rounded-full bg-[#111111] px-4 py-2 text-left text-sm text-[#555555]"
        >
          No que você está pensando?
        </button>
      </div>
      <div className="mt-3 flex gap-2">
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
      <div className="flex items-center gap-2.5">
        <Avatar kind={post.avatar} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[15px] font-semibold">{post.name}</h2>
            <span className="rounded border border-[#C8FF00] bg-[#1A2A00] px-1.5 py-0.5 text-[10px] font-bold text-[#C8FF00]">
              PRO
            </span>
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#C8FF00]" />
          </div>
          <p className="mt-1 truncate text-xs text-[#888888]">
            {post.location} • {post.time}
          </p>
        </div>
        <MoreHorizontal className="h-7 w-7 text-[#888888]" />
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-[1.5] text-[#CCCCCC]">{post.caption}</p>

      <div className="mt-3 rounded-xl bg-[#111111] p-3">
        <p className="text-[11px] uppercase tracking-[1px] text-[#888888]">
          {post.type} • {post.period}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/[0.06]">
          <PostMetric value={`${post.distance} km`} label="Distância" />
          <PostMetric value={post.pace} label="Ritmo médio" />
          <PostMetric value={post.duration} label="Tempo" />
          <PostMetric value={post.calories} label="Calorias" />
        </div>
        <div className="pt-2 text-[11px] text-[#888888]">↑ {post.elevation} ganho de elevação</div>
      </div>

      <div className="mt-3 text-xs text-[#888888]">
        Curtido por {likeCount} pessoas · {post.comments} comentários
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

      <div className="mt-3 border-t border-white/[0.06] pt-1">
        <div className="flex items-center justify-around">
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
        <h2 className="text-base font-semibold">Ranking da semana</h2>
        <span className="text-xs font-semibold text-[#C8FF00]">Ver completo ›</span>
      </div>
      <div className="space-y-3">
        {weeklyRanking.map((item) => (
          <div
            key={`${item.rank}-${item.name}`}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              item.me ? "border-[#C8FF0044] bg-[#C8FF0008]" : "border-white/[0.06]"
            }`}
          >
            <div
              className={`w-8 text-sm font-bold ${item.rank === 1 ? "text-[#C8FF00]" : "text-[#888888]"}`}
            >
              {item.rank}º
            </div>
            <Avatar kind={item.name} size="md" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{item.name}</div>
              <div className="text-xs text-[#C8FF00]">{item.km} na semana</div>
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
      <div className="w-full max-w-[390px] rounded-t-3xl border border-white/[0.06] bg-[#1A1A1A] p-4">
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
      <div className="w-full max-w-[358px] rounded-3xl border border-white/[0.06] bg-[#1A1A1A] p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Criar post</h2>
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
      className="min-h-8 rounded-full border border-white/10 bg-[#111111] px-3 py-1 text-[11px] text-[#888888]"
    >
      <span className="inline-flex items-center gap-1.5 [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:stroke-[1.7]">
        {icon}
        <span className="truncate">{label}</span>
      </span>
    </button>
  );
}

function Avatar({
  kind,
  size,
  online,
}: {
  kind: string;
  size: "sm" | "md" | "lg";
  online?: boolean;
}) {
  const large = size === "lg";
  const small = size === "sm";
  return (
    <div
      className={`relative shrink-0 ${large ? "h-[72px] w-[72px]" : small ? "h-9 w-9" : "h-10 w-10"}`}
    >
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

function PostMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 bg-[#111111] px-3 py-2.5">
      <div className="truncate text-lg font-bold text-white">{value}</div>
      <div className="mt-0.5 truncate text-[11px] text-[#888888]">{label}</div>
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
      className={`flex min-h-11 min-w-0 items-center justify-center gap-1 text-xs ${active ? "text-[#C8FF00]" : "text-[#888888]"}`}
    >
      <span className="shrink-0 [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:stroke-[1.8]">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
