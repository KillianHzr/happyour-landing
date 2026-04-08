"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useSearchParams } from "next/navigation";
import type { AnalyticsData } from "@/lib/analytics";
import styles from "./analytics.module.css";
import GroupExplorer from "./GroupExplorer";
import UserExplorer from "./UserExplorer";

const GREY = {
  100: "rgba(255,255,255,0.90)",
  200: "rgba(255,255,255,0.65)",
  300: "rgba(255,255,255,0.40)",
  500: "rgba(255,255,255,0.08)",
};

const PIE_SHADES = [
  "rgba(255,255,255,0.85)",
  "rgba(255,255,255,0.50)",
  "rgba(255,255,255,0.25)",
  "rgba(255,255,255,0.12)",
];

const TYPE_LABELS: Record<string, string> = {
  Photo: "Photo", Vidéo: "Vidéo", Texte: "Texte",
};

const MEDALS = ["🥇", "🥈", "🥉"];

interface TooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: any }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const topUsers = data.topUsers as { username: string; count: number }[] | undefined;

  return (
    <div className={styles.tooltip}>
      {label && <p className={styles.tooltipLabel}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className={styles.tooltipValue}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
      {topUsers && topUsers.length > 0 && (
        <div className={styles.tooltipTopUsers}>
          <p className={styles.tooltipTopUsersTitle}>Top contributeurs :</p>
          {topUsers.map((u, i) => (
            <p key={i} className={styles.tooltipUser}>
              {u.username} : <strong>{u.count}</strong>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ data }: { data: AnalyticsData }) {
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("role") === "adminkillianphoto12!";

  const [visibleMembers, setVisibleMembers] = useState(10);
  const [showTable, setShowTable] = useState(false);

  const {
    stats, momentsByUser, typeDistribution,
    dailyDistribution, hourlyDistribution, activeMembers,
    groupParticipation, momentTimeline,
  } = data;

  const maxHour = Math.max(...hourlyDistribution.map((h) => h.count));
  const maxDay = Math.max(...dailyDistribution.map((d) => d.count));

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // 1. KPIs
    csvContent += "SECTION: STATISTIQUES GLOBALES\n";
    csvContent += "Indicateur,Valeur\n";
    csvContent += `Total Moments,${stats.totalMoments}\n`;
    csvContent += `Total Utilisateurs,${stats.totalUsers}\n`;
    csvContent += `Total Groupes,${stats.totalGroups}\n`;
    csvContent += `Total Reactions,${stats.totalReactions}\n`;
    csvContent += `Moyenne posts/groupe/semaine,${stats.avgPostsPerGroupWeekly}\n`;
    csvContent += `Moyenne membres/groupe actif,${stats.avgMembersPerGroupActive}\n`;
    csvContent += `Moyenne membres/groupe (>1 membre),${stats.avgMembersPerGroup}\n\n`;

    // 2. Types
    csvContent += "SECTION: REPARTITION PAR TYPE\n";
    csvContent += "Type,Nombre\n";
    typeDistribution.forEach(t => {
      csvContent += `${t.label},${t.count}\n`;
    });
    csvContent += "\n";

    // 3. Daily
    csvContent += "SECTION: DISTRIBUTION JOURNALIERE\n";
    csvContent += "Jour,Nombre\n";
    dailyDistribution.forEach(d => {
      csvContent += `${d.day},${d.count}\n`;
    });
    csvContent += "\n";

    // 4. Hourly
    csvContent += "SECTION: DISTRIBUTION HORAIRE\n";
    csvContent += "Heure,Nombre\n";
    hourlyDistribution.forEach(h => {
      csvContent += `${h.hour},${h.count}\n`;
    });
    csvContent += "\n";

    // 5. Users
    csvContent += "SECTION: ACTIVITE UTILISATEURS\n";
    csvContent += "Username,Moments,Reactions,Score\n";
    activeMembers.forEach(m => {
      csvContent += `${m.username},${m.moments},${m.reactions},${m.score}\n`;
    });
    csvContent += "\n";

    // 6. Groups
    csvContent += "SECTION: PARTICIPATION GROUPES\n";
    csvContent += "Nom,Posts,Membres Posteurs,Total Membres,Taux (%)\n";
    groupParticipation.forEach(g => {
      csvContent += `${g.name.replace(/,/g, ' ')},${g.totalPosts},${g.posted},${g.total},${g.rate}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `happyour_full_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className={styles.dashPage}>
      <header className={styles.dashHeader}>
        <div className={styles.logo}>HappyOur</div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className={styles.exportBtn} onClick={exportToCSV}>
            📥 Rapport Complet
          </button>
          <div className={styles.badge}>Analytics Interne</div>
        </div>
        <div className={styles.studio}>Source Studio</div>
      </header>

      <section className={styles.dashHero}>
        <h1 className={styles.dashTitle}>Dashboard</h1>
        <p className={styles.dashSubtitle}>
          Données filtrées depuis le 30/03/2026 · Accès strictement confidentiel
        </p>
      </section>

      {/* KPIs */}
      <section className={styles.kpiRow}>
        <KpiCard value={stats.totalMoments} label="Moments" />
        <KpiCard value={stats.totalUsers} label="Utilisateurs" />
        <KpiCard value={stats.avgPostsPerGroupWeekly} label="Posts / gr. / sem." isFloat />
        <KpiCard value={stats.avgMembersPerGroupActive} label="Membres / gr. actif" isFloat />
        <KpiCard 
          value={stats.avgMembersPerGroup} 
          label="Membres / gr. (>1 m.)" 
          isFloat 
          subLabel={`(max : ${stats.maxGroupMembers} - ${stats.maxGroupName})`}
        />
      </section>

      {/* Timeline — pleine largeur au-dessus du masonry */}
      <div className={styles.timelineWrap}>
        <div className={`${styles.card} glass-effect`}>
          <p className={styles.cardLabel}>Évolution dans le temps</p>
          {momentTimeline.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={momentTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={GREY[500]} />
                <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#888", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="count" name="Moments" stroke={GREY[100]} strokeWidth={2} dot={{ fill: "#fff", r: 3 }} activeDot={{ r: 5, fill: "#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Masonry — 2 colonnes CSS */}
      <div className={styles.masonry}>

        {/* Colonne gauche */}
        <div className={styles.masonryCol}>

          <div className={`${styles.card} glass-effect`}>
            <p className={styles.cardLabel}>Moments par utilisateur</p>
            {momentsByUser.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={momentsByUser.length * 32 + 20}>
                <BarChart data={momentsByUser} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={GREY[500]} horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#888", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="username" tick={{ fill: "#ccc", fontSize: 12 }} tickLine={false} axisLine={false} width={88} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Moments" fill={GREY[200]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={`${styles.card} glass-effect`}>
            <p className={styles.cardLabel}>Heure de publication favorite</p>
            {momentTimeline.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GREY[500]} />
                  <XAxis dataKey="hour" tick={{ fill: "#888", fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fill: "#888", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Moments" radius={[3, 3, 0, 0]}>
                    {hourlyDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.count === maxHour && maxHour > 0 ? GREY[100] : GREY[300]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={`${styles.card} glass-effect`}>
            <p className={styles.cardLabel}>Activité par groupe</p>
            <div className={styles.partList}>
              {groupParticipation.length === 0 && <Empty />}
              {groupParticipation.map((g) => (
                <div key={g.name} className={styles.partRow}>
                  <div className={styles.partMeta}>
                    <span className={styles.partName}>{g.name}</span>
                    <span className={styles.partRate}>{g.totalPosts} posts</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${g.rate}%` }} />
                  </div>
                  <div className={styles.partSubRow}>
                    <span className={styles.partSub}>{g.rate}% participation</span>
                    <span className={styles.partSub}>{g.posted} / {g.total} membres</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Colonne droite */}
        <div className={styles.masonryCol}>

          <div className={`${styles.card} glass-effect`}>
            <p className={styles.cardLabel}>Répartition par type</p>
            {typeDistribution.length === 0 ? <Empty /> : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={typeDistribution} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {typeDistribution.map((entry, i) => (
                        <Cell key={entry.type} fill={PIE_SHADES[i % PIE_SHADES.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [v, TYPE_LABELS[name as string] ?? name]}
                      contentStyle={{ background: "rgba(10,10,10,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 13 }}
                    />
                    <Legend iconType="circle" formatter={(v) => <span style={{ color: "#888", fontSize: 12 }}>{TYPE_LABELS[v] ?? v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Chiffres détaillés sous le pie */}
                <div className={styles.pieDetails}>
                  {typeDistribution.map((entry, i) => (
                    <div key={entry.type} className={styles.pieDetailRow}>
                      <span className={styles.pieDetailDot} style={{ background: PIE_SHADES[i % PIE_SHADES.length] }} />
                      <span className={styles.pieDetailLabel}>{entry.label}</span>
                      <span className={styles.pieDetailCount}>{entry.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className={`${styles.card} glass-effect`}>
            <p className={styles.cardLabel}>Jour de publication favori</p>
            {dailyDistribution.every((d) => d.count === 0) ? <Empty /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dailyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GREY[500]} />
                  <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#888", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Moments" radius={[4, 4, 0, 0]}>
                    {dailyDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.count === maxDay && maxDay > 0 ? GREY[100] : GREY[300]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={`${styles.card} glass-effect`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <p className={styles.cardLabel} style={{ marginBottom: 0 }}>Membres les plus actifs</p>
              <button className={styles.exportBtn} onClick={() => setShowTable(true)}>
                <span>📊</span> Voir Tout
              </button>
            </div>
            <div className={styles.rankList}>
              {activeMembers.length === 0 && <Empty />}
              {activeMembers.slice(0, visibleMembers).map((m, i) => (
                <div key={m.username} className={styles.rankRow}>
                  <span className={styles.rankPos}>{i < 3 ? MEDALS[i] : `#${i + 1}`}</span>
                  <span className={styles.rankName}>{m.username}</span>
                  <span className={styles.rankMeta}>{m.moments} posts · {m.reactions} réac.</span>
                  <span className={styles.rankScore}>{m.score} pts</span>
                </div>
              ))}
              {visibleMembers < activeMembers.length && (
                <button className={styles.loadMoreBtn} onClick={() => setVisibleMembers(prev => prev + 10)}>
                  Charger plus (+10)
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {isAdmin && (
        <section className={styles.explorerSection}>
          <div className={styles.explorerSectionHeader}>
            <div className={styles.explorerSectionLine} />
            <span className={styles.explorerSectionLabel}>Administration</span>
            <div className={styles.explorerSectionLine} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <GroupExplorer groups={data.groups} />
            <UserExplorer users={data.users} />
          </div>
        </section>
      )}

      {showTable && (
        <div className={styles.tableModalOverlay} onClick={() => setShowTable(false)}>
          <div className={styles.tableModalContainer} onClick={e => e.stopPropagation()}>
            <div className={styles.tableModalHeader}>
              <h2 className={styles.tableModalTitle}>Toutes les données utilisateurs</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className={styles.exportBtn} onClick={exportToCSV}>
                  📥 Exporter CSV
                </button>
                <button className={styles.tableModalClose} onClick={() => setShowTable(false)}>×</button>
              </div>
            </div>
            <div className={styles.tableScroll}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Pseudo</th>
                    <th>Moments</th>
                    <th>Réactions</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {activeMembers.map((m, i) => (
                    <tr key={m.username}>
                      <td>{i + 1}</td>
                      <td><strong>{m.username}</strong></td>
                      <td>{m.moments}</td>
                      <td>{m.reactions}</td>
                      <td>{m.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <footer className={styles.dashFooter}>
        <p>© {new Date().getFullYear()} Source Studio. Données temps réel.</p>
      </footer>

      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />
    </main>
  );
}

function KpiCard({ value, label, isFloat, subLabel }: { value: number; label: string; isFloat?: boolean; subLabel?: string }) {
  const formattedValue = isFloat 
    ? value.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : value.toLocaleString("fr-FR");

  return (
    <div className={`${styles.kpiCard} glass-effect`}>
      <p className={styles.kpiValue}>{formattedValue}</p>
      <p className={styles.kpiLabel}>{label}</p>
      {subLabel && <p className={styles.kpiSubLabel}>{subLabel}</p>}
    </div>
  );
}

function Empty() {
  return <p className={styles.empty}>Aucune donnée disponible.</p>;
}
