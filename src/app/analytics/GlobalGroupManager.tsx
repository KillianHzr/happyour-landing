"use client";

import { useState, useEffect, useMemo } from "react";
import type { GroupDetail } from "@/lib/analytics";
import styles from "./analytics.module.css";

function TagInput({ onAdd }: { onAdd: (tag: string) => void }) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button 
        className={styles.addTagBtn} 
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >
        +
      </button>
    );
  }

  return (
    <input 
      autoFocus
      className={styles.tagInputSmall}
      value={value}
      placeholder="..."
      onClick={e => e.stopPropagation()}
      onChange={e => setValue(e.target.value)}
      onKeyDown={e => {
        if (e.key === "Enter") {
          onAdd(value);
          setValue("");
          setOpen(false);
        } else if (e.key === "Escape") {
          setOpen(false);
        }
      }}
      onBlur={() => setOpen(false)}
    />
  );
}

export default function GlobalGroupManager({ groups }: { groups: GroupDetail[] }) {
  const [query, setQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // LocalStorage for tags persistence in this demo/view
  const [allTags, setAllTags] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const saved = localStorage.getItem("happyour_group_tags");
    if (saved) {
      try {
        setAllTags(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse tags", e);
      }
    }
  }, []);

  const saveTags = (newTags: Record<string, string[]>) => {
    setAllTags(newTags);
    localStorage.setItem("happyour_group_tags", JSON.stringify(newTags));
  };

  const addTag = (groupId: string, tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    const current = allTags[groupId] ?? [];
    if (current.includes(trimmed)) return;
    const next = { ...allTags, [groupId]: [...current, trimmed] };
    saveTags(next);
  };

  const removeTag = (groupId: string, tag: string) => {
    const current = allTags[groupId] ?? [];
    const next = { ...allTags, [groupId]: current.filter(t => t !== tag) };
    saveTags(next);
  };

  const filtered = useMemo(() => {
    return groups.filter(g => {
      const matchName = g.name.toLowerCase().includes(query.toLowerCase()) || 
                        g.admin_username.toLowerCase().includes(query.toLowerCase());
      const tags = allTags[g.id] ?? [];
      const matchTag = !tagQuery || tags.some(t => t.includes(tagQuery.toLowerCase()));
      return matchName && matchTag;
    });
  }, [groups, query, tagQuery, allTags]);

  const uniqueTags = useMemo(() => {
    const set = new Set<string>();
    Object.values(allTags).forEach(tags => tags.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [allTags]);

  const totalMems = useMemo(() => groups.reduce((acc, g) => acc + g.members.length, 0), [groups]);
  const totalPosts = useMemo(() => groups.reduce((acc, g) => acc + g.photo_count, 0), [groups]);

  return (
    <div className={`${styles.cardFull} ${styles.card} glass-effect`}>
      <div className={styles.managerHeader}>
        <div>
          <p className={styles.cardLabel}>Gestion Globale des Groupes</p>
          <p className={styles.cardSubLabel}>
            {groups.length} groupes · {totalMems} membres · {totalPosts} moments
          </p>
        </div>
        <div className={styles.managerActions}>
           <div className={styles.searchWrap}>
             <input 
               className={styles.input} 
               placeholder="Rechercher un groupe ou admin..." 
               value={query}
               onChange={e => setQuery(e.target.value)}
             />
           </div>
           <div className={styles.searchWrap}>
             <input 
               className={styles.input} 
               placeholder="Filtrer par tag..." 
               value={tagQuery}
               onChange={e => setTagQuery(e.target.value)}
             />
           </div>
        </div>
      </div>

      <div className={styles.tagCloud}>
        {uniqueTags.map(tag => (
          <button 
            key={tag} 
            className={`${styles.tagBadge} ${tagQuery === tag ? styles.tagBadgeActive : ""}`}
            onClick={() => setTagQuery(tagQuery === tag ? "" : tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className={styles.tableScroll}>
        <table className={styles.managerTable}>
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>Groupe</th>
              <th>Admin</th>
              <th>Membres</th>
              <th>Posts</th>
              <th>Tags</th>
              <th>Création</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(g => (
              <>
                <tr 
                  key={g.id} 
                  className={`${styles.managerRow} ${expandedId === g.id ? styles.rowExpanded : ""}`}
                  onClick={() => setExpandedId(expandedId === g.id ? null : g.id)}
                >
                  <td>
                    <span className={styles.expandIcon}>{expandedId === g.id ? "▼" : "▶"}</span>
                  </td>
                  <td>
                    <div className={styles.groupNameCell}>
                      <strong>{g.name}</strong>
                      <div className={styles.inviteRow}>
                        <code className={styles.inviteCode}>{g.invite_code || "Pas de code"}</code>
                        {g.invite_code && (
                          <button 
                            className={styles.copyBtn} 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(g.invite_code);
                            }}
                          >
                            📋
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.adminBadge}>@{g.admin_username}</span>
                  </td>
                  <td>{g.members.length}</td>
                  <td>{g.photo_count}</td>
                  <td>
                    <div className={styles.cellTags}>
                      {(allTags[g.id] ?? []).map(t => (
                        <span key={t} className={styles.tagItem}>
                          {t}
                          <button onClick={(e) => { e.stopPropagation(); removeTag(g.id, t); }}>×</button>
                        </span>
                      ))}
                      <TagInput onAdd={(t) => addTag(g.id, t)} />
                    </div>
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(g.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
                {expandedId === g.id && (
                  <tr className={styles.expandedContent}>
                    <td colSpan={7}>
                      <div className={styles.memberListDetail}>
                        <p className={styles.detailTitle}>Liste des membres ({g.members.length})</p>
                        <div className={styles.memberGrid}>
                          {g.members.map(m => (
                            <div key={m.id} className={styles.memberCard}>
                              <div className={styles.memberAvatar}>
                                {m.username.slice(0, 2).toUpperCase()}
                              </div>
                              <div className={styles.memberInfo}>
                                <p className={styles.memberName}>@{m.username}</p>
                                <p className={styles.memberRole}>{m.role === "admin" ? "👑 Admin" : "Membre"}</p>
                                <p className={styles.memberJoined}>Rejoint le {new Date(m.joined_at).toLocaleDateString("fr-FR")}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
