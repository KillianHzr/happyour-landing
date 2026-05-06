"use client";

import { useState, useMemo, useEffect } from "react";
import type { AnalyticsData, ChallengeThemeItem } from "@/lib/analytics";
import styles from "./analytics.module.css";
import { createChallengeTheme } from "./actions";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const GREY_500 = "rgba(255,255,255,0.08)";

export default function ChallengeManager({ data }: { data: AnalyticsData }) {
  const { stats, challengeThemes, challengeProposers } = data;
  const [showAddTheme, setShowAddTheme] = useState(false);
  const [newTheme, setNewTheme] = useState({ label: "", capture_type: "PHOTO" });
  const [loading, setLoading] = useState(false);
  const [localThemes, setLocalThemes] = useState<ChallengeThemeItem[]>(challengeThemes);

  // Sync with prop if it changes
  useEffect(() => {
    setLocalThemes(challengeThemes);
  }, [challengeThemes]);

  const handleAddTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTheme.label.trim()) return;

    setLoading(true);
    try {
      const inserted = await createChallengeTheme(newTheme.label, newTheme.capture_type);

      setLocalThemes([{ ...inserted, count: 0, participationRate: 0 }, ...localThemes]);
      setNewTheme({ label: "", capture_type: "PHOTO" });
      setShowAddTheme(false);
    } catch (err: any) {
      console.error("Failed to add theme", err);
      alert(`Erreur lors de l'ajout du thème : ${err.message}`);
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

      <div className={styles.kpiRow} style={{ marginBottom: '2rem' }}>
        <div className={styles.kpiCard} style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className={styles.kpiValue}>{stats.challengeStats.avgParticipationP1}%</p>
          <p className={styles.kpiLabel}>Partic. Moyenne Défi 1</p>
          <p className={styles.kpiSubLabel}>moy. {stats.challengeStats.avgParticipantsP1} par. / sem.</p>
        </div>
        <div className={styles.kpiCard} style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className={styles.kpiValue}>{stats.challengeStats.avgParticipationP2}%</p>
          <p className={styles.kpiLabel}>Partic. Moyenne Défi 2</p>
          <p className={styles.kpiSubLabel}>moy. {stats.challengeStats.avgParticipantsP2} par. / sem.</p>
        </div>
        <div className={styles.kpiCard} style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className={styles.kpiValue}>{stats.challengeStats.targetParticipationRate}%</p>
          <p className={styles.kpiLabel}>Participation des Cibles</p>
          <p className={styles.kpiSubLabel}>sur leur propre photo cible</p>
        </div>
        <div className={styles.kpiCard} style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className={styles.kpiValue}>{customPercent}%</p>
          <p className={styles.kpiLabel}>Origine Custom</p>
          <p className={styles.kpiSubLabel}>{stats.challengeStats.customChallenges} / {stats.challengeStats.totalChallenges}</p>
        </div>
      </div>

      {/* Participation Trends and Daily Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        <div>
          <p className={styles.cardLabel} style={{ marginBottom: '1.5rem' }}>Évolution du taux de participation aux défis (%)</p>
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.challengeStats.weeklyParticipation}>
                <CartesianGrid strokeDasharray="3 3" stroke={GREY_500} />
                <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#888", fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ background: "rgba(10,10,10,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  itemStyle={{ color: "#fff" }}
                />
                <Line type="monotone" dataKey="rate" name="Participation" stroke="#fff" strokeWidth={2} dot={{ fill: "#fff", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className={styles.cardLabel} style={{ marginBottom: '1.5rem' }}>Jours de participation</p>
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.challengeStats.dailyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={GREY_500} />
                <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#888", fontSize: 11 }} tickLine={false} axisLine={false} hide />
                <Tooltip 
                  contentStyle={{ background: "rgba(10,10,10,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" fill="rgba(255,255,255,0.4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Participation by Type */}
      <div style={{ marginBottom: '3rem' }}>
        <p className={styles.cardLabel} style={{ marginBottom: '1rem' }}>Taux de participation par type de média</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {stats.challengeStats.typeParticipation.map(t => (
            <div key={t.type} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '16px', flex: 1, minWidth: '140px' }}>
              <p style={{ fontSize: '0.7rem', color: '#888', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>{t.type}</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>{t.rate}%</p>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#fff', width: `${t.rate}%` }} />
              </div>
            </div>
          ))}
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
                  <th>Participation</th>
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
                    <td>
                      <strong style={{ color: t.participationRate > 50 ? '#4cd137' : t.participationRate > 20 ? '#fbc531' : '#e84118' }}>
                        {t.participationRate}%
                      </strong>
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
                  <option value="VIDEO">📹 Vidéo</option>
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
