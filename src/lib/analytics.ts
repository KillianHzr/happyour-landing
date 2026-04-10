import { supabase } from "./supabase-server";

export interface MomentsByUser {
  username: string;
  count: number;
}

export interface TypeDistribution {
  type: string;
  count: number;
  label: string;
}

export interface HourlySlot {
  hour: string;
  count: number;
}

export interface DailySlot {
  day: string;
  count: number;
}

export interface ActiveMember {
  username: string;
  moments: number;
  reactions: number;
  score: number;
}

export interface GroupParticipation {
  name: string;
  rate: number;
  posted: number;
  total: number;
  totalPosts: number;
}

export interface TimelinePoint {
  date: string;
  count: number;
  topUsers?: { username: string; count: number }[];
}

export interface GroupItem {
  id: string;
  name: string;
}

export interface UserItem {
  id: string;
  username: string;
}

export interface GroupDetail {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  admin_username: string;
  invite_code: string | null;
  members: {
    id: string;
    username: string;
    role: string;
    joined_at: string;
  }[];
  photo_count: number;
}

export interface SimplifiedPhoto {
  date: string;
  group_id: string;
  user_id: string;
  username: string;
}

export interface AnalyticsData {
  momentsByUser: MomentsByUser[];
  typeDistribution: TypeDistribution[];
  hourlyDistribution: HourlySlot[];
  dailyDistribution: DailySlot[];
  activeMembers: ActiveMember[];
  groupParticipation: GroupParticipation[];
  momentTimeline: TimelinePoint[];
  groups: GroupItem[];
  users: UserItem[];
  groupDetails: GroupDetail[];
  photos: SimplifiedPhoto[];
  stats: {
    totalMoments: number;
    totalUsers: number;
    totalGroups: number;
    activeGroups: number;
    totalReactions: number;
    avgPostsPerGroupWeekly: number;
    avgMembersPerGroupActive: number;
    avgMembersPerGroup: number;
    maxGroupMembers: number;
    maxGroupName: string;
  };
}

/**
 * Infère le type d'un post.
 * - image_path null ET note présente → "Texte"
 * - image_path contient "_draw"       → "Dessin"
 * - image_path .mp4 / .mov / …        → "Vidéo"
 * - image_path .m4a / .wav / …        → "Audio"
 * - tout le reste                   → "Photo"
 */
function inferType(imagePath: string | null, note: string | null): string {
  if (!imagePath || imagePath === "text_mode") return "Texte";
  
  const path = imagePath.toLowerCase();
  if (path.includes("_draw")) return "Dessin";
  
  // Extraire l'extension sans d'éventuels query params
  const cleanPath = path.split('?')[0];
  const ext = cleanPath.split(".").pop() ?? "";

  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "Vidéo";
  if (["m4a", "wav", "mp3", "aac", "oga", "ogg"].includes(ext) || path.includes("_audio")) return "Audio";
  
  return "Photo";
}

const START_DATE = "2026-03-30T00:00:00Z";
const EXCLUDED_GROUP_ID = "7e15ead8-7e24-4d22-b587-7cb834fd38e5"; // HappyOur
const EXCLUDED_USER_ID = "6feff666-5bcb-4b23-a9d8-22e38ceff5ca"; // theolanglade21@gmail.com

