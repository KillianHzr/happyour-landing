"use server";

import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase-server";
import { copyObjectFromCandidates } from "@/lib/r2-admin";
import {
  shiftByWeeks,
  getRevealWeekStart,
  getRevealWeekEnd,
  challengeWeekStartForReveal,
} from "@/lib/reveal-week";

const STORAGE_BASE =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-c3c80a82b60448dba090aef503e3931b.r2.dev";
const SUPABASE_URL = process.env.SUPABASE_URL || "";

async function requireAuth() {
  const cookieStore = await cookies();
  if (cookieStore.get("analytics_auth")?.value !== "authorized") {
    throw new Error("Unauthorized");
  }
}

function getMediaUrl(groupId: string, imagePath: string | null): string | null {
  if (!imagePath || imagePath === "text_mode") return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${STORAGE_BASE}/${groupId}/${imagePath}`;
}

function getFallbackUrl(groupId: string, imagePath: string | null): string | null {
  if (!imagePath || imagePath === "text_mode") return null;
  if (imagePath.startsWith("http")) return null;
  // Legacy fallback bucket may store either {group}/{path} or {path}.
  return `${SUPABASE_URL}/storage/v1/object/public/moments/${groupId}/${imagePath}`;
}

/**
 * The R2 object key convention has varied (some records prefix the group_id,
 * some don't, plus a legacy Supabase "moments" bucket). Return every plausible
 * URL so the client can cascade through them on <img> error.
 */
function mediaCandidates(groupId: string, path: string | null): string[] {
  if (!path || path === "text_mode") return [];
  if (path.startsWith("http")) return [path];
  return [
    `${STORAGE_BASE}/${groupId}/${path}`,
    `${STORAGE_BASE}/${path}`,
    `${SUPABASE_URL}/storage/v1/object/public/moments/${groupId}/${path}`,
    `${SUPABASE_URL}/storage/v1/object/public/moments/${path}`,
  ];
}

function inferType(
  imagePath: string | null
): "photo" | "video" | "text" | "audio" | "drawing" {
  if (!imagePath || imagePath === "text_mode") return "text";
  const path = imagePath.toLowerCase();
  if (path.includes("_draw")) return "drawing";
  const ext = path.split("?")[0].split(".").pop() ?? "";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  if (["m4a", "wav", "mp3", "aac", "oga", "ogg"].includes(ext) || path.includes("_audio"))
    return "audio";
  return "photo";
}

export interface CaptureReaction {
  id: string;
  user_id: string;
  username: string;
  emoji: string;
}

export interface CaptureRow {
  id: string;
  group_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  image_path: string | null;
  second_image_path: string | null;
  note: string | null;
  second_note: string | null;
  audio_note_path: string | null;
  video_thumbnail_path: string | null;
  created_at: string;
  type: "photo" | "video" | "text" | "audio" | "drawing";
  url: string | null;
  second_url: string | null;
  thumb_url: string | null;
  fallback_url: string | null;
  previewUrls: string[];
  reactions: CaptureReaction[];
}

export interface GroupRow {
  id: string;
  name: string;
}

export interface MemberRow {
  user_id: string;
  role: string;
  username: string;
  avatar_url: string | null;
}

export async function listGroups(): Promise<GroupRow[]> {
  await requireAuth();
  const { data, error } = await supabase.from("groups").select("id, name").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listGroupMembers(groupId: string): Promise<MemberRow[]> {
  await requireAuth();
  const { data, error } = await supabase
    .from("group_members")
    .select("user_id, role, profiles:user_id(id, username, avatar_url)")
    .eq("group_id", groupId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((m) => {
    const prof = m.profiles as unknown as { username?: string; avatar_url?: string } | null;
    return {
      user_id: m.user_id as string,
      role: (m.role as string) ?? "member",
      username: prof?.username ?? (m.user_id as string).slice(0, 8),
      avatar_url: prof?.avatar_url ?? null,
    };
  });
}

export async function searchProfiles(
  query: string
): Promise<{ id: string; username: string | null; email: string | null }[]> {
  await requireAuth();
  let q = supabase.from("profiles").select("id, username, email").limit(20);
  const trimmed = query?.trim();
  if (trimmed) q = q.or(`username.ilike.%${trimmed}%,email.ilike.%${trimmed}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listGroupCaptures(groupId: string): Promise<CaptureRow[]> {
  await requireAuth();
  const { data: photos, error } = await supabase
    .from("photos")
    .select(
      "id, group_id, user_id, image_path, second_image_path, note, second_note, audio_note_path, video_thumbnail_path, created_at"
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = photos ?? [];
  const photoIds = rows.map((r) => r.id);
  const userIds = [...new Set(rows.map((r) => r.user_id))];

  const [profilesRes, reactionsRes] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, username, avatar_url").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; username: string; avatar_url: string }[] }),
    photoIds.length
      ? supabase
          .from("reactions")
          .select("id, photo_id, user_id, emoji, sticker_id")
          .in("photo_id", photoIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            photo_id: string;
            user_id: string;
            emoji: string | null;
            sticker_id: string | null;
          }[],
        }),
  ]);

  const profMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p as { username: string; avatar_url: string }])
  );

  const reactUserIds = [
    ...new Set((reactionsRes.data ?? []).map((r) => r.user_id)),
  ].filter((id) => !profMap.has(id));
  if (reactUserIds.length) {
    const { data: more } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", reactUserIds);
    for (const p of more ?? []) profMap.set(p.id, p);
  }

  const reactionsByPhoto = new Map<string, CaptureReaction[]>();
  for (const r of reactionsRes.data ?? []) {
    const arr = reactionsByPhoto.get(r.photo_id) ?? [];
    arr.push({
      id: r.id,
      user_id: r.user_id,
      username: profMap.get(r.user_id)?.username ?? "?",
      emoji: r.emoji ?? r.sticker_id ?? "❓",
    });
    reactionsByPhoto.set(r.photo_id, arr);
  }

  return rows.map((r) => {
    const prof = profMap.get(r.user_id);
    const type = inferType(r.image_path);
    const previewUrls =
      type === "video"
        ? mediaCandidates(r.group_id, r.video_thumbnail_path)
        : mediaCandidates(r.group_id, r.image_path);
    return {
      id: r.id,
      group_id: r.group_id,
      user_id: r.user_id,
      username: prof?.username ?? r.user_id.slice(0, 8),
      avatar_url: prof?.avatar_url ?? null,
      image_path: r.image_path,
      second_image_path: r.second_image_path,
      note: r.note,
      second_note: r.second_note,
      audio_note_path: r.audio_note_path,
      video_thumbnail_path: r.video_thumbnail_path,
      created_at: r.created_at,
      type,
      url: getMediaUrl(r.group_id, r.image_path),
      second_url: getMediaUrl(r.group_id, r.second_image_path),
      thumb_url: getMediaUrl(r.group_id, r.video_thumbnail_path),
      fallback_url: getFallbackUrl(r.group_id, r.image_path),
      previewUrls,
      reactions: reactionsByPhoto.get(r.id) ?? [],
    };
  });
}

