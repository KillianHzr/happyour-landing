"use client";

import { useState, useMemo, useCallback } from "react";
import styles from "./analytics.module.css";
import { useScrollLock } from "./useScrollLock";

interface GlobalPhoto {
  id: string;
  user_id: string;
  username: string;
  group_id: string;
  group_name: string;
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
const PAGE_SIZE = 20;

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function GlobalCalendar() {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<GlobalPhoto[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string[] | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useScrollLock(open);

  const openCalendar = useCallback(async () => {
    setOpen(true);
    setSelectedDate(null);
    setSelectedWeek(null);
    setVisible(PAGE_SIZE);

    if (loaded) return;

    setLoading(true);
    const res = await fetch("/analytics/api/all-photos");
    const json = await res.json();
    const list: GlobalPhoto[] = json.photos ?? [];
    setPhotos(list);
    setLoaded(true);

    if (list.length) {
      setCurrentMonth(new Date(list[list.length - 1].date + "T00:00:00"));
    }
    setLoading(false);
  }, [loaded]);

  function closeModal() {
    setOpen(false);
    setSelectedDate(null);
    setSelectedWeek(null);
    setVisible(PAGE_SIZE);
  }

  function handleBack() {
    setSelectedDate(null);
    setSelectedWeek(null);
    setVisible(PAGE_SIZE);
  }

  const photosByDate = useMemo(() => {
    return photos.reduce<Record<string, GlobalPhoto[]>>((acc, p) => {
      (acc[p.date] ??= []).push(p);
      return acc;
    }, {});
  }, [photos]);

  const weeks = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const result: (Date | null)[][] = [];

    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7;
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

  const displayedPhotos = useMemo(() => {
    if (selectedDate) return photosByDate[selectedDate] ?? [];
    if (selectedWeek) {
      return photos
        .filter((p) => selectedWeek.includes(p.date))
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    }
    return [];
  }, [selectedDate, selectedWeek, photosByDate, photos]);

  const selectionStats = useMemo(() => {
    const users = new Set(displayedPhotos.map((p) => p.user_id));
    const groups = new Set(displayedPhotos.map((p) => p.group_id));
    return { users: users.size, groups: groups.size };
  }, [displayedPhotos]);

  const monthCount = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return photos.filter((p) => p.date.startsWith(prefix)).length;
  }, [photos, year, month]);

  return (
    <>
      <button className={styles.miniExportBtn} onClick={openCalendar}>
        📅 Calendrier global
      </button>

      {open && (
        <div className={styles.phoneOverlay} onClick={closeModal}>
          <div className={styles.phoneFrame} onClick={(e) => e.stopPropagation()}>
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
                <span className={styles.phoneGroupName}>Tous les moments</span>
                <button className={styles.phoneClose} onClick={closeModal}>
                  ×
                </button>
              </div>

              {loading ? (
                <div className={styles.phoneLoading}>Chargement…</div>
              ) : selectedDate || selectedWeek ? (
                /* ── Flux jour / semaine (tous groupes) ── */
                <div className={styles.dayView}>
                  <div>
                    <p className={styles.dayViewTitle}>
                      {selectedDate
                        ? new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })
                        : "Flux de la semaine"}
                      <span className={styles.dayCount}>
                        {" "}· {displayedPhotos.length} moment
                        {displayedPhotos.length > 1 ? "s" : ""}
                      </span>
                    </p>
                    <p className={styles.dayCount} style={{ fontSize: "0.7rem", marginTop: 4 }}>
                      {selectionStats.users} utilisateur{selectionStats.users > 1 ? "s" : ""} ·{" "}
                      {selectionStats.groups} groupe{selectionStats.groups > 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className={styles.dayGrid}>
                    {displayedPhotos.slice(0, visible).map((p, i, arr) => {
                      const showDateLabel =
                        !!selectedWeek && (i === 0 || arr[i - 1].date !== p.date);
                      return (
                        <div key={p.id}>
                          {showDateLabel && (
                            <div className={styles.momentDateLabel}>
                              {new Date(p.date + "T00:00:00").toLocaleDateString("fr-FR", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </div>
                          )}
                          <MomentItem photo={p} />
                        </div>
                      );
                    })}
                  </div>

                  {visible < displayedPhotos.length && (
                    <button
                      className={styles.loadMoreBtn}
                      style={{ marginTop: 0 }}
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    >
                      Voir plus ({displayedPhotos.length - visible} restants)
                    </button>
                  )}
                </div>
              ) : (
                /* ── Calendrier global ── */
                <div className={styles.calendarView}>
                  <div className={styles.calMonthNav}>
                    <button
                      className={styles.calNavBtn}
                      onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                    >
                      ‹
                    </button>
                    <span className={styles.calMonthLabel}>
                      {MONTHS_FR[month]} {year}
                    </span>
                    <button
                      className={styles.calNavBtn}
                      onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
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
                      const weekDates = week
                        .filter((d): d is Date => d !== null)
                        .map(toDateStr);
                      const weekCount = weekDates.reduce(
                        (sum, d) => sum + (photosByDate[d]?.length ?? 0),
                        0
                      );

                      return (
                        <div key={`week-${weekIdx}`} className={styles.calWeekRow}>
                          {weekCount > 0 && (
                            <button
                              className={styles.calWeekBtn}
                              onClick={() => {
                                setSelectedWeek(weekDates);
                                setVisible(PAGE_SIZE);
                              }}
                            >
                              Voir la semaine ({weekCount})
                            </button>
                          )}
                          {week.map((day, i) => {
                            if (!day) return <div key={`empty-${weekIdx}-${i}`} />;
                            const dateStr = toDateStr(day);
                            const count = photosByDate[dateStr]?.length ?? 0;
                            const isToday = dateStr === toDateStr(new Date());
                            return (
                              <button
                                key={dateStr}
                                className={`${styles.calDay} ${
                                  count > 0 ? styles.calDayActive : ""
                                } ${isToday ? styles.calDayToday : ""}`}
                                onClick={() => {
                                  if (count === 0) return;
                                  setSelectedDate(dateStr);
                                  setVisible(PAGE_SIZE);
                                }}
                                disabled={count === 0}
                              >
                                <span>{day.getDate()}</span>
                                {count > 0 && <span className={styles.calDot}>{count}</span>}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  <p className={styles.calTotal}>
                    {monthCount} ce mois · {photos.length} moment{photos.length > 1 ? "s" : ""} au total
                  </p>
                </div>
              )}
            </div>

            <div className={styles.phoneHomeBar} />
          </div>
        </div>
      )}
    </>
  );
}

function MomentItem({ photo }: { photo: GlobalPhoto }) {
  const [errR2, setErrR2] = useState(false);
  const [errFallback, setErrFallback] = useState(false);
  const time = new Date(photo.created_at).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

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
            loading="lazy"
            onError={() => {
              if (!errR2) setErrR2(true);
              else setErrFallback(true);
            }}
          />
        ) : (
          <div
            className={styles.photoErr}
            style={{ flexDirection: "column", gap: 8, padding: 20, textAlign: "center" }}
          >
            <span>Image indisponible</span>
            <span style={{ fontSize: 9, opacity: 0.5, wordBreak: "break-all" }}>
              {photo.image_path?.split("/").pop()}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div className={styles.momentHeader}>
        <span className={styles.momentUser}>
          @{photo.username}{" "}
          <span style={{ color: "#555", fontWeight: 500 }}>· {photo.group_name}</span>
        </span>
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