export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  // La table s'appelle "photos" (pas "moments").
  // Les réactions référencent "photo_id" (pas "moment_id").
  const [photosRes, profilesRes, groupMembersRes, groupsRes, reactionsRes] =
    await Promise.all([
      supabase
        .from("photos")
        .select("id, user_id, group_id, image_path, note, created_at")
        .gte("created_at", START_DATE),
      supabase
        .from("profiles")
        .select("id, username, created_at")
        .not("username", "ilike", "%test%"),
      supabase.from("group_members").select("group_id, user_id, joined_at, role"),
      supabase.from("groups").select("id, name, created_at, created_by, invite_code"),
      supabase
        .from("reactions")
        .select("photo_id, user_id, type, created_at")
        .gte("created_at", START_DATE),
    ]);

  const rawPhotos = photosRes.data ?? [];
  const rawProfiles = profilesRes.data ?? [];
  const rawGroupMembers = groupMembersRes.data ?? [];
  const rawGroups = groupsRes.data ?? [];
  const rawReactions = reactionsRes.data ?? [];

  // 0. Define the team to exclude from STATS
  const membersOfExcludedGroup = new Set(
    rawGroupMembers
      .filter((gm) => gm.group_id === EXCLUDED_GROUP_ID)
      .map((gm) => gm.user_id)
  );

  // Filtered versions for all KPIs and charts
  const filteredProfiles = rawProfiles.filter(
    (p) => p.id !== EXCLUDED_USER_ID && !membersOfExcludedGroup.has(p.id)
  );
  const filteredGroups = rawGroups.filter((g) => g.id !== EXCLUDED_GROUP_ID);
  const filteredGroupMembers = rawGroupMembers.filter(
    (gm) =>
      gm.group_id !== EXCLUDED_GROUP_ID &&
      gm.user_id !== EXCLUDED_USER_ID &&
      !membersOfExcludedGroup.has(gm.user_id)
  );

  // Map user id → username for display (includes everyone for explorers)
  const userMap = new Map(
    rawProfiles.map((p) => [p.id, p.username ?? `user_${p.id.slice(0, 6)}`])
  );
  
  const filteredUserIds = new Set(filteredProfiles.map((p) => p.id));
  const filteredGroupIds = new Set(filteredGroups.map((g) => g.id));

  // Filter photos and reactions for STATS only (exclude team)
  const photos = rawPhotos.filter(
    (p) => filteredUserIds.has(p.user_id) && filteredGroupIds.has(p.group_id)
  );
  const reactions = rawReactions.filter((r) => filteredUserIds.has(r.user_id));

  // 1. Posts par utilisateur
  const momentsByUserMap = new Map<string, number>();
  for (const p of photos) {
    momentsByUserMap.set(p.user_id, (momentsByUserMap.get(p.user_id) ?? 0) + 1);
  }
  const momentsByUser: MomentsByUser[] = [...momentsByUserMap.entries()]
    .map(([uid, count]) => ({
      username: userMap.get(uid) ?? uid.slice(0, 8),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // 2. Répartition par type (inférée depuis image_path + note)
  const typeMap = new Map<string, number>();
  for (const p of photos) {
    const t = inferType(p.image_path, p.note);
    typeMap.set(t, (typeMap.get(t) ?? 0) + 1);
  }
  const typeDistribution: TypeDistribution[] = [...typeMap.entries()].map(
    ([type, count]) => ({ type, count, label: type })
  );

  // 3a. Distribution par jour de la semaine (lundi = 0)
  const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const dayMap = new Map<number, number>();
  for (const p of photos) {
    const dow = (new Date(p.created_at).getDay() + 6) % 7; // 0=Lun … 6=Dim
    dayMap.set(dow, (dayMap.get(dow) ?? 0) + 1);
  }
  const dailyDistribution: DailySlot[] = DAYS_FR.map((day, i) => ({
    day,
    count: dayMap.get(i) ?? 0,
  }));

  // 3b. Distribution horaire
  const hourMap = new Map<number, number>();
  for (const p of photos) {
    const hour = new Date(p.created_at).getHours();
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
  }
  const hourlyDistribution: HourlySlot[] = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}h`,
    count: hourMap.get(h) ?? 0,
  }));

  // 4. Membres les plus actifs (score = posts×3 + réactions)
  const reactionsByUser = new Map<string, number>();
  for (const r of reactions) {
    reactionsByUser.set(r.user_id, (reactionsByUser.get(r.user_id) ?? 0) + 1);
  }
  
  // Inclure TOUS les profils valides FILTRÉS, même ceux sans activité
  const activeMembers: ActiveMember[] = filteredProfiles
    .map((p) => {
      const uid = p.id;
      const mCount = momentsByUserMap.get(uid) ?? 0;
      const rCount = reactionsByUser.get(uid) ?? 0;
      return {
        username: p.username ?? `user_${uid.slice(0, 6)}`,
        moments: mCount,
        reactions: rCount,
        score: mCount * 3 + rCount,
      };
    })
    .sort((a, b) => b.score - a.score);

  // 5. Taux de participation par groupe
  const groupParticipation: GroupParticipation[] = filteredGroups
    .map((g) => {
      const members = filteredGroupMembers.filter((gm) => gm.group_id === g.id && filteredUserIds.has(gm.user_id));
      const groupPhotos = photos.filter((p) => p.group_id === g.id);
      const posters = new Set(
        groupPhotos.map((p) => p.user_id)
      );
      const total = members.length;
      const posted = posters.size;
      const rate = total > 0 ? Math.round((posted / total) * 100) : 0;
      return {
        name: g.name ?? `Groupe ${g.id.slice(0, 6)}`,
        rate,
        posted,
        total,
        totalPosts: groupPhotos.length,
      };
    })
    .sort((a, b) => b.totalPosts - a.totalPosts);

  // 6. Évolution dans le temps
  const timelineMap = new Map<string, Map<string, number>>();
  for (const p of photos) {
    const date = (p.created_at as string).slice(0, 10);
    if (!timelineMap.has(date)) timelineMap.set(date, new Map());
    const dayUsers = timelineMap.get(date)!;
    dayUsers.set(p.user_id, (dayUsers.get(p.user_id) ?? 0) + 1);
  }
  const momentTimeline: TimelinePoint[] = [...timelineMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, dayUsers]) => {
      const totalCount = [...dayUsers.values()].reduce((a, b) => a + b, 0);
      const topUsers = [...dayUsers.entries()]
        .map(([uid, count]) => ({
          username: userMap.get(uid) ?? uid.slice(0, 8),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      return { date, count: totalCount, topUsers };
    });

  // 7. Moyenne de posts par groupe par semaine (groupes actifs > 1 post)
  const photosByWeekAndGroup = new Map<number, Map<string, number>>();
  const START_TS = new Date(START_DATE).getTime();
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  for (const p of photos) {
    const ts = new Date(p.created_at).getTime();
    const weekIndex = Math.floor((ts - START_TS) / WEEK_MS);
    if (!photosByWeekAndGroup.has(weekIndex)) photosByWeekAndGroup.set(weekIndex, new Map());
    const weekGroups = photosByWeekAndGroup.get(weekIndex)!;
    weekGroups.set(p.group_id, (weekGroups.get(p.group_id) ?? 0) + 1);
  }

  const weeklyAverages: number[] = [];
  const activeGroupMembersWeekly: number[] = [];

  for (const weekGroups of photosByWeekAndGroup.values()) {
    const activeEntries = [...weekGroups.entries()].filter(([_, count]) => count > 1);
    if (activeEntries.length > 0) {
      const weekAvg = activeEntries.reduce((a, b) => a + b[1], 0) / activeEntries.length;
      weeklyAverages.push(weekAvg);
      
      activeEntries.forEach(([gid]) => {
        const membersCount = filteredGroupMembers.filter((gm) => gm.group_id === gid && filteredUserIds.has(gm.user_id)).length;
        activeGroupMembersWeekly.push(membersCount);
      });
    }
  }

  const avgPostsPerGroupWeekly = weeklyAverages.length > 0
    ? Math.round((weeklyAverages.reduce((a, b) => a + b, 0) / weeklyAverages.length) * 10) / 10
    : 0;

  const avgMembersPerGroupActive = activeGroupMembersWeekly.length > 0
    ? Math.round((activeGroupMembersWeekly.reduce((a, b) => a + b, 0) / activeGroupMembersWeekly.length) * 10) / 10
    : 0;

  // 8. Moyenne de membres par groupe (groupes > 1 membre)
  const groupsWithMultipleMembers = groupParticipation.filter(g => g.total > 1);
  const avgMembersPerGroup = groupsWithMultipleMembers.length > 0
    ? Math.round((groupsWithMultipleMembers.reduce((a, b) => a + b.total, 0) / groupsWithMultipleMembers.length) * 10) / 10
    : 0;

  // 9. Groupe le plus peuplé
  const maxGroup = groupParticipation.length > 0
    ? [...groupParticipation].sort((a, b) => b.total - a.total)[0]
    : { name: "N/A", total: 0 };

  const activeGroupsCount = groupParticipation.filter(g => g.totalPosts > 0).length;

  const groupDetails: GroupDetail[] = (rawGroups as any[]).map((g) => {
    const members = (rawGroupMembers as any[])
      .filter((gm) => gm.group_id === g.id)
      .map((gm) => ({
        id: gm.user_id,
        username: userMap.get(gm.user_id) ?? `user_${gm.user_id.slice(0, 6)}`,
        role: gm.role,
        joined_at: gm.joined_at,
      }));
    const photo_count = rawPhotos.filter((p) => p.group_id === g.id).length;
    return {
      id: g.id,
      name: g.name ?? `Groupe ${g.id.slice(0, 6)}`,
      created_at: g.created_at,
      created_by: g.created_by,
      admin_username: userMap.get(g.created_by) ?? "Inconnu",
      invite_code: g.invite_code,
      members,
      photo_count,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return {
    momentsByUser,
    typeDistribution,
    dailyDistribution,
    hourlyDistribution,
    activeMembers,
    groupParticipation,
    momentTimeline,
    groups: rawGroups.map((g) => ({
      id: g.id,
      name: g.name ?? `Groupe ${g.id.slice(0, 6)}`,
    })).sort((a, b) => a.name.localeCompare(b.name)),
    users: rawProfiles
      .map((p) => ({ id: p.id, username: p.username ?? `user_${p.id.slice(0, 6)}` }))
      .sort((a, b) => a.username.localeCompare(b.username)),
    groupDetails,
    photos: photos.map(p => ({
      date: (p.created_at as string).slice(0, 10),
      group_id: p.group_id,
      user_id: p.user_id,
      username: userMap.get(p.user_id) ?? "Inconnu",
    })),
    stats: {
      totalMoments: photos.length,
      totalUsers: filteredProfiles.length,
      totalGroups: filteredGroups.length,
      activeGroups: activeGroupsCount,
      totalReactions: reactions.length,
      avgPostsPerGroupWeekly,
      avgMembersPerGroupActive,
      avgMembersPerGroup,
      maxGroupMembers: maxGroup.total,
      maxGroupName: maxGroup.name,
    },
  };
}