export interface CreateCaptureInput {
  group_id: string;
  user_id: string;
  created_at: string; // ISO UTC
  image_path?: string | null;
  note?: string | null;
  second_image_path?: string | null;
  second_note?: string | null;
  ensureMember?: boolean;
}

export async function createCapture(input: CreateCaptureInput): Promise<void> {
  await requireAuth();
  if (input.ensureMember) {
    await supabase
      .from("group_members")
      .upsert(
        { group_id: input.group_id, user_id: input.user_id, role: "member" },
        { onConflict: "group_id,user_id", ignoreDuplicates: true }
      );
  }
  const { error } = await supabase.from("photos").insert({
    group_id: input.group_id,
    user_id: input.user_id,
    image_path: input.image_path && input.image_path.length ? input.image_path : "text_mode",
    note: input.note ?? null,
    second_image_path: input.second_image_path ?? null,
    second_note: input.second_note ?? null,
    created_at: input.created_at,
  });
  if (error) throw new Error(error.message);
}

const EDITABLE_FIELDS = [
  "group_id",
  "user_id",
  "image_path",
  "second_image_path",
  "note",
  "second_note",
  "audio_note_path",
  "video_thumbnail_path",
  "created_at",
] as const;

export async function updateCapture(
  id: string,
  patch: Partial<Record<(typeof EDITABLE_FIELDS)[number], string | null>>
): Promise<void> {
  await requireAuth();
  const clean: Record<string, string | null> = {};
  for (const k of EDITABLE_FIELDS) {
    if (k in patch) clean[k] = patch[k] ?? null;
  }
  const { error } = await supabase.from("photos").update(clean).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCapture(id: string): Promise<void> {
  await requireAuth();
  // Clean up dependents (no guaranteed ON DELETE CASCADE), then the photo.
  await supabase.from("reactions").delete().eq("photo_id", id);
  await supabase.from("comment_views").delete().eq("photo_id", id);
  await supabase.from("comments").delete().eq("photo_id", id);
  await supabase.from("group_members").update({ deletable_photo_id: null }).eq("deletable_photo_id", id);
  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

async function copyMediaToGroup(
  srcGroup: string,
  destGroup: string,
  path: string | null
): Promise<void> {
  if (!path || path === "text_mode" || path.startsWith("http")) return;
  // The object may be stored with or without the group prefix.
  await copyObjectFromCandidates([`${srcGroup}/${path}`, path], `${destGroup}/${path}`);
}

interface PhotoFull {
  id: string;
  group_id: string;
  user_id: string;
  image_path: string | null;
  second_image_path: string | null;
  note: string | null;
  second_note: string | null;
  audio_note_path: string | null;
  waveform: number[] | null;
  caption_waveform: number[] | null;
  video_thumbnail_path: string | null;
  second_video_thumbnail_path: string | null;
  created_at: string;
}

async function copyAllMedia(src: PhotoFull, destGroup: string): Promise<void> {
  await Promise.all([
    copyMediaToGroup(src.group_id, destGroup, src.image_path),
    copyMediaToGroup(src.group_id, destGroup, src.second_image_path),
    copyMediaToGroup(src.group_id, destGroup, src.audio_note_path),
    copyMediaToGroup(src.group_id, destGroup, src.video_thumbnail_path),
    copyMediaToGroup(src.group_id, destGroup, src.second_video_thumbnail_path),
  ]);
}

export interface DuplicateOptions {
  targetGroupId?: string;
  targetUserId?: string;
  createdAt?: string; // ISO UTC
}

async function copyReactions(srcPhotoId: string, dstPhotoId: string): Promise<void> {
  const { data } = await supabase
    .from("reactions")
    .select("user_id, emoji, sticker_id, created_at")
    .eq("photo_id", srcPhotoId);
  if (data && data.length) {
    await supabase.from("reactions").insert(data.map((r) => ({ ...r, photo_id: dstPhotoId })));
  }
}

export async function duplicateCapture(id: string, opts: DuplicateOptions = {}): Promise<void> {
  await requireAuth();
  const { data, error } = await supabase.from("photos").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  const src = data as PhotoFull;
  const targetGroup = opts.targetGroupId ?? src.group_id;
  if (targetGroup !== src.group_id) await copyAllMedia(src, targetGroup);
  const { data: ins, error: insErr } = await supabase
    .from("photos")
    .insert({
      group_id: targetGroup,
      user_id: opts.targetUserId ?? src.user_id,
      image_path: src.image_path,
      second_image_path: src.second_image_path,
      note: src.note,
      second_note: src.second_note,
      audio_note_path: src.audio_note_path,
      waveform: src.waveform,
      caption_waveform: src.caption_waveform,
      video_thumbnail_path: src.video_thumbnail_path,
      second_video_thumbnail_path: src.second_video_thumbnail_path,
      // Default: keep the source date (so a duplicated week lands in the same
      // reveal week). The modal passes an explicit date when relocating.
      created_at: opts.createdAt ?? src.created_at,
    })
    .select("id")
    .single();
  if (insErr) throw new Error(insErr.message);
  // Carry the reactions over to the copy.
  await copyReactions(id, ins.id as string);
}

export async function duplicateCaptures(
  ids: string[],
  targetGroupId: string
): Promise<void> {
  await requireAuth();
  for (const id of ids) {
    await duplicateCapture(id, { targetGroupId });
  }
}

/**
 * Shift a set of captures by N reveal-weeks, preserving weekday + local time.
 * mode "move" rewrites created_at in place; "duplicate" creates shifted copies
 * (same group/user, so no R2 copy is needed).
 */
export async function shiftCapturesByWeeks(
  ids: string[],
  weeks: number,
  mode: "move" | "duplicate"
): Promise<void> {
  await requireAuth();
  if (!Number.isInteger(weeks) || weeks === 0) return;
  const { data, error } = await supabase
    .from("photos")
    .select("id, created_at")
    .in("id", ids);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    const newDate = shiftByWeeks(new Date(row.created_at), weeks).toISOString();
    if (mode === "move") {
      const { error: updErr } = await supabase
        .from("photos")
        .update({ created_at: newDate })
        .eq("id", row.id);
      if (updErr) throw new Error(updErr.message);
    } else {
      await duplicateCapture(row.id, { createdAt: newDate });
    }
  }
}

/** Set an exact created_at (ISO UTC) on every selected capture. */
export async function setCapturesDate(ids: string[], createdAt: string): Promise<void> {
  await requireAuth();
  if (ids.length === 0) return;
  const { error } = await supabase.from("photos").update({ created_at: createdAt }).in("id", ids);
  if (error) throw new Error(error.message);
}

export async function moveCaptures(ids: string[], targetGroupId: string): Promise<void> {
  await requireAuth();
  const { data, error } = await supabase.from("photos").select("*").in("id", ids);
  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as PhotoFull[]) {
    if (row.group_id === targetGroupId) continue;
    await copyAllMedia(row, targetGroupId);
    const { error: updErr } = await supabase
      .from("photos")
      .update({ group_id: targetGroupId })
      .eq("id", row.id);
    if (updErr) throw new Error(updErr.message);
  }
}

