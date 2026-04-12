"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient, type User } from "@supabase/supabase-js";
import styles from "./reveal.module.css";

/* ─── Supabase client ─── */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const R2_BASE = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");

function makeSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/* ─── Media helpers ─── */
type MomentType = "photo" | "video" | "audio" | "drawing" | "text";

const TYPE_LABELS: Record<MomentType, string> = {
  photo: "Photo",
  video: "Vidéo",
  audio: "Audio",
  drawing: "Dessin",
  text: "Texte",
};

function inferType(imagePath: string | null): MomentType {
  if (!imagePath || imagePath === "text_mode") return "text";
  const path = imagePath.toLowerCase().split("?")[0];
  if (path.includes("_draw")) return "drawing";
  const ext = path.split(".").pop() ?? "";
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return "video";
  if (["m4a", "wav", "mp3", "aac", "ogg"].includes(ext) || path.includes("_audio")) return "audio";
  return "photo";
}

function getMediaUrl(imagePath: string | null): string | null {
  if (!imagePath || imagePath === "text_mode") return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${R2_BASE}/${imagePath}`;
}

/* ─── Reveal window logic ─── */

/** Finds the next UTC timestamp where Europe/Paris time is Sunday at 20:00 */
function getNextSunday20Paris(from: Date): Date {
  for (let dayOffset = 0; dayOffset <= 8; dayOffset++) {
    const base = new Date(from);
    base.setUTCDate(base.getUTCDate() + dayOffset);
    // Paris is UTC+1 (CET) or UTC+2 (CEST), so 20h Paris = 18h or 19h UTC
    for (const utcHour of [17, 18, 19]) {
      const candidate = new Date(
        Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), utcHour, 0, 0, 0)
      );
      if (candidate <= from) continue;
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Paris",
        weekday: "long",
        hour: "2-digit",
        hour12: false,
      }).formatToParts(candidate);
      const weekday = parts.find((p) => p.type === "weekday")?.value;
      const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "-1");
      if (weekday === "Sunday" && hour === 20) return candidate;
    }
  }
  return new Date(from.getTime() + 7 * 24 * 3600 * 1000);
}

function getRevealStatus(now: Date): {
  isOpen: boolean;
  nextReveal: Date;
  contentStart: Date;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    weekday: "long",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0");

  const isOpen =
    (weekday === "Sunday" && hour >= 20) || (weekday === "Monday" && hour < 12);

  const nextReveal = getNextSunday20Paris(now);
  // Content covers the week PRECEDING the current/next reveal window
  const contentStart = new Date(nextReveal.getTime() - 7 * 24 * 3600 * 1000);

  return { isOpen, nextReveal, contentStart };
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return d > 0 ? `${d}j ${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/* ─── Types ─── */
interface Moment {
  id: string;
  user_id: string;
  group_id: string;
  username: string;
  type: MomentType;
  url: string | null;
  note: string | null;
  created_at: string;
}

interface Group {
  id: string;
  name: string;
}

/* ─── Main component ─── */
export default function RevealApp() {
  const [supabase] = useState(makeSupabase);

  // Clock — ticks every second for countdown
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { isOpen, nextReveal, contentStart } = getRevealStatus(now);

  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoginLoading(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError("Email ou mot de passe incorrect.");
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMoments([]);
    setGroups([]);
    setActiveGroupId(null);
  };

  // Moments data
  const [moments, setMoments] = useState<Moment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const fetchRevealData = useCallback(async () => {
    if (!supabase || !user) return;
    setDataLoading(true);

    const [membershipsRes, photosRes] = await Promise.all([
      supabase.from("group_members").select("group_id").eq("user_id", user.id),
      supabase
        .from("photos")
        .select("id, user_id, group_id, image_path, note, created_at")
        .gte("created_at", contentStart.toISOString())
        .order("created_at", { ascending: false }),
    ]);

    const groupIds = (membershipsRes.data ?? []).map((m) => m.group_id);

    const [groupsRes, profilesRes] = await Promise.all([
      supabase.from("groups").select("id, name").in("id", groupIds),
      supabase.from("profiles").select("id, username"),
    ]);

    const fetchedGroups: Group[] = (groupsRes.data ?? []).map((g) => ({
      id: g.id,
      name: g.name ?? g.id,
    }));
    setGroups(fetchedGroups);
    setActiveGroupId((prev) => prev ?? fetchedGroups[0]?.id ?? null);

    const userMap = new Map(
      (profilesRes.data ?? []).map((p) => [p.id, p.username ?? "?"])
    );

    const fetchedMoments: Moment[] = (photosRes.data ?? []).map((p) => ({
      id: p.id,
      user_id: p.user_id,
      group_id: p.group_id,
      username: userMap.get(p.user_id) ?? "?",
      type: inferType(p.image_path),
      url: getMediaUrl(p.image_path),
      note: p.note ?? null,
      created_at: p.created_at,
    }));

    setMoments(fetchedMoments);
    setDataLoading(false);
  }, [supabase, user, contentStart]);

  // Fetch when the reveal is open and user is logged in
  useEffect(() => {
    if (isOpen && user) fetchRevealData();
  }, [isOpen, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!authReady) {
    return (
      <main className={styles.page}>
        <div className={styles.bgGlow1} />
        <div className={styles.bgGlow2} />
      </main>
    );
  }

  /* ── COUNTDOWN VIEW ── */
  if (!isOpen) {
    const ms = nextReveal.getTime() - now.getTime();
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <div className={styles.logo}>HappyOur</div>
          {user && (
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Déconnexion
            </button>
          )}
        </header>

        <div className={styles.countdownWrap}>
          <p className={styles.countdownLabel}>Prochain reveal dans</p>
          <div className={styles.countdownTimer}>{formatCountdown(ms)}</div>
          <p className={styles.countdownSub}>
            Ouverture chaque dimanche à 20h · Jusqu'au lundi à 12h
          </p>
        </div>

        <div className={styles.bgGlow1} />
        <div className={styles.bgGlow2} />
      </main>
    );
  }

  /* ── LOGIN VIEW ── */
  if (!user) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <div className={styles.logo}>HappyOur</div>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            Reveal en cours
          </div>
        </header>

        <div className={styles.loginWrap}>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.loginEmoji}>🎉</div>
            <h2 className={styles.loginTitle}>Le reveal est ouvert !</h2>
            <p className={styles.loginSub}>Connecte-toi avec ton compte HappyOur</p>

            <input
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
              autoComplete="email"
              autoFocus
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
              autoComplete="current-password"
            />

            {loginError && <p className={styles.error}>{loginError}</p>}

            <button type="submit" className={styles.loginBtn} disabled={loginLoading}>
              {loginLoading ? "Connexion…" : "Voir le reveal →"}
            </button>
          </form>
        </div>

        <div className={styles.bgGlow1} />
        <div className={styles.bgGlow2} />
      </main>
    );
  }

  /* ── REVEAL VIEW ── */
  const filteredMoments = activeGroupId
    ? moments.filter((m) => m.group_id === activeGroupId)
    : moments;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>HappyOur</div>
        <div className={styles.headerRight}>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            Reveal en cours
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Déconnexion
          </button>
        </div>
      </header>

      <div className={styles.revealHero}>
        <h1 className={styles.revealTitle}>Reveal de la semaine 🎉</h1>
        <p className={styles.revealSub}>Tous vos moments partagés depuis dimanche 20h</p>
      </div>

      {groups.length > 1 && (
        <div className={styles.groupTabs}>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGroupId(g.id)}
              className={`${styles.groupTab} ${activeGroupId === g.id ? styles.groupTabActive : ""}`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {dataLoading ? (
        <div className={styles.loadingRow}>
          <div className={styles.spinner} />
          <span>Chargement des moments…</span>
        </div>
      ) : filteredMoments.length === 0 ? (
        <div className={styles.empty}>
          Aucun moment partagé cette semaine dans ce groupe.
        </div>
      ) : (
        <div className={styles.feed}>
          {filteredMoments.map((moment) => (
            <MomentCard key={moment.id} moment={moment} />
          ))}
        </div>
      )}

      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />
    </main>
  );
}

