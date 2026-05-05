"use client";

import { useState, useMemo } from "react";
import type { AnalyticsData, ChallengeThemeItem } from "@/lib/analytics";
import styles from "./analytics.module.css";
import { supabase } from "@/lib/supabase-client";

export default function ChallengeManager({ data }: { data: AnalyticsData }) {
  const { stats, challengeThemes, challengeProposers } = data;
  const [showAddTheme, setShowAddTheme] = useState(false);
  const [newTheme, setNewTheme] = useState({ label: "", capture_type: "PHOTO" });
  const [loading, setLoading] = useState(false);
  const [localThemes, setLocalThemes] = useState<ChallengeThemeItem[]>(challengeThemes);

  const handleAddTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTheme.label.trim()) return;

    setLoading(true);
    try {
      const { data: inserted, error } = await supabase
        .from("challenge_themes")
        .insert([newTheme])
        .select()
        .single();

      if (error) throw error;

      setLocalThemes([{ ...inserted, count: 0 }, ...localThemes]);
      setNewTheme({ label: "", capture_type: "PHOTO" });
      setShowAddTheme(false);
    } catch (err) {
      console.error("Failed to add theme", err);
      alert("Erreur lors de l'ajout du thème");
    } finally {
      setLoading(false);
    }
  };

  const customPercent = stats.challengeStats.totalChallenges > 0 
    ? Math.round((stats.challengeStats.customChallenges / stats.challengeStats.totalChallenges) * 100)
    : 0;

  return (
    <div className={`${styles.cardFull} ${styles.card} glass-effect`}>
      <div className={styles.managerHeader}>
        <div>
          <p className={styles.cardLabel}>Gestion des Défis & Thèmes</p>
          <p className={styles.cardSubLabel}>
            {stats.challengeStats.totalChallenges} défis générés · {stats.challengeStats.totalPendingCustom} en attente
          </p>
        </div>
        <div className={styles.managerActions}>
          <button className={styles.exportBtn} onClick={() => setShowAddTheme(true)}>
            + Nouveau Thème
          </button>
        </div>
      </div>

      <div className={styles.kpiRow} style={{ marginBottom: '3rem' }}>
        <div className={styles.kpiCard} style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className={styles.kpiValue}>{stats.challengeStats.participationRate}</p>
          <p className={styles.kpiLabel}>Partic. moyenne / défi</p>
        </div>
        <div className={styles.kpiCard} style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className={styles.kpiValue}>{customPercent}%</p>
          <p className={styles.kpiLabel}>Défis d'origine Custom</p>
          <p className={styles.kpiSubLabel}>{stats.challengeStats.customChallenges} sur {stats.challengeStats.totalChallenges}</p>
        </div>
        <div className={styles.kpiCard} style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className={styles.kpiValue}>{stats.challengeStats.totalPendingCustom}</p>
          <p className={styles.kpiLabel}>Défis en file d'attente</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Top Proposers */}
        <div>
          <p className={styles.cardLabel} style={{ marginBottom: '1rem' }}>Top contributeurs file d'attente</p>
          <div className={styles.rankList}>
            {challengeProposers.map((p, i) => (
              <div key={p.username} className={styles.rankRow} style={{ padding: '0.75rem 1rem' }}>
                <span className={styles.rankPos} style={{ width: '20px' }}>#{i + 1}</span>
                <div className={styles.rankMemberInfo}>
                  <span className={styles.rankName}>@{p.username}</span>
                </div>
                <div className={styles.rankCount}>
                  <span className={styles.rankCountValue} style={{ fontSize: '1.1rem' }}>{p.count}</span>
                  <span className={styles.rankCountLabel}>proposés</span>
                </div>
              </div>
            ))}
            {challengeProposers.length === 0 && <p className={styles.empty}>Aucune proposition pour le moment.</p>}
          </div>
        </div>

        {/* Themes List */}
        <div>
          <p className={styles.cardLabel} style={{ marginBottom: '1rem' }}>Thèmes par défaut ({localThemes.length})</p>
          <div className={styles.tableScroll} style={{ maxHeight: '400px' }}>
            <table className={styles.managerTable}>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Capture</th>
                  <th>Utilisé</th>
                </tr>
              </thead>
              <tbody>
                {localThemes.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.label}</td>
                    <td>
                      <span className={styles.badge} style={{ fontSize: '0.6rem', padding: '2px 8px' }}>
                        {t.capture_type}
                      </span>
                    </td>
                    <td style={{ color: t.count > 0 ? '#fff' : '#555' }}>
                      {t.count} fois
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddTheme && (
        <div className={styles.tableModalOverlay} onClick={() => setShowAddTheme(false)}>
          <div className={styles.tableModalContainer} style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.tableModalHeader}>
              <h2 className={styles.tableModalTitle}>Ajouter un thème</h2>
              <button className={styles.tableModalClose} onClick={() => setShowAddTheme(false)}>×</button>
            </div>
            <form onSubmit={handleAddTheme} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className={styles.cardLabel} style={{ marginBottom: '0.5rem', display: 'block' }}>Nom du thème</label>
                <input 
                  className={styles.input}
                  placeholder="Ex: Un monument historique"
                  value={newTheme.label}
                  onChange={e => setNewTheme({ ...newTheme, label: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className={styles.cardLabel} style={{ marginBottom: '0.5rem', display: 'block' }}>Type de média</label>
                <select 
                  className={styles.input}
                  style={{ appearance: 'none' }}
                  value={newTheme.capture_type}
                  onChange={e => setNewTheme({ ...newTheme, capture_type: e.target.value })}
                >
                  <option value="PHOTO">📷 Photo</option>
                  <option value="TEXTE">📝 Texte</option>
                  <option value="AUDIO">🎙 Audio</option>
                  <option value="DESSIN">✏️ Dessin</option>
                </select>
              </div>
              <button 
                type="submit" 
                className={styles.button}
                disabled={loading || !newTheme.label.trim()}
              >
                {loading ? "Création..." : "Ajouter au catalogue"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
