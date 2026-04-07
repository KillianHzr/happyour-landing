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
}

export interface TimelinePoint {
  date: string;
  count: number;
}

export interface GroupItem {
  id: string;
  name: string;
}

export interface UserItem {
  id: string;
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
  stats: {
    totalMoments: number;
    totalUsers: number;
    totalGroups: number;
    totalReactions: number;
  };
}

/**
 * Infère le type d'un post.
 * - image_path null ET note présente → "Texte"
 * - image_path .mp4 / .mov / .avi … → "Vidéo"
 * - tout le reste                   → "Photo"
 */
function inferType(imagePath: string | null, note: string | null): string {
  if (!imagePath || imagePath === "text_mode") return "Texte";
  const ext = imagePath.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "Vidéo";
  return "Photo";
}

export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  const START_DATE = "2026-03-30T00:00:00Z";

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
      supabase.from("group_members").select("group_id, user_id"),
      supabase.from("groups").select("id, name"),
      supabase
        .from("reactions")
        .select("photo_id, user_id, type, created_at")
        .gte("created_at", START_DATE),
    ]);

  const rawPhotos = photosRes.data ?? [];
  const profiles = profilesRes.data ?? [];
  const groupMembers = groupMembersRes.data ?? [];
  const groups = groupsRes.data ?? [];
  const rawReactions = reactionsRes.data ?? [];

  // Map user id → username and valid users set
  const userMap = new Map(
    profiles.map((p) => [p.id, p.username ?? `user_${p.id.slice(0, 6)}`])
  );
  const validUserIds = new Set(profiles.map((p) => p.id));

  // Filter photos and reactions to only include those from valid (non-test) users
  const photos = rawPhotos.filter((p) => validUserIds.has(p.user_id));
  const reactions = rawReactions.filter((r) => validUserIds.has(r.user_id));

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
  
  // Inclure TOUS les profils valides, même ceux sans activité
  const activeMembers: ActiveMember[] = profiles
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
  const groupParticipation: GroupParticipation[] = groups
    .map((g) => {
      const members = groupMembers.filter((gm) => gm.group_id === g.id && validUserIds.has(gm.user_id));
      const posters = new Set(
        photos.filter((p) => p.group_id === g.id).map((p) => p.user_id)
      );
      const total = members.length;
      const posted = posters.size;
      const rate = total > 0 ? Math.round((posted / total) * 100) : 0;
      return {
        name: g.name ?? `Groupe ${g.id.slice(0, 6)}`,
        rate,
        posted,
        total,
      };
    })
    .sort((a, b) => b.rate - a.rate);

  // 6. Évolution dans le temps
  const timelineMap = new Map<string, number>();
  for (const p of photos) {
    const date = (p.created_at as string).slice(0, 10);
    timelineMap.set(date, (timelineMap.get(date) ?? 0) + 1);
  }
  const momentTimeline: TimelinePoint[] = [...timelineMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  return {
    momentsByUser,
    typeDistribution,
    dailyDistribution,
    hourlyDistribution,
    activeMembers,
    groupParticipation,
    momentTimeline,
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name ?? `Groupe ${g.id.slice(0, 6)}`,
    })),
    users: profiles
      .map((p) => ({ id: p.id, username: p.username ?? `user_${p.id.slice(0, 6)}` }))
      .sort((a, b) => a.username.localeCompare(b.username)),
    stats: {
      totalMoments: photos.length,
      totalUsers: profiles.length,
      totalGroups: groups.length,
      totalReactions: reactions.length,
    },
  };
}