/* ─── Moment card ─── */
function MomentCard({ moment }: { moment: Moment }) {
  const timeStr = new Date(moment.created_at).toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className={styles.card}>
      <div className={styles.cardMeta}>
        <div className={styles.avatar}>{moment.username[0]?.toUpperCase()}</div>
        <div className={styles.cardInfo}>
          <span className={styles.username}>{moment.username}</span>
          <span className={styles.time}>{timeStr}</span>
        </div>
        <span className={styles.typeBadge}>{TYPE_LABELS[moment.type]}</span>
      </div>

      <div className={styles.cardContent}>
        {moment.type === "text" && (
          <div className={styles.textMoment}>{moment.note}</div>
        )}

        {moment.type === "audio" && (
          <div className={styles.audioWrap}>
            <div className={styles.audioIcon}>🎵</div>
            <audio controls src={moment.url ?? undefined} className={styles.audioPlayer} />
            {moment.note && <p className={styles.note}>{moment.note}</p>}
          </div>
        )}

        {moment.type === "video" && (
          <div className={styles.mediaWrap}>
            <video
              controls
              src={moment.url ?? undefined}
              className={styles.media}
              playsInline
            />
            {moment.note && <p className={styles.note}>{moment.note}</p>}
          </div>
        )}

        {(moment.type === "photo" || moment.type === "drawing") && (
          <div className={styles.mediaWrap}>
            <img
              src={moment.url ?? undefined}
              alt={`Moment de ${moment.username}`}
              className={styles.media}
              loading="lazy"
            />
            {moment.note && <p className={styles.note}>{moment.note}</p>}
          </div>
        )}
      </div>
    </article>
  );
}
