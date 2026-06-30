"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./tri.module.css";
import {
  CaptureRow,
  GroupRow,
  MemberRow,
  listGroupCaptures,
  listGroupMembers,
  searchProfiles,
  createCapture,
  updateCapture,
  deleteCapture,
  duplicateCapture,
  duplicateCaptures,
  moveCaptures,
  shiftCapturesByWeeks,
  addReaction,
  deleteReaction,
} from "./actions";
import {
  bucketByWeek,
  formatParisTime,
  parisInputValueToUtc,
  utcToParisInputValue,
} from "@/lib/reveal-week";

const EMOJIS = ["❤️", "😂", "🔥", "😮", "😢", "👍", "🎉", "✨", "🥹", "💀"];

type ModalMode = "add" | "edit" | "duplicate";

function fileCaptureType(file: File): "photo" | "video" | "audio" {
  if (file.type.startsWith("video")) return "video";
  if (file.type.startsWith("audio")) return "audio";
  return "photo";
}

async function uploadFile(
  file: File,
  groupId: string,
  userId: string
): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("groupId", groupId);
  fd.append("userId", userId);
  fd.append("type", fileCaptureType(file));
  const res = await fetch("/analytics/tri/api/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Upload échoué");
  return json.image_path as string;
}

/* ------------------------------- Media thumb ------------------------------ */

// Keyed by previewUrls[0] at call sites so it remounts when the media changes.
function MediaThumb({ c }: { c: CaptureRow }) {
  const urls = c.previewUrls;
  const [idx, setIdx] = useState(0);

  if (c.type === "text") return <div className={styles.thumbText}>📝</div>;
  if (c.type === "audio") return <div className={styles.thumbText}>🎵</div>;
  if (urls.length === 0 || idx >= urls.length)
    return <div className={styles.thumbText}>{c.type === "video" ? "🎬" : "🖼️"}</div>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.thumbImg}
      src={urls[idx]}
      alt={c.type}
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

/* ------------------------------ User picker ------------------------------- */

