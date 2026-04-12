"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { type User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import styles from "./reveal.module.css";

/* ─── Media helpers ─── */
const R2_BASE = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");

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

/**
 * Trouve le prochain dimanche 20h00 heure de Paris, exprimé en UTC.
 * Itère heure par heure pour gérer correctement le changement d'heure (DST).
 */
function getNextSunday20Paris(from: Date): Date {
  for (let dayOffset = 0; dayOffset <= 8; dayOffset++) {
    const base = new Date(from);
    base.setUTCDate(base.getUTCDate() + dayOffset);
    // Paris = UTC+1 (CET) ou UTC+2 (CEST) → 20h Paris = 18h ou 19h UTC
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
  revealEnd: Date;
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

  const isOpen = (weekday === "Sunday" && hour >= 20) || (weekday === "Monday" && hour < 12);

  // Prochain dimanche 20h Paris (UTC-correct, gère le DST)
  const nextReveal = getNextSunday20Paris(now);

  // Le contenu couvre la semaine qui précède le prochain reveal
  // = le dimanche 20h Paris qui vient de passer (ou qui est en cours si fenêtre ouverte)
  const contentStart = new Date(nextReveal.getTime() - 7 * 24 * 3600 * 1000);

  // La fenêtre dure 16h : dimanche 20h → lundi 12h
  // revealEnd = contentStart + 16h (toujours correct, fenêtre ouverte ou non)
  const revealEnd = new Date(contentStart.getTime() + 16 * 3600 * 1000);

  return { isOpen, nextReveal, revealEnd, contentStart };
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
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { isOpen, nextReveal, revealEnd, contentStart } = useMemo(() => getRevealStatus(now), [now]);

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
  }, []);

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

    try {
      // 1. Get user groups
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      const groupIds = (memberships ?? []).map((m) => m.group_id);

      if (groupIds.length === 0) {
        setGroups([]);
        setMoments([]);
        setDataLoading(false);
        return;
      }

      // 2. Fetch groups info and profiles
      const [groupsRes, profilesRes] = await Promise.all([
        supabase.from("groups").select("id, name").in("id", groupIds),
        supabase.from("profiles").select("id, username"),
      ]);

      const fetchedGroups: Group[] = (groupsRes.data ?? []).map((g) => ({
        id: g.id,
        name: g.name ?? g.id,
      }));
      setGroups(fetchedGroups);
      
      // Auto-selection logic
      if (!activeGroupId && fetchedGroups.length > 0) {
        setActiveGroupId(fetchedGroups[0].id);
      } else if (activeGroupId && !fetchedGroups.find(g => g.id === activeGroupId)) {
        setActiveGroupId(fetchedGroups[0]?.id ?? null);
      }

      const userMap = new Map(
        (profilesRes.data ?? []).map((p) => [p.id, p.username ?? "?"])
      );

      // 3. Fetch moments for the relevant groups
      const { data: photosData } = await supabase
        .from("photos")
        .select("id, user_id, group_id, image_path, note, created_at")
        .in("group_id", groupIds)
        .gte("created_at", contentStart.toISOString())
        .order("created_at", { ascending: true });

      const fetchedMoments: Moment[] = (photosData ?? []).map((p) => ({
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
    } catch (err) {
      console.error("Reveal fetch error:", err);
    } finally {
      setDataLoading(false);
    }
  }, [user, contentStart, activeGroupId]);

  useEffect(() => {
    if (user && isOpen) fetchRevealData();
  }, [user, isOpen, fetchRevealData]);

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
          {isOpen && (
            <div className={styles.liveBadge}>
              <span className={styles.liveDot} />
              Reveal Live
            </div>
          )}
        </header>

        <div className={styles.loginWrap}>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.loginEmoji}>🤫</div>
            <h2 className={styles.loginTitle}>Connecte-toi pour voir</h2>
            <p className={styles.loginSub}>Utilise tes identifiants de l'application</p>

            <input
              type="email"
              placeholder="Email"
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
              {loginLoading ? "Connexion…" : "Découvrir →"}
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

  const msRemaining = revealEnd.getTime() - now.getTime();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>HappyOur</div>
        <div className={styles.headerRight}>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            {formatCountdown(msRemaining)}
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Déconnexion
          </button>
        </div>
      </header>

      <div className={styles.revealHero}>
        <h1 className={styles.revealTitle}>
          Reveal en cours 🎉
        </h1>
        <p className={styles.revealSub}>
          Fermeture dans <strong>{formatCountdown(msRemaining)}</strong>
        </p>
        <p className={styles.revealSubInfo}>
          {groups.find(g => g.id === activeGroupId)?.name || "Chargement..."} · {filteredMoments.length} moment{filteredMoments.length !== 1 ? "s" : ""}
        </p>
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

      {dataLoading && moments.length === 0 ? (
        <div className={styles.loadingRow}>
          <div className={styles.spinner} />
          <span>Chargement des souvenirs…</span>
        </div>
      ) : groups.length === 0 ? (
        <div className={styles.empty}>
          Tu n'appartiens à aucun groupe pour le moment.
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

      {!isOpen && (
        <div className={styles.nextRevealNote}>
          Prochain Reveal Live dimanche à 20h00
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
    weekday: "long",
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
          <span className={styles.username}>@{moment.username}</span>
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={moment.url ?? undefined}
              alt=""
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
