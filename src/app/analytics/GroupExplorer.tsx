"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { GroupItem } from "@/lib/analytics";
import styles from "./analytics.module.css";

interface Photo {
  id: string;
  username: string;
  type: "photo" | "video" | "text";
  note: string | null;
  url: string | null;
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
  const photosByDate = photos.reduce<Record<string, Photo[]>>((acc, p) => {
    (acc[p.date] ??= []).push(p);
    return acc;
  }, {});

  // Jours du mois courant
  function getDaysInMonth(year: number, month: number) {
    const days: (Date | null)[] = [];
    const first = new Date(year, month, 1);
    // Lundi = 0 … Dimanche = 6
    let startDow = (first.getDay() + 6) % 7;
    for (let i = 0; i < startDow; i++) days.push(null);
    const total = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= total; d++) days.push(new Date(year, month, d));
    return days;
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const days = getDaysInMonth(year, month);

  const photosOfDay = selectedDate ? (photosByDate[selectedDate] ?? []) : [];

  function closeModal() {
    setSelected(null);
    setPhotos([]);
    setSelectedDate(null);
    setQuery("");
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
            {/* Notch */}
            <div className={styles.phoneNotch} />

            {/* Phone screen */}
            <div className={styles.phoneScreen}>
              {/* Header */}
              <div className={styles.phoneHeader}>
                {selectedDate ? (
                  <button
                    className={styles.phoneBack}
                    onClick={() => setSelectedDate(null)}
                  >
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
              ) : selectedDate ? (
                /* ── Day view ── */
                <div className={styles.dayView}>
                  <p className={styles.dayViewTitle}>
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                      "fr-FR",
                      { weekday: "long", day: "numeric", month: "long" }
                    )}
                    <span className={styles.dayCount}>
                      {" "}· {photosOfDay.length} moment
                      {photosOfDay.length > 1 ? "s" : ""}
                    </span>
                  </p>
                  <div className={styles.dayGrid}>
                    {photosOfDay.map((p) => (
                      <DayPhoto key={p.id} photo={p} />
                    ))}
                  </div>
                </div>
              ) : (
                /* ── Calendar view ── */
                <div className={styles.calendarView}>
                  {/* Month nav */}
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

                  {/* Day headers */}
                  <div className={styles.calGrid}>
                    {DAYS_FR.map((d, i) => (
                      <div key={i} className={styles.calDayHeader}>
                        {d}
                      </div>
                    ))}

                    {/* Day cells */}
                    {days.map((day, i) => {
                      if (!day)
                        return <div key={`empty-${i}`} />;
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

                  <p className={styles.calTotal}>
                    {photos.length} moment{photos.length > 1 ? "s" : ""} au total
                  </p>
                </div>
              )}
            </div>

            {/* Home bar */}
            <div className={styles.phoneHomeBar} />
          </div>
        </div>
      )}
    </div>
  );
}

function DayPhoto({ photo }: { photo: Photo }) {
  const [err, setErr] = useState(false);

  if (photo.type === "text") {
    return (
      <div className={styles.photoText}>
        <p>{photo.note || "—"}</p>
        <span className={styles.photoUser}>@{photo.username}</span>
      </div>
    );
  }

  if (photo.type === "video") {
    return (
      <div className={styles.photoWrap}>
        <video
          src={photo.url ?? ""}
          className={styles.photoMedia}
          controls
          playsInline
          preload="metadata"
        />
        <span className={styles.photoUser}>@{photo.username}</span>
      </div>
    );
  }

  return (
    <div className={styles.photoWrap}>
      {!err ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.url ?? ""}
          alt=""
          className={styles.photoMedia}
          onError={() => setErr(true)}
        />
      ) : (
        <div className={styles.photoErr}>Image indisponible</div>
      )}
      <span className={styles.photoUser}>@{photo.username}</span>
    </div>
  );
}