function UserPicker({
  members,
  value,
  displayName,
  onChange,
}: {
  members: MemberRow[];
  value: string;
  displayName: string;
  onChange: (id: string, name: string) => void;
}) {
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; username: string | null; email: string | null }[]>([]);

  const runSearch = async () => {
    const r = await searchProfiles(query);
    setResults(r);
  };

  return (
    <div className={styles.userPicker}>
      {!searching ? (
        <>
          <select
            className={styles.select}
            value={members.some((m) => m.user_id === value) ? value : ""}
            onChange={(e) => {
              const m = members.find((mm) => mm.user_id === e.target.value);
              if (m) onChange(m.user_id, m.username);
            }}
          >
            <option value="" disabled>
              {value && displayName ? `${displayName} (hors membres)` : "Choisir un membre…"}
            </option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.username} {m.role === "admin" ? "★" : ""}
              </option>
            ))}
          </select>
          <button type="button" className={styles.linkBtn} onClick={() => setSearching(true)}>
            Chercher un autre profil
          </button>
        </>
      ) : (
        <div className={styles.searchBox}>
          <div className={styles.searchRow}>
            <input
              className={styles.input}
              placeholder="username ou email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), runSearch())}
            />
            <button type="button" className={styles.btnGhost} onClick={runSearch}>
              OK
            </button>
            <button type="button" className={styles.linkBtn} onClick={() => setSearching(false)}>
              Membres
            </button>
          </div>
          <div className={styles.searchResults}>
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                className={styles.searchResult}
                onClick={() => onChange(p.id, p.username ?? p.email ?? p.id.slice(0, 8))}
              >
                {p.username ?? "(sans nom)"} <span className={styles.muted}>{p.email}</span>
              </button>
            ))}
          </div>
          {value && <div className={styles.muted}>Sélectionné : {displayName}</div>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Modal ------------------------------------ */

function CaptureModal({
  mode,
  capture,
  groupId,
  groups,
  members,
  currentCaptures,
  onClose,
  onSaved,
}: {
  mode: ModalMode;
  capture: CaptureRow | null;
  groupId: string;
  groups: GroupRow[];
  members: MemberRow[];
  currentCaptures: CaptureRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [targetGroup, setTargetGroup] = useState(capture?.group_id ?? groupId);
  const [userId, setUserId] = useState(capture?.user_id ?? members[0]?.user_id ?? "");
  const [userName, setUserName] = useState(capture?.username ?? members[0]?.username ?? "");
  const [dt, setDt] = useState(
    mode === "edit" && capture
      ? utcToParisInputValue(new Date(capture.created_at))
      : utcToParisInputValue(new Date())
  );
  const [note, setNote] = useState(capture?.note ?? "");
  const [secondNote, setSecondNote] = useState(capture?.second_note ?? "");

  // Media (add/edit only)
  const initialTab = mode === "edit" ? "keep" : "text";
  const [mediaTab, setMediaTab] = useState<"keep" | "text" | "upload" | "reuse">(initialTab);
  const [file, setFile] = useState<File | null>(null);
  const [reusePath, setReusePath] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reusable = currentCaptures.filter(
    (c) => c.image_path && c.image_path !== "text_mode"
  );

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const createdAt = parisInputValueToUtc(dt).toISOString();

      if (mode === "duplicate" && capture) {
        await duplicateCapture(capture.id, {
          targetGroupId: targetGroup,
          targetUserId: userId,
          createdAt,
        });
      } else if (mode === "add") {
        let image_path: string | null = null;
        if (mediaTab === "upload" && file) image_path = await uploadFile(file, targetGroup, userId);
        else if (mediaTab === "reuse") image_path = reusePath;
        await createCapture({
          group_id: targetGroup,
          user_id: userId,
          created_at: createdAt,
          image_path,
          note: note || null,
          second_note: secondNote || null,
          ensureMember: true,
        });
      } else if (mode === "edit" && capture) {
        const patch: Record<string, string | null> = {
          user_id: userId,
          created_at: createdAt,
          note: note || null,
          second_note: secondNote || null,
        };
        if (mediaTab === "text") patch.image_path = "text_mode";
        else if (mediaTab === "upload" && file)
          patch.image_path = await uploadFile(file, capture.group_id, userId);
        else if (mediaTab === "reuse" && reusePath) patch.image_path = reusePath;
        await updateCapture(capture.id, patch);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setBusy(false);
    }
  };

  const title =
    mode === "add" ? "Ajouter une capture" : mode === "edit" ? "Modifier la capture" : "Dupliquer la capture";

  const showGroupSelect = mode === "add" || mode === "duplicate";
  const showMedia = mode === "add" || mode === "edit";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} glass-effect`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h3>{title}</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {showGroupSelect && (
          <label className={styles.field}>
            <span>Groupe {mode === "duplicate" ? "destination" : ""}</span>
            <select
              className={styles.select}
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className={styles.field}>
          <span>Utilisateur</span>
          <UserPicker
            members={members}
            value={userId}
            displayName={userName}
            onChange={(id, name) => {
              setUserId(id);
              setUserName(name);
            }}
          />
        </label>

        <label className={styles.field}>
          <span>Date &amp; heure (Europe/Paris)</span>
          <input
            type="datetime-local"
            className={styles.input}
            value={dt}
            onChange={(e) => setDt(e.target.value)}
          />
        </label>

        {showMedia && (
          <div className={styles.field}>
            <span>Média</span>
            <div className={styles.tabs}>
              {mode === "edit" && (
                <button
                  type="button"
                  className={mediaTab === "keep" ? styles.tabActive : styles.tab}
                  onClick={() => setMediaTab("keep")}
                >
                  Garder
                </button>
              )}
              <button
                type="button"
                className={mediaTab === "text" ? styles.tabActive : styles.tab}
                onClick={() => setMediaTab("text")}
              >
                Texte seul
              </button>
              <button
                type="button"
                className={mediaTab === "upload" ? styles.tabActive : styles.tab}
                onClick={() => setMediaTab("upload")}
              >
                Upload
              </button>
              <button
                type="button"
                className={mediaTab === "reuse" ? styles.tabActive : styles.tab}
                onClick={() => setMediaTab("reuse")}
              >
                Réutiliser
              </button>
            </div>

            {mediaTab === "keep" && capture && (
              <div className={styles.muted}>Média actuel conservé ({capture.type}).</div>
            )}
            {mediaTab === "upload" && (
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                className={styles.input}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            )}
            {mediaTab === "reuse" && (
              <div className={styles.reuseGrid}>
                {reusable.length === 0 && (
                  <div className={styles.muted}>Aucun média réutilisable dans ce groupe.</div>
                )}
                {reusable.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={
                      reusePath === c.image_path ? styles.reuseCellActive : styles.reuseCell
                    }
                    onClick={() => setReusePath(c.image_path)}
                    title={c.image_path ?? ""}
                  >
                    <MediaThumb key={c.previewUrls[0] ?? c.id} c={c} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {showMedia && (
          <>
            <label className={styles.field}>
              <span>Légende (note)</span>
              <textarea
                className={styles.textarea}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </label>
            <label className={styles.field}>
              <span>Légende 2e capture (second_note)</span>
              <input
                className={styles.input}
                value={secondNote}
                onChange={(e) => setSecondNote(e.target.value)}
              />
            </label>
          </>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.modalActions}>
          <button type="button" className={styles.btnGhost} onClick={onClose} disabled={busy}>
            Annuler
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={save}
            disabled={busy || !userId}
          >
            {busy ? "…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Reaction editor ----------------------------- */

function ReactionBar({
  capture,
  members,
  onChanged,
}: {
  capture: CaptureRow;
  members: MemberRow[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState(members[0]?.user_id ?? capture.user_id);

  return (
    <div className={styles.reactions}>
      {capture.reactions.map((r) => (
        <button
          key={r.id}
          type="button"
          className={styles.reactionChip}
          title={`${r.username} — retirer`}
          onClick={async () => {
            await deleteReaction(r.id);
            onChanged();
          }}
        >
          {r.emoji} <span className={styles.reactionUser}>{r.username}</span> ✕
        </button>
      ))}
      <button type="button" className={styles.addReaction} onClick={() => setOpen((o) => !o)}>
        ＋
      </button>
      {open && (
        <div className={`${styles.reactionPanel} glass-effect`}>
          <select className={styles.select} value={who} onChange={(e) => setWho(e.target.value)}>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.username}
              </option>
            ))}
          </select>
          <div className={styles.emojiRow}>
            {EMOJIS.map((emo) => (
              <button
                key={emo}
                type="button"
                className={styles.emojiBtn}
                onClick={async () => {
                  await addReaction(capture.id, who, emo);
                  setOpen(false);
                  onChanged();
                }}
              >
                {emo}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Week duplicator ----------------------------- */

function WeekDuplicator({
  items,
  groups,
  currentGroupId,
  onDone,
}: {
  items: CaptureRow[];
  groups: GroupRow[];
  currentGroupId: string;
  onDone: () => void;
}) {
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const others = groups.filter((g) => g.id !== currentGroupId);

  if (others.length === 0) return null;

  return (
    <div className={styles.weekDup}>
      <select className={styles.select} value={target} onChange={(e) => setTarget(e.target.value)}>
        <option value="">Dupliquer la semaine vers…</option>
        {others.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={styles.btnGhost}
        disabled={!target || busy}
        onClick={async () => {
          if (!confirm(`Dupliquer ${items.length} capture(s) de cette semaine ?`)) return;
          setBusy(true);
          try {
            await duplicateCaptures(
              items.map((i) => i.id),
              target
            );
            setTarget("");
            onDone();
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "…" : "Dupliquer →"}
      </button>
    </div>
  );
}

/* ------------------------------ Week shifter ------------------------------ */

function WeekShifter({ items, onDone }: { items: CaptureRow[]; onDone: () => void }) {
  const [weeks, setWeeks] = useState(1);
  const [busy, setBusy] = useState(false);

  const run = async (mode: "move" | "duplicate") => {
    if (!weeks) return;
    const verb = mode === "move" ? "Déplacer" : "Dupliquer";
    const sign = weeks > 0 ? "+" : "";
    if (!confirm(`${verb} ${items.length} capture(s) de ${sign}${weeks} semaine(s) ?`)) return;
    setBusy(true);
    try {
      await shiftCapturesByWeeks(
        items.map((i) => i.id),
        weeks,
        mode
      );
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.weekDup}>
      <span className={styles.muted}>Décaler de</span>
      <input
        type="number"
        className={styles.weekInput}
        value={weeks}
        onChange={(e) => setWeeks(parseInt(e.target.value || "0", 10) || 0)}
      />
      <span className={styles.muted}>sem.</span>
      <button type="button" className={styles.btnGhost} disabled={busy || !weeks} onClick={() => run("move")}>
        Déplacer
      </button>
      <button
        type="button"
        className={styles.btnGhost}
        disabled={busy || !weeks}
        onClick={() => run("duplicate")}
      >
        Dupliquer
      </button>
    </div>
  );
}

/* ------------------------------ Main client ------------------------------- */

export default function TriClient({ groups }: { groups: GroupRow[] }) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [captures, setCaptures] = useState<CaptureRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkGroup, setBulkGroup] = useState("");
  const [modal, setModal] = useState<{ mode: ModalMode; capture: CaptureRow | null } | null>(null);

  const refresh = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const [caps, mem] = await Promise.all([
        listGroupCaptures(groupId),
        listGroupMembers(groupId),
      ]);
      setCaptures(caps);
      setMembers(mem);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    setSelected(new Set());
    refresh();
  }, [refresh]);

  const weeks = useMemo(() => bucketByWeek(captures, (c) => c.created_at), [captures]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const otherGroups = groups.filter((g) => g.id !== groupId);

  const doMove = async () => {
    if (!bulkGroup) return;
    await moveCaptures([...selected], bulkGroup);
    setSelected(new Set());
    await refresh();
  };
  const doDuplicate = async () => {
    if (!bulkGroup) return;
    await duplicateCaptures([...selected], bulkGroup);
    setSelected(new Set());
    await refresh();
  };
  const doDelete = async () => {
    if (!confirm(`Supprimer ${selected.size} capture(s) ?`)) return;
    for (const id of selected) await deleteCapture(id);
    setSelected(new Set());
    await refresh();
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>HappyOur — Tri Reveal</div>
        <a className={styles.linkBtn} href="/analytics">
          ← Analytics
        </a>
      </header>

      <div className={styles.toolbar}>
        <select
          className={styles.select}
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.button}
          onClick={() => setModal({ mode: "add", capture: null })}
        >
          + Ajouter une capture
        </button>
        <button type="button" className={styles.btnGhost} onClick={refresh} disabled={loading}>
          {loading ? "Chargement…" : "Rafraîchir"}
        </button>
      </div>

      {selected.size > 0 && (
        <div className={`${styles.bulkBar} glass-effect`}>
          <span>{selected.size} sélectionné(s)</span>
          <select
            className={styles.select}
            value={bulkGroup}
            onChange={(e) => setBulkGroup(e.target.value)}
          >
            <option value="">Groupe cible…</option>
            {otherGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <button type="button" className={styles.btnGhost} onClick={doMove} disabled={!bulkGroup}>
            Déplacer →
          </button>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={doDuplicate}
            disabled={!bulkGroup}
          >
            Dupliquer →
          </button>
          <button type="button" className={styles.btnDanger} onClick={doDelete}>
            Supprimer
          </button>
          <button type="button" className={styles.linkBtn} onClick={() => setSelected(new Set())}>
            Annuler
          </button>
        </div>
      )}

      {!loading && captures.length === 0 && (
        <div className={styles.empty}>Aucune capture dans ce groupe.</div>
      )}

      {weeks.map((wk) => (
        <section key={wk.key} className={styles.weekSection}>
          <div className={styles.weekHead}>
            <h2 className={styles.weekHeader}>
              {wk.label} <span className={styles.muted}>· {wk.items.length}</span>
            </h2>
            <div className={styles.weekTools}>
              <WeekShifter items={wk.items} onDone={refresh} />
              <WeekDuplicator
                items={wk.items}
                groups={groups}
                currentGroupId={groupId}
                onDone={refresh}
              />
            </div>
          </div>
          <div className={styles.grid}>
            {wk.items.map((c) => (
              <div
                key={c.id}
                className={`${styles.card} glass-effect ${selected.has(c.id) ? styles.cardSel : ""}`}
              >
                <div className={styles.cardTop}>
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                  />
                  <span className={styles.badge}>{c.type}</span>
                  <span className={styles.time}>{formatParisTime(c.created_at)}</span>
                </div>
                <div className={styles.media}>
                  <MediaThumb key={c.previewUrls[0] ?? c.id} c={c} />
                </div>
                <div className={styles.user}>
                  {c.username}
                  {c.note && <div className={styles.note}>{c.note}</div>}
                </div>
                <ReactionBar capture={c} members={members} onChanged={refresh} />
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.smallBtn}
                    onClick={() => setModal({ mode: "edit", capture: c })}
                  >
                    Éditer
                  </button>
                  <button
                    type="button"
                    className={styles.smallBtn}
                    onClick={() => setModal({ mode: "duplicate", capture: c })}
                  >
                    Dupliquer
                  </button>
                  <button
                    type="button"
                    className={styles.smallBtnDanger}
                    onClick={async () => {
                      if (confirm("Supprimer cette capture ?")) {
                        await deleteCapture(c.id);
                        await refresh();
                      }
                    }}
                  >
                    Suppr.
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {modal && (
        <CaptureModal
          mode={modal.mode}
          capture={modal.capture}
          groupId={groupId}
          groups={groups}
          members={members}
          currentCaptures={captures}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            refresh();
          }}
        />
      )}

      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />
    </main>
  );
}
