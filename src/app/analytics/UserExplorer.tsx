"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { UserItem } from "@/lib/analytics";
import styles from "./analytics.module.css";

interface Photo {
  id: string;
  type: "photo" | "video" | "text" | "audio" | "drawing";
  note: string | null;
  url: string | null;
  fallback_url?: string | null;
  image_path?: string | null;
  created_at: string;
  date: string;
  group_name: string | null;
}

export default function UserExplorer({ users }: { users: UserItem[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<UserItem | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(10);
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
    setSelectedGroup("all");
    setOpen(false);
    setQuery(u.username);
    setVisible(10);
    setLoading(true);

    const res = await fetch(`/analytics/api/user-photos?userId=${u.id}`);
    const json = await res.json();
    setPhotos(json.photos ?? []);
    setLoading(false);
  }, []);

  function closeModal() {
    setSelected(null);
    setSelectedGroup("all");
    setPhotos([]);
    setVisible(10);
    setQuery("");
  }

  const userGroups = Array.from(new Set(photos.map(p => p.group_name).filter(Boolean))) as string[];
  
  const filteredPhotos = selectedGroup === "all" 
    ? photos 
    : photos.filter(p => p.group_name === selectedGroup);

  const displayed = filteredPhotos.slice(0, visible);

  return (
    <div className={`${styles.cardFull} ${styles.card} glass-effect`}>
      <p className={styles.cardLabel}>Explorer un utilisateur</p>

      <div className={styles.explorerSearch} ref={wrapRef}>
        <input
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
                <div style={{ width: 24 }} />
                <span className={styles.phoneGroupName}>@{selected.username}</span>
                <button className={styles.phoneClose} onClick={closeModal}>×</button>
              </div>

              {loading ? (
                <div className={styles.phoneLoading}>Chargement…</div>
              ) : (
                <div className={styles.dayView}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p className={styles.dayViewTitle} style={{ margin: 0 }}>
                      {filteredPhotos.length} moment{filteredPhotos.length !== 1 ? "s" : ""}
                    </p>
                    {userGroups.length > 1 && (
                      <select 
                        className={styles.groupSelect} 
                        style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                        value={selectedGroup}
                        onChange={(e) => {
                          setSelectedGroup(e.target.value);
                          setVisible(10);
                        }}
                      >
                        <option value="all">Tous les groupes</option>
                        {userGroups.map(gn => (
                          <option key={gn} value={gn}>{gn}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {filteredPhotos.length === 0 && (
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, padding: "12px 0" }}>
                      Aucun moment
                    </p>
                  )}

                  <div className={styles.dayGrid}>
                    {displayed.map((p) => (
                      <div key={p.id}>
                        {p.group_name && selectedGroup === "all" && (
                          <div className={styles.momentDateLabel}>{p.group_name}</div>
                        )}
                        <MomentItem photo={p} />
                      </div>
                    ))}
                  </div>

                  {visible < filteredPhotos.length && (
                    <button
                      onClick={() => setVisible((v) => v + 10)}
                      style={{
                        marginTop: 12,
                        width: "100%",
                        padding: "10px 0",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "#fff",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Voir plus ({filteredPhotos.length - visible} restants)
                    </button>
                  )}
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
  const dt = new Date(photo.created_at);
  const dateLabel = dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const time = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
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

    if (photo.type === "audio") {
      return (
        <div className={styles.photoWrap}>
          <audio
            src={activeSrc}
            className={styles.photoMedia}
            controls
            preload="metadata"
            style={{ height: "48px", background: "rgba(255,255,255,0.05)", borderRadius: "12px" }}
          />
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
        <span className={styles.momentTime}>{dateLabel} · {time}</span>
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
