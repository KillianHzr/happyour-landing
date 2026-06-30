"use server";

import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase-server";
import { copyObjectFromCandidates } from "@/lib/r2-admin";
import { shiftByWeeks } from "@/lib/reveal-week";

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

export async function duplicateCapture(id: string, opts: DuplicateOptions = {}): Promise<void> {
  await requireAuth();
  const { data, error } = await supabase.from("photos").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  const src = data as PhotoFull;
  const targetGroup = opts.targetGroupId ?? src.group_id;
  if (targetGroup !== src.group_id) await copyAllMedia(src, targetGroup);
  const { error: insErr } = await supabase.from("photos").insert({
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
  });
  if (insErr) throw new Error(insErr.message);
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
