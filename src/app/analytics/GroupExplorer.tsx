"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { GroupItem } from "@/lib/analytics";
import styles from "./analytics.module.css";

interface Photo {
  id: string;
  username: string;
  type: "photo" | "video" | "text" | "audio" | "drawing";
  note: string | null;
  url: string | null;
  fallback_url?: string | null;
  image_path?: string | null;
  created_at: string;
  date: string;
}

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAYS_FR = ["L", "M", "M", "J", "V", "S", "D"];

export default function GroupExplorer({ groups }: { groups: GroupItem[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<GroupItem | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? groups.filter((g) =>
        g.name.toLowerCase().includes(query.toLowerCase())
      )
    : groups;

  // Fermer dropdown au clic extérieur
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selectGroup = useCallback(async (g: GroupItem) => {
    setSelected(g);
    setOpen(false);
    setQuery(g.name);
    setSelectedDate(null);
    setSelectedWeek(null);
    setLoading(true);
    setCurrentMonth(new Date());

    const res = await fetch(`/analytics/api/group-photos?groupId=${g.id}`);
    const json = await res.json();
    setPhotos(json.photos ?? []);

    // Centrer le calendrier sur le mois du dernier post
    if (json.photos?.length) {
      const last = json.photos[json.photos.length - 1];
      setCurrentMonth(new Date(last.date + "T00:00:00"));
    }
    setLoading(false);
  }, []);

  // Photos groupées par date
  const photosByDate = useMemo(() => {
    return photos.reduce<Record<string, Photo[]>>((acc, p) => {
      (acc[p.date] ??= []).push(p);
      return acc;
    }, {});
  }, [photos]);

  // Jours du mois courant groupés par semaine
  const weeks = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const result: (Date | null)[][] = [];
    
    const first = new Date(year, month, 1);
    let startDow = (first.getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    
    let currentWeek: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) currentWeek.push(null);
    
    for (let d = 1; d <= total; d++) {
      currentWeek.push(new Date(year, month, d));
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      result.push(currentWeek);
    }
    return result;
  }, [currentMonth]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const getPhotosOfDates = (dates: string[]) => {
    return photos
      .filter((p) => dates.includes(p.date))
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  };

  const displayedPhotos = useMemo(() => {
    if (selectedDate) return photosByDate[selectedDate] ?? [];
    if (selectedWeek) return getPhotosOfDates(selectedWeek);
    return [];
  }, [selectedDate, selectedWeek, photosByDate, photos]);

  function closeModal() {
    setSelected(null);
    setPhotos([]);
    setSelectedDate(null);
    setSelectedWeek(null);
    setQuery("");
  }

  function handleBack() {
    setSelectedDate(null);
    setSelectedWeek(null);
  }

  return (
    <div className={`${styles.cardFull} ${styles.card} glass-effect`}>
      <p className={styles.cardLabel}>Explorer un groupe</p>

      {/* Search */}
      <div className={styles.explorerSearch} ref={wrapRef}>
        <input
          ref={inputRef}
          className={styles.input}
          style={{ textAlign: "left", letterSpacing: 0 }}
          placeholder="Nom du groupe…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {open && filtered.length > 0 && (
          <ul className={styles.dropdown}>
            {filtered.map((g) => (
              <li
                key={g.id}
                className={styles.dropdownItem}
                onMouseDown={() => selectGroup(g)}
              >
                {g.name}
              </li>
            ))}
          </ul>
        )}
        {open && query.trim() && filtered.length === 0 && (
          <div className={styles.dropdown}>
            <p className={styles.dropdownEmpty}>Aucun groupe trouvé</p>
          </div>
        )}
      </div>

      {/* Phone Modal */}
      {selected && (
        <div className={styles.phoneOverlay} onClick={closeModal}>
          <div
            className={styles.phoneFrame}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.phoneNotch} />

            <div className={styles.phoneScreen}>
              <div className={styles.phoneHeader}>
                {selectedDate || selectedWeek ? (
                  <button className={styles.phoneBack} onClick={handleBack}>
                    ←
                  </button>
                ) : (
                  <div style={{ width: 24 }} />
                )}
                <span className={styles.phoneGroupName}>{selected.name}</span>
                <button className={styles.phoneClose} onClick={closeModal}>
                  ×
                </button>
              </div>

              {loading ? (
                <div className={styles.phoneLoading}>Chargement…</div>
              ) : selectedDate || selectedWeek ? (
                /* ── Flow view (Day or Week) ── */
                <div className={styles.dayView}>
                  <p className={styles.dayViewTitle}>
                    {selectedDate ? (
                      new Date(selectedDate + "T00:00:00").toLocaleDateString(
                        "fr-FR",
                        { weekday: "long", day: "numeric", month: "long" }
                      )
                    ) : (
                      "Flux de la semaine"
                    )}
                    <span className={styles.dayCount}>
                      {" "}· {displayedPhotos.length} moment
                      {displayedPhotos.length > 1 ? "s" : ""}
                    </span>
                  </p>
                  <div className={styles.dayGrid}>
                    {displayedPhotos.map((p, i) => {
                      const showDateLabel = selectedWeek && (i === 0 || displayedPhotos[i-1].date !== p.date);
                      return (
                        <div key={p.id}>
                          {showDateLabel && (
                            <div className={styles.momentDateLabel}>
                              {new Date(p.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                            </div>
                          )}
                          <MomentItem photo={p} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ── Calendar view ── */
                <div className={styles.calendarView}>
                  <div className={styles.calMonthNav}>
                    <button
                      className={styles.calNavBtn}
                      onClick={() =>
                        setCurrentMonth(new Date(year, month - 1, 1))
                      }
                    >
                      ‹
                    </button>
                    <span className={styles.calMonthLabel}>
                      {MONTHS_FR[month]} {year}
                    </span>
                    <button
                      className={styles.calNavBtn}
                      onClick={() =>
                        setCurrentMonth(new Date(year, month + 1, 1))
                      }
                    >
                      ›
                    </button>
                  </div>

                  <div className={styles.calGrid}>
                    {DAYS_FR.map((d, i) => (
                      <div key={i} className={styles.calDayHeader}>
                        {d}
                      </div>
                    ))}

                    {weeks.map((week, weekIdx) => {
                      const weekDates = week.filter(d => d !== null).map(d => d!.toISOString().slice(0, 10));
                      const weekCount = weekDates.reduce((sum, d) => sum + (photosByDate[d]?.length ?? 0), 0);
                      
                      return (
                        <div key={`week-${weekIdx}`} className={styles.calWeekRow}>
                          {weekCount > 0 && (
                            <button 
                              className={styles.calWeekBtn}
                              onClick={() => setSelectedWeek(weekDates)}
                            >
                              Voir la semaine ({weekCount})
                            </button>
                          )}
                          {week.map((day, i) => {
                            if (!day) return <div key={`empty-${weekIdx}-${i}`} />;
                            const dateStr = day.toISOString().slice(0, 10);
                            const count = photosByDate[dateStr]?.length ?? 0;
                            const isToday =
                              dateStr === new Date().toISOString().slice(0, 10);
                            return (
                              <button
                                key={dateStr}
                                className={`${styles.calDay} ${
                                  count > 0 ? styles.calDayActive : ""
                                } ${isToday ? styles.calDayToday : ""}`}
                                onClick={() =>
                                  count > 0 && setSelectedDate(dateStr)
                                }
                                disabled={count === 0}
                              >
                                <span>{day.getDate()}</span>
                                {count > 0 && (
                                  <span className={styles.calDot}>{count}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  <p className={styles.calTotal}>
                    {photos.length} moment{photos.length > 1 ? "s" : ""} au total
                  </p>
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
      return (
        <div className={styles.photoText}>
          <p>{photo.note || "—"}</p>
        </div>
      );
    }

    if (photo.type === "video") {
      return (
        <div className={styles.photoWrap}>
          <video
            src={activeSrc}
            className={styles.photoMedia}
            controls
            playsInline
            preload="metadata"
          />
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
            onError={() => {
              if (!errR2) setErrR2(true);
              else setErrFallback(true);
            }}
          />
        ) : (
          <div className={styles.photoErr} style={{ flexDirection: 'column', gap: '8px', padding: '20px', textAlign: 'center' }}>
            <span>Image indisponible</span>
            <span style={{ fontSize: '9px', opacity: 0.5, wordBreak: 'break-all' }}>
              {photo.image_path?.split('/').pop()}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div className={styles.momentHeader}>
        <span className={styles.momentUser}>@{photo.username}</span>
        <span className={styles.momentTime}>{time}</span>
      </div>
      {renderMedia()}
      {photo.type !== "text" && photo.note && (
         <div style={{ padding: "8px 4px 0", fontSize: "12px", color: "#ddd", fontStyle: "italic" }}>
           {photo.note}
         </div>
      )}
    </div>
  );
}