/* --------------------------- Weekly challenges ---------------------------- */

/** Move the weekly challenge(s) of (group, srcWeekStart) to another week and/or group. */
async function moveChallengeWeek(
  groupId: string,
  srcWeekStart: string,
  dstWeekStart: string,
  dstGroupId?: string
): Promise<void> {
  const patch: Record<string, string> = { week_start: dstWeekStart };
  if (dstGroupId && dstGroupId !== groupId) patch.group_id = dstGroupId;
  await supabase
    .from("weekly_challenges")
    .update(patch)
    .eq("group_id", groupId)
    .eq("week_start", srcWeekStart);
}

/** Deep-copy the weekly challenge(s) (+responses +votes) to another week/group. */
async function duplicateChallengeWeek(
  srcGroupId: string,
  srcWeekStart: string,
  dstGroupId: string,
  dstWeekStart: string
): Promise<void> {
  const { data: challenges } = await supabase
    .from("weekly_challenges")
    .select("*")
    .eq("group_id", srcGroupId)
    .eq("week_start", srcWeekStart);

  for (const ch of (challenges ?? []) as Record<string, unknown>[]) {
    const oldId = ch.id as string;
    const { id: _id, created_at: _ca, ...rest } = ch;
    void _id;
    void _ca;
    const { data: newCh, error: chErr } = await supabase
      .from("weekly_challenges")
      .insert({ ...rest, group_id: dstGroupId, week_start: dstWeekStart })
      .select("id")
      .single();
    if (chErr) throw new Error(chErr.message);
    const newChId = newCh.id as string;

    const { data: responses } = await supabase
      .from("challenge_responses")
      .select("*")
      .eq("challenge_id", oldId);

    const respIdMap = new Map<string, string>();
    for (const r of (responses ?? []) as Record<string, unknown>[]) {
      const oldRid = r.id as string;
      const { id: _rid, created_at: _rca, ...rrest } = r;
      void _rid;
      void _rca;
      if (dstGroupId !== srcGroupId) {
        await copyMediaToGroup(srcGroupId, dstGroupId, (rrest.image_path as string) ?? null);
        await copyMediaToGroup(srcGroupId, dstGroupId, (rrest.second_image_path as string) ?? null);
        await copyMediaToGroup(srcGroupId, dstGroupId, (rrest.video_thumbnail_path as string) ?? null);
        await copyMediaToGroup(
          srcGroupId,
          dstGroupId,
          (rrest.second_video_thumbnail_path as string) ?? null
        );
      }
      const { data: newR, error: rErr } = await supabase
        .from("challenge_responses")
        .insert({ ...rrest, challenge_id: newChId })
        .select("id")
        .single();
      if (rErr) throw new Error(rErr.message);
      respIdMap.set(oldRid, newR.id as string);
    }

    const { data: votes } = await supabase
      .from("challenge_votes")
      .select("*")
      .eq("challenge_id", oldId);

    for (const v of (votes ?? []) as Record<string, unknown>[]) {
      const { id: _vid, created_at: _vca, ...vrest } = v;
      void _vid;
      void _vca;
      const mappedResponse = respIdMap.get(v.response_id as string) ?? (v.response_id as string);
      await supabase
        .from("challenge_votes")
        .insert({ ...vrest, challenge_id: newChId, response_id: mappedResponse });
    }
  }
}

