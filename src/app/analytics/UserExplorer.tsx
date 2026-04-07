"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { UserItem } from "@/lib/analytics";
import styles from "./analytics.module.css";

interface Photo {
  id: string;
  type: "photo" | "video" | "text";
  note: string | null;
  url: string | null;
  fallback_url?: string | null;
  image_path?: string | null;
  created_at: string;
  date: string;
  week_start: string;
  group_name: string | null;
}

interface Week {
  start: string; // YYYY-MM-DD (Monday)
  label: string; // "7 avr – 13 avr"
  photos: Photo[];
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("fr-FR", opts)} – ${end.toLocaleDateString("fr-FR", opts)}`;
}

export default function UserExplorer({ users }: { users: UserItem[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<UserItem | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? users.filter((u) => u.username.toLowerCase().includes(query.toLowerCase()))
    : users;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selectUser = useCallback(async (u: UserItem) => {
    setSelected(u);
    setOpen(false);
    setQuery(u.username);
    setSelectedWeek(null);
    setLoading(true);

    const res = await fetch(`/analytics/api/user-photos?userId=${u.id}`);
    const json = await res.json();
    setPhotos(json.photos ?? []);
    setLoading(false);
  }, []);

  // Group photos by week
  const weeks = useMemo((): Week[] => {
    const map = new Map<string, Photo[]>();
    for (const p of photos) {
      (map.get(p.week_start) ?? map.set(p.week_start, []).get(p.week_start)!).push(p);
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0])) // most recent first
      .map(([start, weekPhotos]) => ({
        start,
        label: formatWeekRange(start),
        photos: weekPhotos.sort((a, b) => a.created_at.localeCompare(b.created_at)),
      }));
  }, [photos]);

  const weekPhotos = useMemo(
    () => weeks.find((w) => w.start === selectedWeek)?.photos ?? [],
    [weeks, selectedWeek]
  );

  function closeModal() {
    setSelected(null);
    setPhotos([]);
    setSelectedWeek(null);
    setQuery("");
  }

  return (
    <div className={`${styles.cardFull} ${styles.card} glass-effect`}>
      <p className={styles.cardLabel}>Explorer un utilisateur</p>

      <div className={styles.explorerSearch} ref={wrapRef}>
        <input
          ref={inputRef}
          className={styles.input}
          style={{ textAlign: "left", letterSpacing: 0 }}
          placeholder="Pseudo…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {open && filtered.length > 0 && (
          <ul className={styles.dropdown}>
            {filtered.map((u) => (
              <li key={u.id} className={styles.dropdownItem} onMouseDown={() => selectUser(u)}>
                {u.username}
              </li>
            ))}
          </ul>
        )}
        {open && query.trim() && filtered.length === 0 && (
          <div className={styles.dropdown}>
            <p className={styles.dropdownEmpty}>Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>

      {selected && (
        <div className={styles.phoneOverlay} onClick={closeModal}>
          <div className={styles.phoneFrame} onClick={(e) => e.stopPropagation()}>
            <div className={styles.phoneNotch} />
            <div className={styles.phoneScreen}>
              <div className={styles.phoneHeader}>
                {selectedWeek ? (
                  <button className={styles.phoneBack} onClick={() => setSelectedWeek(null)}>←</button>
                ) : (
                  <div style={{ width: 24 }} />
                )}
                <span className={styles.phoneGroupName}>@{selected.username}</span>
                <button className={styles.phoneClose} onClick={closeModal}>×</button>
              </div>

              {loading ? (
                <div className={styles.phoneLoading}>Chargement…</div>
              ) : selectedWeek ? (
                /* ── Week detail view ── */
                <div className={styles.dayView}>
                  <p className={styles.dayViewTitle}>
                    {weeks.find((w) => w.start === selectedWeek)?.label}
                    <span className={styles.dayCount}> · {weekPhotos.length} moment{weekPhotos.length > 1 ? "s" : ""}</span>
                  </p>
                  <div className={styles.dayGrid}>
                    {weekPhotos.map((p) => (
                      <div key={p.id}>
                        {p.group_name && (
                          <div className={styles.momentDateLabel}>{p.group_name}</div>
                        )}
                        <MomentItem photo={p} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* ── Week list view ── */
                <div className={styles.dayView}>
                  <p className={styles.dayViewTitle}>
                    {photos.length} moment{photos.length !== 1 ? "s" : ""} au total
                  </p>
                  {weeks.length === 0 && (
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, padding: "12px 0" }}>
                      Aucun moment depuis le 30/03/2026
                    </p>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {weeks.map((w) => (
                      <button
                        key={w.start}
                        onClick={() => setSelectedWeek(w.start)}
                        className={styles.calDay}
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.07)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{w.label}</span>
                        <span className={styles.calDot} style={{ position: "static", fontSize: 11 }}>
                          {w.photos.length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.phoneHomeBar} />
          </div>
        </div>
      )}
    </div>
  );
}

function MomentItem({ photo }: { photo: Photo }) {
  const [errR2, setErrR2] = useState(false);
  const [errFallback, setErrFallback] = useState(false);
  const time = new Date(photo.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const activeSrc = !errR2 ? (photo.url ?? "") : (photo.fallback_url ?? "");

  const renderMedia = () => {
    if (photo.type === "text") {
      return <div className={styles.photoText}><p>{photo.note || "—"}</p></div>;
    }

    if (photo.type === "video") {
      return (
        <div className={styles.photoWrap}>
          <video src={activeSrc} className={styles.photoMedia} controls playsInline preload="metadata" />
        </div>
      );
    }

    const bothFailed = errR2 && (errFallback || !photo.fallback_url);
    return (
      <div className={styles.photoWrap}>
        {!bothFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeSrc}
            alt=""
            className={styles.photoMedia}
            onError={() => { if (!errR2) setErrR2(true); else setErrFallback(true); }}
          />
        ) : (
          <div className={styles.photoErr} style={{ flexDirection: "column", gap: 8, padding: 20, textAlign: "center" }}>
            <span>Image indisponible</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div className={styles.momentHeader}>
        <span className={styles.momentTime}>{time}</span>
      </div>
      {renderMedia()}
      {photo.type !== "text" && photo.note && (
        <div style={{ padding: "8px 4px 0", fontSize: 12, color: "#ddd", fontStyle: "italic" }}>
          {photo.note}
        </div>
      )}
    </div>
  );
}