/**
 * Shift a whole reveal week (its moments AND its weekly challenge) by N weeks.
 * "move" rewrites dates/week_start in place; "duplicate" creates shifted copies
 * (moments + reactions + challenge + responses + votes) in the same group.
 */
export async function shiftWeek(
  groupId: string,
  weekStartIso: string,
  ids: string[],
  weeks: number,
  mode: "move" | "duplicate"
): Promise<void> {
  await requireAuth();
  if (!Number.isInteger(weeks) || weeks === 0) return;
  const srcReveal = new Date(weekStartIso);
  const dstReveal = shiftByWeeks(srcReveal, weeks);
  const srcCWS = challengeWeekStartForReveal(srcReveal);
  const dstCWS = challengeWeekStartForReveal(dstReveal);

  if (mode === "move") {
    await shiftCapturesByWeeks(ids, weeks, "move");
    await moveChallengeWeek(groupId, srcCWS, dstCWS);
  } else {
    await shiftCapturesByWeeks(ids, weeks, "duplicate");
    await duplicateChallengeWeek(groupId, srcCWS, groupId, dstCWS);
  }
}

/**
 * Duplicate a whole reveal week into another group, keeping the same dates:
 * moments (+reactions, +R2 copy) and the weekly challenge (+responses +votes).
 */
export async function duplicateWeekToGroup(
  groupId: string,
  weekStartIso: string,
  ids: string[],
  targetGroupId: string
): Promise<void> {
  await requireAuth();
  if (!targetGroupId || targetGroupId === groupId) return;
  for (const id of ids) {
    await duplicateCapture(id, { targetGroupId });
  }
  const cws = challengeWeekStartForReveal(new Date(weekStartIso));
  await duplicateChallengeWeek(groupId, cws, targetGroupId, cws);
}

/* -------- Backfill onto an already-sorted week (no re-sorting needed) ------ */

/** All groups (unfiltered) — used to pick a challenge source, even non-Gobelin. */
export async function listAllGroups(): Promise<GroupRow[]> {
  await requireAuth();
  const { data, error } = await supabase.from("groups").select("id, name").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Distinct challenge weeks (week_start) available in a source group. */
export async function listChallengeWeeks(
  groupId: string
): Promise<{ week_start: string; count: number }[]> {
  await requireAuth();
  const { data, error } = await supabase
    .from("weekly_challenges")
    .select("week_start")
    .eq("group_id", groupId);
  if (error) throw new Error(error.message);
  const counts = new Map<string, number>();
  for (const r of data ?? []) {
    const ws = r.week_start as string;
    counts.set(ws, (counts.get(ws) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([week_start, count]) => ({ week_start, count }))
    .sort((a, b) => (a.week_start < b.week_start ? 1 : -1));
}

/**
 * Copy a challenge (+responses +votes) from a source (group, week_start) onto
 * an already-sorted target reveal week. Refuses if the target week already has
 * a challenge.
 */
export async function importChallengeWeek(
  targetGroupId: string,
  targetWeekStartIso: string,
  srcGroupId: string,
  srcWeekStart: string
): Promise<void> {
  await requireAuth();
  const targetCws = challengeWeekStartForReveal(new Date(targetWeekStartIso));
  const { data: existing } = await supabase
    .from("weekly_challenges")
    .select("id")
    .eq("group_id", targetGroupId)
    .eq("week_start", targetCws)
    .limit(1);
  if (existing && existing.length) {
    throw new Error("Un défi existe déjà pour cette semaine dans ce groupe.");
  }
  await duplicateChallengeWeek(srcGroupId, srcWeekStart, targetGroupId, targetCws);
}

/**
 * Backfill reactions onto moments that were duplicated (and therefore lost
 * them). Matches each target photo to source photos sharing the same
 * image_path (the originals/other copies) and copies their reactions,
 * de-duplicated by (user, emoji). Skips text-only and already-reacted photos.
 * Returns the number of reactions added.
 */
export async function backfillReactions(ids: string[]): Promise<number> {
  await requireAuth();
  if (ids.length === 0) return 0;
  const { data: targets, error } = await supabase
    .from("photos")
    .select("id, image_path")
    .in("id", ids);
  if (error) throw new Error(error.message);

  let added = 0;
  for (const t of targets ?? []) {
    const ip = t.image_path as string | null;
    if (!ip || ip === "text_mode") continue;

    const { count: existingCount } = await supabase
      .from("reactions")
      .select("id", { count: "exact", head: true })
      .eq("photo_id", t.id);
    if ((existingCount ?? 0) > 0) continue;

    const { data: sources } = await supabase
      .from("photos")
      .select("id")
      .eq("image_path", ip)
      .neq("id", t.id);
    const srcIds = (sources ?? []).map((s) => s.id);
    if (srcIds.length === 0) continue;

    const { data: reacts } = await supabase
      .from("reactions")
      .select("user_id, emoji, sticker_id, created_at")
      .in("photo_id", srcIds);
    if (!reacts || reacts.length === 0) continue;

    const seen = new Set<string>();
    const toInsert: Record<string, unknown>[] = [];
    for (const r of reacts) {
      const key = `${r.user_id}|${r.emoji ?? r.sticker_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      toInsert.push({ ...r, photo_id: t.id });
    }
    if (toInsert.length) {
      const { error: insErr } = await supabase.from("reactions").insert(toInsert);
      if (!insErr) added += toInsert.length;
    }
  }
  return added;
}

/**
 * Give the in-app crown to a user for a given week. The crown is not stored:
 * the app awards it to the group member whose most recent moment has the
 * latest created_at. So we bump that user's most recent moment in the week to
 * just after the latest moment of the week (clamped before the next reveal),
 * and ensure they are a member of the group.
 *
 * `ids` are the capture ids of the week (from the client). Returns the new
 * crown holder's user_id, or throws if they have no moment in that week.
 */
export async function giveCrown(ids: string[], userId: string): Promise<void> {
  await requireAuth();
  if (ids.length === 0) return;
  const { data, error } = await supabase
    .from("photos")
    .select("id, user_id, group_id, created_at")
    .in("id", ids);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length === 0) return;

  const groupId = rows[0].group_id as string;
  const times = rows.map((r) => new Date(r.created_at).getTime());
  const maxT = Math.max(...times);

  const mine = rows
    .filter((r) => r.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (mine.length === 0) {
    throw new Error("Cet utilisateur n'a aucun moment dans cette semaine.");
  }

  const myLatest = mine[0];
  // Already the most recent? Then they already hold the crown.
  if (new Date(myLatest.created_at).getTime() >= maxT) {
    await supabase
      .from("group_members")
      .upsert(
        { group_id: groupId, user_id: userId, role: "member" },
        { onConflict: "group_id,user_id", ignoreDuplicates: true }
      );
    return;
  }

  const weekStart = getRevealWeekStart(new Date(maxT));
  const weekEnd = getRevealWeekEnd(weekStart).getTime();
  let target = maxT + 60_000; // 1 min after current latest
  if (target >= weekEnd) target = weekEnd - 60_000;

  await supabase
    .from("group_members")
    .upsert(
      { group_id: groupId, user_id: userId, role: "member" },
      { onConflict: "group_id,user_id", ignoreDuplicates: true }
    );

  const { error: updErr } = await supabase
    .from("photos")
    .update({ created_at: new Date(target).toISOString() })
    .eq("id", myLatest.id);
  if (updErr) throw new Error(updErr.message);
}

export async function addReaction(
  photoId: string,
  userId: string,
  emoji: string
): Promise<void> {
  await requireAuth();
  const { error } = await supabase
    .from("reactions")
    .insert({ photo_id: photoId, user_id: userId, emoji, sticker_id: emoji });
  if (error) throw new Error(error.message);
}

export async function deleteReaction(reactionId: string): Promise<void> {
  await requireAuth();
  const { error } = await supabase.from("reactions").delete().eq("id", reactionId);
  if (error) throw new Error(error.message);
}
